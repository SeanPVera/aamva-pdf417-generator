import { describe, it, expect } from "vitest";
import {
  BADGES,
  EMPTY_BADGE_STATS,
  TOTAL_JURISDICTIONS,
  earnedBadges,
  featuredBadge,
  type BadgeStats
} from "../core/badges";
import { AAMVA_STATES } from "../core/states";
import { BINGO_SQUARES, buildCard, completedLines, isBlackout, FREE_SPACE } from "../core/bingo";
import { formatTicket, parseHeightInches, heightRemark, formatFeetInches } from "../core/whimsy";
import { getStatePlate, STATE_PLATES, DEFAULT_PLATE } from "../core/stateSlogans";

const stats = (patch: Partial<BadgeStats> = {}): BadgeStats => ({ ...EMPTY_BADGE_STATS, ...patch });

describe("badge stats defaults", () => {
  it("match the store's inlined initial counters", async () => {
    // The store inlines these to keep the badge catalog out of the initial
    // chunk; this test is the guard against the two copies drifting.
    const { useFormStore } = await import("../hooks/useFormStore");
    useFormStore.persist?.clearStorage?.();
    const storeDefaults = Object.keys(EMPTY_BADGE_STATS).sort();
    const live = Object.keys(useFormStore.getState().badgeStats).sort();
    expect(live).toEqual(storeDefaults);
  });
});

describe("badges", () => {
  it("tracks the real jurisdiction count", () => {
    expect(TOTAL_JURISDICTIONS).toBe(Object.keys(AAMVA_STATES).length);
  });

  it("awards nothing on a fresh session", () => {
    expect(earnedBadges(EMPTY_BADGE_STATS)).toEqual([]);
    expect(featuredBadge(EMPTY_BADGE_STATS)).toBeUndefined();
  });

  it("awards Tour of Duty only after every jurisdiction is visited", () => {
    const codes = Object.keys(AAMVA_STATES);
    const almost = earnedBadges(stats({ visitedStates: codes.slice(0, -1) }));
    expect(almost.map((b) => b.id)).not.toContain("tour-of-duty");
    const all = earnedBadges(stats({ visitedStates: codes }));
    expect(all.map((b) => b.id)).toContain("tour-of-duty");
  });

  it("awards Clean Sweep only when there are no redos", () => {
    expect(earnedBadges(stats({ undos: 20, redos: 0 })).map((b) => b.id)).toContain("clean-sweep");
    expect(earnedBadges(stats({ undos: 20, redos: 1 })).map((b) => b.id)).not.toContain(
      "clean-sweep"
    );
  });

  it("reports progress only while a badge is unearned", () => {
    const windowClerk = BADGES.find((b) => b.id === "window-clerk")!;
    expect(windowClerk.progress?.(stats({ generated: 10 }))).toBe("10/50");
    expect(windowClerk.progress?.(stats({ generated: 50 }))).toBeUndefined();
  });

  it("gives every badge a unique id and non-empty copy", () => {
    const ids = new Set(BADGES.map((b) => b.id));
    expect(ids.size).toBe(BADGES.length);
    for (const badge of BADGES) {
      expect(badge.label, badge.id).toBeTruthy();
      expect(badge.blurb, badge.id).toBeTruthy();
      expect(badge.emoji, badge.id).toBeTruthy();
    }
  });

  it("features the last earned badge", () => {
    const earned = earnedBadges(stats({ cleanGenerated: 1, exports: 25 }));
    expect(featuredBadge(stats({ cleanGenerated: 1, exports: 25 }))).toBe(
      earned[earned.length - 1]
    );
  });
});

describe("bingo", () => {
  it("builds a 25-cell card with the free space in the middle", () => {
    const card = buildCard();
    expect(card).toHaveLength(25);
    expect(card[12]).toEqual(FREE_SPACE);
  });

  it("ships exactly 24 markable squares with unique ids", () => {
    expect(BINGO_SQUARES).toHaveLength(24);
    expect(new Set(BINGO_SQUARES.map((s) => s.id)).size).toBe(24);
  });

  it("reports no lines on an empty card", () => {
    expect(completedLines(new Set())).toEqual([]);
  });

  it("counts the free space toward the middle row, column, and both diagonals", () => {
    const card = buildCard();
    // Middle row is indices 10–14; the free space at 12 comes for free.
    const middleRow = [10, 11, 13, 14].map((i) => card[i]!.id);
    const lines = completedLines(new Set(middleRow));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toEqual([10, 11, 12, 13, 14]);
  });

  it("detects a completed column", () => {
    const card = buildCard();
    const column = [0, 5, 10, 15, 20].map((i) => card[i]!.id);
    expect(completedLines(new Set(column))).toContainEqual([0, 5, 10, 15, 20]);
  });

  it("only calls blackout when all 24 squares are marked", () => {
    const all = new Set(BINGO_SQUARES.map((s) => s.id));
    expect(isBlackout(all)).toBe(true);
    all.delete(BINGO_SQUARES[0]!.id);
    expect(isBlackout(all)).toBe(false);
  });
});

describe("whimsy helpers", () => {
  it("formats queue tickets with a letter block and zero padding", () => {
    expect(formatTicket(0)).toBe("A-000");
    expect(formatTicket(47)).toBe("A-047");
    expect(formatTicket(999)).toBe("A-999");
    expect(formatTicket(1000)).toBe("B-000");
  });

  it("parses inches and centimetres from DAU", () => {
    expect(parseHeightInches("069 IN")).toBe(69);
    expect(parseHeightInches("69")).toBe(69);
    expect(parseHeightInches("175 CM")).toBeCloseTo(68.9, 1);
  });

  it("returns null for values still being typed", () => {
    expect(parseHeightInches("")).toBeNull();
    expect(parseHeightInches("6")).toBeNull();
    expect(parseHeightInches("abc")).toBeNull();
    expect(parseHeightInches("000")).toBeNull();
  });

  it("remarks only on implausible heights", () => {
    expect(heightRemark(69)).toBe("");
    expect(heightRemark(null)).toBe("");
    expect(heightRemark(30)).toMatch(/second clerk/);
    expect(heightRemark(90)).toMatch(/second clerk/);
    expect(heightRemark(80)).toMatch(/Duck/);
  });

  it("formats feet and inches without ever printing twelve inches", () => {
    expect(formatFeetInches(69)).toBe(`5'9"`);
    expect(formatFeetInches(72)).toBe(`6'0"`);
    expect(formatFeetInches(71.6)).toBe(`6'0"`);
  });
});

describe("state plates", () => {
  it("returns the curated plate for a known jurisdiction", () => {
    expect(getStatePlate("NH").slogan).toBe("Live Free or Die");
    expect(getStatePlate("ID").slogan).toBe("Famous Potatoes");
  });

  it("falls back for unknown codes", () => {
    expect(getStatePlate("ZZ")).toEqual(DEFAULT_PLATE);
  });

  it("covers every supported jurisdiction with non-empty copy", () => {
    for (const code of Object.keys(AAMVA_STATES)) {
      const plate = STATE_PLATES[code];
      expect(plate, code).toBeDefined();
      expect(plate!.title, code).toBeTruthy();
      expect(plate!.slogan, code).toBeTruthy();
    }
  });
});
