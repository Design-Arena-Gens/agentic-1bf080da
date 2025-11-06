import { NextRequest } from "next/server";
import {
  addMessage,
  addSubscriber,
  emitInitialPayload,
  emitReady,
  ServerEvent,
} from "@/lib/messageBus";

const encoder = new TextEncoder();

const formatEvent = (event: ServerEvent) =>
  `data: ${JSON.stringify(event)}\n\n`;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  let cleanup = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: ServerEvent) => {
        controller.enqueue(encoder.encode(formatEvent(event)));
      };

      const unsubscribe = addSubscriber(send);
      cleanup = () => {
        unsubscribe();
        cleanup = () => {};
      };

      emitReady(send);
      emitInitialPayload(send);

      request.signal.addEventListener(
        "abort",
        cleanup,
        { once: true },
      );
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
      "Cache-Control": "no-cache, no-transform",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    if (typeof text !== "string") {
      return new Response(
        JSON.stringify({ error: "Message text must be a string." }),
        { status: 400 },
      );
    }

    const message = addMessage(text);

    return new Response(JSON.stringify({ message }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: (error as Error).message ?? "Unable to send message.",
      }),
      { status: 400 },
    );
  }
}
