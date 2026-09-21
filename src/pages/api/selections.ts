import type { APIRoute } from "astro";
import { getClassOption, upsertSelection } from "../../lib/db";
import { bus } from "../../lib/events";

// Select or change a class for a course: a plain HTML form POSTs here, the
// choice is upserted into `selections` (one row per course — see the unique
// constraint on selections.courseId in src/lib/schema.ts), and every open
// tab hears about it over the SSE stream. The 303 redirect makes the form
// work with no client-side JavaScript: the submitting tab re-renders from
// SQLite with the new selection and its conflict state already computed.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const courseId = Number(form.get("courseId"));
  const classOptionId = Number(form.get("classOptionId"));
  if (!Number.isInteger(courseId) || !Number.isInteger(classOptionId)) {
    return new Response("courseId and classOptionId are required", { status: 400 });
  }

  // Foreign keys alone only prove both IDs exist somewhere — they don't
  // prove they're paired correctly. Without this check, a tampered form
  // (or a stale page after a course's options changed) could save a
  // selection that points a course at another course's class option.
  const option = getClassOption(classOptionId);
  if (!option || option.courseId !== courseId) {
    return new Response("classOptionId does not belong to courseId", { status: 400 });
  }

  const selection = upsertSelection(courseId, classOptionId);
  bus.emit("selection", selection);
  return redirect("/", 303);
};
