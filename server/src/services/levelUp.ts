import type { PoolClient } from "pg";
import {
  XP_LEVEL_THRESHOLDS,
  SEASON_MAX_XP,
} from "../constants/gameConfig";
import type { TokenType } from "../constants/gameConfig";
import type { UserRow } from "../types/gameLogic";

export interface LevelUpOutcome {
  newXp: number;
  newLevel: number;
  leveledUp: boolean;
  tokenAwarded: TokenType | null;
  toastMessages: string[];
}

/**
 * Adds XP to the user, recalculates their level, awards tokens if a level
 * threshold is crossed, and writes the updated columns to `users` in the
 * supplied pg transaction client.
 *
 * This function is the single place where XP + level + token state is mutated.
 * It is called from both the webhook handler and the quest completion route.
 */
export async function applyXpAndLevelUp(
  client: PoolClient,
  user: UserRow,
  xpToAdd: number
): Promise<LevelUpOutcome> {
  const newXp = Math.min(user.current_xp + xpToAdd, SEASON_MAX_XP);

  // Find the highest level the user qualifies for at this XP total.
  let newLevel = user.level;
  let tokenAwarded: TokenType | null = null;
  const toastMessages: string[] = [];

  for (const config of XP_LEVEL_THRESHOLDS) {
    if (newXp >= config.xpRequiredCumulative) {
      newLevel = config.level;
    }
  }

  const leveledUp = newLevel > user.level;

  if (leveledUp) {
    // Walk each newly crossed level and award tokens for all that carry one.
    for (const config of XP_LEVEL_THRESHOLDS) {
      if (config.level > user.level && config.level <= newLevel && config.tokenReward !== null) {
        tokenAwarded = config.tokenReward;
      }
    }

    toastMessages.push(`LEVEL UP. You are now Level ${newLevel}.`);

    if (tokenAwarded === "MICRO") {
      toastMessages.push("Micro-Token earned. Check your Vault.");
    }
    // PRD Section 10 does not define a Standard Token toast — level-up toast is sufficient.
  }

  const newMicro =
    user.wishlist_tokens_micro + (tokenAwarded === "MICRO" ? 1 : 0);
  const newStandard =
    user.wishlist_tokens_standard + (tokenAwarded === "STANDARD" ? 1 : 0);

  await client.query(
    `UPDATE users
     SET current_xp = $2,
         level = $3,
         wishlist_tokens_micro = $4,
         wishlist_tokens_standard = $5
     WHERE id = $1`,
    [user.id, newXp, newLevel, newMicro, newStandard]
  );

  return { newXp, newLevel, leveledUp, tokenAwarded, toastMessages };
}
