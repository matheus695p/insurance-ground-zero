import { useState, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bot, TrendingUp, Users, Target, DollarSign, Activity, BarChart3, Send, Loader2 } from 'lucide-react';
import { getUseCase } from '../data/domains';
import Breadcrumb from '../components/Breadcrumb';
import { useAIChat } from '../hooks/useAIChat';
import styles from './ValueBasedProspectingWorkstation.module.css';
import { prospects } from '../data/distribution/prospecting-data';
import type { Prospect } from '../data/distribution/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number, decimals = 0): string =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtCurrency = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const fmtPct = (n: number): string => `${(n * 100).toFixed(1)}%`;

const riskTierColor = (tier: string): string => {
  switch (tier) {
    case 'Preferred': return '#22c55e';
    case 'Standard': return '#f59e0b';
    case 'Substandard': return '#ef4444';
    default: return '#64748b';
  }
};

const channelLabel = (channel: string): string => channel;

// ---------------------------------------------------------------------------
// Recommendation types
// ---------------------------------------------------------------------------

interface ProspectRecommendation {
  prospectName: string;
  rank: number;
  expectedValue: string;
  outreachStrategy: string;
  channel: string;
  rationale: string[];
  priority: 'High' | 'Medium' | 'Low';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ValueBasedProspectingWorkstation: React.FC = () => {
  const { domainId, useCaseId } = useParams<{ domainId: string; useCaseId: string }>();
  const result = getUseCase(domainId ?? '', useCaseId ?? '');
  const domain = result?.domain;
  const useCase = result?.useCase;

  // Selection state
  const [selectedProspectId, setSelectedProspectId] = useState<string | null>(null);

  // Simulation / targeting sliders
  const [minLTV, setMinLTV] = useState<number>(5000);
  const [minPropensity, setMinPropensity] = useState<number>(0.1);
  const [filterRiskTier, setFilterRiskTier] = useState<string>('All');

  // Agent recommendation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<ProspectRecommendation[] | null>(null);

  // AI Chat
  const {
    messages,
    inputValue,
    setInputValue,
    isLoading: chatLoading,
    error: chatError,
    configured: chatConfigured,
    providerName,
    send: sendChat,
    handleKeyDown,
  } = useAIChat({
    systemPrompt:
      'You are a Value-Based Prospecting AI agent for a health insurance company. You analyze prospect demographics, propensity scores, and lifetime value estimates to optimize targeting and outreach strategies. Answer questions about prospect prioritization, targeting criteria, and acquisition optimization.',
  });

  // ---------------------------------------------------------------------------
  // KPIs
  // ---------------------------------------------------------------------------

  const kpis = useMemo(() => {
    const prospectPool = prospects.length;
    const avgLTV = prospects.reduce((s, p) => s + p.estimatedLTV, 0) / prospectPool;
    const avgPropensity = prospects.reduce((s, p) => s + p.propensityScore, 0) / prospectPool;
    const totalExpectedPremium = prospects.reduce((s, p) => s + p.expectedPremium, 0);
    return { prospectPool, avgLTV, avgPropensity, totalExpectedPremium };
  }, []);

  // ---------------------------------------------------------------------------
  // Selected prospect
  // ---------------------------------------------------------------------------

  const selectedProspect = useMemo(
    () => prospects.find((p) => p.id === selectedProspectId) ?? null,
    [selectedProspectId],
  );

  const handleRowClick = useCallback((prospect: Prospect) => {
    setSelectedProspectId((prev) => (prev === prospect.id ? null : prospect.id));
    setRecommendations(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Simulation: filtered prospects
  // ---------------------------------------------------------------------------

  const filteredProspects = useMemo(() => {
    return prospects.filter((p) => {
      if (p.estimatedLTV < minLTV) return false;
      if (p.propensityScore < minPropensity) return false;
      if (filterRiskTier !== 'All' && p.riskTier !== filterRiskTier) return false;
      return true;
    });
  }, [minLTV, minPropensity, filterRiskTier]);

  const simulationMetrics = useMemo(() => {
    const count = filteredProspects.length;
    if (count === 0) return { count: 0, expectedYield: 0, avgAcquisitionCost: 0 };
    const expectedYield = filteredProspects.reduce((s, p) => s + p.expectedPremium * p.propensityScore, 0);
    const avgPropensity = filteredProspects.reduce((s, p) => s + p.propensityScore, 0) / count;
    // Estimated acquisition cost inversely related to propensity
    const avgAcquisitionCost = Math.round(450 / avgPropensity);
    return { count, expectedYield, avgAcquisitionCost };
  }, [filteredProspects]);

  // ---------------------------------------------------------------------------
  // Risk tier options
  // ---------------------------------------------------------------------------

  const riskTiers = useMemo(() => {
    const tiers = new Set(prospects.map((p) => p.riskTier));
    return ['All', ...Array.from(tiers).sort()];
  }, []);

  // ---------------------------------------------------------------------------
  // Agent: Prospecting Engine
  // ---------------------------------------------------------------------------

  const generateRecommendations = useCallback(() => {
    setIsGenerating(true);
    setRecommendations(null);

    setTimeout(() => {
      // Rank prospects by expected value = estimatedLTV * propensityScore
      const ranked = [...prospects]
        .map((p) => ({
          ...p,
          expectedValue: p.estimatedLTV * p.propensityScore,
        }))
        .sort((a, b) => b.expectedValue - a.expectedValue)
        .slice(0, 8);

      const recs: ProspectRecommendation[] = ranked.map((p, idx) => {
        let outreachStrategy: string;
        let channel: string;
        let priority: 'High' | 'Medium' | 'Low';

        if (p.propensityScore >= 0.8) {
          outreachStrategy = 'Immediate personalized outreach with custom quote. Schedule one-on-one consultation within 48 hours.';
          channel = p.channel === 'Digital' ? 'Digital — Email + Webinar Invite' : `${p.channel} — Priority Follow-up Call`;
          priority = 'High';
        } else if (p.propensityScore >= 0.6) {
          outreachStrategy = 'Nurture sequence with educational content about plan benefits, followed by soft quote offer within 2 weeks.';
          channel = p.channel === 'Digital' ? 'Digital — Drip Campaign' : `${p.channel} — Scheduled Touchpoint`;
          priority = 'Medium';
        } else {
          outreachStrategy = 'Low-touch awareness campaign. Add to long-term nurture pool with quarterly check-ins.';
          channel = 'Automated — Email Nurture Sequence';
          priority = 'Low';
        }

        const rationale: string[] = [
          `Estimated LTV: ${fmtCurrency(p.estimatedLTV)} with propensity score of ${fmtPct(p.propensityScore)}.`,
          `Expected value: ${fmtCurrency(p.expectedValue)} — ranked #${idx + 1} in prospect pool.`,
          `${p.occupation}, age ${p.age}, income range ${p.incomeRange} — fits ${p.riskTier.toLowerCase()} risk profile.`,
        ];

        if (p.riskTier === 'Preferred') {
          rationale.push('Preferred risk tier indicates lower expected claims and higher lifetime profitability.');
        }

        return {
          prospectName: p.name,
          rank: idx + 1,
          expectedValue: fmtCurrency(p.expectedValue),
          outreachStrategy,
          channel,
          rationale,
          priority,
        };
      });

      setRecommendations(recs);
      setIsGenerating(false);
    }, 2400);
  }, []);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (!domain || !useCase) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h2 style={{ color: 'var(--text-primary)' }}>Use case not found</h2>
          <Link to="/" className={styles.backLink}><ArrowLeft size={16} /> Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <Breadcrumb items={[
          { label: 'Home', to: '/' },
          { label: domain.name, to: `/domain/${domain.id}` },
          { label: useCase.title },
        ]} />

        <Link to={`/domain/${domain.id}`} className={styles.backLink}>
          <ArrowLeft size={16} /> Back to {domain.name}
        </Link>

        {/* Hero Banner */}
        <motion.div
          className={styles.heroBanner}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={styles.heroTitle}>{useCase.title}</h1>
          <p className={styles.heroSubtitle}>{useCase.description}</p>
        </motion.div>

        {/* KPI Row */}
        <motion.div
          className={styles.kpiRow}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className={styles.kpiCard}>
            <Users size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{fmt(kpis.prospectPool)}</span>
            <span className={styles.kpiLabel}>Prospect Pool</span>
          </div>
          <div className={styles.kpiCard}>
            <DollarSign size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{fmtCurrency(kpis.avgLTV)}</span>
            <span className={styles.kpiLabel}>Avg Estimated LTV</span>
          </div>
          <div className={styles.kpiCard}>
            <Target size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{fmtPct(kpis.avgPropensity)}</span>
            <span className={styles.kpiLabel}>Avg Propensity</span>
          </div>
          <div className={styles.kpiCard}>
            <TrendingUp size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{fmtCurrency(kpis.totalExpectedPremium * 12)}</span>
            <span className={styles.kpiLabel}>Expected Annual Premium</span>
          </div>
        </motion.div>

        {/* Data Table */}
        <motion.div
          className={styles.tableSection}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className={styles.sectionTitle}>
            <BarChart3 size={20} /> Prospect Pipeline
          </h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Occupation</th>
                  <th>Income Range</th>
                  <th>Risk Tier</th>
                  <th>Propensity Score</th>
                  <th>Estimated LTV</th>
                  <th>Expected Premium</th>
                  <th>Channel</th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((prospect) => (
                  <tr
                    key={prospect.id}
                    className={selectedProspectId === prospect.id ? styles.selectedRow : styles.tableRow}
                    onClick={() => handleRowClick(prospect)}
                  >
                    <td className={styles.nameCell}>{prospect.name}</td>
                    <td>{prospect.age}</td>
                    <td>{prospect.occupation}</td>
                    <td>{prospect.incomeRange}</td>
                    <td>
                      <span
                        className={styles.riskBadge}
                        style={{ color: riskTierColor(prospect.riskTier), borderColor: riskTierColor(prospect.riskTier) }}
                      >
                        {prospect.riskTier}
                      </span>
                    </td>
                    <td>{fmtPct(prospect.propensityScore)}</td>
                    <td>{fmtCurrency(prospect.estimatedLTV)}</td>
                    <td>${fmt(prospect.expectedPremium)}/mo</td>
                    <td>{channelLabel(prospect.channel)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Detail / Simulation Panel */}
        <AnimatePresence>
          {selectedProspect && (
            <motion.div
              className={styles.detailPanel}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className={styles.detailHeader}>
                <h3 className={styles.detailTitle}>{selectedProspect.name}</h3>
                <span
                  className={styles.detailBadge}
                  style={{ color: riskTierColor(selectedProspect.riskTier), borderColor: riskTierColor(selectedProspect.riskTier) }}
                >
                  {selectedProspect.riskTier} Risk
                </span>
                <span className={styles.detailBadgeSecondary}>{selectedProspect.status}</span>
              </div>

              <div className={styles.detailGrid}>
                {/* Demographics */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Demographics</h4>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Prospect ID</span>
                    <span className={styles.metricValue}>{selectedProspect.id}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Age</span>
                    <span className={styles.metricValue}>{selectedProspect.age}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Gender</span>
                    <span className={styles.metricValue}>{selectedProspect.gender}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Occupation</span>
                    <span className={styles.metricValue}>{selectedProspect.occupation}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Income Range</span>
                    <span className={styles.metricValue}>{selectedProspect.incomeRange}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Channel</span>
                    <span className={styles.metricValue}>{selectedProspect.channel}</span>
                  </div>
                </div>

                {/* Risk Profile */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Risk Profile & LTV</h4>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Risk Tier</span>
                    <span className={styles.metricValue} style={{ color: riskTierColor(selectedProspect.riskTier) }}>
                      {selectedProspect.riskTier}
                    </span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Propensity Score</span>
                    <span className={styles.metricValue}>{fmtPct(selectedProspect.propensityScore)}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Estimated LTV</span>
                    <span className={styles.metricValue}>{fmtCurrency(selectedProspect.estimatedLTV)}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Expected Monthly Premium</span>
                    <span className={styles.metricValue}>${fmt(selectedProspect.expectedPremium)}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Expected Annual Premium</span>
                    <span className={styles.metricValue}>{fmtCurrency(selectedProspect.expectedPremium * 12)}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Expected Value Score</span>
                    <span className={styles.metricValue}>
                      {fmtCurrency(selectedProspect.estimatedLTV * selectedProspect.propensityScore)}
                    </span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Status</span>
                    <span className={styles.metricValue}>{selectedProspect.status}</span>
                  </div>
                </div>

                {/* Targeting Simulation */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Targeting Simulation</h4>
                  <p className={styles.simulationDesc}>
                    Adjust targeting criteria to see how the prospect pool changes.
                  </p>

                  <div className={styles.sliderGroup}>
                    <label className={styles.sliderLabel}>
                      Min LTV Threshold: <strong>{fmtCurrency(minLTV)}</strong>
                    </label>
                    <input
                      type="range"
                      min="5000"
                      max="50000"
                      step="1000"
                      value={minLTV}
                      onChange={(e) => setMinLTV(parseInt(e.target.value))}
                      className={styles.simulationSlider}
                    />
                    <div className={styles.sliderRange}>
                      <span>$5K</span>
                      <span>$50K</span>
                    </div>
                  </div>

                  <div className={styles.sliderGroup}>
                    <label className={styles.sliderLabel}>
                      Min Propensity Score: <strong>{fmtPct(minPropensity)}</strong>
                    </label>
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      value={minPropensity}
                      onChange={(e) => setMinPropensity(parseFloat(e.target.value))}
                      className={styles.simulationSlider}
                    />
                    <div className={styles.sliderRange}>
                      <span>10%</span>
                      <span>90%</span>
                    </div>
                  </div>

                  <div className={styles.sliderGroup}>
                    <label className={styles.sliderLabel}>Risk Tier Filter:</label>
                    <select
                      value={filterRiskTier}
                      onChange={(e) => setFilterRiskTier(e.target.value)}
                      className={styles.selectInput}
                    >
                      {riskTiers.map((tier) => (
                        <option key={tier} value={tier}>{tier}</option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.projectionResults}>
                    <div className={styles.metricRow}>
                      <span className={styles.metricLabel}>Filtered Prospects</span>
                      <span className={styles.metricValue}>{fmt(simulationMetrics.count)} / {fmt(prospects.length)}</span>
                    </div>
                    <div className={styles.metricRow}>
                      <span className={styles.metricLabel}>Expected Yield</span>
                      <span className={styles.metricValue}>{fmtCurrency(simulationMetrics.expectedYield)}/mo</span>
                    </div>
                    <div className={styles.metricRow}>
                      <span className={styles.metricLabel}>Avg Acquisition Cost</span>
                      <span className={styles.metricValue}>${fmt(simulationMetrics.avgAcquisitionCost)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prospecting Engine Agent */}
              <div className={styles.agentSection}>
                <button
                  className={styles.agentButton}
                  onClick={generateRecommendations}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={18} className={styles.spinner} /> Ranking Prospects...
                    </>
                  ) : (
                    <>
                      <Bot size={18} /> Run Prospecting Engine
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {recommendations && (
                    <motion.div
                      className={styles.agentResult}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h4 className={styles.agentResultTitle}>
                        <Target size={16} /> Top {recommendations.length} Prospects by Expected Value
                      </h4>
                      {recommendations.map((rec) => (
                        <div key={rec.rank} className={styles.recommendationCard}>
                          <div className={styles.recHeader}>
                            <span className={styles.recRank}>#{rec.rank}</span>
                            <span className={styles.recName}>{rec.prospectName}</span>
                            <span
                              className={styles.recPriority}
                              data-priority={rec.priority}
                            >
                              {rec.priority}
                            </span>
                          </div>
                          <div className={styles.recMeta}>
                            <span>Expected Value: {rec.expectedValue}</span>
                            <span>Channel: {rec.channel}</span>
                          </div>
                          <p className={styles.recStrategy}>{rec.outreachStrategy}</p>
                          <ul className={styles.recRationale}>
                            {rec.rationale.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Chat Section */}
        <motion.div
          className={styles.chatSection}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className={styles.sectionTitle}>
            <Bot size={20} /> Prospecting AI Assistant
          </h2>
          {!chatConfigured && (
            <p className={styles.chatNotice}>
              AI chat requires configuration. Set up your AI provider to enable this feature.
            </p>
          )}
          <div className={styles.chatMessages}>
            {messages.length === 0 && (
              <div className={styles.chatPlaceholder}>
                <Bot size={32} />
                <p>Ask me about prospect prioritization, targeting criteria, or acquisition optimization.</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={
                  msg.role === 'user' ? styles.chatMessageUser : styles.chatMessageAssistant
                }
              >
                {msg.isTyping ? (
                  <div className={styles.typingIndicator}>
                    <span /><span /><span />
                  </div>
                ) : (
                  <>
                    <div className={styles.chatMessageContent}>{msg.content}</div>
                    <div className={styles.chatMessageTime}>{msg.timestamp}</div>
                  </>
                )}
              </div>
            ))}
          </div>
          {chatError && <p className={styles.chatError}>{chatError}</p>}
          <div className={styles.chatInputRow}>
            <input
              type="text"
              className={styles.chatInput}
              placeholder={chatConfigured ? 'Ask about prospect targeting or acquisition strategy...' : 'AI not configured'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!chatConfigured || chatLoading}
            />
            <button
              className={styles.chatSendButton}
              onClick={() => sendChat()}
              disabled={!chatConfigured || chatLoading || !inputValue.trim()}
            >
              {chatLoading ? <Loader2 size={18} className={styles.spinner} /> : <Send size={18} />}
            </button>
          </div>
          {chatConfigured && providerName && (
            <p className={styles.chatProvider}>Powered by {providerName}</p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ValueBasedProspectingWorkstation;
