"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  text: string;
  createdAt: string;
};

type ServerEvent =
  | { type: "ready" }
  | { type: "init"; payload: ChatMessage[] }
  | { type: "message"; payload: ChatMessage };

const formatTime = (iso: string) =>
  new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "online" | "offline"
  >("connecting");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      eventSource = new EventSource("/api/messages");

      eventSource.onopen = () => {
        setConnectionStatus("online");
      };

      eventSource.onerror = () => {
        setConnectionStatus("offline");
        eventSource?.close();
        if (retryTimer) {
          clearTimeout(retryTimer);
        }
        retryTimer = setTimeout(() => {
          setConnectionStatus("connecting");
          connect();
        }, 3000);
      };

      eventSource.onmessage = (event) => {
        const parsed: ServerEvent = JSON.parse(event.data);

        if (parsed.type === "init") {
          setMessages(parsed.payload);
        } else if (parsed.type === "message") {
          setMessages((prev) => {
            const exists = prev.some((item) => item.id === parsed.payload.id);
            if (exists) {
              return prev;
            }

            return [...prev, parsed.payload];
          });
        }
      };
    };

    connect();

    return () => {
      eventSource?.close();
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const messageCountLabel = useMemo(() => {
    if (!messages.length) {
      return "No messages yet. Break the ice!";
    }
    if (messages.length === 1) {
      return "1 message in the room";
    }
    return `${messages.length} messages in the room`;
  }, [messages.length]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }

    try {
      setSending(true);
      setError(null);

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Unable to send message.");
      }

      setInput("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-50">
      <header className="border-b border-white/10 bg-gradient-to-r from-zinc-900 via-slate-900 to-zinc-900 px-6 py-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Anonymous Broadcast
            </h1>
            <p className="text-sm text-zinc-300">
              Drop a message and it instantly reaches everyone in the room
              without revealing who you are.
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>{messageCountLabel}</span>
            <span
              className={
                connectionStatus === "online"
                  ? "text-emerald-400"
                  : connectionStatus === "connecting"
                    ? "text-amber-300"
                    : "text-rose-400"
              }
            >
              {connectionStatus === "online" && "Live"}
              {connectionStatus === "connecting" && "Connecting…"}
              {connectionStatus === "offline" && "Disconnected"}
            </span>
          </div>
        </div>
      </header>

      <main className="flex flex-1 justify-center px-4 py-8 sm:px-6">
        <div className="flex w-full max-w-4xl flex-1 flex-col rounded-2xl border border-white/10 bg-black/40 backdrop-blur">
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <ul className="space-y-4">
              {messages.map((message) => (
                <li
                  key={message.id}
                  className="group relative max-w-lg rounded-2xl border border-white/5 bg-white/5 px-4 py-3 shadow-sm transition hover:border-white/20"
                >
                  <p className="text-sm text-zinc-100">{message.text}</p>
                  <span className="mt-3 block text-right text-[11px] uppercase tracking-widest text-zinc-500">
                    {formatTime(message.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-white/10 bg-zinc-950/80 p-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <label className="sr-only" htmlFor="message">
                Your message
              </label>
              <input
                id="message"
                name="message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Say something nice (or loud)…"
                maxLength={500}
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-zinc-100 shadow-inner transition placeholder:text-zinc-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-emerald-950 shadow-lg transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                {sending ? "Sending…" : "Broadcast"}
              </button>
            </div>
            {error ? (
              <p className="mt-2 text-sm text-rose-300" role="alert">
                {error}
              </p>
            ) : (
              <p className="mt-2 text-xs text-zinc-500">
                Messages are public & anonymous. Keep it kind.
              </p>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
