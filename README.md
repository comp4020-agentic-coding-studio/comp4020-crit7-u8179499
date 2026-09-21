# ANU Timetable Planner

ANU's own timetable/class-selection tools are hard to scan and compare when
you're just trying to pick a tutorial or lab and see if it clashes with
something else. This is a small slice of that problem: a page that lists a
handful of courses, lets you pick a class for each one, tells you immediately
if two of your picks overlap, and remembers your choices.

**Demo data:** the seeded courses, class options, days and times are invented
for this prototype. They are not pulled from any real ANU timetable and
shouldn't be read as current or official ANU class information — this is a
prototype of the *interaction*, not a feed of real enrolment data.

## The core flow

1. Each course shows its tutorial/lab options as a group of radio buttons.
2. Picking one and pressing **Select** saves it and re-renders the page.
3. If your saved pick overlaps another course's saved pick on the same day,
   both courses show a plain-text banner naming the clashing course and time
   — conflicting picks are still allowed to save, they're just flagged, since
   a real student might accept a clash on purpose (e.g. a recorded lecture).
4. Reloading the page, or opening it in another tab, shows the same saved
   state — selections live in SQLite, not in the page.
5. **Remove** clears a course's saved pick. Selecting again while one already
   exists replaces it rather than adding a second one.

## What good looks like here

- **Selections persist for real.** They're rows in SQLite (via Drizzle),
  written by a normal form POST, not client-side state — the point of the
  Crit is that a reload doesn't lose your work.
- **A conflict is computed, not hand-authored.** `src/lib/conflicts.ts` is a
  small pure function (same-day, overlapping-interval check) that runs
  against whatever is actually saved, so it stays right as selections change.
  It's unit-tested directly (`spec/conflicts.test.ts`), and the served page
  is tested end-to-end against it (`spec/timetable.test.ts`).
- **A selection can't quietly point at the wrong course.** The schema has
  both a `course_id` and a `class_option_id` on a selection, and a foreign
  key only proves each id exists *somewhere* — not that the class option
  actually belongs to that course. `POST /api/selections` looks the option
  up and checks its course before writing anything, and rejects a mismatch
  with a 400 instead of saving an inconsistent row.
- **No JavaScript is required for the core flow.** Selecting, changing and
  removing are all plain HTML forms with a 303 redirect back to `/`, which is
  what the rest of the starter's guestbook already did — this keeps
  conflict-checking to one code path (the server, on every render) instead of
  duplicating it in the browser.
- **What's a judgement call, not a checked rule:** the visual styling, the
  wording of the conflict banner, and how many courses/options are worth
  seeding for a convincing demo. The accessibility structure (one `<h1>`,
  a nav landmark, labelled form controls, text-based conflict messaging) is
  enforced by `spec/invariants.test.ts`; how it actually *looks* isn't.

## Deliberately out of scope

No authentication, no real ANU API integration or scraping, no enrolment
functionality, no multi-user accounts. This models one slice of the
class-selection experience, not a replacement for ANU's timetabling system.

## Live update

The starter's Server-Sent-Events channel is kept and repurposed: any tab that
selects, changes or removes a class broadcasts over `/api/events`, and other
open tabs reload to pick up the new saved state and conflict banners.
