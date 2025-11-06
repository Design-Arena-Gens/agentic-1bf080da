import { randomUUID } from "crypto";

export type ChatMessage = {
  id: string;
  text: string;
  createdAt: string;
};

export type ServerEvent =
  | { type: "message"; payload: ChatMessage }
  | { type: "ready" }
  | { type: "init"; payload: ChatMessage[] };

const MAX_PERSISTED_MESSAGES = 200;

let messages: ChatMessage[] = [];
const subscribers = new Set<(event: ServerEvent) => void>();

const broadcast = (event: ServerEvent) => {
  for (const subscriber of subscribers) {
    try {
      subscriber(event);
    } catch {
      // Ignore subscriber errors to keep broadcast loop resilient.
    }
  }
};

export const addSubscriber = (fn: (event: ServerEvent) => void) => {
  subscribers.add(fn);
  return () => {
    subscribers.delete(fn);
  };
};

export const addMessage = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty.");
  }

  const safeText = trimmed.slice(0, 500);
  const message: ChatMessage = {
    id: randomUUID(),
    text: safeText,
    createdAt: new Date().toISOString(),
  };

  messages = [...messages.slice(-MAX_PERSISTED_MESSAGES + 1), message];

  broadcast({ type: "message", payload: message });

  return message;
};

export const getSnapshot = () => messages.slice();

export const emitReady = (fn: (event: ServerEvent) => void) => {
  fn({ type: "ready" });
};

export const emitInitialPayload = (fn: (event: ServerEvent) => void) => {
  if (messages.length) {
    fn({ type: "init", payload: getSnapshot() });
  }
};
