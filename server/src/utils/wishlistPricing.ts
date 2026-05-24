import { WISHLIST_PRICING_TIERS } from "../constants/gameConfig";

export type SuggestedTokenCost =
  | { tokenCost: number; tokenType: "MICRO" | "STANDARD" }
  | { manualRequired: true };

export function suggestWishlistTokenCost(priceZar: number): SuggestedTokenCost {
  for (const tier of WISHLIST_PRICING_TIERS) {
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
