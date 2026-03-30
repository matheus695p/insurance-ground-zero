import type React from "react";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, RotateCcw } from "lucide-react";
import MetricCard from "./MetricCard";
import type { MetricCardProps } from "./MetricCard";
import styles from "./DashboardSimulation.module.css";

interface DashboardSimulationProps {
  metrics: MetricCardProps[];
  title: string;
  chartData?: number[];
}

type DashboardState = "idle" | "loaded" | "complete";

const DashboardSimulation: React.FC<DashboardSimulationProps> = ({
  metrics,
  title,
  chartData,
}) => {
  const [state, setState] = useState<DashboardState>("idle");
  const [showChart, setShowChart] = useState(false);

  const handleLoad = useCallback(() => {
    setState("loaded");
    setTimeout(() => {
      setShowChart(true);
      setState("complete");
    }, 600);
  }, []);

  const handleReset = useCallback(() => {
    setState("idle");
    setShowChart(false);
  }, []);

  const maxDataValue = chartData ? Math.max(...chartData) : 1;

  const defaultLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
      </div>

      {state === "idle" ? (
        <div className={styles.placeholder}>
          Press Load Dashboard to display data
        </div>
      ) : (
        <div className={styles.body}>
          <AnimatePresence>
            <motion.div
              className={styles.metricsGrid}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {metrics.map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <MetricCard {...metric} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>

          {chartData && chartData.length > 0 && (
            <motion.div
              className={styles.chartSection}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className={styles.chartTitle}>Performance Overview</div>
              <div className={styles.chart}>
                {chartData.map((value, index) => {
                  const heightPercent = (value / maxDataValue) * 100;
                  return (
                    <div key={index} className={styles.barWrapper}>
                      <div
                        className={styles.bar}
                        style={{
                          height: showChart ? `${heightPercent}%` : "0%",
                          transitionDelay: `${index * 0.05}s`,
                        }}
                      />
                      <span className={styles.barLabel}>
                        {defaultLabels[index] ?? index + 1}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}

      <div className={styles.controls}>
        {state === "idle" && (
          <button
            className={`${styles.button} ${styles.loadButton}`}
            onClick={handleLoad}
          >
            <BarChart3 size={16} />
            Load Dashboard
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

export default DashboardSimulation;
