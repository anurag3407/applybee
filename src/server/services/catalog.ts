import "server-only";
import { cache } from "react";
import { getPublishedCatalog } from "@/server/services/billing";
import { getConfig } from "@/server/config";

/**
 * Catalog view for marketing surfaces. One shared server-owned catalog feeds
 * checkout, marketing, and billing — no hardcoded conflicting prices (§4.1).
 */
export type CatalogSkuView = {
  sku: string;
  name: string;
  description: string | null;
  pricePaise: number;
  currency: string;
  contactCredits: number;
  aiCredits: number;
};

export type CatalogView = {
  version: string;
  skus: CatalogSkuView[];
};

// One catalog fetch per request: marketing pages call this directly and via
// getTrialAllowance, which used to run the same two queries twice.
export const getMarketingCatalog = cache(async (): Promise<CatalogView | null> => {
  try {
    const catalog = await getPublishedCatalog();
    if (!catalog) return null;
    return {
      version: catalog.version,
      skus: catalog.skus.map((s) => ({
        sku: s.sku,
        name: s.name,
        description: s.description,
        pricePaise: s.pricePaise,
        currency: s.currency,
        contactCredits: s.contactCredits,
        aiCredits: s.aiCredits,
      })),
    };
  } catch {
    return null;
  }
});

/** The trial allowance from the shared catalog (free_trial_v1). */
export async function getTrialAllowance(): Promise<{ contact: number; ai: number } | null> {
  const catalog = await getMarketingCatalog();
  const trial = catalog?.skus.find((s) => s.sku === "free_trial_v1");
  if (!trial) return null;
  return { contact: trial.contactCredits, ai: trial.aiCredits };
}

export async function isPurchasesLive(): Promise<boolean> {
  return getConfig().FEATURE_LIVE_PURCHASES_ENABLED;
}
