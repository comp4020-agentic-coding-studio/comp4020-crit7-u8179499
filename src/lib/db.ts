import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import Database from "better-sqlite3";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { SEED_COURSES } from "./seed-data";
import { type ClassOption, type Course, type Selection, classOptions, courses, selections } from "./schema";

// One SQLite file is the app's whole persistent state. In production
// fly.toml points DATABASE_PATH at the machine's volume (/data), which is
// how state survives a reload and a redeploy; locally it defaults to an
// untracked file in .data/.
const path = process.env.DATABASE_PATH ?? "./.data/app.db";
mkdirSync(dirname(path), { recursive: true });

const client = new Database(path);
client.pragma("journal_mode = WAL");
// better-sqlite3 doesn't enforce foreign keys by default per connection —
// without this, the references()/cascade declarations in schema.ts are
// silently decorative.
client.pragma("foreign_keys = ON");

export const db = drizzle(client);

// Migrations run at boot, on whatever machine holds the volume — the
// recommended shape for SQLite on Fly, where there's no separate machine to
// run them from. The flow: edit src/lib/schema.ts, `pnpm db:generate`,
// commit the migration it writes to drizzle/.
migrate(db, { migrationsFolder: "./drizzle" });

// Seed the demo courses/class options once, so a fresh Fly volume or a fresh
// CI throwaway DB (spec/global-setup.ts always points at a new temp file)
// has data to show with no manual step. Never touches `selections` — that
// table starts empty so the write path is real, not pre-populated.
function seedIfEmpty(): void {
  const existing = db.select({ id: courses.id }).from(courses).limit(1).all();
  if (existing.length > 0) return;
  for (const course of SEED_COURSES) {
    const { id: courseId } = db.insert(courses).values({ code: course.code, title: course.title }).returning({ id: courses.id }).get();
    for (const option of course.classOptions) {
      db.insert(classOptions).values({ courseId, ...option }).run();
    }
  }
}
seedIfEmpty();

export type { ClassOption, Course, Selection };

export function listCourses(): Course[] {
  return db.select().from(courses).orderBy(courses.code).all();
}

export function listClassOptions(): ClassOption[] {
  return db.select().from(classOptions).all();
}

export function listSelections(): Selection[] {
  return db.select().from(selections).all();
}

export function getClassOption(id: number): ClassOption | undefined {
  return db.select().from(classOptions).where(eq(classOptions.id, id)).get();
}

export function upsertSelection(courseId: number, classOptionId: number): Selection {
  return db
    .insert(selections)
    .values({ courseId, classOptionId })
    .onConflictDoUpdate({
      target: selections.courseId,
      set: { classOptionId, updatedAt: sql`(datetime('now'))` },
    })
    .returning()
    .get();
}

export function removeSelection(courseId: number): void {
  db.delete(selections).where(eq(selections.courseId, courseId)).run();
}
