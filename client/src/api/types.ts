import type { Quest, WishlistItem } from "../types";

export interface ApiErrorResponse {
  error: string;
}

export interface DashboardUser {
  username: string;
  level: number;
  current_xp: number;
  xp_to_next_level: number;
  playable_balance: number;
  state: "ACTIVE" | "GULAG" | "REDEMPTION";
  wishlist_tokens_micro: number;
  wishlist_tokens_standard: number;
}

export interface DashboardResponse {
  user: DashboardUser;
  quests: Quest[];
}

export interface WishlistResponse {
  items: WishlistItem[];
  wishlist_tokens_micro: number;
  wishlist_tokens_standard: number;
}

export interface RedeemValidateResponse {
  success: true;
  item: WishlistItem;
}

export interface ConfirmRedeemResponse {
  success: true;
  toastMessages: string[];
  wishlist_tokens_micro: number;
  wishlist_tokens_standard: number;
}

export interface AddWishlistItemPayload {
  item_name: string;
  price_zar: number;
  token_cost?: number;
  token_type?: "MICRO" | "STANDARD";
}

export interface DeleteWishlistItemResponse {
  success: true;
}

export interface QuestCompleteResponse {
  current_xp: number;
  level: number;
  leveledUp: boolean;
  tokenAwarded: "MICRO" | "STANDARD" | null;
  toastMessages: string[];
}

export interface BankWebhookPayload {
  user_id: number;
  amount: number;
  merchant: string;
  system_category: "FIXED_BILL" | "DISCRETIONARY";
  timestamp: string;
}

export interface GameEngineResult {
  success: boolean;
  newState: "ACTIVE" | "GULAG" | "REDEMPTION";
  xpAwarded: number;
  leveledUp: boolean;
  tokenAwarded: "MICRO" | "STANDARD" | null;
  isViolation: boolean;
  toastMessages: string[];
}
