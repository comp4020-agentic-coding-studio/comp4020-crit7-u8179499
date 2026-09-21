import { sql } from "drizzle-orm";
import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

// The schema is the ground truth for the database. To change it: edit here,
// run `pnpm db:generate` to turn the diff into a migration under drizzle/,
// and commit both — the migration applies automatically when the server
// boots (see src/lib/db.ts), locally and deployed. Never edit the database
// by hand: state on the deployed volume outlives every deploy, and the
// migration trail is what keeps old state and new code compatible.

export const courses = sqliteTable("courses", {
  id: int().primaryKey({ autoIncrement: true }),
  code: text().notNull().unique(),
  title: text().notNull(),
});

export const classOptions = sqliteTable("class_options", {
  id: int().primaryKey({ autoIncrement: true }),
  courseId: int("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  type: text().notNull(),
  label: text().notNull(),
  day: text().notNull(),
  startMinutes: int("start_minutes").notNull(),
  endMinutes: int("end_minutes").notNull(),
  location: text(),
});

// One selection per course: `courseId` is unique, so a re-selection upserts
// the existing row instead of creating a second one for the same course.
export const selections = sqliteTable("selections", {
  id: int().primaryKey({ autoIncrement: true }),
  courseId: int("course_id")
    .notNull()
    .unique()
    .references(() => courses.id, { onDelete: "cascade" }),
  classOptionId: int("class_option_id")
    .notNull()
    .references(() => classOptions.id, { onDelete: "cascade" }),
  updatedAt: text("updated_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export type Course = typeof courses.$inferSelect;
export type ClassOption = typeof classOptions.$inferSelect;
export type Selection = typeof selections.$inferSelect;
