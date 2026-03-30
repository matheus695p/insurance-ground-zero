import type React from "react";
import { useEffect, useState, useCallback } from "react";
import styles from "./TypewriterText.module.css";

interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 30,
  onComplete,
}) => {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const handleComplete = useCallback(() => {
    onComplete?.();
  }, [onComplete]);

  useEffect(() => {
    setDisplayedLength(0);
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    if (displayedLength >= text.length) {
      if (!isComplete) {
        setIsComplete(true);
        handleComplete();
      }
      return;
    }

    const timeout = setTimeout(() => {
      setDisplayedLength((prev) => prev + 1);
    }, speed);

    return () => clearTimeout(timeout);
  }, [displayedLength, text.length, speed, isComplete, handleComplete]);

  return (
    <span className={styles.container}>
      <span className={styles.text}>{text.slice(0, displayedLength)}</span>
      <span
        className={isComplete ? styles.cursorHidden : styles.cursor}
        aria-hidden="true"
      />
    </span>
  );
};

export default TypewriterText;
