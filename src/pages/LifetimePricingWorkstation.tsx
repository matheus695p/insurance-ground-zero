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
import styles from './LifetimePricingWorkstation.module.css';
import { policyCohorts } from '../data/underwriting/lifetime-pricing-data';
import type { PolicyCohort } from '../data/underwriting/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT =
  'You are a Lifetime Pricing AI agent for a health insurance company. You optimize first-year acquisition pricing by modeling multi-year persistency curves, claims trajectories, and lifetime P&L. Answer questions about lifetime value, persistency modeling, and acquisition pricing strategy.';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const LifetimePricingWorkstation: React.FC = () => {
  const { domainId } = useParams<{ domainId: string; useCaseId: string }>();
  const result = getUseCase(domainId ?? '', 'lifetime-pricing');
  const domain = result?.domain;

  // --- selection state ---
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => policyCohorts.find((c) => c.id === selectedId) ?? null,
    [selectedId],
  );

  // --- simulation state ---
  const [discount, setDiscount] = useState(10);

  // --- agent state ---
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentResult, setAgentResult] = useState<Record<string, string> | null>(null);

  // --- chat ---
  const chat = useAIChat({ systemPrompt: SYSTEM_PROMPT });

  // --- KPIs ---
  const kpis = useMemo(() => {
    const n = policyCohorts.length;
    const avgLtv = policyCohorts.reduce((s, c) => s + c.lifetimeValue, 0) / n;
    const avgP1 = policyCohorts.reduce((s, c) => s + c.persistencyYear1, 0) / n;
    const avgBE = policyCohorts.reduce((s, c) => s + c.breakEvenYear, 0) / n;
    const totalMembers = policyCohorts.reduce((s, c) => s + c.currentMembers, 0);
    return { avgLtv, avgP1, avgBE, totalMembers };
  }, []);

  // --- simulation impact ---
  const simImpact = useMemo(() => {
    const discountFrac = discount / 100;
    const ltvChange = -discountFrac * 0.6 + discountFrac * 0.4 * 1.2;
    const breakEvenShift = discountFrac * 2.5;
    const projLtv = kpis.avgLtv * (1 + ltvChange);
    return {
      ltvChange: (ltvChange * 100).toFixed(1),
      breakEvenShift: breakEvenShift.toFixed(1),
      projLtv: (projLtv / 1000).toFixed(1),
    };
  }, [discount, kpis.avgLtv]);

  // --- agent handler ---
  const runAgent = useCallback(() => {
    setAgentRunning(true);
    setAgentResult(null);
    setTimeout(() => {
      setAgentResult({
        optimalDiscount: '12%',
        ltvChange: '+8.4%',
        breakEvenShift: '+0.3 years',
        persistencyImprovement: '+4.2pp Year-1',
        rationale:
          'A 12% first-year discount maximises portfolio lifetime value by improving Year-1 persistency from 88.4% to 92.6%. The additional retained members generate enough incremental premium in Years 2-5 to more than offset the initial discount, with break-even shifting only modestly from 3.0 to 3.3 years. Cohorts with younger demographics benefit most from acquisition discounts due to longer expected tenure.',
      });
      setAgentRunning(false);
    }, 2400);
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <Breadcrumb
            items={[
              { label: 'Home', to: '/' },
              { label: domain?.name ?? 'Underwriting & Pricing', to: `/domain/${domainId}` },
              { label: 'Lifetime-Based Pricing' },
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
            <DollarSign size={26} className={styles.titleIcon} />
            <h1 className={styles.title}>Lifetime-Based Pricing Workstation</h1>
          </div>
          <p className={styles.subtitle}>
            Optimize first-year acquisition pricing by modeling multi-year persistency curves, claims trajectories, and lifetime P&amp;L to maximize long-term portfolio value.
          </p>
        </motion.header>

        {/* KPI Strip */}
        <motion.div className={styles.kpiStrip} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Avg Lifetime Value</span>
            <span className={styles.kpiValue}>${(kpis.avgLtv / 1000).toFixed(1)}K</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Avg Persistency Yr 1</span>
            <span className={styles.kpiValue}>{(kpis.avgP1 * 100).toFixed(1)}%</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Avg Break-Even Year</span>
            <span className={styles.kpiValue}>{kpis.avgBE.toFixed(1)}</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Total Current Members</span>
            <span className={styles.kpiValue}>{kpis.totalMembers.toLocaleString()}</span>
          </div>
        </motion.div>

        {/* Main Layout: Table + Detail */}
        <motion.div className={styles.mainLayout} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {/* Data Table */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <span className={styles.tableTitle}>Policy Cohorts</span>
              <span className={styles.tableCount}>{policyCohorts.length} cohorts</span>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Cohort Name</th>
                    <th>Entry Year</th>
                    <th>Initial</th>
                    <th>Current</th>
                    <th>P Yr1</th>
                    <th>Yr2</th>
                    <th>Yr3</th>
                    <th>Yr5</th>
                    <th>Avg Prem Yr1</th>
                    <th>Lifetime Value</th>
                    <th>Break-Even Yr</th>
                  </tr>
                </thead>
                <tbody>
                  {policyCohorts.map((c) => (
                    <tr
                      key={c.id}
                      className={selectedId === c.id ? styles.rowSelected : undefined}
                      onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
                    >
                      <td className={styles.cellBold}>{c.cohortName}</td>
                      <td>{c.entryYear}</td>
                      <td>{c.initialMembers.toLocaleString()}</td>
                      <td>{c.currentMembers.toLocaleString()}</td>
                      <td className={styles.cellBlue}>{(c.persistencyYear1 * 100).toFixed(0)}%</td>
                      <td>{c.persistencyYear2 > 0 ? `${(c.persistencyYear2 * 100).toFixed(0)}%` : '-'}</td>
                      <td>{c.persistencyYear3 > 0 ? `${(c.persistencyYear3 * 100).toFixed(0)}%` : '-'}</td>
                      <td>{c.persistencyYear5 > 0 ? `${(c.persistencyYear5 * 100).toFixed(0)}%` : '-'}</td>
                      <td>${c.avgPremiumYear1.toLocaleString()}</td>
                      <td className={styles.cellGreen}>${(c.lifetimeValue / 1000).toFixed(1)}K</td>
                      <td>{c.breakEvenYear}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Panel */}
          <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <div className={styles.detailTitle}>Cohort Detail</div>
              <div className={styles.detailSubtitle}>
                {selected ? selected.cohortName : 'Select a cohort to view details'}
              </div>
            </div>
            {!selected ? (
              <div className={styles.detailEmpty}>
                <Target size={32} />
                <span>Click a row to inspect persistency curve and P&amp;L trajectory</span>
              </div>
            ) : (
              <div className={styles.detailBody}>
                {/* Persistency Curve */}
                <div className={styles.detailSection}>
                  <div className={styles.detailSectionTitle}>Persistency Curve</div>
                  <div className={styles.persistencyCurve}>
                    {([
                      { label: 'Year 1', value: selected.persistencyYear1 },
                      { label: 'Year 2', value: selected.persistencyYear2 },
                      { label: 'Year 3', value: selected.persistencyYear3 },
                      { label: 'Year 5', value: selected.persistencyYear5 },
                    ] as const).map((r) => (
                      <div key={r.label} className={styles.persistencyRow}>
                        <span className={styles.persistencyLabel}>{r.label}</span>
                        <div className={styles.persistencyBarBg}>
                          <div className={styles.persistencyBar} style={{ width: `${r.value * 100}%` }} />
                        </div>
                        <span className={styles.persistencyValue}>
                          {r.value > 0 ? `${(r.value * 100).toFixed(0)}%` : 'N/A'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* P&L Trajectory */}
                <div className={styles.detailSection}>
                  <div className={styles.detailSectionTitle}>P&amp;L Trajectory</div>
                  <div>
                    <div className={styles.pnlRow}>
                      <span className={styles.pnlLabel}>Avg Premium Yr 1</span>
                      <span className={styles.pnlValue}>${selected.avgPremiumYear1.toLocaleString()}</span>
                    </div>
                    <div className={styles.pnlRow}>
                      <span className={styles.pnlLabel}>Avg Claims Yr 1</span>
                      <span className={styles.pnlValue}>${selected.avgClaimsYear1.toLocaleString()}</span>
                    </div>
                    <div className={styles.pnlRow}>
                      <span className={styles.pnlLabel}>Yr 1 Margin</span>
                      <span className={styles.pnlValue}>
                        ${(selected.avgPremiumYear1 - selected.avgClaimsYear1).toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.pnlRow}>
                      <span className={styles.pnlLabel}>Lifetime Value</span>
                      <span className={styles.pnlValue}>${selected.lifetimeValue.toLocaleString()}</span>
                    </div>
                    <div className={styles.pnlRow}>
                      <span className={styles.pnlLabel}>Break-Even Year</span>
                      <span className={styles.pnlValue}>{selected.breakEvenYear}</span>
                    </div>
                    <div className={styles.pnlRow}>
                      <span className={styles.pnlLabel}>Member Retention</span>
                      <span className={styles.pnlValue}>
                        {((selected.currentMembers / selected.initialMembers) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Simulation */}
        <motion.div className={styles.simulationSection} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className={styles.simulationHeader}>
            <div className={styles.simulationTitle}>
              <Activity size={18} /> Acquisition Discount Simulation
            </div>
            <span className={styles.simulationBadge}>What-If</span>
          </div>
          <div className={styles.simulationBody}>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderLabel}>
                <span>First-Year Acquisition Discount</span>
                <span className={styles.sliderValue}>{discount}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                step={1}
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
            <div className={styles.impactGrid}>
              <div className={styles.impactCard}>
                <div className={styles.impactLabel}>LTV Impact</div>
                <div className={`${styles.impactValue} ${Number(simImpact.ltvChange) >= 0 ? styles.impactPositive : styles.impactNegative}`}>
                  {Number(simImpact.ltvChange) >= 0 ? '+' : ''}{simImpact.ltvChange}%
                </div>
              </div>
              <div className={styles.impactCard}>
                <div className={styles.impactLabel}>Break-Even Shift</div>
                <div className={`${styles.impactValue} ${styles.impactNeutral}`}>
                  +{simImpact.breakEvenShift} yrs
                </div>
              </div>
              <div className={styles.impactCard}>
                <div className={styles.impactLabel}>Projected Avg LTV</div>
                <div className={styles.impactValue}>${simImpact.projLtv}K</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Agent */}
        <motion.div className={styles.agentSection} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className={styles.agentHeader}>
            <div className={styles.agentTitle}>
              <Bot size={18} className={styles.agentIcon} /> Lifetime Pricing Engine
            </div>
            <button className={styles.agentRunBtn} onClick={runAgent} disabled={agentRunning}>
              {agentRunning ? <><Loader2 size={14} className="spin" /> Running...</> : <><Activity size={14} /> Run Analysis</>}
            </button>
          </div>
          <div className={styles.agentBody}>
            {!agentResult && !agentRunning && (
              <div className={styles.agentEmpty}>
                Click &quot;Run Analysis&quot; to optimize entry pricing for long-term profitability.
              </div>
            )}
            {agentRunning && (
              <div className={styles.agentEmpty}>
                <Loader2 size={20} /> Analyzing persistency curves and lifetime P&amp;L trajectories...
              </div>
            )}
            <AnimatePresence>
              {agentResult && !agentRunning && (
                <motion.div className={styles.agentResults} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className={styles.agentResultGrid}>
                    <div className={styles.agentResultCard}>
                      <div className={styles.agentResultLabel}>Optimal Discount</div>
                      <div className={styles.agentResultValue}>{agentResult.optimalDiscount}</div>
                    </div>
                    <div className={styles.agentResultCard}>
                      <div className={styles.agentResultLabel}>Projected LTV Change</div>
                      <div className={styles.agentResultValue}>{agentResult.ltvChange}</div>
                    </div>
                    <div className={styles.agentResultCard}>
                      <div className={styles.agentResultLabel}>Break-Even Shift</div>
                      <div className={styles.agentResultValue}>{agentResult.breakEvenShift}</div>
                    </div>
                    <div className={styles.agentResultCard}>
                      <div className={styles.agentResultLabel}>Persistency Gain</div>
                      <div className={styles.agentResultValue}>{agentResult.persistencyImprovement}</div>
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
              <Bot size={18} /> Lifetime Pricing Assistant
            </div>
            <span className={styles.chatBadge}>{chat.configured ? chat.providerName : 'AI Chat'}</span>
          </div>
          <div className={styles.chatMessages}>
            {chat.messages.length === 0 && (
              <div className={styles.chatEmpty}>Ask about lifetime value, persistency modeling, or acquisition pricing strategy.</div>
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
              placeholder="Ask about lifetime pricing..."
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

export default LifetimePricingWorkstation;
