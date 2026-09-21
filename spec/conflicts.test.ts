import { describe, expect, it } from "vitest";
import { findConflicts, slotsOverlap } from "../src/lib/conflicts";

describe("slotsOverlap", () => {
  it("is false for different days at the same time", () => {
    expect(
      slotsOverlap(
        { day: "Mon", startMinutes: 600, endMinutes: 660 },
        { day: "Tue", startMinutes: 600, endMinutes: 660 },
      ),
    ).toBe(false);
  });

  it("is false for adjacent, non-overlapping times on the same day", () => {
    expect(
      slotsOverlap(
        { day: "Mon", startMinutes: 600, endMinutes: 660 },
        { day: "Mon", startMinutes: 660, endMinutes: 720 },
      ),
    ).toBe(false);
  });

  it("is true when time ranges intersect on the same day", () => {
    expect(
      slotsOverlap(
        { day: "Mon", startMinutes: 600, endMinutes: 660 },
        { day: "Mon", startMinutes: 630, endMinutes: 690 },
      ),
    ).toBe(true);
  });
});

describe("findConflicts", () => {
  it("returns nothing when no selections overlap", () => {
    const conflicts = findConflicts([
      { courseId: 1, day: "Mon", startMinutes: 600, endMinutes: 660 },
      { courseId: 2, day: "Tue", startMinutes: 600, endMinutes: 660 },
    ]);
    expect(conflicts.size).toBe(0);
  });

  it("flags both sides of an overlapping pair", () => {
    const conflicts = findConflicts([
      { courseId: 1, day: "Mon", startMinutes: 600, endMinutes: 660 },
      { courseId: 2, day: "Mon", startMinutes: 630, endMinutes: 690 },
      { courseId: 3, day: "Wed", startMinutes: 900, endMinutes: 960 },
    ]);
    expect(conflicts.get(1)).toEqual([2]);
    expect(conflicts.get(2)).toEqual([1]);
    expect(conflicts.has(3)).toBe(false);
  });
});
