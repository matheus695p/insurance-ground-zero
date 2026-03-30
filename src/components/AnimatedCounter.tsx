import type React from "react";
import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";
import styles from "./AnimatedCounter.module.css";

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  end,
  duration = 2000,
  prefix,
  suffix,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "0px 0px -50px 0px" });
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    const startTime = performance.now();
    let animationFrame: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isInView, end, duration]);

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <span className={styles.container} ref={ref}>
      {prefix && <span className={styles.prefix}>{prefix}</span>}
      <span className={styles.value}>{formatNumber(current)}</span>
      {suffix && <span className={styles.suffix}>{suffix}</span>}
    </span>
  );
};

export default AnimatedCounter;
