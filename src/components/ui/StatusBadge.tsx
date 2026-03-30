import type React from "react";
import styles from "./StatusBadge.module.css";

interface StatusBadgeProps {
  status: "green" | "yellow" | "red" | "blue" | "gray";
  label: string;
  size?: "sm" | "md";
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  label,
  size = "md",
}) => {
  return (
    <span
      className={`${styles.badge} ${styles[status]} ${styles[size]}`}
    >
      <span className={styles.dot} />
      {label}
    </span>
  );
};

export default StatusBadge;
