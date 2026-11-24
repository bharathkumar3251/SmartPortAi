import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  X,
  Send,
  Loader2,
  Bot,
  User,
  RotateCcw,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  time: string;
}

const API_BASE =
  (typeof import.meta !== "undefined" &&
    (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL) ||
  "http://localhost:8000/api";

const SUGGESTIONS = [
  "Check berth availability",
  "Show active vessel turnaround",
  "Customs clearance & holds",
  "Container yard congestion",
  "Predict fleet delay risk",
];

export function AiChatDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init-1",
      sender: "ai",
      text: "**SmartPort AI Operational Co-Pilot Active**\n\nConnected to live **SQLite database** (`smartport.db`) & **FastAPI intelligence engine**.\n\nAsk me about berths, vessel queues, container yard capacity, or customs clearances.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const sendMessage = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: String(Date.now()),
      sender: "user",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });

      if (!res.ok) {
        throw new Error(`API responded with status ${res.status}`);
      }

      const data = await res.json();
      const aiReplyText = data.reply || "No response received from intelligence engine.";

      const aiMsg: Message = {
        id: String(Date.now() + 1),
        sender: "ai",
        text: aiReplyText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("[AiChatDrawer Error]", err);
      toast.error("Failed to query AI Co-Pilot API");
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: "ai",
          text: "⚠️ **Connection Notice:** Could not reach the FastAPI AI engine on port 8000. Please ensure the backend is running (`python run_backend.py`).",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: "init-reset",
        sender: "ai",
        text: "Chat cleared. What maritime intelligence query can I assist you with?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded border border-amber-500/40 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold shadow-xl transition-all duration-150 cursor-pointer group"
        >
          <div className="relative">
            <Bot className="w-4 h-4 text-slate-950" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-600 rounded-full animate-ping" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-600 rounded-full" />
          </div>
          <span className="text-xs tracking-wider font-mono uppercase font-bold">Port Operations Desk</span>
          <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-950/20 text-slate-950 font-bold">
            Live
          </span>
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[580px] flex flex-col rounded-lg border border-border/80 shadow-2xl bg-[#0e141a] overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-border flex items-center justify-between bg-surface">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow">
                <Bot className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">Port Operations Intelligence Desk</h3>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">FastAPI Core • SQLite Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-muted-foreground">
              <button
                onClick={clearChat}
                title="Reset conversation"
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 rounded-lg hover:bg-white/10 hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin">
            {messages.map((m) => {
              const isAi = m.sender === "ai";
              return (
                <div key={m.id} className={`flex gap-2.5 ${isAi ? "justify-start" : "justify-end"}`}>
                  {isAi && (
                    <div className="w-7 h-7 rounded-lg bg-cyan/20 border border-cyan/40 text-cyan flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      isAi
                        ? "bg-white/[0.05] border border-white/10 text-foreground"
                        : "bg-cyan/90 text-background font-medium border border-cyan"
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">
                      {m.text.split("\n").map((line, idx) => {
                        // Bold parsing
                        const parts = line.split(/(\*\*.*?\*\*)/g);
                        return (
                          <div key={idx} className={line.startsWith("•") ? "pl-2 py-0.5" : ""}>
                            {parts.map((p, pIdx) => {
                              if (p.startsWith("**") && p.endsWith("**")) {
                                return (
                                  <strong key={pIdx} className="font-semibold text-cyan-200">
                                    {p.slice(2, -2)}
                                  </strong>
                                );
                              }
                              return p;
                            })}
                          </div>
                        );
                      })}
                    </div>
                    <span
                      className={`block text-[9px] mt-1 text-right font-mono ${
                        isAi ? "text-muted-foreground" : "text-background/80"
                      }`}
                    >
                      {m.time}
                    </span>
                  </div>

                  {!isAi && (
                    <div className="w-7 h-7 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-2.5 justify-start items-center text-xs text-muted-foreground p-2">
                <Loader2 className="w-4 h-4 text-cyan animate-spin" />
                <span className="font-mono text-[11px]">Querying smartport.db & models...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="px-3 py-2 border-t border-white/5 bg-black/20 flex gap-1.5 overflow-x-auto no-scrollbar">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(s)}
                disabled={loading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full text-[10px] font-mono border border-white/10 bg-white/[0.03] text-muted-foreground hover:border-cyan/50 hover:text-cyan hover:bg-cyan/10 transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="p-3 border-t border-white/10 flex items-center gap-2 bg-white/[0.02]"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Port Copilot anything..."
              disabled={loading}
              className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-cyan/50 focus:ring-1 focus:ring-cyan/50 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl bg-cyan text-background font-semibold hover:bg-cyan/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

