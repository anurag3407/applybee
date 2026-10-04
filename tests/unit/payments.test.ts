import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// Razorpay keys must be present before the config module is first evaluated,
// otherwise getConfig() caches a mock-mode configuration for the whole file.
process.env.RAZORPAY_KEY_ID = "rzp_test_regression";
process.env.RAZORPAY_KEY_SECRET = "test_secret_regression";

const { getPaymentGateway } = await import("@/server/adapters/payments");

describe("payment gateway cannot be spoofed by a client-supplied payment id", () => {
  let realFetch: typeof globalThis.fetch;

  beforeAll(() => {
    realFetch = globalThis.fetch;
  });

  afterAll(() => {
    globalThis.fetch = realFetch;
  });

  it("uses the live Razorpay gateway when keys are configured", () => {
    expect(getPaymentGateway().mode).toBe("razorpay");
  });

  it("does not treat a caller-chosen mock_pay_ id as a captured payment", async () => {
    // Regression: fetchPayment used to short-circuit any id starting with
    // "mock_pay_" and return { status: "captured" }. Combined with the
    // checkout-verify endpoint accepting the same prefix, any signed-in user
    // could fulfill their own order and receive paid credits for free.
    let requestedUrl = "";
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      requestedUrl = String(input);
      return new Response(JSON.stringify({ error: "not found" }), { status: 404 });
    }) as typeof globalThis.fetch;

    const gateway = getPaymentGateway();
    const result = await gateway.fetchPayment("mock_pay_totally_made_up");

    expect(requestedUrl).toContain("api.razorpay.com");
    expect(result).toBeNull();
  });
});