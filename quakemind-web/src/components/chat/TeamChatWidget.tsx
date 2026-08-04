"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchChatMessages, sendChatMessage, ChatMessage } from "@/lib/api";

const OPEN_POLL_MS = 4000;
const CLOSED_POLL_MS = 15000;

export default function TeamChatWidget() {
  const { user, token, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [unread, setUnread] = useState(0);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSeenIdRef = useRef<string | null>(null);
  const openRef = useRef(open);
  openRef.current = open;

  const canChat = Boolean(user && token && (role === "responder" || role === "admin"));

  const poll = useCallback(async () => {
    if (!token) return;
    try {
      const latest = await fetchChatMessages(token, 50);
      setMessages((prev) => {
        if (latest.length === prev.length && latest.every((m, i) => m.id === prev[i]?.id)) {
          return prev;
        }
        return latest;
      });
      if (latest.length > 0) {
        const newestId = latest[latest.length - 1].id;
        if (!openRef.current && lastSeenIdRef.current && newestId !== lastSeenIdRef.current) {
          const seenIndex = latest.findIndex((m) => m.id === lastSeenIdRef.current);
          setUnread(seenIndex >= 0 ? latest.length - 1 - seenIndex : latest.length);
        }
        if (openRef.current) {
          lastSeenIdRef.current = newestId;
          setUnread(0);
        } else if (!lastSeenIdRef.current) {
          lastSeenIdRef.current = newestId;
        }
      }
    } catch (e) {
      // Silent -- chat polling shouldn't surface errors over the whole app.
    }
  }, [token]);

  useEffect(() => {
    if (!canChat) return;
    poll();
    const interval = setInterval(poll, open ? OPEN_POLL_MS : CLOSED_POLL_MS);
    return () => clearInterval(interval);
  }, [canChat, open, poll]);

  useEffect(() => {
    if (open && messages.length > 0) {
      lastSeenIdRef.current = messages[messages.length - 1].id;
      setUnread(0);
    }
  }, [open, messages]);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !token || sending) return;
    setSending(true);
    try {
      const sent = await sendChatMessage(token, text);
      setMessages((prev) => [...prev, sent]);
      setDraft("");
      lastSeenIdRef.current = sent.id;
    } catch (e) {
      // Leave draft in place so the user can retry.
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!canChat) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {open && (
        <div className="mb-3 w-80 h-96 glass-panel rounded-2xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/60">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100">Ekip Sohbeti</p>
              <p className="text-xs text-slate-400 truncate">
                {user?.name} {user?.unit ? `· ${user.unit}` : ""}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg glass-button text-slate-300 hover:text-white shrink-0"
              aria-label="Sohbeti kapat"
            >
              <X size={16} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-xs text-slate-500 text-center mt-6">
                Henüz mesaj yok. Ekibinle konuşmaya başla.
              </p>
            )}
            {messages.map((m) => {
              const mine = m.senderId === user?.id;
              return (
                <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                  {!mine && (
                    <span className="text-[11px] text-slate-400 mb-0.5 px-1">
                      {m.senderName}
                      {m.senderUnit ? ` · ${m.senderUnit}` : ""}
                    </span>
                  )}
                  <div
                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm break-words ${
                      mine
                        ? "bg-red-600/90 text-white rounded-br-sm"
                        : "bg-slate-800/90 text-slate-100 rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 px-1">
                    {new Date(m.timestamp).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 px-3 py-3 border-t border-slate-800 bg-slate-900/60">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Mesaj yaz..."
              maxLength={2000}
              className="flex-1 bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || sending}
              className="p-2 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shrink-0"
              aria-label="Gönder"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-12 h-12 rounded-full glass-panel border border-slate-700 shadow-2xl flex items-center justify-center text-slate-100 hover:text-white hover:border-red-500/60 transition-colors"
        aria-label={open ? "Sohbeti kapat" : "Ekip sohbetini aç"}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}
