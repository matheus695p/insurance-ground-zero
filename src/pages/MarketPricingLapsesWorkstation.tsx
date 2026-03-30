import { useState, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Bot, TrendingUp, Users, Target, DollarSign,
  Activity, BarChart3, Send, Loader2, Clock, Shield,
  AlertTriangle, Percent,
} from 'lucide-react';
import { getUseCase } from '../data/domains';
import Breadcrumb from '../components/Breadcrumb';
import { useAIChat } from '../hooks/useAIChat';
import styles from './MarketPricingLapsesWorkstation.module.css';
import { lapseRiskPolicies } from '../data/underwriting/market-pricing-lapses-data';
import type { LapseRiskPolicy } from '../data/underwriting/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT =
  'You are a Lapse Prevention AI agent for a health insurance company. You generate personalized renewal offers balancing price sensitivity, retention probability, and margin preservation. Answer questions about renewal pricing, lapse prevention, and policyholder retention strategies.';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function riskClass(risk: number): string {
  if (risk < 0.3) return styles.riskLow;
  if (risk <= 0.6) return styles.riskMedium;
  return styles.riskHigh;
}

function riskBadgeClass(risk: number): string {
  if (risk < 0.3) return styles.riskBadgeLow;
  if (risk <= 0.6) return styles.riskBadgeMedium;
  return styles.riskBadgeHigh;
}

function riskLabel(risk: number): string {
  if (risk < 0.3) return 'Low';
  if (risk <= 0.6) return 'Medium';
  return 'High';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const MarketPricingLapsesWorkstation: React.FC = () => {
  const { domainId } = useParams<{ domainId: string; useCaseId: string }>();
  const result = getUseCase(domainId ?? '', 'market-pricing-lapses');
  const domain = result?.domain;

  // --- selection ---
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => lapseRiskPolicies.find((p) => p.id === selectedId) ?? null,
    [selectedId],
  );

  // --- simulation ---
  const [renewalDiscount, setRenewalDiscount] = useState(5);
  const [benefitEnhancement, setBenefitEnhancement] = useState(0);

  // --- agent ---
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentResult, setAgentResult] = useState<Record<string, string> | null>(null);

  // --- chat ---
  const chat = useAIChat({ systemPrompt: SYSTEM_PROMPT });

  // --- KPIs ---
  const kpis = useMemo(() => {
    const n = lapseRiskPolicies.length;
    const avgRisk = lapseRiskPolicies.reduce((s, p) => s + p.lapseRisk, 0) / n;
    const avgIncrease = lapseRiskPolicies.reduce((s, p) => s + p.priceIncrease, 0) / n;
    const atRisk = lapseRiskPolicies
      .filter((p) => p.lapseRisk > 0.5)
      .reduce((s, p) => s + p.currentPremium, 0);
    return { total: n, avgRisk, avgIncrease, atRisk };
  }, []);

  // --- simulation impact ---
  const simImpact = useMemo(() => {
    const discFrac = renewalDiscount / 100;
    const benefitValue = benefitEnhancement * 0.03; // each service ~3% perceived value
    const retentionLift = discFrac * 0.6 + benefitValue * 0.8;
    const marginImpact = -discFrac + benefitValue * -0.01;
    const projRetention = Math.min(0.99, kpis.avgRisk > 0 ? (1 - kpis.avgRisk) + retentionLift : 0.85 + retentionLift);
    return {
      retentionLift: (retentionLift * 100).toFixed(1),
      marginImpact: (marginImpact * 100).toFixed(1),
      projRetention: (projRetention * 100).toFixed(1),
    };
  }, [renewalDiscount, benefitEnhancement, kpis.avgRisk]);

  // --- agent handler ---
  const runAgent = useCallback(() => {
    setAgentRunning(true);
    setAgentResult(null);
    setTimeout(() => {
      const targetName = selected?.policyholderName ?? 'Portfolio Average';
      setAgentResult({
        offer: selected
          ? `${(selected.suggestedDiscount * 100).toFixed(0)}% discount + wellness program upgrade`
          : '5% avg discount + 2 benefit add-ons',
        retentionProb: selected
          ? `${((1 - selected.lapseRisk + 0.15) * 100).toFixed(0)}%`
          : '78.4%',
        marginImpact: selected
          ? `-${(selected.suggestedDiscount * 100).toFixed(0)}% margin`
          : '-3.2% margin',
        netValueRetained: selected
          ? `$${((selected.currentPremium * 12 * (1 - selected.suggestedDiscount)) * 0.85).toFixed(0)}/yr`
          : '$1.84M annual',
        rationale: selected
          ? `For ${targetName} (age ${selected.age}, ${selected.plan} plan, tenure ${selected.tenure}yr), the behavioral signal "${selected.behavioralIndicator}" indicates ${riskLabel(selected.lapseRisk).toLowerCase()} lapse risk. A ${(selected.suggestedDiscount * 100).toFixed(0)}% renewal discount paired with a wellness program upgrade is projected to improve retention probability by 15pp while preserving ${(100 - selected.suggestedDiscount * 100).toFixed(0)}% of margin. The policyholder's claims history (${selected.claimsHistory} claims) and price sensitivity (${(selected.priceSensitivity * 100).toFixed(0)}%) support a balanced retention offer over aggressive discounting.`
          : 'Across the renewal portfolio of 25 policies, the engine recommends segmented offers: high-risk policies (>60% lapse probability) receive 6-10% discounts with benefit add-ons, medium-risk (30-60%) receive 2-4% discounts, and low-risk (<30%) receive no discount. This strategy retains an estimated $1.84M in annual premium with only a 3.2% average margin reduction.',
      });
      setAgentRunning(false);
    }, 2400);
  }, [selected]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Breadcrumb
            items={[
              { label: 'Home', to: '/' },
              { label: domain?.name ?? 'Underwriting & Pricing', to: `/domain/${domainId}` },
              { label: 'Market Pricing -- Lapse Prevention' },
            ]}
          />
        </motion.div>

        <Link to={`/domain/${domainId}`} className={styles.backLink}>
          <ArrowLeft size={16} /> Back to {domain?.name ?? 'Underwriting & Pricing'}
        </Link>

        {/* Header */}
        <motion.header className={styles.header} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className={styles.domainBadge}>Underwriting &amp; Pricing</div>
          <div className={styles.titleRow}>
            <Shield size={26} className={styles.titleIcon} />
            <h1 className={styles.title}>Market Pricing -- Lapse Prevention Workstation</h1>
          </div>
          <p className={styles.subtitle}>
            Generate personalized renewal offers for policies approaching renewal, balancing price sensitivity, retention probability, and margin preservation.
          </p>
        </motion.header>

        {/* KPI Strip */}
        <motion.div className={styles.kpiStrip} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Total Renewal Policies</span>
            <span className={styles.kpiValue}>{kpis.total}</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Avg Lapse Risk</span>
            <span className={styles.kpiValue}>{(kpis.avgRisk * 100).toFixed(1)}%</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Avg Price Increase</span>
            <span className={styles.kpiValue}>{(kpis.avgIncrease * 100).toFixed(1)}%</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>At-Risk Premium</span>
            <span className={styles.kpiValue}>${(kpis.atRisk / 1000).toFixed(1)}K</span>
            <span className={styles.kpiSub}>monthly, where lapse risk &gt; 50%</span>
          </div>
        </motion.div>

        {/* Main Layout */}
        <motion.div className={styles.mainLayout} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {/* Data Table */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <span className={styles.tableTitle}>Renewal Portfolio</span>
              <span className={styles.tableCount}>{lapseRiskPolicies.length} policies</span>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Policyholder</th>
                    <th>Age</th>
                    <th>Plan</th>
                    <th>Current ($)</th>
                    <th>Renewal ($)</th>
                    <th>Increase %</th>
                    <th>Sensitivity</th>
                    <th>Tenure</th>
                    <th>Lapse Risk</th>
                    <th>Discount %</th>
                    <th>Behavioral Indicator</th>
                  </tr>
                </thead>
                <tbody>
                  {lapseRiskPolicies.map((p) => (
                    <tr
                      key={p.id}
                      className={selectedId === p.id ? styles.rowSelected : undefined}
                      onClick={() => setSelectedId(p.id === selectedId ? null : p.id)}
                    >
                      <td className={styles.cellBold}>{p.policyholderName}</td>
                      <td>{p.age}</td>
                      <td>{p.plan}</td>
                      <td>${p.currentPremium}</td>
                      <td>${p.renewalPremium}</td>
                      <td className={styles.cellAmber}>{(p.priceIncrease * 100).toFixed(1)}%</td>
                      <td>{(p.priceSensitivity * 100).toFixed(0)}%</td>
                      <td>{p.tenure} yr</td>
                      <td>
                        <span className={`${styles.riskBadge} ${riskBadgeClass(p.lapseRisk)}`}>
                          {(p.lapseRisk * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td>{p.suggestedDiscount > 0 ? `${(p.suggestedDiscount * 100).toFixed(0)}%` : '-'}</td>
                      <td className={styles.behavioralText} title={p.behavioralIndicator}>
                        {p.behavioralIndicator}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Panel */}
          <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <div className={styles.detailTitle}>Price Sensitivity Analysis</div>
              <div className={styles.detailSubtitle}>
                {selected ? selected.policyholderName : 'Select a policy to view details'}
              </div>
            </div>
            {!selected ? (
              <div className={styles.detailEmpty}>
                <AlertTriangle size={32} />
                <span>Click a policyholder to inspect price sensitivity and renewal risk</span>
              </div>
            ) : (
              <div className={styles.detailBody}>
                {/* Sensitivity Meters */}
                <div className={styles.detailSection}>
                  <div className={styles.detailSectionTitle}>Sensitivity Indicators</div>
                  <div className={styles.sensitivityMeter}>
                    <div className={styles.meterRow}>
                      <span className={styles.meterLabel}>Lapse Risk</span>
                      <div className={styles.meterBarBg}>
                        <div
                          className={`${styles.meterBar} ${styles.meterBarRed}`}
                          style={{ width: `${selected.lapseRisk * 100}%` }}
                        />
                      </div>
                      <span className={styles.meterValue}>{(selected.lapseRisk * 100).toFixed(0)}%</span>
                    </div>
                    <div className={styles.meterRow}>
                      <span className={styles.meterLabel}>Price Sensitivity</span>
                      <div className={styles.meterBarBg}>
                        <div
                          className={`${styles.meterBar} ${styles.meterBarAmber}`}
                          style={{ width: `${selected.priceSensitivity * 100}%` }}
                        />
                      </div>
                      <span className={styles.meterValue}>{(selected.priceSensitivity * 100).toFixed(0)}%</span>
                    </div>
                    <div className={styles.meterRow}>
                      <span className={styles.meterLabel}>Retention Value</span>
                      <div className={styles.meterBarBg}>
                        <div
                          className={`${styles.meterBar} ${styles.meterBarGreen}`}
                          style={{ width: `${Math.min(100, (selected.currentPremium / 13) )}%` }}
                        />
                      </div>
                      <span className={styles.meterValue}>${selected.currentPremium}</span>
                    </div>
                    <div className={styles.meterRow}>
                      <span className={styles.meterLabel}>Tenure Score</span>
                      <div className={styles.meterBarBg}>
                        <div
                          className={`${styles.meterBar} ${styles.meterBarBlue}`}
                          style={{ width: `${Math.min(100, (selected.tenure / 15) * 100)}%` }}
                        />
                      </div>
                      <span className={styles.meterValue}>{selected.tenure} yr</span>
                    </div>
                  </div>
                </div>

                {/* Policy Details */}
                <div className={styles.detailSection}>
                  <div className={styles.detailSectionTitle}>Policy Details</div>
                  <div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Plan</span>
                      <span className={styles.infoValue}>{selected.plan}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Current Premium</span>
                      <span className={styles.infoValue}>${selected.currentPremium}/mo</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Renewal Premium</span>
                      <span className={styles.infoValue}>${selected.renewalPremium}/mo</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Price Increase</span>
                      <span className={styles.infoValue}>{(selected.priceIncrease * 100).toFixed(1)}%</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Claims History</span>
                      <span className={styles.infoValue}>{selected.claimsHistory} claims</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Suggested Discount</span>
                      <span className={styles.infoValue}>
                        {selected.suggestedDiscount > 0 ? `${(selected.suggestedDiscount * 100).toFixed(0)}%` : 'None'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Behavioral Signal */}
                <div className={styles.detailSection}>
                  <div className={styles.detailSectionTitle}>Behavioral Signal</div>
                  <div className={styles.behavioralDetail}>{selected.behavioralIndicator}</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Simulation */}
        <motion.div className={styles.simulationSection} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className={styles.simulationHeader}>
            <div className={styles.simulationTitle}>
              <Percent size={18} /> Retention vs. Margin Simulation
            </div>
            <span className={styles.simulationBadge}>What-If</span>
          </div>
          <div className={styles.simulationBody}>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderLabel}>
                <span>Renewal Discount</span>
                <span className={styles.sliderValue}>{renewalDiscount}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={20}
                step={1}
                value={renewalDiscount}
                onChange={(e) => setRenewalDiscount(Number(e.target.value))}
                className={styles.slider}
              />
              <div className={styles.sliderLabel}>
                <span>Benefit Enhancement (services)</span>
                <span className={styles.sliderValue}>{benefitEnhancement}</span>
              </div>
              <input
                type="range"
                min={0}
                max={5}
                step={1}
                value={benefitEnhancement}
                onChange={(e) => setBenefitEnhancement(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
            <div className={styles.impactGrid}>
              <div className={styles.impactCard}>
                <div className={styles.impactLabel}>Retention Lift</div>
                <div className={`${styles.impactValue} ${styles.impactPositive}`}>
                  +{simImpact.retentionLift}pp
                </div>
              </div>
              <div className={styles.impactCard}>
                <div className={styles.impactLabel}>Margin Impact</div>
                <div className={`${styles.impactValue} ${Number(simImpact.marginImpact) >= 0 ? styles.impactPositive : styles.impactNegative}`}>
                  {simImpact.marginImpact}%
                </div>
              </div>
              <div className={styles.impactCard}>
                <div className={styles.impactLabel}>Projected Retention</div>
                <div className={styles.impactValue}>
                  {simImpact.projRetention}%
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Agent */}
        <motion.div className={styles.agentSection} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className={styles.agentHeader}>
            <div className={styles.agentTitle}>
              <Bot size={18} className={styles.agentIcon} /> Lapse Prevention Engine
            </div>
            <button className={styles.agentRunBtn} onClick={runAgent} disabled={agentRunning}>
              {agentRunning ? <><Loader2 size={14} className="spin" /> Analyzing...</> : <><Shield size={14} /> Generate Offer</>}
            </button>
          </div>
          <div className={styles.agentBody}>
            {!agentResult && !agentRunning && (
              <div className={styles.agentEmpty}>
                {selected
                  ? `Click "Generate Offer" to create a personalized renewal offer for ${selected.policyholderName}.`
                  : 'Select a policyholder then click "Generate Offer", or run against the full portfolio.'}
              </div>
            )}
            {agentRunning && (
              <div className={styles.agentEmpty}>
                <Loader2 size={20} /> Modeling retention probability and margin tradeoffs...
              </div>
            )}
            <AnimatePresence>
              {agentResult && !agentRunning && (
                <motion.div className={styles.agentResults} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className={styles.agentResultGrid}>
                    <div className={styles.agentResultCard}>
                      <div className={styles.agentResultLabel}>Recommended Offer</div>
                      <div className={styles.agentResultValue}>{agentResult.offer}</div>
                    </div>
                    <div className={styles.agentResultCard}>
                      <div className={styles.agentResultLabel}>Retention Prob.</div>
                      <div className={styles.agentResultValue}>{agentResult.retentionProb}</div>
                    </div>
                    <div className={styles.agentResultCard}>
                      <div className={styles.agentResultLabel}>Margin Impact</div>
                      <div className={styles.agentResultValue}>{agentResult.marginImpact}</div>
                    </div>
                    <div className={styles.agentResultCard}>
                      <div className={styles.agentResultLabel}>Net Value Retained</div>
                      <div className={styles.agentResultValue}>{agentResult.netValueRetained}</div>
                    </div>
                  </div>
                  <div className={styles.agentRationale}>
                    <div className={styles.agentRationaleTitle}>Rationale</div>
                    <div className={styles.agentRationaleText}>{agentResult.rationale}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Chat */}
        <motion.div className={styles.chatSection} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className={styles.chatHeader}>
            <div className={styles.chatTitle}>
              <Bot size={18} /> Lapse Prevention Assistant
            </div>
            <span className={styles.chatBadge}>{chat.configured ? chat.providerName : 'AI Chat'}</span>
          </div>
          <div className={styles.chatMessages}>
            {chat.messages.length === 0 && (
              <div className={styles.chatEmpty}>Ask about renewal pricing, lapse prevention, or retention strategies.</div>
            )}
            {chat.messages.map((m) => (
              <div key={m.id} className={m.role === 'user' ? styles.msgUser : styles.msgAssistant}>
                {m.isTyping ? (
                  <div className={styles.typingDots}><span /><span /><span /></div>
                ) : (
                  <>
                    <div className={styles.msgContent}>{m.content}</div>
                    <div className={styles.msgTimestamp}>{m.timestamp}</div>
                  </>
                )}
              </div>
            ))}
          </div>
          <div className={styles.chatInputRow}>
            <input
              className={styles.chatInput}
              placeholder="Ask about lapse prevention..."
              value={chat.inputValue}
              onChange={(e) => chat.setInputValue(e.target.value)}
              onKeyDown={chat.handleKeyDown}
            />
            <button className={styles.chatSendBtn} onClick={() => chat.send()} disabled={chat.isLoading || !chat.inputValue.trim()}>
              {chat.isLoading ? <Loader2 size={16} /> : <Send size={16} />}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default MarketPricingLapsesWorkstation;
