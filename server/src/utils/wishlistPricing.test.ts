import { describe, it, expect } from "vitest";
import { suggestWishlistTokenCost } from "./wishlistPricing";

describe("suggestWishlistTokenCost", () => {
  it("returns 1 Micro-Token for price just under 50", () => {
    const result = suggestWishlistTokenCost(49.99);
    expect(result).toEqual({ tokenCost: 1, tokenType: "MICRO" });
  });

  it("returns 1 Micro-Token for price of 0", () => {
    const result = suggestWishlistTokenCost(0);
    expect(result).toEqual({ tokenCost: 1, tokenType: "MICRO" });
  });

  it("returns 1 Standard Token at the 50 boundary", () => {
    const result = suggestWishlistTokenCost(50);
    expect(result).toEqual({ tokenCost: 1, tokenType: "STANDARD" });
  });

  it("returns 1 Standard Token for price just under 150", () => {
    const result = suggestWishlistTokenCost(149.99);
    expect(result).toEqual({ tokenCost: 1, tokenType: "STANDARD" });
  });

  it("returns 2 Standard Tokens at the 150 boundary", () => {
    const result = suggestWishlistTokenCost(150);
    expect(result).toEqual({ tokenCost: 2, tokenType: "STANDARD" });
  });

  it("returns 2 Standard Tokens for price just under 400", () => {
    const result = suggestWishlistTokenCost(399.99);
    expect(result).toEqual({ tokenCost: 2, tokenType: "STANDARD" });
  });

  it("returns 3 Standard Tokens at the 400 boundary", () => {
    const result = suggestWishlistTokenCost(400);
    expect(result).toEqual({ tokenCost: 3, tokenType: "STANDARD" });
  });

  it("returns 3 Standard Tokens for price just under 800", () => {
    const result = suggestWishlistTokenCost(799.99);
    expect(result).toEqual({ tokenCost: 3, tokenType: "STANDARD" });
  });

  it("requires manual override at exactly 800", () => {
    const result = suggestWishlistTokenCost(800);
    expect(result).toEqual({ manualRequired: true });
  });

  it("requires manual override for price over 800", () => {
    const result = suggestWishlistTokenCost(800.01);
    expect(result).toEqual({ manualRequired: true });
  });

  it("requires manual override for a large price", () => {
    const result = suggestWishlistTokenCost(5000);
    expect(result).toEqual({ manualRequired: true });
  });
});
