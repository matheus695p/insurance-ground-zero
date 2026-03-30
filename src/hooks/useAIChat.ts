// ============================================================================
// useAIChat — Reusable AI Chat Hook
// Manages chat state, message sending, and AI responses
// ============================================================================

import { useState, useCallback, useRef } from "react";
import {
  sendMessage,
  isAIConfigured,
  getProviderName,
  type ChatMessage,
} from "../services/ai-chat";

export interface DisplayMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  isTyping?: boolean;
}

interface UseAIChatOptions {
  systemPrompt: string;
  initialMessages?: DisplayMessage[];
  onMessageSent?: (message: DisplayMessage) => void;
  onResponseReceived?: (message: DisplayMessage) => void;
}

export function useAIChat(options: UseAIChatOptions) {
  const { systemPrompt, initialMessages = [], onMessageSent, onResponseReceived } = options;
  const [messages, setMessages] = useState<DisplayMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idCounter = useRef(initialMessages.length + 1);
  const configured = isAIConfigured();
  const providerName = getProviderName();

  const makeTimestamp = (): string => {
    const now = new Date();
    return now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const send = useCallback(
    async (text?: string) => {
      const content = (text || inputValue).trim();
      if (!content || isLoading) return;

      setError(null);
      setInputValue("");

      const userMsg: DisplayMessage = {
        id: `msg-${idCounter.current++}`,
        role: "user",
        content,
        timestamp: makeTimestamp(),
      };
      onMessageSent?.(userMsg);

      const typingMsg: DisplayMessage = {
        id: `msg-typing`,
        role: "assistant",
        content: "",
        timestamp: makeTimestamp(),
        isTyping: true,
      };

      setMessages((prev) => [...prev, userMsg, typingMsg]);
      setIsLoading(true);

      try {
        const history: ChatMessage[] = [
          ...messages
            .filter((m) => m.role !== "system")
            .map((m) => ({ role: m.role, content: m.content })),
          { role: "user" as const, content },
        ];

        const response = await sendMessage(history, systemPrompt);

        const assistantMsg: DisplayMessage = {
          id: `msg-${idCounter.current++}`,
          role: "assistant",
          content: response,
          timestamp: makeTimestamp(),
        };

        setMessages((prev) =>
          prev.filter((m) => m.id !== "msg-typing").concat(assistantMsg),
        );
        onResponseReceived?.(assistantMsg);
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== "msg-typing"));
        setError(err instanceof Error ? err.message : "Failed to get AI response");
      } finally {
        setIsLoading(false);
      }
    },
    [inputValue, isLoading, messages, systemPrompt, onMessageSent, onResponseReceived],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    },
    [send],
  );

  const clearMessages = useCallback(() => {
    setMessages(initialMessages);
    setError(null);
    idCounter.current = initialMessages.length + 1;
  }, [initialMessages]);

  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    error,
    configured,
    providerName,
    send,
    handleKeyDown,
    clearMessages,
    setMessages,
  };
}
