"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ChatMessage = { role: "user" | "assistant"; content: string };

export function PageAssistantWidget() {
  const t = useTranslations("pageAssistant");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastPathname, setLastPathname] = useState(pathname);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMessages([]);
    setError(null);
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, pending]);

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || pending) return;

    const pageText = document.querySelector("main")?.textContent?.replace(/\s+/g, " ").trim() ?? "";

    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setQuestion("");
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/assistant/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, pageText, pathname }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("error"));
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.answer || t("noAnswer") }]);
      }
    } catch {
      setError(t("error"));
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-96 w-80 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-200 bg-brand-navy/5 px-3 py-2">
            <span className="text-sm font-medium">{t("title")}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded p-1 text-slate-500 hover:bg-slate-100"
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 text-sm">
            {messages.length === 0 && <p className="text-slate-400">{t("intro")}</p>}
            <div className="flex flex-col gap-2">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "self-end rounded-lg bg-brand-navy px-3 py-1.5 text-white"
                      : "self-start rounded-lg bg-slate-100 px-3 py-1.5 text-slate-800"
                  }
                >
                  {m.content}
                </div>
              ))}
              {pending && (
                <div className="flex items-center gap-1 self-start text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t("thinking")}
                </div>
              )}
            </div>
            {error && <p className="mt-2 text-red-600">{error}</p>}
          </div>
          <form onSubmit={ask} className="flex gap-2 border-t border-slate-200 p-2">
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t("placeholder")}
              className="flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
            <Button type="submit" size="sm" disabled={pending || !question.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
      <Button
        type="button"
        onClick={() => setOpen((o) => !o)}
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg"
        aria-label={t("title")}
      >
        <MessageCircle className="h-5 w-5" />
      </Button>
    </div>
  );
}
