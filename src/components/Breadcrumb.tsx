import type React from "react";
import { Link } from "react-router-dom";
import styles from "./Breadcrumb.module.css";

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className={styles.breadcrumb} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={index} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {index > 0 && <span className={styles.separator}>{">"}</span>}
            {item.to && !isLast ? (
              <Link to={item.to} className={styles.link}>
                {item.label}
              </Link>
            ) : (
              <span className={styles.current}>{item.label}</span>
            )}
          </span>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
