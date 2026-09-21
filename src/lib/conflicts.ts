// Pure conflict-detection logic: no DB or HTTP dependency, so it's testable
// on its own (spec/conflicts.test.ts) without booting the server.

export interface TimeSlot {
  day: string;
  startMinutes: number;
  endMinutes: number;
}

export function slotsOverlap(a: TimeSlot, b: TimeSlot): boolean {
  return a.day === b.day && a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;
}

export interface SelectedSlot extends TimeSlot {
  courseId: number;
}

/** For each selected course, the IDs of the other selected courses whose
 *  class time overlaps it. A course with no entry has no conflict. */
export function findConflicts(selected: SelectedSlot[]): Map<number, number[]> {
  const conflicts = new Map<number, number[]>();
  for (const a of selected) {
    const against = selected
      .filter((b) => b.courseId !== a.courseId && slotsOverlap(a, b))
      .map((b) => b.courseId);
    if (against.length > 0) conflicts.set(a.courseId, against);
  }
  return conflicts;
}
