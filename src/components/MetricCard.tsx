import type React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";
import styles from "./MetricCard.module.css";

export interface MetricCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: "up" | "down";
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  prefix,
  suffix,
  trend,
  description,
}) => {
  return (
    <div className={styles.card}>
      <div className={styles.label}>{label}</div>
      <div className={styles.valueRow}>
        <span className={styles.value}>
          <AnimatedCounter
            end={value}
            prefix={prefix}
            suffix={suffix}
            duration={2000}
          />
        </span>
        {trend === "up" && (
          <span className={styles.trendUp}>
            <TrendingUp size={18} />
          </span>
        )}
        {trend === "down" && (
          <span className={styles.trendDown}>
            <TrendingDown size={18} />
          </span>
        )}
      </div>
      {description && <div className={styles.description}>{description}</div>}
    </div>
  );
};

export default MetricCard;
