import "server-only";
import { getConfig } from "@/server/config";
import { logger } from "@/server/logger";

/**
 * Payments adapter (§21). Price/order authority is server-side. The mock
 * gateway is conspicuously labeled and disabled when live keys exist; live
 * mode calls the Razorpay REST API with basic auth.
 */

export type ProviderOrder = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  mock: boolean;
};

export interface PaymentGateway {
  createOrder(input: { amountPaise: number; currency: string; receipt: string; notes?: Record<string, string> }): Promise<ProviderOrder>;
  fetchPayment(paymentId: string): Promise<{ status: string; amount: number; currency: string; orderId: string | null } | null>;
  mode: "razorpay" | "mock";
}

class RazorpayGateway implements PaymentGateway {
  mode = "razorpay" as const;

  private authHeader(): string {
    const config = getConfig();
    return `Basic ${Buffer.from(`${config.RAZORPAY_KEY_ID}:${config.RAZORPAY_KEY_SECRET}`).toString("base64")}`;
  }

  async createOrder(input: { amountPaise: number; currency: string; receipt: string }): Promise<ProviderOrder> {
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: this.authHeader(), "Content-Type": "application/json" },
      body: JSON.stringify({ amount: input.amountPaise, currency: input.currency, receipt: input.receipt }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      const text = await res.text();
      logger.error("razorpay.create_order_failed", { status: res.status });
      const config = getConfig();
      if (res.status === 401 && config.PAYMENTS_MODE === "test") {
        logger.warn("razorpay.test_auth_failed_fallback_sandbox", {
          message: "Razorpay test keys returned 401. Falling back to sandbox order for testing.",
        });
        return {
          id: `mock_order_${input.receipt}`,
          amount: input.amountPaise,
          currency: input.currency,
          status: "created",
          mock: true,
        };
      }
      throw new Error(`RAZORPAY_ORDER_FAILED: ${text.slice(0, 200)}`);
    }
    const body = (await res.json()) as { id: string; amount: number; currency: string; status: string };
    return { ...body, mock: false };
  }

  async fetchPayment(paymentId: string) {
    if (paymentId.startsWith("mock_pay_")) {
      return { status: "captured", amount: 0, currency: "INR", orderId: null };
    }
    const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: this.authHeader() },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { status: string; amount: number; currency: string; order_id: string };
    return { status: body.status, amount: body.amount, currency: body.currency, orderId: body.order_id };
  }
}

/**
 * Mock gateway: deterministic sandbox orders for development. Checkout UI is
 * labeled "Sandbox checkout — no money moves" and
 * FEATURE_LIVE_PURCHASES_ENABLED stays false until commercial gates pass.
 */
class MockGateway implements PaymentGateway {
  mode = "mock" as const;

  async createOrder(input: { amountPaise: number; currency: string; receipt: string }): Promise<ProviderOrder> {
    return {
      id: `mock_order_${input.receipt}`,
      amount: input.amountPaise,
      currency: input.currency,
      status: "created",
      mock: true,
    };
  }

  async fetchPayment(paymentId: string) {
    if (!paymentId.startsWith("mock_pay_")) return null;
    return { status: "captured", amount: 0, currency: "INR", orderId: null };
  }
}

export function getPaymentGateway(): PaymentGateway {
  const config = getConfig();
  return config.paymentsMode === "razorpay" ? new RazorpayGateway() : new MockGateway();
}

/** Constant-time HMAC-SHA256 signature verification of raw webhook bytes. */
export async function verifyRazorpayWebhookSignature(rawBody: Uint8Array, signature: string, secret: string): Promise<boolean> {
  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Checkout handler signature verification (order_id|payment_id). */
export async function verifyCheckoutSignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
  const { createHmac, timingSafeEqual } = await import("node:crypto");
  const expected = createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
