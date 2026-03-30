import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
import {
  BarChart3,
  Globe,
  Bot,
  ArrowRight,
  Users,
  Shield,
  FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { domains } from "../data/domains";
import type { Domain } from "../data/domains";
import styles from "./Landing.module.css";

/* --- Icon mapping for domains -------------------------------------- */

const domainIconMap: Record<string, LucideIcon> = {
  distribution: Users,
  underwriting: Shield,
  claims: FileText,
};

/* --- Animated word-cycle subtitle ---------------------------------- */

const ROTATING_WORDS = [
  "Claims",
  "Underwriting",
  "Distribution",
  "Pricing",
  "Fraud",
  "Networks",
  "Retention",
  "Prospecting",
];

const WordCycler: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className={styles.wordCyclerWrapper}>
      {ROTATING_WORDS.map((word, i) => (
        <motion.span
          key={word}
          className={styles.wordCyclerWord}
          initial={false}
          animate={{
            opacity: i === index ? 1 : 0,
            y: i === index ? 0 : i < index ? -20 : 20,
            filter: i === index ? "blur(0px)" : "blur(4px)",
          }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
};

/* --- Animated counter ---------------------------------------------- */

const Counter: React.FC<{ to: number; duration?: number }> = ({
  to,
  duration = 1.8,
}) => {
  const [value, setValue] = useState(0);
  const controls = useAnimation();

  useEffect(() => {
    let cancelled = false;
    const step = to / ((duration * 1000) / 16);
    let current = 0;
    const tick = () => {
      if (cancelled) return;
      current = Math.min(current + step, to);
      setValue(Math.round(current));
      if (current < to) requestAnimationFrame(tick);
    };
    controls.start({ opacity: 1 }).then(tick);
    return () => {
      cancelled = true;
    };
  }, [to, duration, controls]);

  return <span>{value}</span>;
};

/* --- Card variants for stagger ------------------------------------- */

const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: i * 0.07,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

/* --- Insurance value chain flow order -------------------------------- */

// Linear flow: Distribution -> Underwriting -> Claims
const FLOW_ROW_IDS = ["distribution", "underwriting", "claims"];

/* --- Impact highlights data ---------------------------------------- */

const IMPACT_HIGHLIGHTS: { domainId: string; metric: string }[] = [
  { domainId: "distribution", metric: "10-15% new business growth" },
  { domainId: "distribution", metric: "10-18% lapse reduction" },
  { domainId: "underwriting", metric: "4-6% STP rate improvement" },
  { domainId: "underwriting", metric: "2-3pp loss ratio improvement" },
  { domainId: "underwriting", metric: "10-14% new business via pricing" },
  { domainId: "claims", metric: "2-5% claims cost reduction" },
  { domainId: "claims", metric: "8-12% prevention savings" },
  { domainId: "claims", metric: "25% faster triage routing" },
  { domainId: "claims", metric: "3-5% settlement leakage reduction" },
  { domainId: "claims", metric: "1-2% fraud recovery" },
  { domainId: "claims", metric: "~1% network savings" },
];

/* --- Helper: get domain by id -------------------------------------- */

function getDomainById(id: string): Domain | undefined {
  return domains.find((d) => d.id === id);
}

/* --- Flow card component ------------------------------------------- */

const FlowCard: React.FC<{ domainId: string; index: number }> = ({
  domainId,
  index,
}) => {
  const domain = getDomainById(domainId);
  if (!domain) return null;

  const Icon = domainIconMap[domain.id];
  const useCaseCount = domain.useCases.length;

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
    >
      <Link
        to={`/domain/${domain.id}`}
        className={styles.flowCard}
        style={{
          borderLeftColor: domain.accentColor,
        }}
      >
        <div
          className={styles.flowCardIcon}
          style={{
            background: `${domain.accentColor}20`,
            color: domain.accentColor,
            border: `1px solid ${domain.accentColor}18`,
          }}
        >
          {Icon && <Icon size={18} />}
        </div>
        <div className={styles.flowCardInfo}>
          <span className={styles.flowCardName}>{domain.name}</span>
          <span
            className={styles.flowCardBadge}
            style={{
              background: `${domain.accentColor}20`,
              color: domain.accentColor,
            }}
          >
            {useCaseCount} {useCaseCount === 1 ? "use case" : "use cases"}
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

/* --- Main component ------------------------------------------------ */

const Landing: React.FC = () => {
  return (
    <div className={styles.page}>
      {/* --- Animated background orbs ------------------------------- */}
      <div className={styles.bgOrbs} aria-hidden="true">
        <div className={`${styles.orb} ${styles.orbTeal}`} />
        <div className={`${styles.orb} ${styles.orbPurple}`} />
        <div className={`${styles.orb} ${styles.orbAmber}`} />
      </div>

      {/* --- Floating geometric shapes ------------------------------ */}
      <div className={styles.geometricLayer} aria-hidden="true">
        <div className={`${styles.shape} ${styles.hexagon1}`} />
        <div className={`${styles.shape} ${styles.hexagon2}`} />
        <div className={`${styles.shape} ${styles.diamond1}`} />
        <div className={`${styles.shape} ${styles.diamond2}`} />
        <div className={`${styles.shape} ${styles.circle1}`} />
        <div className={`${styles.shape} ${styles.circle2}`} />
        <div className={`${styles.shape} ${styles.triangle1}`} />
        <div className={`${styles.shape} ${styles.crosshair1}`} />
        {/* Horizontal beams */}
        <div className={styles.horizBeam} style={{ top: '20%', animationDelay: '0s' }} />
        <div className={styles.horizBeam} style={{ top: '45%', animationDelay: '4s' }} />
        <div className={styles.horizBeam} style={{ top: '75%', animationDelay: '8s' }} />
      </div>

      {/* --- Hero Section ------------------------------------------- */}
      <motion.section
        className={styles.hero}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <div className={styles.heroGradient} />

        {/* Circuit grid overlay */}
        <div className={styles.circuitGrid} aria-hidden="true">
          <div className={styles.scanLine} />
        </div>

        <div className={styles.heroContent}>
          {/* Pill badge tagline */}
          <motion.div
            className={styles.heroTag}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <span className={styles.heroTagDot} />
            Plataforma Inteligente de Siniestros
          </motion.div>

          {/* Title */}
          <motion.h1
            className={styles.heroTitle}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            Gestión Inteligente
            <br />
            <span className={styles.heroTitleAccent}>de Siniestros E2E</span>
          </motion.h1>

          {/* Subtitle with word cycler */}
          <motion.div
            className={styles.heroSubtitle}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.55 }}
          >
            for <WordCycler />
          </motion.div>

          {/* Description */}
          <motion.p
            className={styles.heroDescription}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.75 }}
          >
            A strategic, data-driven platform that turns agentic AI workflows
            into business outcomes, enabling leaders in Health Insurance to act
            with precision, speed, and measurable impact across the insurance value chain.
          </motion.p>

          {/* CTA */}
          <motion.div
            className={styles.heroCta}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.95 }}
          >
            <a href="#value-chain" className={styles.ctaButton}>
              Explore Insurance Value Chain
              <span className={styles.ctaArrow}>
                <ArrowRight size={16} />
              </span>
            </a>
          </motion.div>
        </div>
      </motion.section>

      {/* --- Stats Bar ---------------------------------------------- */}
      <motion.section
        className={styles.statsBar}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.1 }}
      >
        <div className={styles.statsInner}>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <Globe size={20} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>
                <Counter to={3} />
              </span>
              <span className={styles.statLabel}>Domains</span>
            </div>
          </div>

          <div className={styles.statDivider} />

          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <BarChart3 size={20} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>
                <Counter to={15} />
              </span>
              <span className={styles.statLabel}>Use Cases</span>
            </div>
          </div>

          <div className={styles.statDivider} />

          <div className={styles.statItem}>
            <div className={styles.statIcon}>
              <Bot size={20} />
            </div>
            <div className={styles.statContent}>
              <span className={styles.statNumber}>
                <Counter to={15} />
              </span>
              <span className={styles.statLabel}>AI Agents</span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* --- Value Chain Flow ---------------------------------------- */}
      <section className={styles.valueChainSection} id="value-chain">
        <motion.h2
          className={styles.valueChainTitle}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6 }}
        >
          Insurance Value Chain
        </motion.h2>
        <motion.p
          className={styles.valueChainSubtitle}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          End-to-end visibility across the health insurance lifecycle, from
          distribution and sales through underwriting and into claims management.
        </motion.p>

        <div className={styles.flowContainer}>
          {/* Single row: Distribution -> Underwriting -> Claims */}
          <div className={`${styles.flowRow} ${styles.flowTopRow}`}>
            {FLOW_ROW_IDS.map((id, idx) => (
              <Fragment key={id}>
                <FlowCard domainId={id} index={idx} />
                {idx < FLOW_ROW_IDS.length - 1 && (
                  <span className={styles.flowArrow}>&#8594;</span>
                )}
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* --- Impact Highlights -------------------------------------- */}
      <section className={styles.impactSection}>
        <motion.h3
          className={styles.impactTitle}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.5 }}
        >
          Impact Highlights
        </motion.h3>
        <div className={styles.impactScroll}>
          {IMPACT_HIGHLIGHTS.map((item, idx) => {
            const domain = getDomainById(item.domainId);
            if (!domain) return null;
            return (
              <motion.div
                key={`${item.domainId}-${idx}`}
                className={styles.impactCard}
                style={{ borderTopColor: domain.accentColor }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-20px" }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
              >
                <div
                  className={styles.impactCardDomain}
                  style={{ color: domain.accentColor }}
                >
                  {domain.name}
                </div>
                <div className={styles.impactCardMetric}>{item.metric}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* --- Footer ------------------------------------------------- */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <span className={styles.footerLogo}>AI</span>
            <span className={styles.footerText}>
              Plataforma Inteligente de Siniestros
            </span>
          </div>
          <div className={styles.footerMeta}>
            <span className={styles.footerMetaText}>
              Plataforma Inteligente de Gestión de Siniestros
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
