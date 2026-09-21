# Crit 7 reflection

**What was the breakthrough that moved the work forward?**

Deciding to write the full implementation plan before any code, and reviewing
it critically rather than approving it on sight, is what made the build go
smoothly. Reading that plan surfaced a real gap: the schema has both
`course_id` and `class_option_id` on a selection, but a foreign key only
proves each id exists somewhere — nothing stops a `POST` from pairing a valid
course with a valid class option that belongs to a *different* course. That's
not a hypothetical; it's exactly the kind of bug that looks fine in the happy
path and only shows up as silently wrong data later. Catching it at the plan
stage meant the fix — look the option up server-side and compare its
`course_id` before writing — was designed in from the first commit of the API
routes, instead of getting bolted on after a bug report.

**What did this work change about who I want to be as a software developer?**

I want to be someone who treats "the types line up" as necessary but not
sufficient. Drizzle's foreign keys made the schema *look* airtight, and it
would have been easy to trust that and move on. The useful habit this crit
reinforced is asking, for every write path, "what could two individually
valid inputs combine to produce that's still wrong?" — and then writing that
check, and a test for it, rather than assuming the database's own constraints
already cover it. That question is cheap to ask up front and expensive to
answer after the fact.
