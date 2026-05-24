import { Router } from "express";
import { pool } from "../db/index";
import { applyXpAndLevelUp } from "../services/levelUp";
import type { UserRow, QuestRow } from "../types/gameLogic";

const router = Router();

router.post("/:id/quests/:questId/complete", async (req, res) => {
  const routeUserId = parseInt(req.params["id"], 10);
  const questId = parseInt(req.params["questId"], 10);

  if (isNaN(routeUserId) || routeUserId !== req.user!.id || isNaN(questId)) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }

  const userId = req.user!.id;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { rows: questRows } = await client.query<QuestRow>(
      `SELECT id, user_id, title, xp_reward, quest_type, status, streak_count
       FROM quests
       WHERE id = $1 AND user_id = $2
       FOR UPDATE`,
      [questId, userId]
    );

    if (questRows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "Quest not found." });
      return;
    }

    const quest = questRows[0];

    if (quest.quest_type === "GULAG_REDEMPTION") {
      await client.query("ROLLBACK");
      res.status(403).json({
        error: "GULAG_REDEMPTION quests cannot be manually completed.",
      });
      return;
    }

    if (quest.status !== "ACTIVE") {
      await client.query("ROLLBACK");
      res.status(409).json({ error: "Quest is not active." });
      return;
    }

    await client.query(
      `UPDATE quests SET status = 'COMPLETE' WHERE id = $1`,
      [questId]
    );

    const { rows: userRows } = await client.query<UserRow>(
      `SELECT id, playable_balance, current_xp, level,
              wishlist_tokens_micro, wishlist_tokens_standard, state
       FROM users
       WHERE id = $1
       FOR UPDATE`,
      [userId]
    );

    if (userRows.length === 0) {
      await client.query("ROLLBACK");
      res.status(404).json({ error: "User not found." });
      return;
    }

    const user = userRows[0];
    const toastMessages: string[] = [
      `+${quest.xp_reward} XP. ${quest.title} complete.`,
    ];

    const outcome = await applyXpAndLevelUp(client, user, quest.xp_reward);
    toastMessages.push(...outcome.toastMessages);

    await client.query("COMMIT");

    res.json({
      current_xp: outcome.newXp,
      level: outcome.newLevel,
      leveledUp: outcome.leveledUp,
      tokenAwarded: outcome.tokenAwarded,
      toastMessages,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Quest completion error:", err);
    res.status(500).json({ error: "Internal server error." });
  } finally {
    client.release();
  }
});

export default router;
