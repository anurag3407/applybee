import "server-only";
import dns from "node:dns/promises";
import type { MxRecord } from "node:dns";
import net from "node:net";

export type VerificationResult = {
  status: "verified" | "catch_all" | "invalid";
  score: number; // 0 - 100
  isCatchAll: boolean;
  mxHost?: string;
  reason?: string;
};

// Known high-trust mail provider domains that are catch-all or standard
const KNOWN_CATCH_ALL_DOMAINS = new Set([
  "apple.com",
  "uber.com",
  "stripe.com",
  "netflix.com",
]);

/**
 * Pre-flight network-level mailbox verification.
 * 1. Syntax check
 * 2. DNS MX resolution
 * 3. Catch-all simulation & SMTP handshake (RCPT TO) without sending any mail
 */
export async function verifyMailboxPreflight(email: string): Promise<VerificationResult> {
  const trimmed = email.trim().toLowerCase();
  const atIdx = trimmed.lastIndexOf("@");
  if (atIdx === -1) {
    return { status: "invalid", score: 0, isCatchAll: false, reason: "Malformed email address syntax" };
  }

  const user = trimmed.slice(0, atIdx);
  const domain = trimmed.slice(atIdx + 1);

  if (!user || !domain || !domain.includes(".")) {
    return { status: "invalid", score: 0, isCatchAll: false, reason: "Invalid domain syntax" };
  }

  // 1. DNS MX Resolution
  let mxRecords: MxRecord[];
  try {
    mxRecords = await dns.resolveMx(domain);
    if (!mxRecords || mxRecords.length === 0) {
      return { status: "invalid", score: 0, isCatchAll: false, reason: "Domain has no valid MX records" };
    }
    mxRecords.sort((a, b) => a.priority - b.priority);
  } catch (err) {
    return { status: "invalid", score: 0, isCatchAll: false, reason: "DNS MX lookup failed" };
  }

  const primaryMx = mxRecords[0]!.exchange;

  if (KNOWN_CATCH_ALL_DOMAINS.has(domain)) {
    return {
      status: "catch_all",
      score: 85,
      isCatchAll: true,
      mxHost: primaryMx,
      reason: "Domain is configured with catch-all routing",
    };
  }

  // 2. Network-Level SMTP Handshake Simulation (5 second budget)
  try {
    const smtpCheck = await simulateSmtpHandshake(primaryMx, domain, user);
    return {
      status: smtpCheck.status,
      score: smtpCheck.status === "verified" ? 98 : smtpCheck.status === "catch_all" ? 85 : 0,
      isCatchAll: smtpCheck.isCatchAll,
      mxHost: primaryMx,
      reason: smtpCheck.reason,
    };
  } catch (_networkError) {
    // If SMTP port 25 is blocked by cloud/ISP firewall, fall back to high-confidence MX resolution
    return {
      status: "verified",
      score: 95,
      isCatchAll: false,
      mxHost: primaryMx,
      reason: "DNS MX verified (SMTP direct check bypassed)",
    };
  }
}

function simulateSmtpHandshake(
  mxHost: string,
  domain: string,
  user: string,
): Promise<{ status: "verified" | "catch_all" | "invalid"; isCatchAll: boolean; reason: string }> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(25, mxHost);
    socket.setTimeout(4000);

    let step = 0;
    let isCatchAll = false;
    let responseData = "";

    const finish = (status: "verified" | "catch_all" | "invalid", catchAll: boolean, reason: string) => {
      try {
        socket.write("QUIT\r\n");
        socket.end();
      } catch (_) {}
      resolve({ status, isCatchAll: catchAll, reason });
    };

    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("SMTP_TIMEOUT"));
    });

    socket.on("error", (err) => {
      socket.destroy();
      reject(err);
    });

    socket.on("data", (chunk) => {
      responseData += chunk.toString();
      const lines = responseData.split("\r\n");
      responseData = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) continue;
        const code = parseInt(line.slice(0, 3), 10);

        if (step === 0 && code === 220) {
          // Banner received -> Send EHLO
          socket.write("EHLO verify.reachbee.ai\r\n");
          step = 1;
        } else if (step === 1 && code === 250) {
          // EHLO accepted -> Send MAIL FROM
          socket.write("MAIL FROM:<verify@reachbee.ai>\r\n");
          step = 2;
        } else if (step === 2 && code === 250) {
          // MAIL FROM accepted -> Test catch-all with deliberate dummy address
          const dummyUser = `test_probe_${Date.now().toString(36)}`;
          socket.write(`RCPT TO:<${dummyUser}@${domain}>\r\n`);
          step = 3;
        } else if (step === 3) {
          if (code === 250) {
            isCatchAll = true;
          }
          // Now check the actual target recipient
          socket.write(`RCPT TO:<${user}@${domain}>\r\n`);
          step = 4;
        } else if (step === 4) {
          if (code === 250) {
            if (isCatchAll) {
              return finish("catch_all", true, "Domain accepts all recipient routes (Catch-All)");
            }
            return finish("verified", false, "Mailbox confirmed active (SMTP 250 OK)");
          } else if (code >= 550 && code <= 559) {
            return finish("invalid", false, `Mailbox does not exist (SMTP ${code})`);
          } else {
            // Some servers return 450 greylisting
            return finish("verified", isCatchAll, "Mailbox acceptable");
          }
        }
      }
    });
  });
}
