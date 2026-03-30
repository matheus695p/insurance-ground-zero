import type React from "react";
import styles from "./SliderInput.module.css";

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
}

const SliderInput: React.FC<SliderInputProps> = ({
  label,
  value,
  min,
  max,
  step,
  unit = "",
  onChange,
}) => {
  const fillPercent = ((value - min) / (max - min)) * 100;

  return (
    <div className={styles.wrapper}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}</span>
        <span className={styles.valueDisplay}>
          {value}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
      <input
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--fill-percent": `${fillPercent}%` } as React.CSSProperties}
      />
    </div>
  );
};

export default SliderInput;
