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
import styles from './MarketPricingNewWorkstation.module.css';
import { competitorRates } from '../data/underwriting/market-pricing-new-data';
import type { CompetitorRate } from '../data/underwriting/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT =
  'You are a Market Pricing AI agent for a health insurance company. You benchmark against competitor rates and model price elasticity to find optimal price points that balance growth with profitability. Answer questions about competitive positioning, price elasticity, and market share optimization.';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const MarketPricingNewWorkstation: React.FC = () => {
  const { domainId } = useParams<{ domainId: string; useCaseId: string }>();
  const result = getUseCase(domainId ?? '', 'market-pricing-new');
  const domain = result?.domain;

  // --- selection ---
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(
    () => competitorRates.find((r) => r.id === selectedId) ?? null,
    [selectedId],
  );

  // --- simulation ---
  const [priceAdj, setPriceAdj] = useState(0);

  // --- agent ---
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentResult, setAgentResult] = useState<Record<string, string> | null>(null);

  // --- chat ---
  const chat = useAIChat({ systemPrompt: SYSTEM_PROMPT });

  // --- KPIs ---
  const kpis = useMemo(() => {
    const n = competitorRates.length;
    const avgDelta = competitorRates.reduce((s, r) => s + r.priceDelta, 0) / n;
    const avgShare = competitorRates.reduce((s, r) => s + r.marketShare, 0) / n;
    const avgElasticity = competitorRates.reduce((s, r) => s + r.elasticity, 0) / n;
    const uniqueCompetitors = new Set(competitorRates.map((r) => r.competitor)).size;
    return { avgDelta, avgShare, avgElasticity, uniqueCompetitors };
  }, []);

  // --- simulation impact ---
  const simImpact = useMemo(() => {
    const adjFrac = priceAdj / 100;
    // Average elasticity across portfolio
    const avgE = Math.abs(kpis.avgElasticity);
    const volumeChange = adjFrac * avgE * -1; // lower price -> higher volume
    const revenueChange = adjFrac + volumeChange; // price change + volume change
    const shareChange = kpis.avgShare * (1 + volumeChange) - kpis.avgShare;
    return {
      volumeChange: (volumeChange * 100).toFixed(1),
      revenueChange: (revenueChange * 100).toFixed(1),
      shareChange: (shareChange * 100).toFixed(1),
    };
  }, [priceAdj, kpis]);

  // --- agent handler ---
  const runAgent = useCallback(() => {
    setAgentRunning(true);
    setAgentResult(null);
    setTimeout(() => {
      setAgentResult({
        optimalPosition: '-3.2%',
        projectedShare: '24.8%',
        revenueImpact: '+$2.1M',
        winRateChange: '+6.4pp',
        rationale:
          'Optimal positioning is 3.2% below the market average. In the 18-30 Bronze/Silver segment, high elasticity (-1.4 to -1.8) means a modest price reduction captures outsized volume. For 56-65 Gold/Platinum, inelastic demand (-0.7 to -0.8) supports margin preservation. The blended strategy projects a 24.8% aggregate market share (up from 22.2%) with net revenue uplift of $2.1M annually. Win rates on competitive quotes improve by 6.4 percentage points.',
      });
      setAgentRunning(false);
    }, 2200);
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
              { label: 'Market Pricing -- New Business' },
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
            <BarChart3 size={26} className={styles.titleIcon} />
            <h1 className={styles.title}>Market Pricing -- New Business Workstation</h1>
          </div>
          <p className={styles.subtitle}>
            Benchmark against competitor rates and model price elasticity by segment to find optimal price points that balance market share growth with profitability targets.
          </p>
        </motion.header>

        {/* KPI Strip */}
        <motion.div className={styles.kpiStrip} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Avg Price Delta</span>
            <span className={styles.kpiValue}>{(kpis.avgDelta * 100).toFixed(1)}%</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Avg Market Share</span>
            <span className={styles.kpiValue}>{(kpis.avgShare * 100).toFixed(1)}%</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Avg Elasticity</span>
            <span className={styles.kpiValue}>{kpis.avgElasticity.toFixed(2)}</span>
          </div>
          <div className={styles.kpiCard}>
            <span className={styles.kpiLabel}>Competitors Tracked</span>
            <span className={styles.kpiValue}>{kpis.uniqueCompetitors}</span>
          </div>
        </motion.div>

        {/* Main Layout */}
        <motion.div className={styles.mainLayout} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {/* Data Table */}
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <span className={styles.tableTitle}>Competitor Rate Comparison</span>
              <span className={styles.tableCount}>{competitorRates.length} rates</span>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Competitor</th>
                    <th>Segment</th>
                    <th>Age Group</th>
                    <th>Plan Type</th>
                    <th>Their Rate ($)</th>
                    <th>Our Rate ($)</th>
                    <th>Price Delta (%)</th>
                    <th>Market Share (%)</th>
                    <th>Elasticity</th>
                  </tr>
                </thead>
                <tbody>
                  {competitorRates.map((r) => (
                    <tr
                      key={r.id}
                      className={selectedId === r.id ? styles.rowSelected : undefined}
                      onClick={() => setSelectedId(r.id === selectedId ? null : r.id)}
                    >
                      <td className={styles.cellBold}>{r.competitor}</td>
                      <td>{r.segment}</td>
                      <td>{r.ageGroup}</td>
                      <td>{r.planType}</td>
                      <td>${r.monthlyRate}</td>
                      <td>${r.ourRate}</td>
                      <td className={r.priceDelta > 0 ? styles.deltaPositive : styles.deltaNegative}>
                        {r.priceDelta > 0 ? '+' : ''}{(r.priceDelta * 100).toFixed(1)}%
                      </td>
                      <td className={styles.cellBlue}>{(r.marketShare * 100).toFixed(0)}%</td>
                      <td className={styles.cellAmber}>{r.elasticity.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detail Panel */}
          <div className={styles.detailPanel}>
            <div className={styles.detailHeader}>
              <div className={styles.detailTitle}>Competitive Position Analysis</div>
              <div className={styles.detailSubtitle}>
                {selected ? `${selected.competitor} -- ${selected.ageGroup} ${selected.planType}` : 'Select a rate to view details'}
              </div>
            </div>
            {!selected ? (
              <div className={styles.detailEmpty}>
                <Target size={32} />
                <span>Click a competitor row to see competitive position analysis</span>
              </div>
            ) : (
              <div className={styles.detailBody}>
                {/* Rate Comparison Visual */}
                <div className={styles.detailSection}>
                  <div className={styles.detailSectionTitle}>Rate Comparison</div>
                  <div className={styles.positionBar}>
                    <div className={styles.positionRow}>
                      <span className={styles.positionLabel}>Competitor</span>
                      <div className={styles.positionBarBg}>
                        <div
                          className={`${styles.positionBarFill} ${styles.positionBarTheirs}`}
                          style={{ width: `${(selected.monthlyRate / Math.max(selected.monthlyRate, selected.ourRate)) * 100}%` }}
                        />
                      </div>
                      <span className={styles.positionValue}>${selected.monthlyRate}/mo</span>
                    </div>
                    <div className={styles.positionRow}>
                      <span className={styles.positionLabel}>Our Rate</span>
                      <div className={styles.positionBarBg}>
                        <div
                          className={`${styles.positionBarFill} ${styles.positionBarOurs}`}
                          style={{ width: `${(selected.ourRate / Math.max(selected.monthlyRate, selected.ourRate)) * 100}%` }}
                        />
                      </div>
                      <span className={styles.positionValue}>${selected.ourRate}/mo</span>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className={styles.detailSection}>
                  <div className={styles.detailSectionTitle}>Key Metrics</div>
                  <div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Competitor</span>
                      <span className={styles.infoValue}>{selected.competitor}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Segment</span>
                      <span className={styles.infoValue}>{selected.segment} / {selected.ageGroup}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Plan Type</span>
                      <span className={styles.infoValue}>{selected.planType}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Price Delta</span>
                      <span className={styles.infoValue}>
                        {selected.priceDelta > 0 ? '+' : ''}{(selected.priceDelta * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Market Share</span>
                      <span className={styles.infoValue}>{(selected.marketShare * 100).toFixed(0)}%</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Price Elasticity</span>
                      <span className={styles.infoValue}>{selected.elasticity.toFixed(2)}</span>
                    </div>
                    <div className={styles.infoRow}>
                      <span className={styles.infoLabel}>Annual Revenue/Member</span>
                      <span className={styles.infoValue}>${(selected.ourRate * 12).toLocaleString()}</span>
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
              <TrendingUp size={18} /> Price Position Simulation
            </div>
            <span className={styles.simulationBadge}>What-If</span>
          </div>
          <div className={styles.simulationBody}>
            <div className={styles.sliderGroup}>
              <div className={styles.sliderLabel}>
                <span>Price Position vs. Market</span>
                <span className={styles.sliderValue}>
                  {priceAdj > 0 ? '+' : ''}{priceAdj}%
                </span>
              </div>
              <input
                type="range"
                min={-15}
                max={15}
                step={1}
                value={priceAdj}
                onChange={(e) => setPriceAdj(Number(e.target.value))}
                className={styles.slider}
              />
            </div>
            <div className={styles.impactGrid}>
              <div className={styles.impactCard}>
                <div className={styles.impactLabel}>Volume Change</div>
                <div className={`${styles.impactValue} ${Number(simImpact.volumeChange) >= 0 ? styles.impactPositive : styles.impactNegative}`}>
                  {Number(simImpact.volumeChange) >= 0 ? '+' : ''}{simImpact.volumeChange}%
                </div>
              </div>
              <div className={styles.impactCard}>
                <div className={styles.impactLabel}>Market Share Change</div>
                <div className={`${styles.impactValue} ${Number(simImpact.shareChange) >= 0 ? styles.impactPositive : styles.impactNegative}`}>
                  {Number(simImpact.shareChange) >= 0 ? '+' : ''}{simImpact.shareChange}pp
                </div>
              </div>
              <div className={styles.impactCard}>
                <div className={styles.impactLabel}>Revenue Impact</div>
                <div className={`${styles.impactValue} ${Number(simImpact.revenueChange) >= 0 ? styles.impactPositive : styles.impactNegative}`}>
                  {Number(simImpact.revenueChange) >= 0 ? '+' : ''}{simImpact.revenueChange}%
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Agent */}
        <motion.div className={styles.agentSection} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className={styles.agentHeader}>
            <div className={styles.agentTitle}>
              <Bot size={18} className={styles.agentIcon} /> Market Pricing Optimizer
            </div>
            <button className={styles.agentRunBtn} onClick={runAgent} disabled={agentRunning}>
              {agentRunning ? <><Loader2 size={14} className="spin" /> Optimizing...</> : <><Target size={14} /> Run Optimizer</>}
            </button>
          </div>
          <div className={styles.agentBody}>
            {!agentResult && !agentRunning && (
              <div className={styles.agentEmpty}>
                Click &quot;Run Optimizer&quot; to find competitive price points per segment.
              </div>
            )}
            {agentRunning && (
              <div className={styles.agentEmpty}>
                <Loader2 size={20} /> Analyzing competitor rates and price elasticity across segments...
              </div>
            )}
            <AnimatePresence>
              {agentResult && !agentRunning && (
                <motion.div className={styles.agentResults} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className={styles.agentResultGrid}>
                    <div className={styles.agentResultCard}>
                      <div className={styles.agentResultLabel}>Optimal Position</div>
                      <div className={styles.agentResultValue}>{agentResult.optimalPosition}</div>
                    </div>
                    <div className={styles.agentResultCard}>
                      <div className={styles.agentResultLabel}>Projected Share</div>
                      <div className={styles.agentResultValue}>{agentResult.projectedShare}</div>
                    </div>
                    <div className={styles.agentResultCard}>
                      <div className={styles.agentResultLabel}>Revenue Impact</div>
                      <div className={styles.agentResultValue}>{agentResult.revenueImpact}</div>
                    </div>
                    <div className={styles.agentResultCard}>
                      <div className={styles.agentResultLabel}>Win Rate Change</div>
                      <div className={styles.agentResultValue}>{agentResult.winRateChange}</div>
                    </div>
                    <div className={styles.agentResultCard}>
                      <div className={styles.agentResultLabel}>Segments</div>
                      <div className={styles.agentResultValue}>{kpis.uniqueCompetitors}</div>
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
              <Bot size={18} /> Market Pricing Assistant
            </div>
            <span className={styles.chatBadge}>{chat.configured ? chat.providerName : 'AI Chat'}</span>
          </div>
          <div className={styles.chatMessages}>
            {chat.messages.length === 0 && (
              <div className={styles.chatEmpty}>Ask about competitive positioning, price elasticity, or market share optimization.</div>
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
              placeholder="Ask about market pricing..."
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

export default MarketPricingNewWorkstation;
