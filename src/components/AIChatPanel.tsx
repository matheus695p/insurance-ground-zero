// ============================================================================
// AIChatPanel — Reusable AI-powered chat component
// Drop into any workstation to add functional chat with AI
// ============================================================================

import { useEffect, useRef } from "react";
import { Send, Bot, User, AlertCircle, Loader2, Wifi, WifiOff } from "lucide-react";
import { useAIChat, type DisplayMessage } from "../hooks/useAIChat";

interface AIChatPanelProps {
  systemPrompt: string;
  initialMessages?: DisplayMessage[];
  placeholder?: string;
  userLabel?: string;
  assistantLabel?: string;
  userAvatar?: string;
  assistantAvatar?: string;
  height?: string;
  onMessageSent?: (msg: DisplayMessage) => void;
  onResponseReceived?: (msg: DisplayMessage) => void;
  className?: string;
  style?: React.CSSProperties;
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({
  systemPrompt,
  initialMessages = [],
  placeholder = "Type a message...",
  userLabel = "You",
  assistantLabel = "AI Assistant",
  userAvatar,
  assistantAvatar,
  height = "100%",
  onMessageSent,
  onResponseReceived,
  className,
  style,
}) => {
  const {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    error,
    configured,
    providerName,
    send,
    handleKeyDown,
  } = useAIChat({
    systemPrompt,
    initialMessages,
    onMessageSent,
    onResponseReceived,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      className={className}
      style={{
        display: "flex",
        flexDirection: "column",
        height,
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Bot size={14} style={{ color: "var(--accent-teal)" }} />
          <span
            style={{
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {assistantLabel}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {configured ? (
            <>
              <Wifi size={11} style={{ color: "var(--accent-teal)" }} />
              <span
                style={{
                  fontSize: "0.6rem",
                  color: "var(--accent-teal)",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                }}
              >
                {providerName}
              </span>
            </>
          ) : (
            <>
              <WifiOff size={11} style={{ color: "var(--text-muted)" }} />
              <span
                style={{
                  fontSize: "0.6rem",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                No API key
              </span>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(148,163,184,0.15) transparent",
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              flexDirection: msg.role === "user" ? "row-reverse" : "row",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.6rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                flexShrink: 0,
                background:
                  msg.role === "user"
                    ? "rgba(0, 212, 170, 0.12)"
                    : "rgba(139, 92, 246, 0.12)",
                color:
                  msg.role === "user"
                    ? "var(--accent-teal)"
                    : "#8b5cf6",
              }}
            >
              {msg.role === "user" ? (
                userAvatar || <User size={13} />
              ) : (
                assistantAvatar || <Bot size={13} />
              )}
            </div>

            {/* Bubble */}
            <div style={{ maxWidth: "80%" }}>
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  fontSize: "0.78rem",
                  lineHeight: 1.55,
                  color: "var(--text-secondary)",
                  background:
                    msg.role === "user"
                      ? "rgba(0, 212, 170, 0.08)"
                      : "rgba(148, 163, 184, 0.06)",
                  border: `1px solid ${
                    msg.role === "user"
                      ? "rgba(0, 212, 170, 0.15)"
                      : "rgba(148, 163, 184, 0.08)"
                  }`,
                  borderBottomRightRadius: msg.role === "user" ? 4 : 12,
                  borderBottomLeftRadius: msg.role === "user" ? 12 : 4,
                  whiteSpace: "pre-wrap",
                }}
              >
                {msg.isTyping ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      color: "var(--text-muted)",
                    }}
                  >
                    <Loader2
                      size={14}
                      style={{
                        animation: "spin 1s linear infinite",
                      }}
                    />
                    Thinking...
                  </span>
                ) : (
                  msg.content
                )}
              </div>
              <div
                style={{
                  fontSize: "0.58rem",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  marginTop: 3,
                  textAlign: msg.role === "user" ? "right" : "left",
                }}
              >
                {msg.role === "user" ? userLabel : assistantLabel} -- {msg.timestamp}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div
          style={{
            padding: "8px 16px",
            background: "rgba(239, 68, 68, 0.08)",
            borderTop: "1px solid rgba(239, 68, 68, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.72rem",
            color: "#ef4444",
            flexShrink: 0,
          }}
        >
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {/* Input */}
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "12px 16px",
          borderTop: "1px solid var(--border-subtle)",
          background: "rgba(0,0,0,0.15)",
          flexShrink: 0,
        }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={configured ? placeholder : "Configure API key in .env to enable chat"}
          disabled={!configured || isLoading}
          style={{
            flex: 1,
            padding: "10px 14px",
            background: "rgba(148,163,184,0.04)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-sm)",
            fontSize: "0.78rem",
            color: "var(--text-primary)",
            fontFamily: "var(--font-sans)",
            outline: "none",
            transition: "border-color 0.15s ease",
            opacity: configured ? 1 : 0.5,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-teal)";
            e.currentTarget.style.boxShadow = "0 0 0 2px rgba(0,212,170,0.1)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border-subtle)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <button
          onClick={() => send()}
          disabled={!configured || isLoading || !inputValue.trim()}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 38,
            height: 38,
            background:
              configured && inputValue.trim()
                ? "var(--accent-teal)"
                : "rgba(148,163,184,0.15)",
            border: "none",
            borderRadius: "var(--radius-sm)",
            color:
              configured && inputValue.trim()
                ? "var(--bg-primary)"
                : "var(--text-muted)",
            cursor: configured && inputValue.trim() ? "pointer" : "not-allowed",
            transition: "all 0.15s ease",
            flexShrink: 0,
          }}
        >
          {isLoading ? (
            <Loader2
              size={16}
              style={{ animation: "spin 1s linear infinite" }}
            />
          ) : (
            <Send size={16} />
          )}
        </button>
      </div>

      {/* Spin keyframe - injected once */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default AIChatPanel;
