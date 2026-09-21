# Working on this repo

This is the ANU Timetable Planner (see `README.md` for the product account).
Rules for whoever — human or agent — touches this repo next.

## Don't change without a reason

- `fly.toml`, `Dockerfile`, `.github/workflows/checks.yml`, and
  `astro.config.ts`'s `security`/`adapter` settings are load-bearing for
  deploy and CI. Read them before touching anything nearby; if a change here
  seems necessary, say why in the commit message.
- `/api/events` must keep streaming bytes on connect. The deploy check in
  `.github/workflows/checks.yml` curls it and fails the deploy if it doesn't
  — this is why the SSE plumbing exists even though the app has no chat/log
  feature that obviously needs it.

## Data integrity

- Never hand-write a file under `drizzle/`. Change `src/lib/schema.ts`, then
  run `pnpm db:generate`, and commit whatever it produces.
- A `selections` row has both `course_id` and `class_option_id`. A foreign
  key only proves each id exists somewhere, not that the class option
  actually belongs to that course — any code path that writes a selection
  (see `src/pages/api/selections.ts`) must look the option up and check its
  `course_id` before writing, and reject a mismatch instead of saving an
  inconsistent row.
- The seeded courses, class options, days and times
  (`src/lib/seed-data.ts`) are invented for this prototype. Never present
  them, in the UI or in docs, as real or current ANU timetable data — say
  plainly that they're sample/demo data.

## Conflict detection

- Overlap logic lives in `src/lib/conflicts.ts` as pure functions with no
  DB/HTTP dependency, so it can be unit-tested directly
  (`spec/conflicts.test.ts`) rather than only through the rendered page.
- A conflicting pair of selections is allowed to save — it's flagged, not
  blocked. Don't add a validation error that prevents saving an overlapping
  choice; a real student might accept a clash on purpose.
- Conflict messaging must carry meaning in text, not colour alone. jsdom (the
  invariants test environment) doesn't compute real contrast, so a
  colour-only signal would pass CI while still failing real accessibility.

## Tests

- `spec/*.test.ts` is this project's own work, run via `pnpm test` /
  `pnpm check`; `spec/invariants.test.ts` and `spec/readme.test.ts` are
  fixed harness the starter ships and should not be weakened.
- Prefer testing this app's actual contracts (a selection persists across a
  reload, a mismatched pair is rejected, an overlapping pair is flagged)
  over re-testing framework or library behaviour.
