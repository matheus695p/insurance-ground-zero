import type React from "react";
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";
import styles from "./ProcessFlow.module.css";

interface ProcessStep {
  title: string;
  description: string;
  details?: string[];
}

interface ProcessFlowProps {
  steps: ProcessStep[];
}

type FlowState = "idle" | "running" | "complete";

const ProcessFlow: React.FC<ProcessFlowProps> = ({ steps }) => {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([]);
  const [state, setState] = useState<FlowState>("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  const showNextStep = useCallback(
    (index: number) => {
      if (index >= steps.length) {
        setState("complete");
        return;
      }

      timeoutRef.current = setTimeout(() => {
        setVisibleSteps((prev) => [...prev, index]);

        showNextStep(index + 1);
      }, 800);
    },
    [steps.length]
  );

  const handleRun = useCallback(() => {
    setState("running");
    setVisibleSteps([]);
    showNextStep(0);
  }, [showNextStep]);

  const handleReset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState("idle");
    setVisibleSteps([]);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const lineFillHeight =
    visibleSteps.length > 0 && timelineRef.current
      ? `${(visibleSteps.length / steps.length) * 100}%`
      : "0%";

  return (
    <div className={styles.container}>
      <div className={styles.title}>Process Flow</div>

      {state === "idle" ? (
        <div className={styles.emptyState}>Press Run Process to begin</div>
      ) : (
        <div className={styles.timeline} ref={timelineRef}>
          <div className={styles.line} />
          <div className={styles.lineFill} style={{ height: lineFillHeight }} />

          <AnimatePresence>
            {steps.map((step, index) => {
              const isVisible = visibleSteps.includes(index);
              return (
                <motion.div
                  key={index}
                  className={styles.step}
                  initial={{ opacity: 0, x: -20 }}
                  animate={
                    isVisible
                      ? { opacity: 1, x: 0 }
                      : { opacity: 0.15, x: 0 }
                  }
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div
                    className={`${styles.stepCircle} ${
                      isVisible
                        ? styles.stepCircleActive
                        : styles.stepCircleInactive
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className={styles.stepTitle}>{step.title}</div>
                  <div className={styles.stepDescription}>
                    {step.description}
                  </div>
                  {step.details && isVisible && (
                    <motion.ul
                      className={styles.stepDetails}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.3 }}
                    >
                      {step.details.map((detail, dIndex) => (
                        <li key={dIndex} className={styles.stepDetail}>
                          {detail}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <div className={styles.controls}>
        {(state === "idle" || state === "running") && (
          <button
            className={`${styles.button} ${styles.runButton}`}
            onClick={handleRun}
            disabled={state === "running"}
          >
            <Play size={16} />
            Run Process
          </button>
        )}
        {state === "complete" && (
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
  );
};

export default ProcessFlow;
