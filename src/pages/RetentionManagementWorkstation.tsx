// ============================================================================
// RetentionManagementWorkstation — Churn Prediction & Retention Strategy
// Distribution domain accent: #00d4aa (teal)
// ============================================================================

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
  ShieldCheck,
  Heart,
  Package,
} from 'lucide-react';
import { getUseCase } from '../data/domains';
import Breadcrumb from '../components/Breadcrumb';
import { useAIChat } from '../hooks/useAIChat';
import styles from './RetentionManagementWorkstation.module.css';
import { policyHolders } from '../data/distribution/retention-data';
import type { PolicyHolder } from '../data/distribution/types';

/* ── Agent result type ──────────────────────────────────────── */
interface AgentResult {
  interventionType: string;
  discountRecommendation: string;
  optimalContactTiming: string;
  expectedSaveProbability: string;
  estimatedRetentionROI: string;
  rationale: string[];
}

/* ── Simulated agent recommendation ─────────────────────────── */
function generateRecommendation(holder: PolicyHolder): Promise<AgentResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const interventionMap: Record<string, string> = {
        Critical: 'Premium discount + Personal outreach + Claims concierge',
        High: 'Plan upgrade offer + Loyalty reward',
        Medium: 'Loyalty reward + Engagement campaign',
        Low: 'Proactive satisfaction survey + Thank-you package',
      };

      const discountMap: Record<string, string> = {
        Critical: `${Math.min(25, Math.round(holder.churnRisk * 28))}% for 6 months`,
        High: `${Math.min(18, Math.round(holder.churnRisk * 22))}% for 3 months`,
        Medium: `${Math.min(10, Math.round(holder.churnRisk * 15))}% at renewal`,
        Low: 'No discount needed — focus on engagement',
      };

      const timingMap: Record<string, string> = {
        Critical: 'Immediate — within 48 hours (high lapse risk)',
        High: '7 days before next billing cycle',
        Medium: '30 days before renewal',
        Low: '60 days before renewal — standard touchpoint',
      };

      const baseSave = Math.max(0.2, 1 - holder.churnRisk);
      const saveProbability = Math.min(0.95, baseSave + 0.15).toFixed(0);
      const annualPremium = holder.monthlyPremium * 12;
      const discountCost = annualPremium * (holder.churnRisk * 0.15);
      const retentionValue = annualPremium * holder.tenure * 0.3;
      const roi = ((retentionValue - discountCost) / Math.max(discountCost, 1)).toFixed(1);

      const rationaleBank: Record<string, string[]> = {
        Critical: [
          `Churn risk at ${(holder.churnRisk * 100).toFixed(0)}% — immediate intervention required`,
          `Last interaction was ${holder.lastInteraction} — ${Math.round((Date.now() - new Date(holder.lastInteraction).getTime()) / 86400000)} days of inactivity`,
          `Satisfaction score ${holder.satisfactionScore}/10 is below retention threshold of 5`,
          `Payment history "${holder.paymentHistory}" indicates financial friction`,
        ],
        High: [
          `Churn risk ${(holder.churnRisk * 100).toFixed(0)}% driven by low satisfaction (${holder.satisfactionScore}/10)`,
          `${holder.tenure}-year tenure represents $${(annualPremium * holder.tenure).toLocaleString()} lifetime value at risk`,
          `Claims frequency of ${holder.claimsFrequency}/yr suggests plan mismatch — consider restructure`,
          `Similar profiles show 68% retention when offered plan upgrade within 14 days`,
        ],
        Medium: [
          `Moderate churn risk (${(holder.churnRisk * 100).toFixed(0)}%) — preventive action recommended`,
          `Satisfaction score ${holder.satisfactionScore}/10 is stable but improvable`,
          `Payment history "${holder.paymentHistory}" — no urgent financial red flags`,
          `Loyalty program enrollment increases retention by 42% for this segment`,
        ],
        Low: [
          `Low churn risk (${(holder.churnRisk * 100).toFixed(0)}%) — strong retention profile`,
          `High satisfaction (${holder.satisfactionScore}/10) and "${holder.paymentHistory}" payment history`,
          `${holder.tenure}-year loyal member — candidate for advocacy program`,
          `Proactive engagement maintains current positive trajectory`,
        ],
      };

      resolve({
        interventionType: interventionMap[holder.riskSegment] ?? 'Standard retention outreach',
        discountRecommendation: discountMap[holder.riskSegment] ?? '5% goodwill discount',
        optimalContactTiming: timingMap[holder.riskSegment] ?? '30 days before renewal',
        expectedSaveProbability: `${saveProbability}%`,
        estimatedRetentionROI: `${roi}x`,
        rationale: rationaleBank[holder.riskSegment] ?? [
          `Churn risk: ${(holder.churnRisk * 100).toFixed(0)}%`,
          `Satisfaction: ${holder.satisfactionScore}/10`,
          `Tenure: ${holder.tenure} years`,
          `Recommended: standard retention pathway`,
        ],
      });
    }, 2400);
  });
}

/* ══════════════════════════════════════════════════════════════ */
/*  Component                                                     */
/* ══════════════════════════════════════════════════════════════ */

const RetentionManagementWorkstation: React.FC = () => {
  const { domainId, useCaseId } = useParams<{ domainId: string; useCaseId: string }>();
  const result = getUseCase(domainId ?? '', useCaseId ?? '');

  const domain = result?.domain ?? {
    id: 'distribution',
    name: 'Distribution, Sales & Marketing',
    accentColor: '#00d4aa',
    description: '',
    position: 1,
    useCases: [],
  };
  const useCase = result?.useCase ?? {
    id: 'retention-management',
    title: 'Retention Management',
    description: 'Identify policyholders at risk of lapsing and recommend targeted retention interventions.',
  };

  /* ── State ──────────────────────────────────────────────────── */
  const [selectedHolder, setSelectedHolder] = useState<PolicyHolder | null>(null);
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [discountOffer, setDiscountOffer] = useState(10);
  const [outreachTiming, setOutreachTiming] = useState(30);

  /* ── KPIs ───────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const total = policyHolders.length;
    const avgChurn = policyHolders.reduce((s, p) => s + p.churnRisk, 0) / total;
    const atRisk = policyHolders.filter((p) => p.churnRisk > 0.6).length;
    const avgSatisfaction = policyHolders.reduce((s, p) => s + p.satisfactionScore, 0) / total;
    return { total, avgChurn, atRisk, avgSatisfaction };
  }, []);

  /* ── Simulation ─────────────────────────────────────────────── */
  const simulation = useMemo(() => {
    if (!selectedHolder) return null;
    const baseRetention = 1 - selectedHolder.churnRisk;
    const discountBoost = discountOffer * 0.018;
    const timingBoost = outreachTiming <= 30 ? 0.12 : outreachTiming <= 60 ? 0.06 : 0.02;
    const newRetention = Math.min(0.98, baseRetention + discountBoost + timingBoost);
    const annualPremium = selectedHolder.monthlyPremium * 12;
    const discountCost = annualPremium * (discountOffer / 100);
    const retainedRevenue = annualPremium * newRetention;
    const netImpact = retainedRevenue - discountCost - annualPremium * baseRetention;
    return {
      originalRetention: (baseRetention * 100).toFixed(1),
      newRetention: (newRetention * 100).toFixed(1),
      retentionDelta: ((newRetention - baseRetention) * 100).toFixed(1),
      discountCost: discountCost.toFixed(0),
      netRevenueDelta: netImpact.toFixed(0),
    };
  }, [selectedHolder, discountOffer, outreachTiming]);

  /* ── Handlers ───────────────────────────────────────────────── */
  const handleSelectHolder = useCallback((holder: PolicyHolder) => {
    setSelectedHolder(holder);
    setAgentResult(null);
    setDiscountOffer(10);
    setOutreachTiming(30);
  }, []);

  const handleRunAgent = useCallback(async () => {
    if (!selectedHolder || isProcessing) return;
    setIsProcessing(true);
    setAgentResult(null);
    try {
      const rec = await generateRecommendation(selectedHolder);
      setAgentResult(rec);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedHolder, isProcessing]);

  /* ── Churn risk styling ─────────────────────────────────────── */
  const riskClass = (risk: number) => {
    if (risk > 0.8) return styles.riskCritical;
    if (risk > 0.6) return styles.riskHigh;
    if (risk > 0.3) return styles.riskMedium;
    return styles.riskLow;
  };

  const segmentClass = (segment: string) => {
    switch (segment) {
      case 'Critical': return styles.riskCritical;
      case 'High': return styles.riskHigh;
      case 'Medium': return styles.riskMedium;
      default: return styles.riskLow;
    }
  };

  /* ── Chat ───────────────────────────────────────────────────── */
  const {
    messages,
    inputValue,
    setInputValue,
    isLoading: chatLoading,
    send,
    handleKeyDown,
    configured,
  } = useAIChat({
    systemPrompt:
      'You are a Retention Management AI agent for a health insurance company. You identify policyholders at risk of lapsing and recommend personalized retention strategies including discounts, plan adjustments, and outreach timing. Answer questions about churn prediction, retention interventions, and policyholder engagement.',
  });

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Breadcrumb & back */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Breadcrumb
            items={[
              { label: 'Home', to: '/' },
              { label: domain.name, to: `/domain/${domain.id}` },
              { label: useCase.title },
            ]}
          />
        </motion.div>

        <Link to={`/domain/${domain.id}`} className={styles.backLink}>
          <ArrowLeft size={16} /> Back to {domain.name}
        </Link>

        {/* Hero banner */}
        <motion.div
          className={styles.heroBanner}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={styles.heroTitle}>{useCase.title}</h1>
          <p className={styles.heroSubtitle}>{useCase.description}</p>
        </motion.div>

        {/* KPI row */}
        <motion.div
          className={styles.kpiRow}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className={styles.kpiCard}>
            <Users size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{kpis.total}</span>
            <span className={styles.kpiLabel}>Total Policyholders</span>
          </div>
          <div className={styles.kpiCard}>
            <Activity size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{(kpis.avgChurn * 100).toFixed(1)}%</span>
            <span className={styles.kpiLabel}>Avg Churn Risk</span>
          </div>
          <div className={styles.kpiCard}>
            <Target size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{kpis.atRisk}</span>
            <span className={styles.kpiLabel}>At-Risk Members</span>
          </div>
          <div className={styles.kpiCard}>
            <Heart size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{kpis.avgSatisfaction.toFixed(1)}</span>
            <span className={styles.kpiLabel}>Avg Satisfaction (/10)</span>
          </div>
        </motion.div>

        {/* Data table */}
        <motion.section
          className={styles.section}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <h2 className={styles.sectionTitle}>
            <BarChart3 size={18} /> Policyholder Retention Dashboard
          </h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Plan</th>
                  <th>Monthly Premium</th>
                  <th>Tenure (yrs)</th>
                  <th>Claims Freq</th>
                  <th>Satisfaction</th>
                  <th>Churn Risk</th>
                  <th>Risk Segment</th>
                  <th>Payment History</th>
                </tr>
              </thead>
              <tbody>
                {policyHolders.map((p) => (
                  <tr
                    key={p.id}
                    className={`${styles.tableRow} ${selectedHolder?.id === p.id ? styles.selectedRow : ''}`}
                    onClick={() => handleSelectHolder(p)}
                  >
                    <td className={styles.nameCell}>{p.name}</td>
                    <td>{p.age}</td>
                    <td>{p.plan}</td>
                    <td>${p.monthlyPremium.toLocaleString()}</td>
                    <td>{p.tenure}</td>
                    <td>{p.claimsFrequency.toFixed(1)}</td>
                    <td>{p.satisfactionScore}/10</td>
                    <td>
                      <span className={riskClass(p.churnRisk)}>
                        {(p.churnRisk * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td>
                      <span className={segmentClass(p.riskSegment)}>
                        {p.riskSegment}
                      </span>
                    </td>
                    <td>{p.paymentHistory}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedHolder && (
            <motion.section
              className={styles.detailPanel}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className={styles.detailGrid}>
                {/* Profile card */}
                <div className={styles.profileCard}>
                  <h3 className={styles.detailTitle}>
                    <ShieldCheck size={18} /> Policyholder Profile
                  </h3>
                  <div className={styles.profileRow}>
                    <span className={styles.profileLabel}>Name</span>
                    <span className={styles.profileValue}>{selectedHolder.name}</span>
                  </div>
                  <div className={styles.profileRow}>
                    <span className={styles.profileLabel}>Age</span>
                    <span className={styles.profileValue}>{selectedHolder.age}</span>
                  </div>
                  <div className={styles.profileRow}>
                    <span className={styles.profileLabel}>Plan</span>
                    <span className={styles.profileValue}>{selectedHolder.plan}</span>
                  </div>
                  <div className={styles.profileRow}>
                    <span className={styles.profileLabel}>Monthly Premium</span>
                    <span className={styles.profileValue}>${selectedHolder.monthlyPremium.toLocaleString()}</span>
                  </div>
                  <div className={styles.profileRow}>
                    <span className={styles.profileLabel}>Tenure</span>
                    <span className={styles.profileValue}>{selectedHolder.tenure} yrs</span>
                  </div>
                  <div className={styles.profileRow}>
                    <span className={styles.profileLabel}>Claims Frequency</span>
                    <span className={styles.profileValue}>{selectedHolder.claimsFrequency}/yr</span>
                  </div>
                  <div className={styles.profileRow}>
                    <span className={styles.profileLabel}>Satisfaction</span>
                    <span className={styles.profileValue}>{selectedHolder.satisfactionScore}/10</span>
                  </div>
                  <div className={styles.profileRow}>
                    <span className={styles.profileLabel}>Payment History</span>
                    <span className={styles.profileValue}>{selectedHolder.paymentHistory}</span>
                  </div>
                  <div className={styles.profileRow}>
                    <span className={styles.profileLabel}>Last Interaction</span>
                    <span className={styles.profileValue}>{selectedHolder.lastInteraction}</span>
                  </div>
                  <div className={styles.profileRow}>
                    <span className={styles.profileLabel}>Churn Risk</span>
                    <span className={`${styles.profileValue} ${riskClass(selectedHolder.churnRisk)}`}>
                      {(selectedHolder.churnRisk * 100).toFixed(0)}% ({selectedHolder.riskSegment})
                    </span>
                  </div>
                </div>

                {/* Simulation + Agent */}
                <div className={styles.rightPanel}>
                  {/* Simulation */}
                  <div className={styles.simulationCard}>
                    <h3 className={styles.detailTitle}>
                      <TrendingUp size={18} /> Retention Simulation
                    </h3>

                    <div className={styles.sliderGroup}>
                      <label className={styles.sliderLabel}>
                        Discount Offer: <strong>{discountOffer}%</strong>
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={25}
                        step={1}
                        value={discountOffer}
                        onChange={(e) => setDiscountOffer(Number(e.target.value))}
                        className={styles.slider}
                      />
                      <div className={styles.sliderRange}>
                        <span>0%</span>
                        <span>25%</span>
                      </div>
                    </div>

                    <div className={styles.sliderGroup}>
                      <label className={styles.sliderLabel}>
                        Outreach Timing: <strong>{outreachTiming} days</strong> before renewal
                      </label>
                      <input
                        type="range"
                        min={30}
                        max={90}
                        step={30}
                        value={outreachTiming}
                        onChange={(e) => setOutreachTiming(Number(e.target.value))}
                        className={styles.slider}
                      />
                      <div className={styles.sliderRange}>
                        <span>30 days</span>
                        <span>60 days</span>
                        <span>90 days</span>
                      </div>
                    </div>

                    {simulation && (
                      <div className={styles.simulationResults}>
                        <div className={styles.simRow}>
                          <span className={styles.simLabel}>Original Retention</span>
                          <span className={styles.simValue}>{simulation.originalRetention}%</span>
                        </div>
                        <div className={styles.simRow}>
                          <span className={styles.simLabel}>Projected Retention</span>
                          <span className={styles.simValueHighlight}>{simulation.newRetention}%</span>
                        </div>
                        <div className={styles.simRow}>
                          <span className={styles.simLabel}>Retention Uplift</span>
                          <span className={styles.simValuePositive}>+{simulation.retentionDelta}pp</span>
                        </div>
                        <div className={styles.simRow}>
                          <span className={styles.simLabel}>Discount Cost (annual)</span>
                          <span className={styles.simValueNegative}>-${Number(simulation.discountCost).toLocaleString()}</span>
                        </div>
                        <div className={styles.simRow}>
                          <span className={styles.simLabel}>Net Revenue Impact</span>
                          <span className={Number(simulation.netRevenueDelta) >= 0 ? styles.simValuePositive : styles.simValueNegative}>
                            {Number(simulation.netRevenueDelta) >= 0 ? '+' : ''}${Number(simulation.netRevenueDelta).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Agent */}
                  <button
                    className={`${styles.agentButton} ${isProcessing ? styles.processing : ''}`}
                    onClick={handleRunAgent}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className={styles.spinner} /> Generating retention strategy...
                      </>
                    ) : (
                      <>
                        <Bot size={16} /> Generate Retention Strategy
                      </>
                    )}
                  </button>

                  {isProcessing && <div className={styles.processingBar} />}

                  <AnimatePresence>
                    {agentResult && (
                      <motion.div
                        className={styles.agentResult}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h4 className={styles.resultTitle}>
                          <ShieldCheck size={16} /> AI Retention Strategy
                        </h4>

                        <div className={styles.resultSection}>
                          <span className={styles.resultLabel}>Intervention Type</span>
                          <span className={styles.resultValue}>{agentResult.interventionType}</span>
                        </div>

                        <div className={styles.resultSection}>
                          <span className={styles.resultLabel}>Discount Recommendation</span>
                          <span className={styles.resultValue}>{agentResult.discountRecommendation}</span>
                        </div>

                        <div className={styles.resultSection}>
                          <span className={styles.resultLabel}>Optimal Contact Timing</span>
                          <span className={styles.resultValue}>{agentResult.optimalContactTiming}</span>
                        </div>

                        <div className={styles.resultRow}>
                          <div className={styles.resultSection}>
                            <span className={styles.resultLabel}>Save Probability</span>
                            <span className={styles.resultValueLarge}>{agentResult.expectedSaveProbability}</span>
                          </div>
                          <div className={styles.resultSection}>
                            <span className={styles.resultLabel}>Retention ROI</span>
                            <span className={styles.resultValueLarge}>{agentResult.estimatedRetentionROI}</span>
                          </div>
                        </div>

                        <div className={styles.rationale}>
                          <span className={styles.resultLabel}>Rationale</span>
                          <ul>
                            {agentResult.rationale.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Chat section */}
        <motion.section
          className={styles.chatSection}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <h2 className={styles.sectionTitle}>
            <Bot size={18} /> AI Agent Chat
          </h2>

          {!configured && (
            <p className={styles.chatNotice}>
              AI chat is not configured. Set your API key in the environment to enable live responses.
            </p>
          )}

          <div className={styles.chatMessages}>
            {messages.length === 0 && (
              <div className={styles.chatEmpty}>
                <Bot size={32} />
                <p>Ask about churn prediction, retention strategies, or policyholder engagement patterns.</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.chatMessage} ${
                  msg.role === 'user' ? styles.chatUser : styles.chatAssistant
                }`}
              >
                {msg.isTyping ? (
                  <span className={styles.typingDots}>
                    <span />
                    <span />
                    <span />
                  </span>
                ) : (
                  <p>{msg.content}</p>
                )}
                {!msg.isTyping && <span className={styles.chatTimestamp}>{msg.timestamp}</span>}
              </div>
            ))}
          </div>

          <div className={styles.chatInputRow}>
            <input
              type="text"
              className={styles.chatInput}
              placeholder="Ask the Retention agent..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={chatLoading}
            />
            <button
              className={styles.chatSend}
              onClick={() => send()}
              disabled={chatLoading || !inputValue.trim()}
            >
              {chatLoading ? <Loader2 size={16} className={styles.spinner} /> : <Send size={16} />}
            </button>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default RetentionManagementWorkstation;
