import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import styles from "./LoginPage.module.css";

const LoginPage = () => {
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    // Small artificial delay to feel realistic
    await new Promise((r) => setTimeout(r, 600));

    const success = login(email.trim(), password);

    if (!success) {
      setError("Invalid credentials. Please check your email and password.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Animated background layers */}
      <div className={styles.backgroundGradient} />
      <div className={styles.backgroundOrb} />
      <div className={styles.backgroundOrbSecondary} />
      <div className={styles.gridOverlay} />

      {/* Card with entrance animation */}
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Branding */}
        <div className={styles.branding}>
          <motion.div
            className={styles.shieldIcon}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5, ease: "backOut" }}
          >
            <ShieldCheck size={28} strokeWidth={1.8} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <div className={styles.logoText}>Siniestros AI</div>
            <div className={styles.accentLine} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
          >
            <div className={styles.title}>Plataforma Inteligente de Siniestros</div>
            <div className={styles.subtitle}>
              Gestión E2E impulsada por IA
            </div>
          </motion.div>
        </div>

        {/* Form */}
        <motion.form
          className={styles.form}
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.5 }}
        >
          {/* Email field */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <Mail size={16} strokeWidth={1.8} />
              </span>
              <input
                id="email"
                className={styles.input}
                type="email"
                placeholder="matheus_pinto@mckinsey.com"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
              />
            </div>
          </div>

          {/* Password field */}
          <div className={styles.fieldGroup}>
            <label className={styles.label} htmlFor="password">
              Password
            </label>
            <div className={styles.inputWrapper}>
              <span className={styles.inputIcon}>
                <Lock size={16} strokeWidth={1.8} />
              </span>
              <input
                id="password"
                className={styles.input}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={1.8} />
                ) : (
                  <Eye size={18} strokeWidth={1.8} />
                )}
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <motion.div
              className={styles.errorMessage}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <AlertCircle size={16} strokeWidth={2} />
              {error}
            </motion.div>
          )}

          {/* Submit button */}
          <motion.button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? (
              "Authenticating..."
            ) : (
              <>
                <LogIn size={18} strokeWidth={2} />
                Sign In
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Footer */}
        <motion.div
          className={styles.footer}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <span className={styles.footerText}>
            Plataforma Inteligente de Gestión de Siniestros
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
