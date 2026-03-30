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
import styles from './UnderwritingAutomationWorkstation.module.css';
import { applications } from '../data/underwriting/underwriting-automation-data';
import type { Application } from '../data/underwriting/types';

/* ── Helpers ───────────────────────────────────────────── */

const formatUSD = (v: number) =>
  '$' + v.toLocaleString('en-US');

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

const decisionClass = (d: string): string => {
  if (d.includes('Approve')) return styles.decisionApproved;
  if (d.includes('Decline')) return styles.decisionDeclined;
  if (d === 'Referred') return styles.decisionReferred;
  return '';
};

/* ── Agent recommendation types ────────────────────────── */

interface AgentRecommendation {
  finalDecision: string;
  riskClassification: string;
  keyRiskFactors: string[];
  mitigatingFactors: string[];
  suggestedPremiumLoading: number;
  confidenceScore: number;
  rationale: string[];
}

/* ── Agent recommendation generator ────────────────────── */

function generateRecommendation(app: Application): AgentRecommendation {
  const riskFactors: string[] = [];
  const mitigatingFactors: string[] = [];

  if (app.smoker) riskFactors.push('Active smoker status increases morbidity risk by 40-60%');
  if (app.bmi >= 30) riskFactors.push(`BMI of ${app.bmi} indicates obesity class ${app.bmi >= 35 ? 'II' : 'I'}, elevated chronic disease risk`);
  if (app.bmi >= 25 && app.bmi < 30) riskFactors.push(`BMI of ${app.bmi} (overweight) — moderate metabolic risk`);
  if (app.age >= 55) riskFactors.push(`Age ${app.age} places applicant in higher actuarial risk band`);
  if (app.chronicConditions.length > 0) riskFactors.push(`Chronic conditions: ${app.chronicConditions.join(', ')}`);
  if (app.chronicConditions.length >= 2) riskFactors.push('Multiple comorbidities increase compounded risk exposure');
  if (app.requestedCoverage >= 500000) riskFactors.push(`High coverage amount ($${(app.requestedCoverage / 1000).toFixed(0)}K) requires enhanced scrutiny`);

  if (!app.smoker) mitigatingFactors.push('Non-smoker status — favorable mortality profile');
  if (app.bmi >= 18.5 && app.bmi < 25) mitigatingFactors.push(`Healthy BMI of ${app.bmi} — within normal range`);
  if (app.age < 40) mitigatingFactors.push(`Young age (${app.age}) — lower baseline risk`);
  if (app.chronicConditions.length === 0) mitigatingFactors.push('No chronic conditions reported');
  if (app.documentStatus === 'Complete') mitigatingFactors.push('All documentation complete and verified');
  if (app.riskScore < 30) mitigatingFactors.push(`Low risk score of ${app.riskScore} — well within auto-approval threshold`);

  let finalDecision: string;
  let riskClassification: string;
  let suggestedPremiumLoading: number;
  let confidenceScore: number;

  if (app.riskScore < 20) {
    finalDecision = 'Approve';
    riskClassification = 'Preferred';
    suggestedPremiumLoading = 0;
    confidenceScore = 0.96;
  } else if (app.riskScore < 35) {
    finalDecision = 'Approve';
    riskClassification = 'Standard';
    suggestedPremiumLoading = 5;
    confidenceScore = 0.91;
  } else if (app.riskScore < 60) {
    finalDecision = 'Approve with Conditions';
    riskClassification = 'Substandard';
    suggestedPremiumLoading = 25 + Math.round(app.riskScore * 0.3);
    confidenceScore = 0.74;
  } else if (app.riskScore < 85) {
    finalDecision = 'Manual Review Required';
    riskClassification = 'Substandard';
    suggestedPremiumLoading = 50 + Math.round(app.riskScore * 0.4);
    confidenceScore = 0.58;
  } else {
    finalDecision = 'Decline';
    riskClassification = 'Decline';
    suggestedPremiumLoading = 0;
    confidenceScore = 0.93;
  }

  const rationale: string[] = [
    `Applicant ${app.applicantName}, age ${app.age}, ${app.gender}, requesting ${app.requestedPlan} plan with $${(app.requestedCoverage / 1000).toFixed(0)}K coverage.`,
    `Risk score of ${app.riskScore}/100 places this application in the ${riskClassification.toLowerCase()} classification tier.`,
    `BMI ${app.bmi} and smoking status (${app.smoker ? 'yes' : 'no'}) are key health indicators in the assessment.`,
    app.chronicConditions.length > 0
      ? `Chronic conditions (${app.chronicConditions.join(', ')}) require careful evaluation of ongoing treatment costs.`
      : 'No chronic conditions reduce expected claims frequency significantly.',
    suggestedPremiumLoading > 0
      ? `Recommended premium loading of +${suggestedPremiumLoading}% compensates for identified risk factors.`
      : 'No premium loading required — standard rates apply for this risk profile.',
  ];

  return {
    finalDecision,
    riskClassification,
    keyRiskFactors: riskFactors.length > 0 ? riskFactors : ['No significant risk factors identified'],
    mitigatingFactors: mitigatingFactors.length > 0 ? mitigatingFactors : ['Limited mitigating factors'],
    suggestedPremiumLoading,
    confidenceScore,
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

const UnderwritingAutomationWorkstation: React.FC = () => {
  const { domainId } = useParams<{ domainId: string; useCaseId: string }>();
  const result = getUseCase(domainId ?? 'underwriting', 'underwriting-automation');

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [riskThreshold, setRiskThreshold] = useState(0.75);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentResult, setAgentResult] = useState<AgentRecommendation | null>(null);

  /* Chat system */
  const { messages, inputValue, setInputValue, isLoading, send, handleKeyDown } = useAIChat({
    systemPrompt: 'You are an Underwriting Automation AI agent for a health insurance company. You process applications through automated risk assessment, analyzing medical history, BMI, smoking status, and chronic conditions. You flag exceptions and generate auto-decisions with confidence scores. Answer questions about risk assessment, underwriting decisions, and application processing.',
  });

  /* KPI calculations */
  const totalApplications = applications.length;

  const stpRate = useMemo(() => {
    const stpCount = applications.filter((a) => a.autoDecision.includes('Approve') && a.confidence > 0.85).length;
    return stpCount / applications.length;
  }, []);

  const avgProcessingTime = useMemo(
    () => applications.reduce((s, a) => s + a.processingTime, 0) / applications.length,
    [],
  );

  const referralRate = useMemo(() => {
    const referredCount = applications.filter((a) => a.autoDecision === 'Referred').length;
    return referredCount / applications.length;
  }, []);

  /* Simulation: how threshold affects STP and decline rates */
  const simResults = useMemo(() => {
    const total = applications.length;
    const stpCount = applications.filter((a) => a.autoDecision.includes('Approve') && a.confidence >= riskThreshold).length;
    const declineCount = applications.filter((a) => a.autoDecision.includes('Decline')).length;
    const referredCount = total - stpCount - declineCount;
    return {
      stpRate: stpCount / total,
      declineRate: declineCount / total,
      referralRate: referredCount / total,
      stpCount,
      declineCount,
      referredCount,
    };
  }, [riskThreshold]);

  const handleRowClick = useCallback((app: Application) => {
    setSelectedApp(app);
    setAgentResult(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    setSelectedApp(null);
    setAgentResult(null);
  }, []);

  const handleRunAgent = useCallback(() => {
    if (!selectedApp) return;
    setAgentRunning(true);
    setAgentResult(null);
    setTimeout(() => {
      const rec = generateRecommendation(selectedApp);
      setAgentResult(rec);
      setAgentRunning(false);
    }, 2200);
  }, [selectedApp]);

  const domain = result?.domain;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Breadcrumb items={[
            { label: 'Home', to: '/' },
            { label: domain?.name ?? 'Underwriting & Pricing', to: `/domain/${domainId ?? 'underwriting'}` },
            { label: 'Underwriting Automation' },
          ]} />
        </motion.div>

        <Link to={`/domain/${domainId ?? 'underwriting'}`} className={styles.backLink}>
          <ArrowLeft size={16} /> Back to {domain?.name ?? 'Underwriting & Pricing'}
        </Link>

        {/* Hero Banner */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <div className={styles.heroBanner}>
            <h1 className={styles.heroTitle}>Underwriting Automation</h1>
            <p className={styles.heroSubtitle}>
              Process health insurance applications through automated risk assessment. Analyze medical history, BMI, smoking status, and chronic conditions to generate auto-decisions with confidence scores. Click any application to review the full risk profile, run AI underwriting assessments, and simulate threshold impacts.
            </p>
          </div>
        </motion.div>

        {/* KPI Row */}
        <motion.div className={styles.kpiRow} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon}><Users size={16} /></div>
              <span className={styles.kpiLabel}>Total Applications</span>
            </div>
            <div className={styles.kpiValue}>{totalApplications}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon}><FileCheck size={16} /></div>
              <span className={styles.kpiLabel}>STP Rate</span>
            </div>
            <div className={styles.kpiValue}>{pct(stpRate)}</div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon}><Clock size={16} /></div>
              <span className={styles.kpiLabel}>Avg Processing Time</span>
            </div>
            <div className={styles.kpiValue}>
              {avgProcessingTime.toFixed(1)}<span className={styles.kpiUnit}>hrs</span>
            </div>
          </div>
          <div className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <div className={styles.kpiIcon}><AlertTriangle size={16} /></div>
              <span className={styles.kpiLabel}>Referral Rate</span>
            </div>
            <div className={styles.kpiValue}>{pct(referralRate)}</div>
          </div>
        </motion.div>

        {/* Applications Table */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <CollapsibleSection icon={<Shield size={16} />} title="Application Pipeline" badge={`${applications.length} applications`}>
            <div className={styles.tableCount}>Click any application row to open the detail panel</div>
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Applicant Name</th>
                    <th style={{ textAlign: 'right' }}>Age</th>
                    <th style={{ textAlign: 'right' }}>BMI</th>
                    <th>Smoker</th>
                    <th>Chronic Conditions</th>
                    <th>Plan</th>
                    <th style={{ textAlign: 'right' }}>Coverage</th>
                    <th style={{ textAlign: 'right' }}>Risk Score</th>
                    <th>Auto Decision</th>
                    <th style={{ textAlign: 'right' }}>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const isSelected = selectedApp?.id === app.id;
                    return (
                      <tr
                        key={app.id}
                        className={`${styles.clickableRow} ${isSelected ? styles.selectedRow : ''}`}
                        onClick={() => handleRowClick(app)}
                      >
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{app.applicantName}</td>
                        <td style={{ textAlign: 'right' }}>{app.age}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: app.bmi >= 30 ? 'var(--status-red)' : app.bmi >= 25 ? 'var(--accent-amber)' : 'var(--status-green)' }}>{app.bmi.toFixed(1)}</td>
                        <td>{app.smoker ? <span className={styles.smokerYes}>Yes</span> : <span className={styles.smokerNo}>No</span>}</td>
                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{app.chronicConditions.length > 0 ? app.chronicConditions.join(', ') : 'None'}</td>
                        <td>{app.requestedPlan}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--text-primary)' }}>{formatUSD(app.requestedCoverage)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span className={app.riskScore >= 70 ? styles.riskHigh : app.riskScore >= 40 ? styles.riskMedium : styles.riskLow}>{app.riskScore}</span>
                        </td>
                        <td><span className={decisionClass(app.autoDecision)}>{app.autoDecision}</span></td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{pct(app.confidence)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        </motion.div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedApp && (
            <motion.div key="detail-panel" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.35 }}>
              <div className={styles.detailPanel}>
                <div className={styles.detailHeader}>
                  <div>
                    <div className={styles.detailTitle}>
                      <Shield size={16} style={{ color: '#3b82f6' }} />
                      Application Detail: {selectedApp.applicantName}
                    </div>
                    <div className={styles.detailSubtitle}>{selectedApp.id} &mdash; {selectedApp.requestedPlan} Plan &mdash; {formatUSD(selectedApp.requestedCoverage)} Coverage</div>
                  </div>
                  <button className={styles.closeBtn} onClick={handleClosePanel}>&times;</button>
                </div>

                {/* Applicant Profile */}
                <div className={styles.profileGrid}>
                  <div className={styles.profileCard}>
                    <span className={styles.profileLabel}>Gender</span>
                    <span className={styles.profileValue}>{selectedApp.gender}</span>
                  </div>
                  <div className={styles.profileCard}>
                    <span className={styles.profileLabel}>Age</span>
                    <span className={styles.profileValue}>{selectedApp.age}</span>
                  </div>
                  <div className={styles.profileCard}>
                    <span className={styles.profileLabel}>BMI</span>
                    <span className={styles.profileValue} style={{ color: selectedApp.bmi >= 30 ? 'var(--status-red)' : selectedApp.bmi >= 25 ? 'var(--accent-amber)' : 'var(--status-green)' }}>{selectedApp.bmi.toFixed(1)}</span>
                  </div>
                  <div className={styles.profileCard}>
                    <span className={styles.profileLabel}>Smoker</span>
                    <span className={styles.profileValue} style={{ color: selectedApp.smoker ? 'var(--status-red)' : 'var(--status-green)' }}>{selectedApp.smoker ? 'Yes' : 'No'}</span>
                  </div>
                  <div className={styles.profileCard}>
                    <span className={styles.profileLabel}>Risk Score</span>
                    <span className={styles.profileValue}>{selectedApp.riskScore}/100</span>
                  </div>
                  <div className={styles.profileCard}>
                    <span className={styles.profileLabel}>Processing Time</span>
                    <span className={styles.profileValue}>{selectedApp.processingTime}h</span>
                  </div>
                </div>

                {/* Risk Factor Breakdown */}
                <div className={styles.riskSection}>
                  <div className={styles.riskSectionTitle}>Risk Factor Breakdown</div>
                  <div className={styles.riskBarGroup}>
                    <div className={styles.riskBarItem}>
                      <span className={styles.riskBarLabel}>Age Risk</span>
                      <div className={styles.riskBarTrack}><div className={styles.riskBarFill} style={{ width: `${Math.min(selectedApp.age / 70 * 100, 100)}%` }} /></div>
                      <span className={styles.riskBarValue}>{Math.round(selectedApp.age / 70 * 100)}%</span>
                    </div>
                    <div className={styles.riskBarItem}>
                      <span className={styles.riskBarLabel}>BMI Risk</span>
                      <div className={styles.riskBarTrack}><div className={styles.riskBarFill} style={{ width: `${Math.min((selectedApp.bmi - 18) / 22 * 100, 100)}%`, background: selectedApp.bmi >= 30 ? 'var(--status-red)' : '#3b82f6' }} /></div>
                      <span className={styles.riskBarValue}>{selectedApp.bmi.toFixed(1)}</span>
                    </div>
                    <div className={styles.riskBarItem}>
                      <span className={styles.riskBarLabel}>Smoking</span>
                      <div className={styles.riskBarTrack}><div className={styles.riskBarFill} style={{ width: selectedApp.smoker ? '100%' : '0%', background: selectedApp.smoker ? 'var(--status-red)' : '#3b82f6' }} /></div>
                      <span className={styles.riskBarValue}>{selectedApp.smoker ? 'High' : 'None'}</span>
                    </div>
                    <div className={styles.riskBarItem}>
                      <span className={styles.riskBarLabel}>Conditions</span>
                      <div className={styles.riskBarTrack}><div className={styles.riskBarFill} style={{ width: `${Math.min(selectedApp.chronicConditions.length / 3 * 100, 100)}%`, background: selectedApp.chronicConditions.length >= 2 ? 'var(--status-red)' : selectedApp.chronicConditions.length === 1 ? 'var(--accent-amber)' : '#3b82f6' }} /></div>
                      <span className={styles.riskBarValue}>{selectedApp.chronicConditions.length}</span>
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div className={styles.medicalSection}>
                  <div className={styles.medicalTitle}>Medical History Summary</div>
                  <div className={styles.medicalContent}>
                    {selectedApp.chronicConditions.length > 0 ? (
                      <ul className={styles.conditionList}>
                        {selectedApp.chronicConditions.map((c, i) => <li key={i}>{c}</li>)}
                      </ul>
                    ) : (
                      <p className={styles.noConditions}>No chronic conditions reported. Clean medical history.</p>
                    )}
                  </div>
                </div>

                {/* Document Status */}
                <div className={styles.docStatus}>
                  <span className={styles.docStatusLabel}>Document Status:</span>
                  <span className={selectedApp.documentStatus === 'Complete' ? styles.docComplete : styles.docPending}>{selectedApp.documentStatus}</span>
                </div>

                {/* AI Decision */}
                <div className={styles.aiDecisionRow}>
                  <div className={styles.aiDecisionCard}>
                    <span className={styles.aiDecisionLabel}>Auto Decision</span>
                    <span className={decisionClass(selectedApp.autoDecision)}>{selectedApp.autoDecision}</span>
                  </div>
                  <div className={styles.aiDecisionCard}>
                    <span className={styles.aiDecisionLabel}>Confidence</span>
                    <span className={styles.aiDecisionValue}>{pct(selectedApp.confidence)}</span>
                  </div>
                  {selectedApp.referralReason && (
                    <div className={styles.aiDecisionCard} style={{ gridColumn: '1 / -1' }}>
                      <span className={styles.aiDecisionLabel}>Referral Reason</span>
                      <span className={styles.referralText}>{selectedApp.referralReason}</span>
                    </div>
                  )}
                </div>

                {/* Simulation: Risk Threshold */}
                <div className={styles.simSection}>
                  <div className={styles.simTitle}>
                    <Target size={16} style={{ color: '#3b82f6' }} />
                    Threshold Simulation
                  </div>
                  <div className={styles.sliderBlock}>
                    <div className={styles.sliderBlockHeader}>
                      <span className={styles.sliderLabel}>Risk Tolerance Threshold</span>
                      <span className={styles.sliderDisplay}>{riskThreshold.toFixed(2)}</span>
                    </div>
                    <div className={styles.sliderLabels}>
                      <span>0.50</span>
                      <span>0.725</span>
                      <span>0.95</span>
                    </div>
                    <input type="range" min={0.5} max={0.95} step={0.01} value={riskThreshold} onChange={(e) => setRiskThreshold(parseFloat(e.target.value))} className={styles.sliderInput} />
                  </div>
                  <div className={styles.simResults}>
                    <div className={styles.simResult}>
                      <div className={styles.simResultLabel}>STP Rate</div>
                      <div className={`${styles.simResultValue} ${styles.simPositive}`}>{pct(simResults.stpRate)} ({simResults.stpCount})</div>
                    </div>
                    <div className={styles.simResult}>
                      <div className={styles.simResultLabel}>Decline Rate</div>
                      <div className={`${styles.simResultValue} ${styles.simNegative}`}>{pct(simResults.declineRate)} ({simResults.declineCount})</div>
                    </div>
                    <div className={styles.simResult}>
                      <div className={styles.simResultLabel}>Referral Rate</div>
                      <div className={styles.simResultValue} style={{ color: 'var(--accent-amber)' }}>{pct(simResults.referralRate)} ({simResults.referredCount})</div>
                    </div>
                  </div>
                </div>

                {/* Agent Button */}
                <div className={styles.agentSection}>
                  <button className={`${styles.agentBtn} ${agentRunning ? styles.agentBtnRunning : ''}`} onClick={handleRunAgent} disabled={agentRunning}>
                    {agentRunning ? (
                      <><Loader2 size={16} className={styles.spinnerIcon} /> Assessing risk profile...</>
                    ) : (
                      <><Bot size={16} /> Run Underwriting Assessment</>
                    )}
                  </button>
                  {agentRunning && (
                    <motion.div className={styles.processingBar} initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 2.0, ease: 'easeInOut' }} />
                  )}
                </div>

                {/* Agent Results */}
                <AnimatePresence>
                  {agentResult && (
                    <motion.div key="agent-result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.4 }} className={styles.agentResultPanel}>
                      <div className={styles.agentResultHeader}>
                        <Bot size={16} style={{ color: '#3b82f6' }} />
                        <span>AI Underwriting Assessment</span>
                      </div>
                      <div className={styles.agentResultGrid}>
                        <div className={styles.agentResultCard}>
                          <div className={styles.agentResultCardLabel}>Final Decision</div>
                          <div className={styles.agentResultCardValue} style={{ color: agentResult.finalDecision === 'Approve' ? 'var(--status-green)' : agentResult.finalDecision === 'Decline' ? 'var(--status-red)' : '#3b82f6' }}>{agentResult.finalDecision}</div>
                        </div>
                        <div className={styles.agentResultCard}>
                          <div className={styles.agentResultCardLabel}>Risk Classification</div>
                          <div className={styles.agentResultCardValue} style={{ color: '#3b82f6' }}>{agentResult.riskClassification}</div>
                        </div>
                        <div className={styles.agentResultCard}>
                          <div className={styles.agentResultCardLabel}>Premium Loading</div>
                          <div className={styles.agentResultCardValue} style={{ color: agentResult.suggestedPremiumLoading > 0 ? 'var(--accent-amber)' : 'var(--status-green)' }}>+{agentResult.suggestedPremiumLoading}%</div>
                        </div>
                        <div className={styles.agentResultCard}>
                          <div className={styles.agentResultCardLabel}>Confidence</div>
                          <div className={styles.agentResultCardValue} style={{ color: '#3b82f6' }}>{pct(agentResult.confidenceScore)}</div>
                        </div>
                      </div>

                      <div className={styles.agentListBlock}>
                        <div className={styles.agentListLabel}>Key Risk Factors</div>
                        <ul className={`${styles.agentList} ${styles.riskList}`}>
                          {agentResult.keyRiskFactors.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>

                      <div className={styles.agentListBlock}>
                        <div className={styles.agentListLabel}>Mitigating Factors</div>
                        <ul className={styles.agentList}>
                          {agentResult.mitigatingFactors.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>

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
          <CollapsibleSection icon={<Bot size={16} />} title="AI Underwriting Assistant" badge="Chat" defaultOpen={false}>
            <div className={styles.chatContainer}>
              <div className={styles.chatMessages}>
                {messages.length === 0 && (
                  <div className={styles.chatEmpty}>Ask questions about risk assessment, underwriting decisions, or application processing.</div>
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
                  placeholder="Ask about underwriting decisions, risk factors..."
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

export default UnderwritingAutomationWorkstation;
