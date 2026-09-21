// Invented demo data — sample ANU-style courses and class times for this
// prototype, not pulled from any real ANU timetable. Times are minutes since
// midnight (600 = 10:00), matching src/lib/schema.ts's class_options columns.
// COMP4020 Tutorial 1 (Mon 600-660) deliberately overlaps COMP2100 Lab 1
// (Mon 630-690), so a conflict is visible the first time two courses are
// picked, not only if a marker happens to choose a clashing pair.
export const SEED_COURSES = [
  {
    code: "COMP4020",
    title: "Agentic Coding Studio",
    classOptions: [
      { type: "tutorial", label: "Tutorial 1", day: "Mon", startMinutes: 600, endMinutes: 660 },
      { type: "tutorial", label: "Tutorial 2", day: "Wed", startMinutes: 840, endMinutes: 900 },
    ],
  },
  {
    code: "COMP2100",
    title: "Software Engineering Studio 1",
    classOptions: [
      { type: "lab", label: "Lab 1", day: "Mon", startMinutes: 630, endMinutes: 690 },
      { type: "lab", label: "Lab 2", day: "Thu", startMinutes: 540, endMinutes: 600 },
    ],
  },
  {
    code: "COMP1730",
    title: "Programming for Scientists",
    classOptions: [
      { type: "lab", label: "Lab 1", day: "Tue", startMinutes: 660, endMinutes: 780 },
      { type: "lab", label: "Lab 2", day: "Fri", startMinutes: 540, endMinutes: 660 },
    ],
  },
  {
    code: "COMP3620",
    title: "Artificial Intelligence",
    classOptions: [
      { type: "tutorial", label: "Tutorial 1", day: "Wed", startMinutes: 870, endMinutes: 930 },
      { type: "tutorial", label: "Tutorial 2", day: "Mon", startMinutes: 780, endMinutes: 840 },
    ],
  },
] as const;
