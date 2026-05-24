import { apiClient } from "./client";
import type { QuestCompleteResponse } from "./types";

export async function completeQuest(
  userId: number,
  questId: number
): Promise<QuestCompleteResponse> {
  const { data } = await apiClient.post<QuestCompleteResponse>(
    `/api/user/${userId}/quests/${questId}/complete`
  );
  return data;
}
