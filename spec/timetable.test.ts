import { JSDOM } from "jsdom";
import { beforeAll, describe, expect, it } from "vitest";
import { inject } from "vitest";

// Drives the running app over HTTP to prove the timetable's own contracts
// hold: a selection persists across a reload, changing a course's pick
// replaces rather than duplicates it, an overlapping pair of selections is
// clearly flagged as a conflict, removing a selection clears it, and a
// selection change is broadcast over the SSE stream. Depends on the seeded
// demo data in src/lib/seed-data.ts: COMP4020's Mon 10:00-11:00 tutorial
// deliberately overlaps COMP2100's Mon 10:30-11:30 lab.
const baseUrl = inject("baseUrl");

// Astro checks form POSTs carry a same-origin Origin header (CSRF
// protection); browsers send it automatically, a bare fetch doesn't.
const post = (path: string, body: URLSearchParams) =>
  fetch(new URL(path, baseUrl), {
    method: "POST",
    headers: { origin: baseUrl },
    body,
    redirect: "manual",
  });

async function page(): Promise<Document> {
  const res = await fetch(baseUrl);
  return new JSDOM(await res.text()).window.document;
}

function findSection(doc: Document, code: string): Element {
  const heading = [...doc.querySelectorAll("h2")].find((h) => h.textContent?.includes(code));
  if (!heading) throw new Error(`no section found for ${code}`);
  return heading.closest("section")!;
}

function courseIdOf(section: Element): string {
  const input = section.querySelector('form[action="/api/selections"] input[name="courseId"]');
  return (input as HTMLInputElement).value;
}

function radioFor(section: Element, timeText: string): HTMLInputElement {
  const label = [...section.querySelectorAll("label")].find((l) => l.textContent?.includes(timeText));
  if (!label) throw new Error(`no option matching "${timeText}" in this section`);
  const forId = label.getAttribute("for")!;
  return section.querySelector(`#${forId}`) as HTMLInputElement;
}

describe("timetable planner", () => {
  let comp4020Id: string;
  let comp2100Id: string;
  let comp4020Tutorial1: string; // Mon 10:00-11:00
  let comp4020Tutorial2: string; // Wed 14:00-15:00, no conflict
  let comp2100Lab1: string; // Mon 10:30-11:30, overlaps comp4020Tutorial1

  beforeAll(async () => {
    const doc = await page();
    const comp4020 = findSection(doc, "COMP4020");
    const comp2100 = findSection(doc, "COMP2100");
    comp4020Id = courseIdOf(comp4020);
    comp2100Id = courseIdOf(comp2100);
    comp4020Tutorial1 = radioFor(comp4020, "10:00–11:00").value;
    comp4020Tutorial2 = radioFor(comp4020, "14:00–15:00").value;
    comp2100Lab1 = radioFor(comp2100, "10:30–11:30").value;
  });

  it("selects a class and persists it across a reload", async () => {
    const res = await post(
      "/api/selections",
      new URLSearchParams({ courseId: comp4020Id, classOptionId: comp4020Tutorial1 }),
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("/");

    const doc = await page();
    const section = findSection(doc, "COMP4020");
    expect(radioFor(section, "10:00–11:00").checked).toBe(true);
  });

  it("rejects a classOptionId that doesn't belong to the given courseId", async () => {
    const res = await post(
      "/api/selections",
      new URLSearchParams({ courseId: comp2100Id, classOptionId: comp4020Tutorial1 }),
    );
    expect(res.status).toBe(400);

    // nothing was written: COMP2100 still has no selection
    const doc = await page();
    const section = findSection(doc, "COMP2100");
    expect(section.querySelectorAll("input[type=radio]:checked").length).toBe(0);
  });

  it("flags a conflict once an overlapping pair is selected, on both sides", async () => {
    await post("/api/selections", new URLSearchParams({ courseId: comp2100Id, classOptionId: comp2100Lab1 }));

    const doc = await page();
    const comp4020 = findSection(doc, "COMP4020");
    const comp2100 = findSection(doc, "COMP2100");
    expect(comp4020.textContent).toContain("Conflicts with COMP2100");
    expect(comp2100.textContent).toContain("Conflicts with COMP4020");
  });

  it("changes a selection (replaces, doesn't duplicate) and clears the conflict once it no longer overlaps", async () => {
    await post("/api/selections", new URLSearchParams({ courseId: comp4020Id, classOptionId: comp4020Tutorial2 }));

    const doc = await page();
    const section = findSection(doc, "COMP4020");
    expect(section.querySelectorAll("input[type=radio]:checked").length).toBe(1);
    expect(radioFor(section, "14:00–15:00").checked).toBe(true);
    expect(radioFor(section, "10:00–11:00").checked).toBe(false);
    expect(section.textContent).not.toContain("Conflicts with");
  });

  it("removes a selection", async () => {
    const res = await post("/api/selections/remove", new URLSearchParams({ courseId: comp2100Id }));
    expect(res.status).toBe(303);

    const doc = await page();
    const section = findSection(doc, "COMP2100");
    expect(section.querySelectorAll("input[type=radio]:checked").length).toBe(0);
    expect(section.querySelector('form[action="/api/selections/remove"]')).toBeNull();
  });

  it("broadcasts a selection change over the SSE stream", async () => {
    const stream = await fetch(new URL("/api/events", baseUrl));
    expect(stream.headers.get("content-type")).toContain("text/event-stream");
    const reader = stream.body?.getReader();
    if (!reader) throw new Error("no response body");

    await post("/api/selections", new URLSearchParams({ courseId: comp4020Id, classOptionId: comp4020Tutorial1 }));

    const decoder = new TextDecoder();
    let received = "";
    while (!received.includes("data:")) {
      const { value, done } = await reader.read();
      if (done) throw new Error("stream ended before an event arrived");
      received += decoder.decode(value, { stream: true });
    }
    await reader.cancel();
  }, 10_000);
});
