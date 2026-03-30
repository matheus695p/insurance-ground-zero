import { useState, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bot, TrendingUp, Users, Target, DollarSign, Activity, BarChart3, Send, Loader2 } from 'lucide-react';
import { getUseCase } from '../data/domains';
import Breadcrumb from '../components/Breadcrumb';
import { useAIChat } from '../hooks/useAIChat';
import styles from './DistributionProductivityWorkstation.module.css';
import { agents } from '../data/distribution/distribution-productivity-data';
import type { Agent } from '../data/distribution/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number, decimals = 0): string =>
  n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtCurrency = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

const fmtPct = (n: number): string => `${(n * 100).toFixed(1)}%`;

const ratingStars = (rating: number): string => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  return '\u2605'.repeat(full) + (half ? '\u00BD' : '') + ` (${rating.toFixed(1)})`;
};

// ---------------------------------------------------------------------------
// Recommendation type
// ---------------------------------------------------------------------------

interface Recommendation {
  title: string;
  rationale: string[];
  impact: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DistributionProductivityWorkstation: React.FC = () => {
  const { domainId, useCaseId } = useParams<{ domainId: string; useCaseId: string }>();
  const result = getUseCase(domainId ?? '', useCaseId ?? '');
  const domain = result?.domain;
  const useCase = result?.useCase;

  // Selection & simulation state
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [leadMultiplier, setLeadMultiplier] = useState<number>(1.0);

  // Agent recommendation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);

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
      'You are a Distribution Optimizer AI agent for a health insurance company. You analyze agent/broker performance data and recommend territory rebalancing, workload distribution, and productivity improvements. Answer questions about agent performance, territory optimization, and distribution strategy.',
  });

  // ---------------------------------------------------------------------------
  // KPIs
  // ---------------------------------------------------------------------------

  const kpis = useMemo(() => {
    const totalAgents = agents.length;
    const avgPolicies = agents.reduce((s, a) => s + a.policiesSold, 0) / totalAgents;
    const avgConversion = agents.reduce((s, a) => s + a.conversionRate, 0) / totalAgents;
    const totalRevenue = agents.reduce((s, a) => s + a.revenue, 0);
    return { totalAgents, avgPolicies, avgConversion, totalRevenue };
  }, []);

  // ---------------------------------------------------------------------------
  // Selection helpers
  // ---------------------------------------------------------------------------

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId) ?? null,
    [selectedAgentId],
  );

  const handleRowClick = useCallback(
    (agent: Agent) => {
      setSelectedAgentId((prev) => (prev === agent.id ? null : agent.id));
      setLeadMultiplier(1.0);
      setRecommendations(null);
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Simulation projections
  // ---------------------------------------------------------------------------

  const projections = useMemo(() => {
    if (!selectedAgent) return null;
    const projectedLeads = Math.round(selectedAgent.leadsAssigned * leadMultiplier);
    const projectedQuotes = Math.round(selectedAgent.quotesGenerated * leadMultiplier);
    const projectedPolicies = Math.round(selectedAgent.policiesSold * leadMultiplier);
    const projectedRevenue = Math.round(selectedAgent.revenue * leadMultiplier);
    return { projectedLeads, projectedQuotes, projectedPolicies, projectedRevenue };
  }, [selectedAgent, leadMultiplier]);

  // ---------------------------------------------------------------------------
  // Agent recommendation generator
  // ---------------------------------------------------------------------------

  const generateRecommendations = useCallback(() => {
    setIsGenerating(true);
    setRecommendations(null);

    setTimeout(() => {
      if (!selectedAgent) {
        setIsGenerating(false);
        return;
      }

      const recs: Recommendation[] = [];

      // Territory rebalancing advice based on agent metrics
      if (selectedAgent.conversionRate < 0.15) {
        recs.push({
          title: 'Reduce Lead Volume & Improve Quality',
          rationale: [
            `${selectedAgent.name} has a conversion rate of ${fmtPct(selectedAgent.conversionRate)}, well below the team average of ${fmtPct(kpis.avgConversion)}.`,
            `Current lead volume (${selectedAgent.leadsAssigned}) may be overwhelming — reducing by 20% while increasing lead quality could yield better outcomes.`,
            `Recommend pairing with a senior mentor from the ${selectedAgent.region} region for coaching on consultative selling techniques.`,
          ],
          impact: `Projected +${Math.round(selectedAgent.policiesSold * 0.25)} additional policies/quarter with improved conversion.`,
        });
      }

      if (selectedAgent.conversionRate >= 0.25) {
        recs.push({
          title: 'Increase Territory Allocation',
          rationale: [
            `${selectedAgent.name} converts at ${fmtPct(selectedAgent.conversionRate)} — significantly above the ${fmtPct(kpis.avgConversion)} team average.`,
            `This agent can handle 15-25% more leads without quality degradation based on capacity analysis.`,
            `Recommend expanding into adjacent ZIP codes within ${selectedAgent.territory} to capture untapped demand.`,
          ],
          impact: `Projected +${fmtCurrency(selectedAgent.revenue * 0.2)} incremental revenue per quarter.`,
        });
      }

      if (selectedAgent.rating < 4.0) {
        recs.push({
          title: 'Performance Improvement Plan',
          rationale: [
            `Agent rating of ${selectedAgent.rating.toFixed(1)} is below the 4.0 threshold for the ${selectedAgent.region} region.`,
            `Review customer feedback for common themes — likely issues with response time or product knowledge.`,
            `Schedule bi-weekly check-ins and assign product certification modules for health plan portfolio.`,
          ],
          impact: 'Target 0.3-point rating improvement within 90 days.',
        });
      }

      // Always include a territory rebalancing suggestion
      recs.push({
        title: 'Territory Rebalancing Opportunity',
        rationale: [
          `${selectedAgent.territory} currently has ${selectedAgent.leadsAssigned} leads assigned vs. team average of ${Math.round(agents.reduce((s, a) => s + a.leadsAssigned, 0) / agents.length)}.`,
          `Revenue per lead in this territory: ${fmtCurrency(selectedAgent.revenue / selectedAgent.leadsAssigned)}.`,
          `Cross-reference with demographic growth data in ${selectedAgent.territory} to identify expansion or consolidation opportunities.`,
        ],
        impact: `Optimal lead allocation for this territory: ${Math.round(selectedAgent.leadsAssigned * (selectedAgent.conversionRate / kpis.avgConversion))} leads.`,
      });

      setRecommendations(recs);
      setIsGenerating(false);
    }, 2200);
  }, [selectedAgent, kpis]);

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
            <span className={styles.kpiValue}>{fmt(kpis.totalAgents)}</span>
            <span className={styles.kpiLabel}>Total Agents</span>
          </div>
          <div className={styles.kpiCard}>
            <Target size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{kpis.avgPolicies.toFixed(1)}</span>
            <span className={styles.kpiLabel}>Avg Policies/Agent</span>
          </div>
          <div className={styles.kpiCard}>
            <TrendingUp size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{fmtPct(kpis.avgConversion)}</span>
            <span className={styles.kpiLabel}>Avg Conversion Rate</span>
          </div>
          <div className={styles.kpiCard}>
            <DollarSign size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{fmtCurrency(kpis.totalRevenue)}</span>
            <span className={styles.kpiLabel}>Total Revenue</span>
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
            <BarChart3 size={20} /> Agent Performance Overview
          </h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Agent Name</th>
                  <th>Territory</th>
                  <th>Leads Assigned</th>
                  <th>Quotes Generated</th>
                  <th>Policies Sold</th>
                  <th>Conversion Rate</th>
                  <th>Revenue</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr
                    key={agent.id}
                    className={selectedAgentId === agent.id ? styles.selectedRow : styles.tableRow}
                    onClick={() => handleRowClick(agent)}
                  >
                    <td className={styles.nameCell}>{agent.name}</td>
                    <td>{agent.territory}</td>
                    <td>{fmt(agent.leadsAssigned)}</td>
                    <td>{fmt(agent.quotesGenerated)}</td>
                    <td>{fmt(agent.policiesSold)}</td>
                    <td>{fmtPct(agent.conversionRate)}</td>
                    <td>{fmtCurrency(agent.revenue)}</td>
                    <td>{agent.rating.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Detail / Simulation Panel */}
        <AnimatePresence>
          {selectedAgent && (
            <motion.div
              className={styles.detailPanel}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className={styles.detailHeader}>
                <h3 className={styles.detailTitle}>{selectedAgent.name}</h3>
                <span className={styles.detailBadge}>{selectedAgent.territory}</span>
              </div>

              <div className={styles.detailGrid}>
                {/* Performance Metrics */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Performance Metrics</h4>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Agent ID</span>
                    <span className={styles.metricValue}>{selectedAgent.id}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Leads Assigned</span>
                    <span className={styles.metricValue}>{fmt(selectedAgent.leadsAssigned)}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Leads Contacted</span>
                    <span className={styles.metricValue}>{fmt(selectedAgent.leadsContacted)}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Quotes Generated</span>
                    <span className={styles.metricValue}>{fmt(selectedAgent.quotesGenerated)}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Policies Sold</span>
                    <span className={styles.metricValue}>{fmt(selectedAgent.policiesSold)}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Conversion Rate</span>
                    <span className={styles.metricValue}>{fmtPct(selectedAgent.conversionRate)}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Avg Premium</span>
                    <span className={styles.metricValue}>{fmtCurrency(selectedAgent.avgPremium)}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Rating</span>
                    <span className={styles.metricValue}>{ratingStars(selectedAgent.rating)}</span>
                  </div>
                </div>

                {/* Territory Breakdown */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Territory Breakdown</h4>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Territory</span>
                    <span className={styles.metricValue}>{selectedAgent.territory}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Region</span>
                    <span className={styles.metricValue}>{selectedAgent.region}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Tenure</span>
                    <span className={styles.metricValue}>{selectedAgent.tenure} years</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Total Revenue</span>
                    <span className={styles.metricValue}>{fmtCurrency(selectedAgent.revenue)}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Revenue per Lead</span>
                    <span className={styles.metricValue}>{fmtCurrency(selectedAgent.revenue / selectedAgent.leadsAssigned)}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Contact Rate</span>
                    <span className={styles.metricValue}>{fmtPct(selectedAgent.leadsContacted / selectedAgent.leadsAssigned)}</span>
                  </div>
                </div>

                {/* Simulation */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Lead Allocation Simulation</h4>
                  <p className={styles.simulationDesc}>
                    Adjust the lead allocation multiplier to project how this agent would perform with more or fewer leads.
                  </p>
                  <div className={styles.sliderGroup}>
                    <label className={styles.sliderLabel}>
                      Lead Multiplier: <strong>{leadMultiplier.toFixed(1)}x</strong>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={leadMultiplier}
                      onChange={(e) => setLeadMultiplier(parseFloat(e.target.value))}
                      className={styles.simulationSlider}
                    />
                    <div className={styles.sliderRange}>
                      <span>0.5x</span>
                      <span>2.0x</span>
                    </div>
                  </div>
                  {projections && (
                    <div className={styles.projectionResults}>
                      <div className={styles.metricRow}>
                        <span className={styles.metricLabel}>Projected Leads</span>
                        <span className={styles.metricValue}>{fmt(projections.projectedLeads)}</span>
                      </div>
                      <div className={styles.metricRow}>
                        <span className={styles.metricLabel}>Projected Quotes</span>
                        <span className={styles.metricValue}>{fmt(projections.projectedQuotes)}</span>
                      </div>
                      <div className={styles.metricRow}>
                        <span className={styles.metricLabel}>Projected Policies</span>
                        <span className={styles.metricValue}>{fmt(projections.projectedPolicies)}</span>
                      </div>
                      <div className={styles.metricRow}>
                        <span className={styles.metricLabel}>Projected Revenue</span>
                        <span className={styles.metricValue}>{fmtCurrency(projections.projectedRevenue)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Agent Button */}
              <div className={styles.agentSection}>
                <button
                  className={styles.agentButton}
                  onClick={generateRecommendations}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={18} className={styles.spinner} /> Generating Recommendations...
                    </>
                  ) : (
                    <>
                      <Bot size={18} /> Generate Territory Rebalancing Advice
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
                      {recommendations.map((rec, idx) => (
                        <div key={idx} className={styles.recommendationCard}>
                          <h4 className={styles.recTitle}>{rec.title}</h4>
                          <ul className={styles.recRationale}>
                            {rec.rationale.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                          <div className={styles.recImpact}>
                            <Activity size={14} /> {rec.impact}
                          </div>
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
            <Bot size={20} /> Distribution Optimizer AI
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
                <p>Ask me about agent performance, territory optimization, or distribution strategy.</p>
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
              placeholder={chatConfigured ? 'Ask about agent performance or territory strategy...' : 'AI not configured'}
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

export default DistributionProductivityWorkstation;
