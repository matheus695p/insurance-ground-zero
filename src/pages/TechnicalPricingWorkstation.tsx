import type React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Bot,
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Activity,
  BarChart3,
  Send,
  Loader2,
  FileCheck,
  AlertTriangle,
  Shield,
  Clock,
} from 'lucide-react';
import { getUseCase } from '../data/domains';
import Breadcrumb from '../components/Breadcrumb';
import { useAIChat } from '../hooks/useAIChat';
import styles from './TechnicalPricingWorkstation.module.css';
import { ratingFactors, experienceRecords } from '../data/underwriting/technical-pricing-data';
import type { RatingFactor, ExperienceRecord } from '../data/underwriting/types';

/* ── Helpers ───────────────────────────────────────────── */

const formatUSD = (v: number) =>
  '$' + v.toLocaleString('en-US');

const formatUSDCompact = (v: number) => {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return formatUSD(v);
};

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const pctSigned = (v: number) => `${v >= 0 ? '+' : ''}${(v * 100).toFixed(2)}%`;

/* ── Agent recommendation types ────────────────────────── */

interface ActuarialRecommendation {
  recommendedWeightChanges: { factor: string; currentWeight: number; recommendedWeight: number; change: string }[];
  projectedLossRatioImprovement: number;
  premiumVolumeImpact: string;
  rateAdequacyScore: number;
  rationale: string[];
}

/* ── Agent recommendation generator ────────────────────── */

function generateRecommendation(factors: RatingFactor[], records: ExperienceRecord[]): ActuarialRecommendation {
  const avgLossRatio = records.reduce((s, r) => s + r.lossRatio, 0) / records.length;
  const totalPremium = records.reduce((s, r) => s + r.earnedPremium, 0);
  const totalClaims = records.reduce((s, r) => s + r.incurredClaims, 0);

  const weightChanges = factors
    .filter((f) => Math.abs(f.proposedWeight - f.currentWeight) > 0.01)
    .map((f) => ({
      factor: f.factor,
      currentWeight: f.currentWeight,
      recommendedWeight: f.proposedWeight + (f.impactOnLossRatio > 0.02 ? 0.05 : 0),
      change: `${f.proposedWeight > f.currentWeight ? '+' : ''}${((f.proposedWeight - f.currentWeight) / f.currentWeight * 100).toFixed(1)}%`,
    }));

  const lossRatioImprovement = weightChanges.reduce((s, w) => {
    const factor = factors.find((f) => f.factor === w.factor);
    return s + (factor ? Math.abs(factor.impactOnLossRatio) * 0.3 : 0);
  }, 0);

  const premiumIncrease = weightChanges.reduce((s, w) => {
    const factor = factors.find((f) => f.factor === w.factor);
    return s + (factor ? (w.recommendedWeight - factor.currentWeight) * factor.sampleSize * 12 : 0);
  }, 0);

  const rateAdequacy = ((totalPremium - totalClaims) / totalPremium) * 100;

  const rationale: string[] = [
    `Current portfolio loss ratio of ${(avgLossRatio * 100).toFixed(1)}% exceeds target of 72.0% by ${((avgLossRatio - 0.72) * 100).toFixed(1)} percentage points.`,
    `Analysis of ${records.length} cohort-year experience records covering $${(totalPremium / 1_000_000).toFixed(0)}M in earned premium.`,
    `${weightChanges.length} rating factors require weight adjustment to restore rate adequacy.`,
    `Older age bands (46-55, 56-65) show consistent loss ratio deterioration year-over-year, requiring upward weight revision.`,
    `Smoker and cardiovascular condition factors are under-weighted relative to emerging claims experience.`,
    `Projected combined ratio improvement of ${(lossRatioImprovement * 100).toFixed(2)}% upon implementation of proposed rate changes.`,
    `Premium volume impact estimated at ${formatUSDCompact(premiumIncrease)} annually from weight adjustments across affected rating cells.`,
  ];

  return {
    recommendedWeightChanges: weightChanges,
    projectedLossRatioImprovement: lossRatioImprovement,
    premiumVolumeImpact: formatUSDCompact(premiumIncrease),
    rateAdequacyScore: rateAdequacy,
    rationale,
  };
}

/* ── Collapsible Section ───────────────────────────────── */

interface CollapsibleSectionProps {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const sectionContentVariants = {
  open: { height: 'auto', opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  closed: { height: 0, opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } },
};

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  icon, title, badge, defaultOpen = true, children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader} onClick={() => setOpen((o) => !o)}>
        <div className={styles.sectionHeaderLeft}>
          <span className={styles.sectionIcon}>{icon}</span>
          <span className={styles.sectionTitle}>{title}</span>
          {badge && <span className={styles.sectionBadge}>{badge}</span>}
        </div>
        <Activity
          size={18}
          className={`${styles.sectionChevron} ${open ? styles.sectionChevronOpen : ''}`}
        />
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div key="content" initial="closed" animate="open" exit="closed" variants={sectionContentVariants} style={{ overflow: 'hidden' }}>
            <div className={styles.sectionContent}>{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Main Component ────────────────────────────────────── */

const TechnicalPricingWorkstation: React.FC = () => {
  const { domainId } = useParams<{ domainId: string; useCaseId: string }>();
  const result = getUseCase(domainId ?? 'underwriting', 'technical-pricing');

  const [selectedFactor, setSelectedFactor] = useState<RatingFactor | null>(null);
  const [weightAdjustment, setWeightAdjustment] = useState(0);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentResult, setAgentResult] = useState<ActuarialRecommendation | null>(null);

  /* Chat system */
  const { messages, inputValue, setInputValue, isLoading, send, handleKeyDown } = useAIChat({
    systemPrompt: 'You are an Actuarial Pricing AI agent for a health insurance company. You calibrate rating factors against emerging loss experience to maintain rate adequacy and premium sufficiency. Answer questions about actuarial modeling, loss ratios, rating factor adjustments, and pricing strategy.',
  });

  /* KPI calculations */
  const avgLossRatio = useMemo(
    () => experienceRecords.reduce((s, r) => s + r.lossRatio, 0) / experienceRecords.length,
    [],
  );

  const rateAdequacy = useMemo(() => {
    const totalPremium = experienceRecords.reduce((s, r) => s + r.earnedPremium, 0);
    const totalClaims = experienceRecords.reduce((s, r) => s + r.incurredClaims, 0);
    return (totalPremium - totalClaims) / totalPremium;
  }, []);

  const totalEarnedPremium = useMemo(
    () => experienceRecords.reduce((s, r) => s + r.earnedPremium, 0),
    [],
  );

  const avgClaimSize = useMemo(
    () => experienceRecords.reduce((s, r) => s + r.avgClaimSize, 0) / experienceRecords.length,
    [],
  );

  /* Simulation: impact of adjusting a factor's weight */
  const simResults = useMemo(() => {
    if (!selectedFactor) return null;
    const adjustedWeight = selectedFactor.currentWeight * (1 + weightAdjustment / 100);
    const weightDelta = adjustedWeight - selectedFactor.currentWeight;
    const lossRatioImpact = weightDelta * selectedFactor.impactOnLossRatio * 10;
    const premiumImpact = weightDelta * selectedFactor.sampleSize * 15;
    return {
      adjustedWeight,
      weightDelta,
      lossRatioImpact,
      premiumImpact,
    };
  }, [selectedFactor, weightAdjustment]);

  const handleFactorClick = useCallback((factor: RatingFactor) => {
    setSelectedFactor(factor);
    setWeightAdjustment(0);
    setAgentResult(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedFactor(null);
    setAgentResult(null);
    setWeightAdjustment(0);
  }, []);

  const handleRunAgent = useCallback(() => {
    setAgentRunning(true);
    setAgentResult(null);
    setTimeout(() => {
      const rec = generateRecommendation(ratingFactors, experienceRecords);
      setAgentResult(rec);
      setAgentRunning(false);
    }, 2600);
  }, []);

  const domain = result?.domain;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Breadcrumb items={[
            { label: 'Home', to: '/' },
            { label: domain?.name ?? 'Underwriting & Pricing', to: `/domain/${domainId ?? 'underwriting'}` },
            { label: 'Technical Pricing' },
          ]} />
        </motion.div>

        <Link to={`/domain/${domainId ?? 'underwriting'}`} className={styles.backLink}>
          <ArrowLeft size={16} /> Back to {domain?.name ?? 'Underwriting & Pricing'}
        </Link>

        {/* Hero Banner */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <div className={styles.heroBanner}>
            <h1 className={styles.heroTitle}>Technical Pricing</h1>
            <p className={styles.heroSubtitle}>
              Calibrate actuarial rating factors against emerging loss experience to maintain rate adequacy and premium sufficiency. Analyze rating factor weights, loss ratios across cohorts, and simulate weight adjustments to project portfolio-level impacts on profitability.
            </p>
          </div>
        </motion.div>

        {/* KPI Row */}
        <motion.div className={styles.kpiRow} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon}><BarChart3 size={16} /></div>
              <span className={styles.kpiLabel}>Avg Loss Ratio</span>
            </div>
            <div className={styles.kpiValue}>
              {(avgLossRatio * 100).toFixed(1)}<span className={styles.kpiUnit}>%</span>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon}><Shield size={16} /></div>
              <span className={styles.kpiLabel}>Rate Adequacy</span>
            </div>
            <div className={styles.kpiValue}>
              {(rateAdequacy * 100).toFixed(1)}<span className={styles.kpiUnit}>%</span>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon}><DollarSign size={16} /></div>
              <span className={styles.kpiLabel}>Total Earned Premium</span>
            </div>
            <div className={styles.kpiValue}>{formatUSDCompact(totalEarnedPremium)}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon}><TrendingUp size={16} /></div>
              <span className={styles.kpiLabel}>Avg Claim Size</span>
            </div>
            <div className={styles.kpiValue}>{formatUSDCompact(avgClaimSize)}</div>
          </div>
        </motion.div>

        {/* Rating Factors Table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <CollapsibleSection icon={<Target size={16} />} title="Rating Factors" badge={`${ratingFactors.length} factors`}>
            <div className={styles.tableCount}>Click any factor row to open the impact analysis panel</div>
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Factor</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Current Weight</th>
                    <th style={{ textAlign: 'right' }}>Proposed Weight</th>
                    <th style={{ textAlign: 'right' }}>Impact on Loss Ratio</th>
                    <th style={{ textAlign: 'right' }}>Sample Size</th>
                  </tr>
                </thead>
                <tbody>
                  {ratingFactors.map((rf) => {
                    const isSelected = selectedFactor?.id === rf.id;
                    const weightDiff = rf.proposedWeight - rf.currentWeight;
                    return (
                      <tr
                        key={rf.id}
                        className={`${styles.clickableRow} ${isSelected ? styles.selectedRow : ''}`}
                        onClick={() => handleFactorClick(rf)}
                      >
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{rf.factor}</td>
                        <td>
                          <span className={styles.categoryBadge}>{rf.category}</span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>{rf.currentWeight.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: weightDiff > 0 ? 'var(--status-red)' : weightDiff < 0 ? 'var(--status-green)' : 'var(--text-primary)' }}>
                          {rf.proposedWeight.toFixed(2)}
                          {weightDiff !== 0 && (
                            <span style={{ fontSize: '0.68rem', marginLeft: 4, color: weightDiff > 0 ? 'var(--status-red)' : 'var(--status-green)' }}>
                              ({weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(2)})
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={rf.impactOnLossRatio > 0.02 ? styles.impactHigh : rf.impactOnLossRatio > 0 ? styles.impactMedium : styles.impactNeutral}>
                            {pctSigned(rf.impactOnLossRatio)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{rf.sampleSize.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        </motion.div>

        {/* Experience Records Table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.35 }}>
          <CollapsibleSection icon={<BarChart3 size={16} />} title="Experience Records" badge={`${experienceRecords.length} records`}>
            <div className={styles.tableCount}>Cohort-level earned premium and incurred claims by policy year</div>
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Cohort</th>
                    <th style={{ textAlign: 'right' }}>Policy Year</th>
                    <th style={{ textAlign: 'right' }}>Earned Premium</th>
                    <th style={{ textAlign: 'right' }}>Incurred Claims</th>
                    <th style={{ textAlign: 'right' }}>Loss Ratio</th>
                    <th style={{ textAlign: 'right' }}>Claims Count</th>
                    <th style={{ textAlign: 'right' }}>Avg Claim Size</th>
                  </tr>
                </thead>
                <tbody>
                  {experienceRecords.map((er) => (
                    <tr key={er.id} className={styles.dataRow}>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{er.cohort}</td>
                      <td style={{ textAlign: 'right' }}>{er.policyYear}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>{formatUSDCompact(er.earnedPremium)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>{formatUSDCompact(er.incurredClaims)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span className={er.lossRatio >= 0.85 ? styles.lossHigh : er.lossRatio >= 0.75 ? styles.lossMedium : styles.lossGood}>
                          {(er.lossRatio * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{er.claimsCount.toLocaleString()}</td>
                      <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatUSD(er.avgClaimSize)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        </motion.div>

        {/* Impact Analysis Panel */}
        <AnimatePresence>
          {selectedFactor && (
            <motion.div key="impact-panel" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.35 }}>
              <div className={styles.impactPanel}>
                <div className={styles.impactHeader}>
                  <div>
                    <div className={styles.impactTitle}>
                      <Target size={16} style={{ color: '#3b82f6' }} />
                      Impact Analysis: {selectedFactor.factor}
                    </div>
                    <div className={styles.impactSubtitle}>{selectedFactor.category} &mdash; Sample Size: {selectedFactor.sampleSize.toLocaleString()}</div>
                  </div>
                  <button className={styles.closeBtn} onClick={handleClosePanel}>&times;</button>
                </div>

                {/* Factor Detail Cards */}
                <div className={styles.factorDetailGrid}>
                  <div className={styles.factorDetailCard}>
                    <span className={styles.factorDetailLabel}>Current Weight</span>
                    <span className={styles.factorDetailValue}>{selectedFactor.currentWeight.toFixed(2)}</span>
                  </div>
                  <div className={styles.factorDetailCard}>
                    <span className={styles.factorDetailLabel}>Proposed Weight</span>
                    <span className={styles.factorDetailValue} style={{ color: selectedFactor.proposedWeight > selectedFactor.currentWeight ? 'var(--status-red)' : selectedFactor.proposedWeight < selectedFactor.currentWeight ? 'var(--status-green)' : 'var(--text-primary)' }}>{selectedFactor.proposedWeight.toFixed(2)}</span>
                  </div>
                  <div className={styles.factorDetailCard}>
                    <span className={styles.factorDetailLabel}>Impact on Loss Ratio</span>
                    <span className={styles.factorDetailValue} style={{ color: selectedFactor.impactOnLossRatio > 0 ? 'var(--status-red)' : 'var(--status-green)' }}>{pctSigned(selectedFactor.impactOnLossRatio)}</span>
                  </div>
                  <div className={styles.factorDetailCard}>
                    <span className={styles.factorDetailLabel}>Weight Change</span>
                    <span className={styles.factorDetailValue} style={{ color: '#3b82f6' }}>{((selectedFactor.proposedWeight - selectedFactor.currentWeight) / selectedFactor.currentWeight * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Weight Adjustment Slider */}
                <div className={styles.simSection}>
                  <div className={styles.simTitle}>
                    <BarChart3 size={16} style={{ color: '#3b82f6' }} />
                    Weight Adjustment Simulation
                  </div>
                  <div className={styles.sliderBlock}>
                    <div className={styles.sliderBlockHeader}>
                      <span className={styles.sliderLabel}>Adjust Weight ({selectedFactor.factor})</span>
                      <span className={styles.sliderDisplay}>{weightAdjustment >= 0 ? '+' : ''}{weightAdjustment.toFixed(1)}%</span>
                    </div>
                    <div className={styles.sliderLabels}>
                      <span>-20%</span>
                      <span>0%</span>
                      <span>+20%</span>
                    </div>
                    <input type="range" min={-20} max={20} step={0.5} value={weightAdjustment} onChange={(e) => setWeightAdjustment(parseFloat(e.target.value))} className={styles.sliderInput} />
                  </div>

                  {simResults && (
                    <div className={styles.simResults}>
                      <div className={styles.simResult}>
                        <div className={styles.simResultLabel}>Adjusted Weight</div>
                        <div className={styles.simResultValue} style={{ color: '#3b82f6' }}>{simResults.adjustedWeight.toFixed(3)}</div>
                      </div>
                      <div className={styles.simResult}>
                        <div className={styles.simResultLabel}>Loss Ratio Impact</div>
                        <div className={`${styles.simResultValue} ${simResults.lossRatioImpact <= 0 ? styles.simPositive : styles.simNegative}`}>
                          {simResults.lossRatioImpact >= 0 ? '+' : ''}{(simResults.lossRatioImpact * 100).toFixed(3)}%
                        </div>
                      </div>
                      <div className={styles.simResult}>
                        <div className={styles.simResultLabel}>Premium Volume Impact</div>
                        <div className={`${styles.simResultValue} ${simResults.premiumImpact >= 0 ? styles.simPositive : styles.simNegative}`}>
                          {formatUSDCompact(simResults.premiumImpact)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Agent Button */}
                <div className={styles.agentSection}>
                  <button className={`${styles.agentBtn} ${agentRunning ? styles.agentBtnRunning : ''}`} onClick={handleRunAgent} disabled={agentRunning}>
                    {agentRunning ? (
                      <><Loader2 size={16} className={styles.spinnerIcon} /> Running actuarial analysis...</>
                    ) : (
                      <><Bot size={16} /> Run Actuarial Pricing Assessment</>
                    )}
                  </button>
                  {agentRunning && (
                    <motion.div className={styles.processingBar} initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 2.4, ease: 'easeInOut' }} />
                  )}
                </div>

                {/* Agent Results */}
                <AnimatePresence>
                  {agentResult && (
                    <motion.div key="agent-result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.4 }} className={styles.agentResultPanel}>
                      <div className={styles.agentResultHeader}>
                        <Bot size={16} style={{ color: '#3b82f6' }} />
                        <span>Actuarial Pricing Assessment</span>
                      </div>

                      {/* Summary Metrics */}
                      <div className={styles.agentResultGrid}>
                        <div className={styles.agentResultCard}>
                          <div className={styles.agentResultCardLabel}>Loss Ratio Improvement</div>
                          <div className={styles.agentResultCardValue} style={{ color: 'var(--status-green)' }}>{pctSigned(-agentResult.projectedLossRatioImprovement)}</div>
                        </div>
                        <div className={styles.agentResultCard}>
                          <div className={styles.agentResultCardLabel}>Premium Volume Impact</div>
                          <div className={styles.agentResultCardValue} style={{ color: '#3b82f6' }}>{agentResult.premiumVolumeImpact}</div>
                        </div>
                        <div className={styles.agentResultCard}>
                          <div className={styles.agentResultCardLabel}>Rate Adequacy Score</div>
                          <div className={styles.agentResultCardValue} style={{ color: agentResult.rateAdequacyScore > 25 ? 'var(--status-green)' : 'var(--accent-amber)' }}>{agentResult.rateAdequacyScore.toFixed(1)}%</div>
                        </div>
                        <div className={styles.agentResultCard}>
                          <div className={styles.agentResultCardLabel}>Factors Adjusted</div>
                          <div className={styles.agentResultCardValue} style={{ color: '#3b82f6' }}>{agentResult.recommendedWeightChanges.length}</div>
                        </div>
                      </div>

                      {/* Recommended Weight Changes */}
                      <div className={styles.weightChangeSection}>
                        <div className={styles.weightChangeTitle}>Recommended Weight Changes</div>
                        <div className={styles.tableWrapper}>
                          <table className={styles.dataTable}>
                            <thead>
                              <tr>
                                <th>Factor</th>
                                <th style={{ textAlign: 'right' }}>Current</th>
                                <th style={{ textAlign: 'right' }}>Recommended</th>
                                <th style={{ textAlign: 'right' }}>Change</th>
                              </tr>
                            </thead>
                            <tbody>
                              {agentResult.recommendedWeightChanges.map((wc, i) => (
                                <tr key={i} className={styles.dataRow}>
                                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{wc.factor}</td>
                                  <td style={{ textAlign: 'right' }}>{wc.currentWeight.toFixed(2)}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 600, color: '#3b82f6' }}>{wc.recommendedWeight.toFixed(2)}</td>
                                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-amber)' }}>{wc.change}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Rationale */}
                      <div className={styles.agentListBlock}>
                        <div className={styles.agentListLabel}>Rationale</div>
                        <ul className={styles.agentList}>
                          {agentResult.rationale.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chat Section */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <CollapsibleSection icon={<Bot size={16} />} title="AI Actuarial Pricing Assistant" badge="Chat" defaultOpen={false}>
            <div className={styles.chatContainer}>
              <div className={styles.chatMessages}>
                {messages.length === 0 && (
                  <div className={styles.chatEmpty}>Ask questions about actuarial modeling, loss ratios, rating factor adjustments, or pricing strategy.</div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`${styles.chatMessage} ${msg.role === 'user' ? styles.chatMessageUser : styles.chatMessageAssistant}`}>
                    {msg.isTyping ? (
                      <div className={styles.typingDots}><span /><span /><span /></div>
                    ) : (
                      <div className={styles.chatMessageContent}>{msg.content}</div>
                    )}
                    <div className={styles.chatTimestamp}>{msg.timestamp}</div>
                  </div>
                ))}
              </div>
              <div className={styles.chatInputRow}>
                <input
                  type="text"
                  className={styles.chatInput}
                  placeholder="Ask about loss ratios, rating factors, pricing strategy..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                />
                <button className={styles.chatSendBtn} onClick={() => send()} disabled={isLoading || !inputValue.trim()}>
                  {isLoading ? <Loader2 size={16} className={styles.spinnerIcon} /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </CollapsibleSection>
        </motion.div>
      </div>
    </div>
  );
};

export default TechnicalPricingWorkstation;
