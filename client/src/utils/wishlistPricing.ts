export type SuggestedTokenCost =
  | { tokenCost: number; tokenType: "MICRO" | "STANDARD" }
  | { manualRequired: true };

interface PricingTier {
  minPriceZar: number;
  maxPriceZar: number | null;
  tokenCost: number;
  tokenType: "MICRO" | "STANDARD";
  manualOverride: boolean;
}

const PRICING_TIERS: readonly PricingTier[] = [
  { minPriceZar: 0, maxPriceZar: 50, tokenCost: 1, tokenType: "MICRO", manualOverride: false },
  { minPriceZar: 50, maxPriceZar: 150, tokenCost: 1, tokenType: "STANDARD", manualOverride: false },
  { minPriceZar: 150, maxPriceZar: 400, tokenCost: 2, tokenType: "STANDARD", manualOverride: false },
  { minPriceZar: 400, maxPriceZar: 800, tokenCost: 3, tokenType: "STANDARD", manualOverride: false },
  { minPriceZar: 800, maxPriceZar: null, tokenCost: 0, tokenType: "STANDARD", manualOverride: true },
];

export function suggestWishlistTokenCost(priceZar: number): SuggestedTokenCost {
  for (const tier of PRICING_TIERS) {
    const withinMin = priceZar >= tier.minPriceZar;
    const withinMax = tier.maxPriceZar === null || priceZar < tier.maxPriceZar;
    if (withinMin && withinMax) {
      if (tier.manualOverride) {
        return { manualRequired: true };
      }
      return { tokenCost: tier.tokenCost, tokenType: tier.tokenType };
    }
  }
  return { manualRequired: true };
}

export function formatSuggestedCost(cost: SuggestedTokenCost): string {
  if ("manualRequired" in cost) {
    return "Set manually (required for prices over R800)";
  }
  const label = cost.tokenType === "MICRO" ? "Micro Coin" : "Standard Coin";
  return `${cost.tokenCost} ${label}${cost.tokenCost !== 1 ? "s" : ""}`;
}
