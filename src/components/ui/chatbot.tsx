"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm Axia AI. I can help you navigate the CRM, find records, create tasks, or answer questions about your data. What do you need?",
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userMessage = input.trim();
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Build history for context (last 10 messages excluding welcome)
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const result = await api.chat(userMessage, history);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.reply || "I'm not sure how to help with that.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (e) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I couldn't connect to the AI service. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  // Parse markdown-style links in messages
  const renderContent = (content: string) => {
    // Handle [text](/path) links
    const parts = content.split(/(\[[^\]]+\]\([^)]+\))/g);
    return parts.map((part, i) => {
      const match = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (match) {
        return (
          <a
            key={i}
            href={match[2]}
            className="underline font-medium"
            style={{ color: "var(--accent-blue)" }}
            onClick={(e) => {
              e.preventDefault();
              window.location.href = match[2];
            }}
          >
            {match[1]}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 transition-all duration-200"
        style={{
          background: open ? "var(--accent-red)" : "var(--accent-blue)",
          borderRadius: "50%",
          boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
          color: "#fff",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Chat Panel */}
      {open && (
        <div
          className="fixed bottom-20 right-6 z-50 flex flex-col overflow-hidden"
          style={{
            width: "380px",
            height: "520px",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-primary)",
            borderRadius: "var(--radius-lg)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{
              background: "var(--bg-tertiary)",
              borderBottom: "1px solid var(--border-primary)",
            }}
          >
            <div
              className="w-8 h-8 flex items-center justify-center"
              style={{ background: "var(--accent-blue)", borderRadius: "50%" }}
            >
              <Bot size={16} color="#fff" />
            </div>
            <div>
              <div className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                Axia AI
              </div>
              <div
                className="flex items-center gap-1"
                style={{ fontSize: "10px", color: "var(--accent-green)", fontFamily: "var(--font-mono)" }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--accent-green)" }} />
                ONLINE
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id}>
                <div className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div
                      className="w-6 h-6 flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "var(--accent-blue-muted)", borderRadius: "50%" }}
                    >
                      <Bot size={12} style={{ color: "var(--accent-blue)" }} />
                    </div>
                  )}
                  <div
                    className="max-w-[75%] px-3 py-2 text-[13px] leading-relaxed"
                    style={{
                      borderRadius: msg.role === "user" ? "var(--radius-md) var(--radius-md) 2px var(--radius-md)" : "var(--radius-md) var(--radius-md) var(--radius-md) 2px",
                      background: msg.role === "user" ? "var(--accent-blue)" : "var(--bg-tertiary)",
                      color: msg.role === "user" ? "#fff" : "var(--text-primary)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {renderContent(msg.content)}
                  </div>
                  {msg.role === "user" && (
                    <div
                      className="w-6 h-6 flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: "var(--accent-purple)", borderRadius: "50%", opacity: 0.7 }}
                    >
                      <User size={12} color="#fff" />
                    </div>
                  )}
                </div>
                {/* Timestamp */}
                <div
                  className={`text-[9px] mt-0.5 ${msg.role === "user" ? "text-right mr-8" : "ml-8"}`}
                  style={{ color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}
                >
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2">
                <div
                  className="w-6 h-6 flex items-center justify-center shrink-0"
                  style={{ background: "var(--accent-blue-muted)", borderRadius: "50%" }}
                >
                  <Bot size={12} style={{ color: "var(--accent-blue)" }} />
                </div>
                <div
                  className="px-3 py-2 text-[13px] flex items-center gap-2"
                  style={{ background: "var(--bg-tertiary)", borderRadius: "var(--radius-md)", color: "var(--text-tertiary)" }}
                >
                  <Loader2 size={12} className="animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            className="flex items-center gap-2 px-3 py-3 shrink-0"
            style={{ borderTop: "1px solid var(--border-primary)", background: "var(--bg-tertiary)" }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) handleSend(); }}
              placeholder="Ask Axia AI..."
              disabled={isTyping}
              className="flex-1 px-3 py-2 text-[13px] outline-none"
              style={{
                background: "var(--bg-quaternary)",
                border: "1px solid var(--border-primary)",
                borderRadius: "var(--radius-sm)",
                color: "var(--text-primary)",
                opacity: isTyping ? 0.6 : 1,
              }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="w-8 h-8 flex items-center justify-center shrink-0 transition-colors"
              style={{
                background: input.trim() && !isTyping ? "var(--accent-blue)" : "var(--bg-quaternary)",
                borderRadius: "var(--radius-sm)",
                color: input.trim() && !isTyping ? "#fff" : "var(--text-tertiary)",
              }}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
