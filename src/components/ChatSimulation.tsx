import type React from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";
import TypewriterText from "./TypewriterText";
import styles from "./ChatSimulation.module.css";

interface ChatMessage {
  role: "agent" | "system" | "user";
  content: string;
  delay?: number;
}

interface ChatSimulationProps {
  messages: ChatMessage[];
}

type SimulationState = "idle" | "running" | "complete";

const ChatSimulation: React.FC<ChatSimulationProps> = ({ messages }) => {
  const [visibleMessages, setVisibleMessages] = useState<number[]>([]);
  const [currentTyping, setCurrentTyping] = useState<number | null>(null);
  const [state, setState] = useState<SimulationState>("idle");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [visibleMessages, scrollToBottom]);

  const showNextMessage = useCallback(
    (index: number) => {
      if (index >= messages.length) {
        setState("complete");
        setCurrentTyping(null);
        return;
      }

      const msg = messages[index];
      const delay = msg.delay ?? 500;

      timeoutRef.current = setTimeout(() => {
        setVisibleMessages((prev) => [...prev, index]);

        if (msg.role === "agent") {
          setCurrentTyping(index);
        } else {
          setCurrentTyping(null);
          showNextMessage(index + 1);
        }
      }, delay);
    },
    [messages]
  );

  const handleStart = useCallback(() => {
    setState("running");
    setVisibleMessages([]);
    setCurrentTyping(null);
    showNextMessage(0);
  }, [showNextMessage]);

  const handleRestart = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState("idle");
    setVisibleMessages([]);
    setCurrentTyping(null);
  }, []);

  const handleTypewriterComplete = useCallback(
    (index: number) => {
      setCurrentTyping(null);
      showNextMessage(index + 1);
    },
    [showNextMessage]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getRowClass = (role: ChatMessage["role"]): string => {
    switch (role) {
      case "agent":
        return `${styles.messageRow} ${styles.messageRowAgent}`;
      case "user":
        return `${styles.messageRow} ${styles.messageRowUser}`;
      case "system":
        return `${styles.messageRow} ${styles.messageRowSystem}`;
    }
  };

  const getBubbleClass = (role: ChatMessage["role"]): string => {
    switch (role) {
      case "agent":
        return `${styles.messageBubble} ${styles.agentBubble}`;
      case "user":
        return `${styles.messageBubble} ${styles.userBubble}`;
      case "system":
        return `${styles.messageBubble} ${styles.systemBubble}`;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.chatHeader}>
        <span className={styles.chatTitle}>Chat Simulation</span>
        {state === "running" && <span className={styles.statusDot} />}
      </div>

      <div className={styles.messages}>
        {state === "idle" && (
          <div className={styles.emptyState}>
            Press Start Simulation to begin
          </div>
        )}

        <AnimatePresence>
          {visibleMessages.map((msgIndex) => {
            const msg = messages[msgIndex];
            return (
              <motion.div
                key={msgIndex}
                className={getRowClass(msg.role)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className={getBubbleClass(msg.role)}>
                  {msg.role === "agent" && currentTyping === msgIndex ? (
                    <TypewriterText
                      text={msg.content}
                      speed={30}
                      onComplete={() => handleTypewriterComplete(msgIndex)}
                    />
                  ) : (
                    msg.content
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.controls}>
        {state === "idle" && (
          <button
            className={`${styles.button} ${styles.startButton}`}
            onClick={handleStart}
          >
            <Play size={16} />
            Start Simulation
          </button>
        )}
        {state === "complete" && (
          <button
            className={`${styles.button} ${styles.restartButton}`}
            onClick={handleRestart}
          >
            <RotateCcw size={16} />
            Restart
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatSimulation;
