// Pure presentation helpers for the "My Weekly Timetable" grid: no DB/HTTP
// dependency, kept separate from src/lib/conflicts.ts (which stays focused on
// overlap detection, not rendering). Grid geometry (rows/columns) is derived
// here so src/pages/index.astro only has to place data into it.

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const DAY_LABELS: Record<Weekday, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
};

// The grid covers 8:00-18:00 in 30-minute rows. If you change these, update
// the matching `repeat(20, ...)` row count in styles.css to keep them in sync.
export const GRID_START_MINUTES = 8 * 60;
export const GRID_END_MINUTES = 18 * 60;
export const ROW_MINUTES = 30;
export const TOTAL_ROWS = (GRID_END_MINUTES - GRID_START_MINUTES) / ROW_MINUTES;

/** Grid row line for a given time-of-day, offset by 1 for the day-header row. */
export function rowLine(minutes: number): number {
  return 2 + (minutes - GRID_START_MINUTES) / ROW_MINUTES;
}

export interface LayoutItem {
  startMinutes: number;
  endMinutes: number;
}

export interface PositionedItem<T extends LayoutItem> {
  item: T;
  lane: number;
  laneCount: number;
}

/** Assigns each item a side-by-side "lane" so overlapping items in the same
 *  day render next to each other instead of stacking on top of one another. */
export function layoutDay<T extends LayoutItem>(items: T[]): PositionedItem<T>[] {
  const sorted = [...items].sort((a, b) => a.startMinutes - b.startMinutes);

  const groups: T[][] = [];
  let current: T[] = [];
  let currentEnd = -Infinity;
  for (const item of sorted) {
    if (current.length === 0 || item.startMinutes < currentEnd) {
      current.push(item);
      currentEnd = Math.max(currentEnd, item.endMinutes);
    } else {
      groups.push(current);
      current = [item];
      currentEnd = item.endMinutes;
    }
  }
  if (current.length > 0) groups.push(current);

  const result: PositionedItem<T>[] = [];
  for (const group of groups) {
    const laneEnds: number[] = [];
    const laneOf = new Map<T, number>();
    for (const item of group) {
      let lane = laneEnds.findIndex((end) => end <= item.startMinutes);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(item.endMinutes);
      } else {
        laneEnds[lane] = item.endMinutes;
      }
      laneOf.set(item, lane);
    }
    const laneCount = laneEnds.length;
    for (const item of group) result.push({ item, lane: laneOf.get(item)!, laneCount });
  }
  return result;
}
