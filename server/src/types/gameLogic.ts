import type { UserState, TokenType, QuestType } from "../constants/gameConfig";

export interface BankWebhookPayload {
  user_id: number;
  amount: number;
  merchant: string;
  system_category: "FIXED_BILL" | "DISCRETIONARY";
  timestamp: string;
}

export interface GameEngineResult {
  success: boolean;
  newState: UserState;
  xpAwarded: number;
  leveledUp: boolean;
  tokenAwarded: TokenType | null;
  isViolation: boolean;
  toastMessages: string[];
}

export interface UserRow {
  id: number;
  playable_balance: string;
  current_xp: number;
  level: number;
  wishlist_tokens_micro: number;
  wishlist_tokens_standard: number;
  state: UserState;
}

export interface QuestRow {
  id: number;
  user_id: number;
  title: string;
  xp_reward: number;
  quest_type: QuestType;
  status: "ACTIVE" | "COMPLETE" | "FAILED";
  streak_count: number;
}
