type UserState = "ACTIVE" | "GULAG" | "REDEMPTION";
type CoinTier = "MICRO" | "STANDARD";

const USER_STATE_LABELS: Record<UserState, string> = {
  ACTIVE: "Active",
  GULAG: "Budgt Break",
  REDEMPTION: "Recovery",
};

/** Map DB state enum to v2 display label. */
export function formatUserState(state: UserState): string {
  return USER_STATE_LABELS[state];
}

/** Format wishlist coin tier for display (Micro Coin / Micro Coins). */
export function formatCoinTier(type: CoinTier, plural = false): string {
  const base = type === "MICRO" ? "Micro Coin" : "Standard Coin";
  if (!plural) {
    return base;
  }
  return base.endsWith("Coin") ? `${base}s` : base;
}

/** Rebrand backend-sourced or legacy v1 strings for UI display. */
export function rebrandUserFacingString(text: string): string {
  return text
    .replace(/Finance Battle Pass/g, "Budgt Hero")
    .replace(/Battle Pass/g, "Budgt Pass")
    .replace(/Wishlist Vault/g, "The Shop")
    .replace(/Add to Vault/g, "Add to The Shop")
    .replace(/Your Vault/g, "The Shop")
    .replace(/the Vault/g, "The Shop")
    .replace(/Check your Vault/g, "Check The Shop")
    .replace(/Loading vault/gi, "Loading The Shop")
    .replace(/Standard Tokens/g, "Standard Coins")
    .replace(/Micro Tokens/g, "Micro Coins")
    .replace(/Standard Token/g, "Standard Coin")
    .replace(/Micro Token/g, "Micro Coin")
    .replace(/Standard-Tokens/g, "Standard Coins")
    .replace(/Micro-Tokens/g, "Micro Coins")
    .replace(/Standard-Token/g, "Standard Coin")
    .replace(/Micro-Token/g, "Micro Coin")
    .replace(/\bTokens\b/g, "Coins")
    .replace(/\bToken\b/g, "Coin")
    .replace(/Gulag/g, "Budgt Break")
    .replace(/\bVault\b/g, "The Shop")
    .replace(/\bLoadout\b/g, "Profile");
}

/** Rebrand quest title from API for display. */
export function rebrandQuestTitle(title: string): string {
  return rebrandUserFacingString(title);
}
