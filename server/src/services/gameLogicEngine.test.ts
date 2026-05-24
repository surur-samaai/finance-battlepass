/**
 * Unit tests for the Game Logic Engine (Phase 2).
 *
 * The pg pool is fully mocked — no real DB connection is required.
 * Each test configures mock `query` responses to simulate specific DB state,
 * then asserts the GameEngineResult matches PRD Section 9 rules.
 */
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";

// vi.mock is hoisted before module initialisation, so the factory must be
// self-contained — no references to variables declared in this file.
vi.mock("../db/index", () => ({
  pool: {
    connect: vi.fn(),
  },
}));

import { pool } from "../db/index";
import { processTransaction, validatePayload, ValidationError } from "./gameLogicEngine";
import { XP_LEVEL_THRESHOLDS } from "../constants/gameConfig";

// ---------------------------------------------------------------------------
// Per-test client setup
// ---------------------------------------------------------------------------

function buildMockClient() {
  const mockQuery = vi.fn();
  const mockRelease = vi.fn();
  (pool.connect as Mock).mockResolvedValue({ query: mockQuery, release: mockRelease });
  return mockQuery;
}

/**
 * Sets up `mockQuery` to return specific rows for successive calls.
 * Calls beyond the provided list resolve to `{ rows: [] }`.
 */
function setupQueries(mockQuery: Mock, responses: Array<{ rows: unknown[] }>) {
  let callIndex = 0;
  mockQuery.mockImplementation(() => {
    const resp = responses[callIndex] ?? { rows: [] };
    callIndex++;
    return Promise.resolve(resp);
  });
}

// ---------------------------------------------------------------------------
// Fixture builders
// ---------------------------------------------------------------------------

function makeUser(overrides: Partial<{
  id: number;
  playable_balance: string;
  current_xp: number;
  level: number;
  wishlist_tokens_micro: number;
  wishlist_tokens_standard: number;
  state: "ACTIVE" | "GULAG" | "REDEMPTION";
}> = {}) {
  return {
    id: 1,
    playable_balance: "3000.00",
    current_xp: 0,
    level: 1,
    wishlist_tokens_micro: 0,
    wishlist_tokens_standard: 0,
    state: "ACTIVE" as const,
    ...overrides,
  };
}

function makeQuest(overrides: Partial<{
  id: number;
  user_id: number;
  title: string;
  xp_reward: number;
  quest_type: "DAILY" | "WEEKLY" | "GULAG_REDEMPTION";
  status: "ACTIVE" | "COMPLETE" | "FAILED";
  streak_count: number;
  last_streak_date: string | null;
  created_at: string;
}> = {}) {
  return {
    id: 10,
    user_id: 1,
    title: "Under Budget Day",
    xp_reward: 15,
    quest_type: "DAILY" as const,
    status: "ACTIVE" as const,
    streak_count: 0,
    last_streak_date: null,
    created_at: "2026-05-01T12:00:00.000Z",
    ...overrides,
  };
}

function makeGulagRedemptionQuest(
  overrides: Partial<{
    streak_count: number;
    last_streak_date: string | null;
    created_at: string;
  }> = {}
) {
  return makeQuest({
    id: 50,
    title: "Gulag Redemption",
    xp_reward: 50,
    quest_type: "GULAG_REDEMPTION",
    ...overrides,
  });
}

const baseDiscretionary = {
  user_id: 1,
  amount: 50,
  merchant: "Nando's Rondebosch",
  system_category: "DISCRETIONARY" as const,
  timestamp: "2026-05-24T10:00:00.000Z",
};

const baseFixedBill = {
  ...baseDiscretionary,
  system_category: "FIXED_BILL" as const,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// validatePayload
// ---------------------------------------------------------------------------

describe("validatePayload", () => {
  it("accepts a valid payload", () => {
    expect(() => validatePayload(baseDiscretionary)).not.toThrow();
  });

  it("rejects a non-object", () => {
    expect(() => validatePayload("bad")).toThrow(ValidationError);
  });

  it("rejects negative amount", () => {
    expect(() => validatePayload({ ...baseDiscretionary, amount: -1 })).toThrow(ValidationError);
  });

  it("rejects invalid system_category", () => {
    expect(() =>
      validatePayload({ ...baseDiscretionary, system_category: "OTHER" })
    ).toThrow(ValidationError);
  });

  it("rejects empty merchant", () => {
    expect(() => validatePayload({ ...baseDiscretionary, merchant: "" })).toThrow(ValidationError);
  });
});

// ---------------------------------------------------------------------------
// processTransaction
// ---------------------------------------------------------------------------

describe("processTransaction", () => {
  // -------------------------------------------------------------------------
  // FIXED_BILL path
  // -------------------------------------------------------------------------
  it("FIXED_BILL: returns no XP, no state change, not a violation", async () => {
    const mockQuery = buildMockClient();
    setupQueries(mockQuery, [
      { rows: [] },                    // BEGIN
      { rows: [makeUser()] },          // SELECT user FOR UPDATE
      { rows: [] },                    // UPDATE balance
      { rows: [{ id: 99 }] },          // INSERT transaction
      { rows: [] },                    // COMMIT
    ]);

    const result = await processTransaction(baseFixedBill, 1);

    expect(result.success).toBe(true);
    expect(result.newState).toBe("ACTIVE");
    expect(result.xpAwarded).toBe(0);
    expect(result.isViolation).toBe(false);
    expect(result.leveledUp).toBe(false);
    expect(result.tokenAwarded).toBeNull();
  });

  // -------------------------------------------------------------------------
  // GULAG: any discretionary spend logs violation, no XP
  // -------------------------------------------------------------------------
  it("GULAG + DISCRETIONARY: is_violation=true, state stays GULAG, no XP", async () => {
    const mockQuery = buildMockClient();
    setupQueries(mockQuery, [
      { rows: [] },
      { rows: [makeUser({ state: "GULAG" })] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
    ]);

    const result = await processTransaction(baseDiscretionary, 1);

    expect(result.newState).toBe("GULAG");
    expect(result.isViolation).toBe(true);
    expect(result.xpAwarded).toBe(0);
    expect(result.toastMessages).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // GULAG: FIXED_BILL — balance deducted, state stays GULAG, not a violation
  // -------------------------------------------------------------------------
  it("GULAG + FIXED_BILL: balance deducted, state stays GULAG, is_violation=false", async () => {
    const mockQuery = buildMockClient();
    setupQueries(mockQuery, [
      { rows: [] },
      { rows: [makeUser({ state: "GULAG" })] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
    ]);

    const result = await processTransaction(baseFixedBill, 1);

    expect(result.newState).toBe("GULAG");
    expect(result.isViolation).toBe(false);
    expect(result.xpAwarded).toBe(0);
  });

  it("GULAG + FIXED_BILL with zero yesterday: streak advances to REDEMPTION", async () => {
    const mockQuery = buildMockClient();
    const gulagQuest = makeGulagRedemptionQuest({
      created_at: "2026-05-20T12:00:00.000Z",
    });
    setupQueries(mockQuery, [
      { rows: [] },
      { rows: [makeUser({ state: "GULAG" })] },
      { rows: [gulagQuest] },
      { rows: [{ count: "0" }] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
    ]);

    const result = await processTransaction(
      { ...baseFixedBill, timestamp: "2026-05-24T10:00:00.000Z" },
      1
    );

    expect(result.newState).toBe("REDEMPTION");
    expect(result.isViolation).toBe(false);
    expect(result.toastMessages).toContain("Day 1 of 3 complete. 2 more.");
  });

  // -------------------------------------------------------------------------
  // ACTIVE + Zero Spend Day violation
  // -------------------------------------------------------------------------
  it("ACTIVE + Zero Spend Day quest: violation → state=GULAG, GULAG_REDEMPTION quest inserted, no XP", async () => {
    const mockQuery = buildMockClient();
    const zeroSpendQuest = makeQuest({ title: "Zero Spend Day" });
    setupQueries(mockQuery, [
      { rows: [] },                           // BEGIN
      { rows: [makeUser()] },                 // SELECT user FOR UPDATE
      { rows: [zeroSpendQuest] },             // SELECT active quests
      { rows: [{ total: "0.00" }] },          // today's discretionary total
      { rows: [] },                           // UPDATE balance
      { rows: [] },                           // INSERT transaction
      { rows: [] },                           // UPDATE users SET state='GULAG'
      { rows: [] },                           // INSERT GULAG_REDEMPTION quest
      { rows: [] },                           // COMMIT
    ]);

    const result = await processTransaction(baseDiscretionary, 1);

    expect(result.newState).toBe("GULAG");
    expect(result.isViolation).toBe(true);
    expect(result.xpAwarded).toBe(0);
    expect(result.leveledUp).toBe(false);
    expect(result.toastMessages).toContain("Violation detected. Battle Pass frozen.");

    const queryStrings = mockQuery.mock.calls.map((c: unknown[]) =>
      typeof c[0] === "string" ? c[0] : ""
    );
    expect(queryStrings.some((q: string) => q.includes("GULAG_REDEMPTION"))).toBe(true);
  });

  // -------------------------------------------------------------------------
  // ACTIVE + Under Budget Day valid spend
  // -------------------------------------------------------------------------
  it("ACTIVE + Under Budget Day quest + spend within limit: awards XP, state stays ACTIVE", async () => {
    const mockQuery = buildMockClient();
    const user = makeUser({ current_xp: 0, level: 1 });
    const underBudgetQuest = makeQuest({ title: "Under Budget Day", xp_reward: 15 });
    // playable_balance=3000, end of a 30-day month → limit ≈ 100/day; spend 50 ≤ 100
    setupQueries(mockQuery, [
      { rows: [] },
      { rows: [user] },
      { rows: [underBudgetQuest] },
      { rows: [{ total: "0.00" }] },
      { rows: [] },   // UPDATE balance
      { rows: [] },   // INSERT transaction
      { rows: [] },   // UPDATE quest COMPLETE
      { rows: [] },   // UPDATE users XP/level
      { rows: [] },   // COMMIT
    ]);

    const result = await processTransaction(baseDiscretionary, 1);

    expect(result.newState).toBe("ACTIVE");
    expect(result.isViolation).toBe(false);
    expect(result.xpAwarded).toBe(15);
    expect(result.toastMessages).toContain("+15 XP. Under Budget Day complete.");
  });

  // -------------------------------------------------------------------------
  // Level 5 threshold → Micro-Token awarded
  // -------------------------------------------------------------------------
  it("crossing Level 5 threshold awards a Micro-Token and correct toasts", async () => {
    const mockQuery = buildMockClient();
    const level5Config = XP_LEVEL_THRESHOLDS.find((l) => l.level === 5)!;
    // 5 XP below level 5; Under Budget quest gives 15 XP → crosses threshold
    const user = makeUser({
      current_xp: level5Config.xpRequiredCumulative - 5,
      level: 4,
    });
    const underBudgetQuest = makeQuest({ title: "Under Budget Day", xp_reward: 15 });
    setupQueries(mockQuery, [
      { rows: [] },
      { rows: [user] },
      { rows: [underBudgetQuest] },
      { rows: [{ total: "0.00" }] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
    ]);

    const result = await processTransaction(baseDiscretionary, 1);

    expect(result.leveledUp).toBe(true);
    expect(result.tokenAwarded).toBe("MICRO");
    expect(result.toastMessages).toContain("LEVEL UP. You are now Level 5.");
    expect(result.toastMessages).toContain("Micro-Token earned. Check your Vault.");
  });

  // -------------------------------------------------------------------------
  // Level 10 threshold → Standard Token awarded
  // -------------------------------------------------------------------------
  it("crossing Level 10 threshold awards a Standard Token", async () => {
    const mockQuery = buildMockClient();
    const level10Config = XP_LEVEL_THRESHOLDS.find((l) => l.level === 10)!;
    const user = makeUser({
      current_xp: level10Config.xpRequiredCumulative - 5,
      level: 9,
    });
    const underBudgetQuest = makeQuest({ title: "Under Budget Day", xp_reward: 15 });
    setupQueries(mockQuery, [
      { rows: [] },
      { rows: [user] },
      { rows: [underBudgetQuest] },
      { rows: [{ total: "0.00" }] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
      { rows: [] },
    ]);

    const result = await processTransaction(baseDiscretionary, 1);

    expect(result.leveledUp).toBe(true);
    expect(result.tokenAwarded).toBe("STANDARD");
    expect(result.toastMessages).toContain("LEVEL UP. You are now Level 10.");
  });

  // -------------------------------------------------------------------------
  // DB failure mid-write → ROLLBACK issued, error rethrown
  // -------------------------------------------------------------------------
  it("DB failure after user fetch causes ROLLBACK and rethrows", async () => {
    const mockQuery = buildMockClient();
    let callCount = 0;
    mockQuery.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return Promise.resolve({ rows: [] });         // BEGIN
      if (callCount === 2) return Promise.resolve({ rows: [makeUser()] }); // SELECT user
      return Promise.reject(new Error("DB connection lost"));
    });

    await expect(
      processTransaction(baseDiscretionary, 1)
    ).rejects.toThrow("DB connection lost");

    const queryStrings = mockQuery.mock.calls.map((c: unknown[]) =>
      typeof c[0] === "string" ? c[0] : ""
    );
    expect(queryStrings).toContain("ROLLBACK");
  });
});
