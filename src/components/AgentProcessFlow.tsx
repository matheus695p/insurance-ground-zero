import type React from "react";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw, Database, Cpu, Bot, Zap, CheckCircle } from "lucide-react";
import styles from "./AgentProcessFlow.module.css";

/* ── Types ── */

interface AgentNode {
  id: string;
  type: "data-source" | "model" | "agent" | "action" | "output";
  label: string;
  description: string;
  details?: string[];
}

interface AgentConnection {
  from: string;
  to: string;
  label?: string;
}

interface AgentProcessFlowProps {
  nodes: AgentNode[];
  connections: AgentConnection[];
  title?: string;
}

/* ── Helpers ── */

type FlowState = "idle" | "running" | "complete";

const TYPE_LABELS: Record<AgentNode["type"], string> = {
  "data-source": "DATA SOURCE",
  model: "ML MODEL",
  agent: "AGENT",
  action: "ACTION",
  output: "OUTPUT",
};

const nodeStyleClass: Record<AgentNode["type"], string> = {
  "data-source": styles.nodeDataSource,
  model: styles.nodeModel,
  agent: styles.nodeAgent,
  action: styles.nodeAction,
  output: styles.nodeOutput,
};

const badgeStyleClass: Record<AgentNode["type"], string> = {
  "data-source": styles.badgeDataSource,
  model: styles.badgeModel,
  agent: styles.badgeAgent,
  action: styles.badgeAction,
  output: styles.badgeOutput,
};

const dotStyleClass: Record<AgentNode["type"], string> = {
  "data-source": styles.dotDataSource,
  model: styles.dotModel,
  agent: styles.dotAgent,
  action: styles.dotAction,
  output: styles.dotOutput,
};

const TYPE_COLORS: Record<AgentNode["type"], string> = {
  "data-source": "#3b82f6",
  model: "#8b5cf6",
  agent: "#00d4aa",
  action: "#f59e0b",
  output: "#22c55e",
};

const IconForType: React.FC<{ type: AgentNode["type"]; size?: number }> = ({
  type,
  size = 12,
}) => {
  switch (type) {
    case "data-source":
      return <Database size={size} />;
    case "model":
      return <Cpu size={size} />;
    case "agent":
      return <Bot size={size} />;
    case "action":
      return <Zap size={size} />;
    case "output":
      return <CheckCircle size={size} />;
  }
};

/* ── Component ── */

const AgentProcessFlow: React.FC<AgentProcessFlowProps> = ({
  nodes,
  connections,
  title = "Agent Process Flow",
}) => {
  const [activatedIds, setActivatedIds] = useState<Set<string>>(new Set());
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [activeConnections, setActiveConnections] = useState<Set<string>>(new Set());
  const [pulsingConnection, setPulsingConnection] = useState<string | null>(null);
  const [state, setState] = useState<FlowState>("idle");
  const timeoutRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* Build an ordered sequence based on the nodes array. */
  const orderedNodeIds = useMemo(() => nodes.map((n) => n.id), [nodes]);

  /* Map from nodeId -> AgentNode for quick lookup. */
  const nodeMap = useMemo(() => {
    const m = new Map<string, AgentNode>();
    nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [nodes]);

  /* For each pair of consecutive nodes, find the matching connection. */
  const connectionBetween = useCallback(
    (fromId: string, toId: string): AgentConnection | undefined =>
      connections.find((c) => c.from === fromId && c.to === toId),
    [connections]
  );

  /* Cleanup helper. */
  const clearAllTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(clearTimeout);
    timeoutRefs.current = [];
  }, []);

  useEffect(() => {
    return () => clearAllTimeouts();
  }, [clearAllTimeouts]);

  /* ── Run agent ── */
  const handleRun = useCallback(() => {
    clearAllTimeouts();
    setActivatedIds(new Set());
    setCurrentId(null);
    setActiveConnections(new Set());
    setPulsingConnection(null);
    setState("running");

    let delay = 300; // initial delay before first node
    const ACTIVATE_DURATION = 1000; // how long a node stays "current" (processing)
    const CONNECTION_DURATION = 600;

    orderedNodeIds.forEach((id, index) => {
      // Activate the node
      const activateTimeout = setTimeout(() => {
        setCurrentId(id);
        setActivatedIds((prev) => new Set(prev).add(id));
      }, delay);
      timeoutRefs.current.push(activateTimeout);

      delay += ACTIVATE_DURATION;

      // After the node finishes, animate the outgoing connection (if any)
      if (index < orderedNodeIds.length - 1) {
        const nextId = orderedNodeIds[index + 1];
        const connKey = `${id}__${nextId}`;

        const connStartTimeout = setTimeout(() => {
          setCurrentId(null); // stop showing processing on current node
          setPulsingConnection(connKey);
          setActiveConnections((prev) => new Set(prev).add(connKey));
        }, delay);
        timeoutRefs.current.push(connStartTimeout);

        delay += CONNECTION_DURATION;

        const connEndTimeout = setTimeout(() => {
          setPulsingConnection((prev) => (prev === connKey ? null : prev));
        }, delay);
        timeoutRefs.current.push(connEndTimeout);
      } else {
        // Last node — mark complete after processing
        const completeTimeout = setTimeout(() => {
          setCurrentId(null);
          setState("complete");
        }, delay);
        timeoutRefs.current.push(completeTimeout);
      }
    });
  }, [orderedNodeIds, clearAllTimeouts]);

  /* ── Reset ── */
  const handleReset = useCallback(() => {
    clearAllTimeouts();
    setActivatedIds(new Set());
    setCurrentId(null);
    setActiveConnections(new Set());
    setPulsingConnection(null);
    setState("idle");
  }, [clearAllTimeouts]);

  /* ── Render ── */
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.title}>{title}</div>
        <div className={styles.controls}>
          {(state === "idle" || state === "complete") && (
            <button
              className={`${styles.button} ${styles.runButton}`}
              onClick={handleRun}
            >
              <Play size={16} />
              Run Agent
            </button>
          )}
          {state === "running" && (
            <button className={`${styles.button} ${styles.runButton}`} disabled>
              <Play size={16} />
              Running...
            </button>
          )}
          {(state === "running" || state === "complete") && (
            <button
              className={`${styles.button} ${styles.resetButton}`}
              onClick={handleReset}
            >
              <RotateCcw size={16} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Idle message */}
      {state === "idle" && (
        <div className={styles.statusBanner + " " + styles.statusIdle}>
          Press "Run Agent" to visualize the processing pipeline
        </div>
      )}

      {/* Flow */}
      {state !== "idle" && (
        <div className={styles.flowArea}>
          {orderedNodeIds.map((id, index) => {
            const node = nodeMap.get(id);
            if (!node) return null;

            const isActivated = activatedIds.has(id);
            const isCurrent = currentId === id;
            const nextId =
              index < orderedNodeIds.length - 1
                ? orderedNodeIds[index + 1]
                : null;
            const conn = nextId ? connectionBetween(id, nextId) : null;
            const connKey = nextId ? `${id}__${nextId}` : null;
            const isConnActive = connKey ? activeConnections.has(connKey) : false;
            const isConnPulsing = connKey ? pulsingConnection === connKey : false;

            return (
              <div className={styles.nodeGroup} key={id}>
                {/* Node card */}
                <motion.div
                  className={[
                    styles.node,
                    nodeStyleClass[node.type],
                    isActivated ? styles.nodeActive : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  initial={{ opacity: 0.25, scale: 0.95 }}
                  animate={
                    isActivated
                      ? { opacity: 1, scale: 1 }
                      : { opacity: 0.25, scale: 0.95 }
                  }
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  {/* Type badge */}
                  <div
                    className={`${styles.typeBadge} ${badgeStyleClass[node.type]}`}
                  >
                    <span className={styles.badgeIcon}>
                      <IconForType type={node.type} />
                    </span>
                    {TYPE_LABELS[node.type]}
                  </div>

                  {/* Label & description */}
                  <div className={styles.nodeLabel}>{node.label}</div>
                  <div className={styles.nodeDescription}>
                    {node.description}
                  </div>

                  {/* Details — shown when activated */}
                  <AnimatePresence>
                    {isActivated && node.details && node.details.length > 0 && (
                      <motion.ul
                        className={styles.detailsList}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      >
                        {node.details.map((detail, dIdx) => (
                          <li key={dIdx} className={styles.detailItem}>
                            {detail}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>

                  {/* Processing indicator */}
                  <AnimatePresence>
                    {isCurrent && (
                      <motion.div
                        className={styles.processingIndicator}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span
                          className={`${styles.pulsingDot} ${dotStyleClass[node.type]}`}
                        />
                        <span
                          className={`${styles.pulsingDot} ${dotStyleClass[node.type]}`}
                        />
                        <span
                          className={`${styles.pulsingDot} ${dotStyleClass[node.type]}`}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Connector arrow */}
                {conn && (
                  <div
                    className={[
                      styles.connector,
                      isConnActive ? styles.connectorActive : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <div className={styles.connectorLine}>
                      <div className={styles.connectorArrow} />
                      <AnimatePresence>
                        {isConnPulsing && (
                          <motion.div
                            className={styles.connectorPulse}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            style={{
                              background: TYPE_COLORS[node.type],
                              boxShadow: `0 0 8px ${TYPE_COLORS[node.type]}80`,
                            }}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                    {conn.label && (
                      <div className={styles.connectorLabel}>{conn.label}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Complete banner */}
      {state === "complete" && (
        <motion.div
          className={`${styles.statusBanner} ${styles.statusComplete}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Process Complete -- All pipeline stages executed successfully
        </motion.div>
      )}
    </div>
  );
};

export default AgentProcessFlow;
export type { AgentNode, AgentConnection, AgentProcessFlowProps };
