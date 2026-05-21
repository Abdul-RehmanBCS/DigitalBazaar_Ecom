import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { getSessionId, trackEvent } from "../hooks/usePageTracking";
import { MessageCircle, X, Send, Bot, User, RotateCcw, ExternalLink } from "lucide-react";

const PROVIDER_LABELS = { groq: "AI", gemini: "AI", openai: "AI", fallback: "Online" };

const WELCOME = {
  role: "bot",
  text: "Hello! I'm here to help you shop at **Digital Bazaar**.\n\nAsk about products, pricing, orders, payments, or digital delivery — I'll give you a direct answer."
};

const CHAT_STORAGE_KEY = "db_chat_messages";

function parseInline(text) {
  const parts = [];
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: "text", value: text.slice(last, m.index) });
    if (m[1]) parts.push({ type: "bold", value: m[1] });
    else parts.push({ type: "link", label: m[2], href: m[3] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type: "text", value: text.slice(last) });
  return parts.length ? parts : [{ type: "text", value: text }];
}

function ChatMessage({ role, text, logId, feedback, onFeedback, onNavigate }) {
  const lines = text.split("\n").filter((l, i, arr) => l || i < arr.length - 1);

  return (
    <div className={`flex gap-2.5 ${role === "user" ? "justify-end" : "justify-start"}`}>
      {role === "bot" && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-violet-500/20">
          <Bot size={14} className="text-white" />
        </div>
      )}
      <div className={`max-w-[88%] ${role === "user" ? "" : ""}`}>
        <div
          className={`px-3.5 py-2.5 text-[13px] leading-relaxed ${
            role === "user"
              ? "bg-violet-600 text-white rounded-2xl rounded-br-sm shadow-md shadow-violet-900/20"
              : "bg-slate-800/90 text-slate-200 rounded-2xl rounded-bl-sm border border-white/5"
          }`}
        >
          {lines.map((line, li) => (
            <p key={li} className={li > 0 ? "mt-2" : ""}>
              {parseInline(line).map((part, pi) => {
                if (part.type === "bold")
                  return (
                    <strong key={pi} className={role === "user" ? "text-white" : "text-violet-200 font-semibold"}>
                      {part.value}
                    </strong>
                  );
                if (part.type === "link") {
                  const internal = part.href.startsWith("/") || part.href.includes("/products/") || part.href.includes("/blog/");
                  const to = internal ? part.href.replace(/^https?:\/\/[^/]+/, "") || part.href : null;
                  return to ? (
                    <Link
                      key={pi}
                      to={to}
                      onClick={() => {
                        trackEvent("chat", { action: "product_link" });
                        onNavigate?.();
                      }}
                      className="text-violet-300 underline underline-offset-2 hover:text-white font-medium"
                    >
                      {part.label}
                    </Link>
                  ) : (
                    <a key={pi} href={part.href} target="_blank" rel="noopener noreferrer" className="text-violet-300 underline">
                      {part.label}
                    </a>
                  );
                }
                return <span key={pi}>{part.value}</span>;
              })}
            </p>
          ))}
        </div>
        {role === "bot" && logId && feedback === undefined && (
          <div className="flex items-center gap-2 mt-1.5 pl-1">
            <span className="text-[10px] text-slate-500">Helpful?</span>
            <button type="button" onClick={() => onFeedback(logId, true)} className="text-[10px] px-2 py-0.5 rounded-md text-slate-400 hover:text-green-400 hover:bg-green-500/10">
              Yes
            </button>
            <button type="button" onClick={() => onFeedback(logId, false)} className="text-[10px] px-2 py-0.5 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/10">
              No
            </button>
          </div>
        )}
        {role === "bot" && feedback !== undefined && (
          <p className="text-[10px] text-slate-500 mt-1 pl-1">Thanks for your feedback.</p>
        )}
      </div>
      {role === "user" && (
        <div className="w-7 h-7 rounded-full bg-slate-700/80 flex items-center justify-center flex-shrink-0 border border-white/10">
          <User size={14} className="text-slate-300" />
        </div>
      )}
    </div>
  );
}

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState("fallback");
  const [messages, setMessages] = useState(() => {
    try {
      const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [WELCOME];
    } catch {
      return [WELCOME];
    }
  });
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const sessionId = useRef(getSessionId());

  useEffect(() => {
    api.get("/chat/status").then((r) => setProvider(r.data.provider || "fallback")).catch(() => {});
  }, []);

  useEffect(() => {
    sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      trackEvent("chat", { action: "open" });
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const sendFeedback = async (logId, helpful) => {
    setMessages((m) => m.map((msg) => (msg.logId === logId ? { ...msg, feedback: helpful } : msg)));
    try {
      await api.post("/chat/feedback", { logId, helpful });
    } catch {
      /* ignore */
    }
  };

  const resetChat = () => {
    setMessages([WELCOME]);
    setMessage("");
    trackEvent("chat", { action: "reset" });
  };

  const sendMessage = useCallback(
    async (text) => {
      const trimmed = (text || message).trim();
      if (!trimmed || loading) return;

      const history = messages
        .filter((m) => m.role === "user" || m.role === "bot")
        .slice(-10)
        .map((m) => ({ role: m.role, text: m.text }));

      setMessages((m) => [...m, { role: "user", text: trimmed }]);
      setMessage("");
      setLoading(true);
      trackEvent("chat", { action: "message" });

      try {
        const { data } = await api.post("/chat", {
          message: trimmed,
          sessionId: sessionId.current,
          history
        });
        setMessages((m) => [...m, { role: "bot", text: data.answer, logId: data.logId }]);
      } catch {
        setMessages((m) => [
          ...m,
          {
            role: "bot",
            text: "I couldn't connect right now. Please try again, or browse [All Products](/products) and [Blog](/blog) on the site."
          }
        ]);
      } finally {
        setLoading(false);
      }
    },
    [message, loading, messages]
  );

  const hasUserMessage = messages.some((m) => m.role === "user");

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
      {open && (
        <div
          className="w-[min(400px,calc(100vw-1.5rem))] mb-3 rounded-2xl overflow-hidden border border-violet-500/25 shadow-2xl shadow-black/50 flex flex-col bg-[#0c0c1a]/95 backdrop-blur-xl"
          style={{ maxHeight: "min(560px, calc(100vh - 5rem))" }}
          role="dialog"
          aria-label="Store assistant"
        >
          <div className="bg-gradient-to-r from-violet-600 via-violet-600 to-indigo-600 px-4 py-3.5 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Store Assistant</p>
                <p className="text-[11px] text-violet-100/90 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {PROVIDER_LABELS[provider] || "Online"} · replies instantly
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={resetChat} title="New chat" className="p-2 rounded-lg hover:bg-white/15 text-white/90">
                <RotateCcw size={15} />
              </button>
              <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-white/15 text-white">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] scroll-smooth">
            {messages.map((m, i) => (
              <ChatMessage
                key={i}
                role={m.role}
                text={m.text}
                logId={m.logId}
                feedback={m.feedback}
                onFeedback={sendFeedback}
                onNavigate={() => setOpen(false)}
              />
            ))}

            {loading && (
              <div className="flex gap-2.5 items-center">
                <div className="w-7 h-7 rounded-full bg-violet-600/30 flex items-center justify-center">
                  <Bot size={14} className="text-violet-400 animate-pulse" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-slate-800/90 border border-white/5">
                  <p className="text-xs text-slate-400">Thinking...</p>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-white/5 flex-shrink-0 bg-slate-900/50">
            <div className="px-3 pt-2 flex gap-3 text-[11px]">
              <Link to="/products" onClick={() => setOpen(false)} className="text-violet-400 hover:text-violet-300 flex items-center gap-1">
                <ExternalLink size={10} /> Products
              </Link>
              <Link to="/blog" onClick={() => setOpen(false)} className="text-violet-400 hover:text-violet-300 flex items-center gap-1">
                <ExternalLink size={10} /> Blog
              </Link>
              <Link to="/cart" onClick={() => setOpen(false)} className="text-violet-400 hover:text-violet-300 flex items-center gap-1">
                <ExternalLink size={10} /> Cart
              </Link>
            </div>
            <div className="p-3 flex gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                className="flex-1 bg-slate-800/80 border border-white/10 px-3.5 py-2.5 rounded-xl text-sm placeholder:text-slate-500 resize-none max-h-24 min-h-[42px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={hasUserMessage ? "Type your message..." : "e.g. UI kits under $30, how do orders work?"}
                disabled={loading}
                aria-label="Message"
              />
              <button
                type="button"
                className="btn-primary px-3.5 py-2.5 rounded-xl disabled:opacity-40 self-end"
                onClick={() => sendMessage()}
                disabled={loading || !message.trim()}
                aria-label="Send"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-300 ${
          open
            ? "bg-slate-800 border border-white/10 rotate-0"
            : "bg-gradient-to-br from-violet-600 to-indigo-600 hover:scale-105 shadow-violet-500/40"
        }`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? "Close assistant" : "Open assistant"}
      >
        {open ? <X size={22} className="text-white" /> : <MessageCircle size={22} className="text-white" />}
      </button>
    </div>
  );
}
