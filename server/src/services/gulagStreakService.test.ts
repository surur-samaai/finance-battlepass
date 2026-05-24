/**
 * Unit tests for Gulag streak advancement (Phase 7).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { tryAdvanceGulagStreak } from "./gulagStreakService";
import type { QuestRow, UserRow } from "../types/gameLogic";

function buildMockClient() {
  const mockQuery = vi.fn();
  return mockQuery;
}

function makeUser(
  overrides: Partial<UserRow> = {}
): UserRow {
  return {
    id: 1,
    playable_balance: "3000.00",
    current_xp: 100,
    level: 3,
    wishlist_tokens_micro: 0,
    wishlist_tokens_standard: 0,
    state: "GULAG",
    ...overrides,
  };
}

function makeGulagQuest(
  overrides: Partial<QuestRow> = {}
): QuestRow {
  return {
    id: 99,
    user_id: 1,
    title: "Gulag Redemption",
    xp_reward: 50,
    quest_type: "GULAG_REDEMPTION",
    status: "ACTIVE",
    streak_count: 0,
    last_streak_date: null,
    created_at: "2026-05-20T12:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("tryAdvanceGulagStreak", () => {
  it("does not advance when candidate day is on or before quest creation date", async () => {
    const mockQuery = buildMockClient();
    const client = { query: mockQuery } as unknown as import("pg").PoolClient;
    const quest = makeGulagQuest({ created_at: "2026-05-23T12:00:00.000Z" });

    const result = await tryAdvanceGulagStreak(
      client,
      1,
      makeUser(),
      quest,
      "2026-05-24T10:00:00.000Z"
    );

    expect(result.streakCount).toBe(0);
    expect(result.toastMessages).toHaveLength(0);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("does not advance when yesterday had discretionary spend", async () => {
    const mockQuery = buildMockClient();
    mockQuery.mockResolvedValueOnce({ rows: [{ count: "2" }] });
    const client = { query: mockQuery } as unknown as import("pg").PoolClient;
    const quest = makeGulagQuest();

    const result = await tryAdvanceGulagStreak(
      client,
      1,
      makeUser(),
      quest,
      "2026-05-24T10:00:00.000Z"
    );

    expect(result.streakCount).toBe(0);
    expect(result.toastMessages).toHaveLength(0);
  });

  it("advances streak to 1 and transitions GULAG → REDEMPTION", async () => {
    const mockQuery = buildMockClient();
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: "0" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const client = { query: mockQuery } as unknown as import("pg").PoolClient;
    const quest = makeGulagQuest();

    const result = await tryAdvanceGulagStreak(
      client,
      1,
      makeUser({ state: "GULAG" }),
      quest,
      "2026-05-24T10:00:00.000Z"
    );

    expect(result.streakCount).toBe(1);
    expect(result.newState).toBe("REDEMPTION");
    expect(result.toastMessages).toContain("Day 1 of 3 complete. 2 more.");
  });

  it("does not count the same day twice", async () => {
    const mockQuery = buildMockClient();
    const client = { query: mockQuery } as unknown as import("pg").PoolClient;
    const quest = makeGulagQuest({
      streak_count: 1,
      last_streak_date: "2026-05-23",
    });

    const result = await tryAdvanceGulagStreak(
      client,
      1,
      makeUser({ state: "REDEMPTION" }),
      quest,
      "2026-05-24T10:00:00.000Z"
    );

    expect(result.streakCount).toBe(1);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it("completes streak at 3 and returns ACTIVE with exit toast and XP", async () => {
    const mockQuery = buildMockClient();
    mockQuery
      .mockResolvedValueOnce({ rows: [{ count: "0" }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });
    const client = { query: mockQuery } as unknown as import("pg").PoolClient;
    const quest = makeGulagQuest({
      streak_count: 2,
      last_streak_date: "2026-05-22",
    });

    const result = await tryAdvanceGulagStreak(
      client,
      1,
      makeUser({ state: "REDEMPTION", current_xp: 100, level: 3 }),
      quest,
      "2026-05-24T10:00:00.000Z"
    );

    expect(result.streakCount).toBe(3);
    expect(result.newState).toBe("ACTIVE");
    expect(result.xpAwarded).toBe(50);
    expect(result.toastMessages).toContain(
      "Redemption complete. Battle Pass unlocked."
    );
    expect(result.toastMessages).toContain("+50 XP. Gulag Redemption complete.");
  });
});

describe("gulagProgressToast", () => {
  it("uses PRD wording for day 2", async () => {
    const { gulagProgressToast } = await import("../constants/gameConfig");
    expect(gulagProgressToast(2)).toBe("Day 2 of 3 complete. One more.");
  });
});
