export type UserState = "ACTIVE" | "GULAG" | "REDEMPTION";
export type TokenType = "MICRO" | "STANDARD";
export type QuestType = "DAILY" | "WEEKLY" | "GULAG_REDEMPTION";
export type QuestCadence = "DAILY" | "WEEKLY" | "ONE_TIME_PER_GULAG";

export interface LevelConfig {
  level: number;
  xpRequiredCumulative: number;
  tokenReward: TokenType | null;
}

export interface QuestXpConfig {
  questKey: string;
  example: string;
  xpReward: number;
  resetCadence: QuestCadence;
}

export interface TokenTypeConfig {
  type: TokenType;
  howEarned: string;
  redeemableFor: string;
}

export interface WishlistPricingTier {
  minPriceZar: number;
  maxPriceZar: number | null;
  tokenCost: number;
  tokenType: TokenType;
  manualOverride: boolean;
}

/** Cumulative XP thresholds per level (Section 4.1). */
export const XP_LEVEL_THRESHOLDS: readonly LevelConfig[] = [
  { level: 1, xpRequiredCumulative: 0, tokenReward: null },
  { level: 2, xpRequiredCumulative: 100, tokenReward: null },
  { level: 3, xpRequiredCumulative: 250, tokenReward: null },
  { level: 4, xpRequiredCumulative: 450, tokenReward: null },
  { level: 5, xpRequiredCumulative: 700, tokenReward: "MICRO" },
  { level: 6, xpRequiredCumulative: 1000, tokenReward: null },
  { level: 7, xpRequiredCumulative: 1350, tokenReward: null },
  { level: 8, xpRequiredCumulative: 1750, tokenReward: null },
  { level: 9, xpRequiredCumulative: 2200, tokenReward: null },
  { level: 10, xpRequiredCumulative: 2700, tokenReward: "STANDARD" },
] as const;

export const SEASON_MAX_XP = 2700;
export const MAX_LEVEL = 10;
export const STARTING_LEVEL = 1;
export const STARTING_XP = 0;

/** Level at which each token type is awarded (Section 4.1 / 4.2). */
export const MICRO_TOKEN_LEVEL = 5;
export const STANDARD_TOKEN_LEVEL = 10;

/** Token type definitions (Section 4.2). */
export const TOKEN_TYPES: readonly TokenTypeConfig[] = [
  {
    type: "MICRO",
    howEarned: "Reaching Level 5",
    redeemableFor:
      "Small guilt-free purchases (coffee, single snack). Wishlist items priced at 1 Micro-Token.",
  },
  {
    type: "STANDARD",
    howEarned: "Reaching Level 10",
    redeemableFor:
      "Mid-tier Wishlist items. Priced at 1–3 Standard Tokens depending on real-world cost.",
  },
] as const;

/** Quest XP values (Section 4.3). */
export const QUEST_XP_VALUES: readonly QuestXpConfig[] = [
  {
    questKey: "ZERO_SPEND_DAY",
    example: "No discretionary spending today",
    xpReward: 25,
    resetCadence: "DAILY",
  },
  {
    questKey: "UNDER_BUDGET_DAY",
    example: "Spend under daily discretionary limit",
    xpReward: 15,
    resetCadence: "DAILY",
  },
  {
    questKey: "MEAL_PREP",
    example: "Manual check-in: cooked at home",
    xpReward: 20,
    resetCadence: "DAILY",
  },
  {
    questKey: "WEEKLY_STREAK",
    example: "5+ Zero Spend Days in a week",
    xpReward: 100,
    resetCadence: "WEEKLY",
  },
  {
    questKey: "WEEKLY_UNDER_BUDGET",
    example: "All 7 days under daily limit",
    xpReward: 75,
    resetCadence: "WEEKLY",
  },
  {
    questKey: "GULAG_REDEMPTION",
    example: "3 consecutive days zero discretionary",
    xpReward: 50,
    resetCadence: "ONE_TIME_PER_GULAG",
  },
] as const;

/** Gulag redemption streak requirement (Section 4.3 / 5). */
export const GULAG_REDEMPTION_STREAK_DAYS = 3;

/** Wishlist token pricing tiers in ZAR (Section 4.4). */
export const WISHLIST_PRICING_TIERS: readonly WishlistPricingTier[] = [
  {
    minPriceZar: 0,
    maxPriceZar: 50,
    tokenCost: 1,
    tokenType: "MICRO",
    manualOverride: false,
  },
  {
    minPriceZar: 50,
    maxPriceZar: 150,
    tokenCost: 1,
    tokenType: "STANDARD",
    manualOverride: false,
  },
  {
    minPriceZar: 150,
    maxPriceZar: 400,
    tokenCost: 2,
    tokenType: "STANDARD",
    manualOverride: false,
  },
  {
    minPriceZar: 400,
    maxPriceZar: 800,
    tokenCost: 3,
    tokenType: "STANDARD",
    manualOverride: false,
  },
  {
    minPriceZar: 800,
    maxPriceZar: null,
    tokenCost: 0,
    tokenType: "STANDARD",
    manualOverride: true,
  },
] as const;

/** User state enum values (Section 5). */
export const USER_STATES: readonly UserState[] = [
  "ACTIVE",
  "GULAG",
  "REDEMPTION",
] as const;

/** Canonical quest titles used for quest matching and DB inserts. */
export const QUEST_TITLES = {
  ZERO_SPEND_DAY: "Zero Spend Day",
  UNDER_BUDGET_DAY: "Under Budget Day",
  MEAL_PREP: "Meal Prep",
  WEEKLY_STREAK: "Weekly Streak",
  WEEKLY_UNDER_BUDGET: "Weekly Under Budget",
  GULAG_REDEMPTION: "Gulag Redemption",
} as const;
