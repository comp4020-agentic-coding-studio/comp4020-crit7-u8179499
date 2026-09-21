import type { APIRoute } from "astro";
import { bus } from "../../lib/events";

// The minimal server-sent-events (SSE) pattern: a long-lived streaming
// response the browser consumes with `new EventSource("/api/events")`.
// SSE is one-directional (server → browser) and plain HTTP, which makes it
// the simplest live channel that works everywhere — reach for WebSockets
// only when the client needs to push over the same connection.
//
// The client's reaction to a "selection" event is a full page reload (see
// index.astro), so the payload itself isn't consumed — only that an event
// arrives. This also keeps the deploy check in .github/workflows/checks.yml
// green, which just confirms /api/events streams bytes.
export const GET: APIRoute = () => {
  let onSelection: () => void;
  let heartbeat: ReturnType<typeof setInterval>;

  const stream = new ReadableStream<string>({
    start(controller) {
      // an opening comment so the client (and the post-deploy CI probe) sees
      // bytes immediately, and a periodic one so proxies don't drop the
      // connection as idle
      controller.enqueue(": connected\n\n");
      heartbeat = setInterval(() => controller.enqueue(": ping\n\n"), 30_000);
      onSelection = () => {
        controller.enqueue(`data: changed\n\n`);
      };
      bus.on("selection", onSelection);
    },
    cancel() {
      clearInterval(heartbeat);
      bus.off("selection", onSelection);
    },
  });

  return new Response(stream.pipeThrough(new TextEncoderStream()), {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
    },
  });
};
