import type { APIRoute } from "astro";
import { removeSelection } from "../../../lib/db";
import { bus } from "../../../lib/events";

// Remove a course's saved selection. Same no-JS-required shape as
// api/selections.ts: a form POSTs here, the row is deleted, other tabs hear
// about it over SSE, and the 303 redirect re-renders the submitting tab.
export const POST: APIRoute = async ({ request, redirect }) => {
  const form = await request.formData();
  const courseId = Number(form.get("courseId"));
  if (!Number.isInteger(courseId)) {
    return new Response("courseId is required", { status: 400 });
  }

  removeSelection(courseId);
  bus.emit("selection", { courseId, removed: true });
  return redirect("/", 303);
};
