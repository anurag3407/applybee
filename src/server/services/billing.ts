import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { catalogSkus, catalogVersions, paymentOrders, payments, webhookEvents, refunds, users } from "@/db/schema";
import { getConfig } from "@/server/config";
import { getPaymentGateway, verifyRazorpayWebhookSignature, verifyCheckoutSignature } from "@/server/adapters/payments";
import { admitWithPreCheck, LIMITS } from "@/server/adapters/ratelimit";
import { enqueueJob } from "@/server/services/jobs";
import { withIdempotency, hashRequest } from "@/server/services/idempotency";
import { audit } from "@/server/services/audit";
import { logger } from "@/server/logger";

/**
 * Billing service (§21). The SKU catalog is server-owned and versioned;
 * prices never come from the client. Client paid flags are never trusted.
 */

export async function getPublishedCatalog() {
  const version = (
    await db
      .select()
      .from(catalogVersions)
      .where(eq(catalogVersions.state, "published"))
      .orderBy(desc(catalogVersions.createdAt))
      .limit(1)
  )[0];
  if (!version) return null;
  const skus = await db
    .select()
    .from(catalogSkus)
    .where(and(eq(catalogSkus.catalogVersionId, version.id), eq(catalogSkus.state, "published")))
    .orderBy(catalogSkus.sortOrder);
  return { version: version.version, publishedAt: version.publishedAt, skus };
}

export class OrderError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export async function createOrder(params: {
  userId: string;
  sku: string;
  idempotencyKey: string;
}): Promise<{ orderId: string; providerOrderId: string | null; amountPaise: number; currency: string; mock: boolean }> {
  const config = getConfig();
  if (!config.FEATURE_LIVE_PURCHASES_ENABLED && config.isProduction) {
    throw new OrderError("SALES_DISABLED", "Purchases are not open yet. Existing credits remain usable.");
  }

  const admission = await admitWithPreCheck({ policy: LIMITS.orders, principal: params.userId, operationRef: `order:${params.userId}:${params.idempotencyKey}` });
  if (!admission.admitted) throw new OrderError("RATE_LIMITED", "Too many checkout attempts. Please wait a moment.");

  const outcome = await withIdempotency<{ orderId: string; providerOrderId: string | null; amountPaise: number; currency: string; mock: boolean }>({
    actorId: params.userId,
    scope: "billing.order",
    key: params.idempotencyKey,
    requestHash: hashRequest({ sku: params.sku }),
    run: async (operationRef) => {
      const catalog = await getPublishedCatalog();
      const sku = catalog?.skus.find((s) => s.sku === params.sku);
      if (!catalog || !sku || sku.pricePaise < 0) {
        // Stale/unavailable catalog disables purchase honestly (§10 §12).
        throw new OrderError("CATALOG_UNAVAILABLE", "The catalog is temporarily unavailable. Please try again shortly.");
      }

      const receipt = `ab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const localOrder = (
        await db
          .insert(paymentOrders)
          .values({
            userId: params.userId,
            skuId: sku.id,
            skuSnapshot: {
              sku: sku.sku,
              name: sku.name,
              contact_credits: sku.contactCredits,
              ai_credits: sku.aiCredits,
              catalog_version: catalog.version,
            },
            amountPaise: sku.pricePaise,
            currency: sku.currency,
            receipt,
            idempotencyKey: params.idempotencyKey,
            status: "created",
          })
          .returning({ id: paymentOrders.id })
      )[0]!;

      const gateway = getPaymentGateway();
      const providerOrder = await gateway.createOrder({
        amountPaise: sku.pricePaise,
        currency: sku.currency,
        receipt,
      });
      await db
        .update(paymentOrders)
        .set({ providerOrderId: providerOrder.id, status: "provider_created", updatedAt: new Date() })
        .where(eq(paymentOrders.id, localOrder.id));

      await audit({
        actorType: "user",
        actorId: params.userId,
        action: "billing.order_created",
        entityType: "payment_order",
        entityId: localOrder.id,
        metadata: { sku: sku.sku, amountPaise: sku.pricePaise },
      });
      return {
        orderId: localOrder.id,
        providerOrderId: providerOrder.id,
        amountPaise: sku.pricePaise,
        currency: sku.currency,
        mock: gateway.mode === "mock",
        keyId: config.RAZORPAY_KEY_ID ?? null,
      };
    },
  });

  if (outcome.kind === "conflict") throw new OrderError("IDEMPOTENCY_CONFLICT", "This checkout request was already used with different inputs.");
  if (outcome.kind === "new") return outcome.result;
  const meta = outcome.kind === "replay" ? outcome.responseMeta : null;
  if (meta) return meta;
  throw new OrderError("INTERNAL", "Order could not be created.");
}

export async function getOrderForUser(userId: string, orderId: string) {
  const rows = await db
    .select()
    .from(paymentOrders)
    .where(and(eq(paymentOrders.id, orderId), eq(paymentOrders.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Checkout verification (§21.2): validate the Razorpay checkout signature
 * against the server-stored order id and the server secret. The client paid
 * flag is never trusted; captured state grants through the same durable
 * fulfillment service as the webhook.
 */
export async function verifyCheckout(params: {
  userId: string;
  orderId: string;
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}): Promise<{ status: string; fulfilled: boolean }> {
  const config = getConfig();
  const order = await getOrderForUser(params.userId, params.orderId);
  if (!order) throw new OrderError("ORDER_NOT_FOUND", "Order not found.");
  if (order.status === "fulfilled") return { status: "fulfilled", fulfilled: true };

  const gateway = getPaymentGateway();
  // The sandbox shortcut must depend ONLY on the server-side gateway mode.
  // It previously also triggered on any client-supplied payment id starting
  // with "mock_pay_", which let a signed-in user fulfill their own order and
  // receive paid credits without paying anything, even with live Razorpay
  // keys configured.
  if (gateway.mode === "mock" && !config.isProduction) {
    const { fulfillCapturedPayment } = await import("@/server/services/credits");
    const result = await fulfillCapturedPayment({
      providerPaymentId: params.providerPaymentId,
      providerOrderId: order.providerOrderId ?? order.id,
      amountPaise: order.amountPaise,
      currency: order.currency,
    });
    if (result.granted) {
      const user = (await db.select({ email: users.email }).from(users).where(eq(users.id, params.userId)).limit(1))[0];
      if (user?.email) {
        const snap = order.skuSnapshot as Record<string, unknown> | null;
        const { sendPaymentReceiptEmail } = await import("@/server/services/email");
        sendPaymentReceiptEmail({
          userEmail: user.email,
          orderId: order.id,
          skuName: String(snap?.name ?? order.skuId),
          amountPaise: order.amountPaise,
          contactCredits: Number(snap?.contact_credits ?? 0),
          aiCredits: Number(snap?.ai_credits ?? 0),
        }).catch(() => {});
      }
    }
    return { status: "captured", fulfilled: result.granted || result.alreadyGranted };
  }

  const secret = config.RAZORPAY_KEY_SECRET!;
  const valid = await verifyCheckoutSignature(params.providerOrderId, params.providerPaymentId, params.signature, secret);
  if (!valid) throw new OrderError("INVALID_SIGNATURE", "Payment verification failed. Do not pay again — contact support with this reference.");

  // Fetch authoritative provider state before granting.
  const payment = await gateway.fetchPayment(params.providerPaymentId);
  if (!payment || payment.status !== "captured" || payment.amount !== order.amountPaise) {
    await db
      .update(paymentOrders)
      .set({ status: "pending", updatedAt: new Date() })
      .where(eq(paymentOrders.id, order.id));
    return { status: "pending", fulfilled: false };
  }
  const { fulfillCapturedPayment } = await import("@/server/services/credits");
  const result = await fulfillCapturedPayment({
    providerPaymentId: params.providerPaymentId,
    providerOrderId: order.providerOrderId ?? order.id,
    amountPaise: payment.amount,
    currency: payment.currency,
  });
  if (result.granted) {
    const user = (await db.select({ email: users.email }).from(users).where(eq(users.id, params.userId)).limit(1))[0];
    if (user?.email) {
      const snap = order.skuSnapshot as Record<string, unknown> | null;
      const { sendPaymentReceiptEmail } = await import("@/server/services/email");
      sendPaymentReceiptEmail({
        userEmail: user.email,
        orderId: order.id,
        skuName: String(snap?.name ?? order.skuId),
        amountPaise: order.amountPaise,
        contactCredits: Number(snap?.contact_credits ?? 0),
        aiCredits: Number(snap?.ai_credits ?? 0),
      }).catch(() => {});
    }
  }
  return { status: "captured", fulfilled: result.granted || result.alreadyGranted };
}

/**
 * Webhook ingestion (§21.3): raw bytes → HMAC → durable dedupe → async
 * fulfillment. Redis failure never blocks durable provider event recovery.
 */
export async function ingestRazorpayWebhook(params: { rawBody: Uint8Array; signature: string; eventId: string | null; eventType: string }): Promise<{ accepted: boolean; reason?: string }> {
  const config = getConfig();
  if (!config.RAZORPAY_WEBHOOK_SECRET) {
    return { accepted: false, reason: "webhook_not_configured" };
  }
  if (!params.eventId) {
    // Missing provider event id: reject per verified contract (§21.3).
    return { accepted: false, reason: "missing_event_id" };
  }
  const valid = await verifyRazorpayWebhookSignature(params.rawBody, params.signature, config.RAZORPAY_WEBHOOK_SECRET);
  if (!valid) {
    logger.warn("razorpay.webhook_bad_signature", {});
    return { accepted: false, reason: "invalid_signature" };
  }

  // Deduplicate by provider + event id; persist verified receipt before 2xx.
  const inserted = await db
    .insert(webhookEvents)
    .values({
      provider: "razorpay",
      eventId: params.eventId,
      eventType: params.eventType,
      storedPayload: null,
      processState: "received",
    })
    .onConflictDoNothing()
    .returning({ id: webhookEvents.id });
  if (inserted.length === 0) return { accepted: true }; // duplicate: already durable

  // Parse minimal verified facts from the event.
  let payload: { providerPaymentId?: string; providerOrderId?: string; amount?: number; currency?: string } | null = null;
  try {
    const body = JSON.parse(new TextDecoder().decode(params.rawBody)) as {
      event?: string;
      payload?: { payment?: { entity?: { id?: string; order_id?: string; amount?: number; currency?: string } } };
    };
    const entity = body.payload?.payment?.entity;
    if (entity?.id && entity.order_id && typeof entity.amount === "number") {
      payload = {
        providerPaymentId: entity.id,
        providerOrderId: entity.order_id,
        amount: entity.amount,
        currency: entity.currency ?? "INR",
      };
    }
  } catch {
    payload = null;
  }
  await db
    .update(webhookEvents)
    .set({ storedPayload: payload, processState: payload ? "received" : "quarantined" })
    .where(eq(webhookEvents.id, inserted[0]!.id));

  if (payload && params.eventType === "payment.captured") {
    await enqueueJob({ kind: "payment.fulfill", entityId: inserted[0]!.id, maxAttempts: 5 });
  }
  return { accepted: true };
}

export async function listPayments(userId: string, limit = 30) {
  return db
    .select({
      id: payments.id,
      providerPaymentId: payments.providerPaymentId,
      state: payments.state,
      providerAmount: payments.providerAmount,
      currency: payments.currency,
      capturedAt: payments.capturedAt,
      fulfilledAt: payments.fulfilledAt,
      createdAt: payments.createdAt,
      orderId: payments.orderId,
    })
    .from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt))
    .limit(limit);
}

export async function getPaymentForUser(userId: string, paymentId: string) {
  const rows = await db
    .select({ payment: payments, order: paymentOrders })
    .from(payments)
    .innerJoin(paymentOrders, eq(paymentOrders.id, payments.orderId))
    .where(and(eq(payments.id, paymentId), eq(payments.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function listOrders(userId: string, limit = 20) {
  return db
    .select()
    .from(paymentOrders)
    .where(eq(paymentOrders.userId, userId))
    .orderBy(desc(paymentOrders.createdAt))
    .limit(limit);
}

export async function listRefunds(userId: string) {
  const rows = await db.execute(sql`
    SELECT r.id, r.provider_refund_id, r.amount_paise, r.state, r.created_at, p.provider_payment_id
    FROM refunds r
    JOIN payments p ON p.id = r.payment_id
    WHERE p.user_id = ${userId}::uuid
    ORDER BY r.created_at DESC LIMIT 20
  `);
  return rows.rows as Array<{ id: string; provider_refund_id: string; amount_paise: number; state: string; created_at: string; provider_payment_id: string }>;
}
