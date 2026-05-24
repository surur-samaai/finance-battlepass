import type { PoolClient } from "pg";
import {
  QUEST_XP_VALUES,
  QUEST_TITLES,
  type QuestType,
} from "../constants/gameConfig";

type SeedableQuestKey = keyof Omit<typeof QUEST_TITLES, "GULAG_REDEMPTION">;

function cadenceToQuestType(
  cadence: "DAILY" | "WEEKLY" | "ONE_TIME_PER_GULAG"
): QuestType | null {
  if (cadence === "DAILY") return "DAILY";
  if (cadence === "WEEKLY") return "WEEKLY";
  return null;
}

export async function seedDefaultQuests(
  client: PoolClient,
  userId: number
): Promise<void> {
  for (const quest of QUEST_XP_VALUES) {
    const questType = cadenceToQuestType(quest.resetCadence);
    if (questType === null) continue;

    const questKey = quest.questKey as SeedableQuestKey;
    const title = QUEST_TITLES[questKey];

    await client.query(
      `INSERT INTO quests (user_id, title, xp_reward, quest_type, status, streak_count)
       VALUES ($1, $2, $3, $4, 'ACTIVE', 0)`,
      [userId, title, quest.xpReward, questType]
    );
  }
}
