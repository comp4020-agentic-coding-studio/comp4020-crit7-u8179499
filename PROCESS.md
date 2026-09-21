# Process overview

## What I built

The ANU Timetable Planner — a page where a student picks a tutorial/lab for
each of a handful of courses, sees immediately if two picks clash, and has
those picks persist in SQLite. `README.md` has the full product account and
what "good" means for this app; this file is how I got there.

## How I got here

I started from a brief, not a spec — "ANU timetable/class selection is hard
to scan and compare" — and asked the agent not to write anything until we'd
agreed a concrete plan. I gave it the product decision and the core flow (view
courses → see options → pick one → see conflicts → persist → reload →
change/remove) plus explicit exclusions (no auth, no real ANU API, no
enrolment, no multi-user), and asked for a plan covering the user flow,
schema, seed data, conflict-detection approach, which starter files would be
replaced, a commit sequence, and what the smallest complete version looks
like — deliberately withholding "go ahead and code it" until I'd read that
plan.

Reviewing the plan surfaced the one real design gap: the schema was going to
have both `course_id` and `class_option_id` on a selection, connected by
foreign keys, but nothing in a foreign key stops those two ids from being a
*mismatched* pair — a valid course id and a valid class-option id that
belongs to a different course. I sent the agent back with two corrections
before implementation: validate that pairing server-side and reject a
mismatch instead of writing it, and make sure the seeded timetable data is
labelled as demo/sample rather than presented as real ANU class times. Both
are visible in the commit history from the first commit that touches the
write path onward, not bolted on afterwards:

- Schema and generated migration:
  [`7289636`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-u8179499/commit/7289636)
- DB layer, boot-time seed (seed data is explicitly commented as invented,
  not real ANU data):
  [`e724a68`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-u8179499/commit/e724a68)
- Pure conflict-detection module, written test-first against
  `spec/conflicts.test.ts`:
  [`fbe3a1d`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-u8179499/commit/fbe3a1d)
- API routes — this is where the courseId/classOptionId pairing check lives:
  [`bb8a7e8`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-u8179499/commit/bb8a7e8)
- UI, including the demo-data notice and the text-based (not colour-only)
  conflict banner:
  [`a6a9c5f`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-u8179499/commit/a6a9c5f)
- Retiring the starter's guestbook test and adding this app's own
  end-to-end contracts:
  [`bfee02e`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-u8179499/commit/bfee02e)

The correction that mattered most, roughly as given:

> When handling a selection POST, validate on the server that the submitted
> `classOptionId` actually belongs to the submitted `courseId` before
> upserting the selection. [...] If they do not match, reject the request
> safely instead of writing inconsistent data.

I checked the result by reading the actual diff of `src/pages/api/selections.ts`
in [`bb8a7e8`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit7-u8179499/commit/bb8a7e8)
rather than trusting a description of it, and by having
`spec/timetable.test.ts` assert the mismatch case directly (POST a real
course id against another course's class-option id, expect a 400 and no row
written). I also had `spec/conflicts.test.ts` written before
`src/lib/conflicts.ts` existed, so it genuinely started red.

Before calling it done I ran `pnpm check` (typecheck plus the full spec suite
against a built server) and re-ran it again after each round of commits above
to make sure nothing regressed on the way through.

## Before you ship

`pnpm check:evidence` verifies that this comment is gone, that your citations
resolve to real commits, that a crit week's reflection entry is in
`reflections/`, and that your `CLAUDE.md` is there. It checks that your account
is traceable, not that it is good: that is the marker's call.

Images aren't checked: unlike a citation whose SHA doesn't resolve, a broken
image is visible the moment this file is rendered on GitHub.
