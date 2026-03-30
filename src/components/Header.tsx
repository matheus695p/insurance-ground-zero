import type React from "react";
import { motion } from "framer-motion";
import styles from "./Header.module.css";

const Header: React.FC = () => {
  return (
    <motion.header
      className={styles.header}
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className={styles.logo}>
        <span className={styles.logoText}>Siniestros AI</span>
        <div className={styles.accentLine} />
      </div>
      <span className={styles.subtitle}>Plataforma Inteligente de Gestión de Siniestros</span>
    </motion.header>
  );
};

export default Header;
