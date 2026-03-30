// ============================================================================
// NetworkOptimizationWorkstation — Provider Network & Supplier Performance
// Claims Management domain accent: #f59e0b (amber)
// ============================================================================

import { useState, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bot, TrendingUp, Users, Target, DollarSign, Activity, BarChart3, Send, Loader2, AlertTriangle, Shield, Search, Eye } from 'lucide-react';
import { getUseCase } from '../data/domains';
import Breadcrumb from '../components/Breadcrumb';
import { useAIChat } from '../hooks/useAIChat';
import styles from './NetworkOptimizationWorkstation.module.css';
import { providers } from '../data/claims/network-optimization-data';
import type { Provider } from '../data/claims/types';

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

const tierClass = (tier: string): string => {
  if (tier === 'Tier 1') return styles.tierOne;
  if (tier === 'Tier 2') return styles.tierTwo;
  return styles.tierThree;
};

// ---------------------------------------------------------------------------
// Agent result type
// ---------------------------------------------------------------------------

interface AgentResult {
  tierRecommendation: string;
  costOptimization: string;
  qualityImprovementAreas: string[];
  contractNegotiationPoints: string[];
  savingsProjection: string;
  rationale: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const NetworkOptimizationWorkstation: React.FC = () => {
  const { domainId, useCaseId } = useParams<{ domainId: string; useCaseId: string }>();
  const result = getUseCase(domainId ?? '', useCaseId ?? '');

  const domain = result?.domain ?? {
    id: 'claims',
    name: 'Claims Management',
    accentColor: '#f59e0b',
    description: '',
    position: 3,
    useCases: [],
  };
  const useCase = result?.useCase ?? {
    id: 'network-optimization',
    title: 'Provider Network & Supplier Performance',
    description: 'Evaluate healthcare providers by cost, quality scores, and patient outcomes to optimize network composition.',
  };

  // State
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Simulation state
  const [excludedProviders, setExcludedProviders] = useState<Set<string>>(new Set());
  const [qualityThreshold, setQualityThreshold] = useState<number>(50);

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
      'You are a Provider Network AI agent for a health insurance company. You evaluate healthcare providers by cost, quality, and patient outcomes to optimize network composition. Answer questions about network adequacy, provider tiering, contract negotiations, and cost optimization.',
  });

  // ---------------------------------------------------------------------------
  // KPIs
  // ---------------------------------------------------------------------------

  const kpis = useMemo(() => {
    const totalProviders = providers.length;
    const avgQuality = providers.reduce((s, p) => s + p.qualityScore, 0) / totalProviders;
    const avgCost = providers.reduce((s, p) => s + p.avgCostPerProcedure, 0) / totalProviders;
    const totalSavings = providers.reduce((s, p) => s + p.savingsPotential, 0);
    return { totalProviders, avgQuality, avgCost, totalSavings };
  }, []);

  // ---------------------------------------------------------------------------
  // Filtered providers
  // ---------------------------------------------------------------------------

  const filteredProviders = useMemo(() => {
    let result = providers;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.type.toLowerCase().includes(q) ||
          p.specialty.toLowerCase().includes(q) ||
          p.tier.toLowerCase().includes(q)
      );
    }
    return result;
  }, [searchQuery]);

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  const selectedProvider = useMemo(
    () => providers.find((p) => p.id === selectedProviderId) ?? null,
    [selectedProviderId],
  );

  const handleRowClick = useCallback((provider: Provider) => {
    setSelectedProviderId((prev) => (prev === provider.id ? null : provider.id));
    setAgentResult(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Simulation: Network composition
  // ---------------------------------------------------------------------------

  const toggleProviderInNetwork = useCallback((providerId: string) => {
    setExcludedProviders((prev) => {
      const next = new Set(prev);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  }, []);

  const simulationResults = useMemo(() => {
    const activeProviders = providers.filter(
      (p) => !excludedProviders.has(p.id) && p.qualityScore >= qualityThreshold
    );
    const total = providers.length;
    const active = activeProviders.length;
    const avgCost = active > 0 ? activeProviders.reduce((s, p) => s + p.avgCostPerProcedure, 0) / active : 0;
    const avgQuality = active > 0 ? activeProviders.reduce((s, p) => s + p.qualityScore, 0) / active : 0;
    const networkAdequacy = (active / total) * 100;
    const totalSavings = activeProviders.reduce((s, p) => s + p.savingsPotential, 0);
    return { activeProviders: active, avgCost, avgQuality, networkAdequacy, totalSavings };
  }, [excludedProviders, qualityThreshold]);

  // ---------------------------------------------------------------------------
  // Agent recommendation generator
  // ---------------------------------------------------------------------------

  const generateAnalysis = useCallback(() => {
    if (!selectedProvider) return;
    setIsGenerating(true);
    setAgentResult(null);

    setTimeout(() => {
      const avgCost = providers.reduce((s, p) => s + p.avgCostPerProcedure, 0) / providers.length;
      const avgQuality = providers.reduce((s, p) => s + p.qualityScore, 0) / providers.length;

      let tierRec: string;
      if (selectedProvider.qualityScore >= 90 && selectedProvider.avgCostPerProcedure <= avgCost * 1.2) {
        tierRec = 'Promote to Tier 1 / Maintain Tier 1';
      } else if (selectedProvider.qualityScore >= 75 && selectedProvider.qualityScore < 90) {
        tierRec = 'Maintain Tier 2 — quality improvement path recommended';
      } else if (selectedProvider.qualityScore < 75) {
        tierRec = 'Demote to Tier 3 / Consider network removal';
      } else {
        tierRec = 'Maintain current tier';
      }

      const costOpt =
        selectedProvider.avgCostPerProcedure > avgCost
          ? `Cost per procedure ($${fmt(selectedProvider.avgCostPerProcedure)}) is ${((selectedProvider.avgCostPerProcedure / avgCost - 1) * 100).toFixed(0)}% above network average ($${fmt(Math.round(avgCost))}). Negotiate volume-based discounts targeting 10-15% reduction.`
          : `Cost per procedure ($${fmt(selectedProvider.avgCostPerProcedure)}) is ${((1 - selectedProvider.avgCostPerProcedure / avgCost) * 100).toFixed(0)}% below network average. Strong cost position — leverage for expanded service agreements.`;

      const qualityAreas: string[] = [];
      if (selectedProvider.qualityScore < 90) qualityAreas.push('Implement quality improvement milestones tied to reimbursement bonuses');
      if (selectedProvider.patientSatisfaction < 85) qualityAreas.push('Address patient satisfaction scores through service experience audit');
      if (selectedProvider.qualityScore < 80) qualityAreas.push('Require participation in peer review and best-practice sharing program');
      if (qualityAreas.length === 0) qualityAreas.push('Quality metrics exceed benchmarks — maintain current protocols');

      const negotiationPoints: string[] = [
        `Current contract expires ${selectedProvider.contractExpiry} — begin renegotiation 90 days prior`,
        selectedProvider.patientVolume > 5000
          ? `High volume provider (${fmt(selectedProvider.patientVolume)} patients) — significant network dependency; negotiate carefully`
          : `Moderate volume (${fmt(selectedProvider.patientVolume)} patients) — network has alternatives for gradual transition if needed`,
        `Savings potential of ${fmtCurrency(selectedProvider.savingsPotential)} identified through rate benchmarking and utilization analysis`,
        `Propose value-based contract with quality bonuses tied to ${selectedProvider.qualityScore >= 90 ? 'maintaining' : 'achieving'} 90+ quality score`,
      ];

      const savingsProj = `Projected annual savings: ${fmtCurrency(selectedProvider.savingsPotential)} through contract renegotiation and utilization management. Additional ${fmtCurrency(selectedProvider.savingsPotential * 0.3)} potential through care pathway standardization.`;

      const rationale: string[] = [
        `${selectedProvider.name} operates as a ${selectedProvider.type} specializing in ${selectedProvider.specialty} at ${selectedProvider.tier} level.`,
        `Quality score of ${selectedProvider.qualityScore}/100 is ${selectedProvider.qualityScore >= avgQuality ? 'above' : 'below'} the network average of ${avgQuality.toFixed(1)}.`,
        `Patient satisfaction at ${selectedProvider.patientSatisfaction}% ${selectedProvider.patientSatisfaction >= 85 ? 'demonstrates strong patient experience' : 'indicates room for service improvement'}.`,
        `Cost position of ${fmtCurrency(selectedProvider.avgCostPerProcedure)} per procedure ${selectedProvider.avgCostPerProcedure > avgCost ? 'warrants cost reduction negotiations' : 'represents competitive value'}.`,
        `Network status: ${selectedProvider.networkStatus}. Contract expiry: ${selectedProvider.contractExpiry}.`,
      ];

      setAgentResult({
        tierRecommendation: tierRec,
        costOptimization: costOpt,
        qualityImprovementAreas: qualityAreas,
        contractNegotiationPoints: negotiationPoints,
        savingsProjection: savingsProj,
        rationale,
      });
      setIsGenerating(false);
    }, 2400);
  }, [selectedProvider]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Breadcrumb */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Breadcrumb items={[
            { label: 'Home', to: '/' },
            { label: domain.name, to: `/domain/${domain.id}` },
            { label: useCase.title },
          ]} />
        </motion.div>

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
            <span className={styles.kpiValue}>{fmt(kpis.totalProviders)}</span>
            <span className={styles.kpiLabel}>Total Providers</span>
          </div>
          <div className={styles.kpiCard}>
            <Target size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{kpis.avgQuality.toFixed(1)}</span>
            <span className={styles.kpiLabel}>Avg Quality Score</span>
          </div>
          <div className={styles.kpiCard}>
            <DollarSign size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{fmtCurrency(kpis.avgCost)}</span>
            <span className={styles.kpiLabel}>Avg Cost/Procedure</span>
          </div>
          <div className={styles.kpiCard}>
            <TrendingUp size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{fmtCurrency(kpis.totalSavings)}</span>
            <span className={styles.kpiLabel}>Total Savings Potential</span>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          className={styles.searchBar}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search providers by name, type, specialty, or tier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </motion.div>

        {/* Data Table */}
        <motion.section
          className={styles.tableSection}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className={styles.sectionTitle}>
            <BarChart3 size={18} /> Provider Network Overview
          </h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Specialty</th>
                  <th>Tier</th>
                  <th>Avg Cost/Procedure ($)</th>
                  <th>Quality Score</th>
                  <th>Patient Volume</th>
                  <th>Network Status</th>
                  <th>Contract Expiry</th>
                  <th>Savings Potential ($)</th>
                  <th>Patient Satisfaction</th>
                </tr>
              </thead>
              <tbody>
                {filteredProviders.map((provider) => (
                  <tr
                    key={provider.id}
                    className={`${styles.tableRow} ${selectedProviderId === provider.id ? styles.selectedRow : ''}`}
                    onClick={() => handleRowClick(provider)}
                  >
                    <td className={styles.nameCell}>{provider.name}</td>
                    <td>{provider.type}</td>
                    <td>{provider.specialty}</td>
                    <td>
                      <span className={`${styles.tierBadge} ${tierClass(provider.tier)}`}>
                        {provider.tier}
                      </span>
                    </td>
                    <td>{fmt(provider.avgCostPerProcedure)}</td>
                    <td>{provider.qualityScore}</td>
                    <td>{fmt(provider.patientVolume)}</td>
                    <td>{provider.networkStatus}</td>
                    <td>{provider.contractExpiry}</td>
                    <td>{fmtCurrency(provider.savingsPotential)}</td>
                    <td>{provider.patientSatisfaction}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedProvider && (
            <motion.section
              className={styles.detailPanel}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className={styles.detailHeader}>
                <h3 className={styles.detailTitle}>
                  <Eye size={20} /> {selectedProvider.name}
                </h3>
                <span className={`${styles.tierBadge} ${tierClass(selectedProvider.tier)}`}>
                  {selectedProvider.tier}
                </span>
                <span className={styles.detailBadge}>{selectedProvider.networkStatus}</span>
              </div>

              <div className={styles.detailGrid}>
                {/* Provider Profile */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Provider Profile</h4>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Provider ID</span>
                    <span className={styles.metricValue}>{selectedProvider.id}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Type</span>
                    <span className={styles.metricValue}>{selectedProvider.type}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Specialty</span>
                    <span className={styles.metricValue}>{selectedProvider.specialty}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Tier</span>
                    <span className={styles.metricValue}>{selectedProvider.tier}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Network Status</span>
                    <span className={styles.metricValue}>{selectedProvider.networkStatus}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Contract Expiry</span>
                    <span className={styles.metricValue}>{selectedProvider.contractExpiry}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Patient Volume</span>
                    <span className={styles.metricValue}>{fmt(selectedProvider.patientVolume)}</span>
                  </div>
                </div>

                {/* Cost vs Quality */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Cost vs Quality Comparison</h4>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Avg Cost/Procedure</span>
                    <span className={styles.metricValue}>${fmt(selectedProvider.avgCostPerProcedure)}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Network Avg Cost</span>
                    <span className={styles.metricValue}>${fmt(Math.round(kpis.avgCost))}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Cost Variance</span>
                    <span className={styles.metricValue}>
                      {selectedProvider.avgCostPerProcedure > kpis.avgCost ? '+' : ''}
                      {((selectedProvider.avgCostPerProcedure / kpis.avgCost - 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Quality Score</span>
                    <span className={styles.metricValue}>{selectedProvider.qualityScore}/100</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Network Avg Quality</span>
                    <span className={styles.metricValue}>{kpis.avgQuality.toFixed(1)}/100</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Savings Potential</span>
                    <span className={styles.metricValue}>{fmtCurrency(selectedProvider.savingsPotential)}</span>
                  </div>
                </div>

                {/* Patient Outcome Summary */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Patient Outcome Summary</h4>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Patient Satisfaction</span>
                    <span className={styles.metricValue}>{selectedProvider.patientSatisfaction}%</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Quality Percentile</span>
                    <span className={styles.metricValue}>
                      {Math.round(
                        (providers.filter((p) => p.qualityScore <= selectedProvider.qualityScore).length / providers.length) * 100
                      )}th
                    </span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Volume Rank</span>
                    <span className={styles.metricValue}>
                      #{providers.slice().sort((a, b) => b.patientVolume - a.patientVolume).findIndex((p) => p.id === selectedProvider.id) + 1} of {providers.length}
                    </span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Cost Efficiency</span>
                    <span className={styles.metricValue}>
                      {selectedProvider.avgCostPerProcedure <= kpis.avgCost ? 'Above Average' : 'Below Average'}
                    </span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Tier Recommendation</span>
                    <span className={styles.metricValue}>
                      {selectedProvider.qualityScore >= 90 ? 'Tier 1 Eligible' : selectedProvider.qualityScore >= 75 ? 'Tier 2 Eligible' : 'Tier 3 / Review'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Simulation Section */}
              <div className={styles.simulationSection}>
                <h4 className={styles.detailCardTitle}>Network Composition Simulation</h4>
                <p className={styles.simulationDesc}>
                  Toggle providers in/out of network and adjust the quality threshold to see the impact on network metrics.
                </p>

                <div className={styles.simulationControls}>
                  <div className={styles.toggleGroup}>
                    <button
                      className={`${styles.toggleButton} ${excludedProviders.has(selectedProvider.id) ? styles.toggleExcluded : styles.toggleIncluded}`}
                      onClick={() => toggleProviderInNetwork(selectedProvider.id)}
                    >
                      {excludedProviders.has(selectedProvider.id) ? 'Excluded from Network' : 'Included in Network'}
                    </button>
                  </div>

                  <div className={styles.sliderGroup}>
                    <label className={styles.sliderLabel}>
                      Quality Threshold: <strong>{qualityThreshold}</strong>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="90"
                      step="5"
                      value={qualityThreshold}
                      onChange={(e) => setQualityThreshold(parseInt(e.target.value))}
                      className={styles.simulationSlider}
                    />
                    <div className={styles.sliderRange}>
                      <span>50</span>
                      <span>90</span>
                    </div>
                  </div>
                </div>

                <div className={styles.simulationResults}>
                  <div className={styles.simMetric}>
                    <span className={styles.simMetricLabel}>Active Providers</span>
                    <span className={styles.simMetricValue}>{simulationResults.activeProviders}</span>
                  </div>
                  <div className={styles.simMetric}>
                    <span className={styles.simMetricLabel}>Avg Cost</span>
                    <span className={styles.simMetricValue}>{fmtCurrency(simulationResults.avgCost)}</span>
                  </div>
                  <div className={styles.simMetric}>
                    <span className={styles.simMetricLabel}>Avg Quality</span>
                    <span className={styles.simMetricValue}>{simulationResults.avgQuality.toFixed(1)}</span>
                  </div>
                  <div className={styles.simMetric}>
                    <span className={styles.simMetricLabel}>Network Adequacy</span>
                    <span className={styles.simMetricValue}>{simulationResults.networkAdequacy.toFixed(1)}%</span>
                  </div>
                  <div className={styles.simMetric}>
                    <span className={styles.simMetricLabel}>Total Savings</span>
                    <span className={styles.simMetricValue}>{fmtCurrency(simulationResults.totalSavings)}</span>
                  </div>
                </div>
              </div>

              {/* Agent Button */}
              <div className={styles.agentSection}>
                <button
                  className={styles.agentButton}
                  onClick={generateAnalysis}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={18} className={styles.spinner} /> Analyzing Provider...
                    </>
                  ) : (
                    <>
                      <Bot size={18} /> Analyze Provider with Network Analyzer
                    </>
                  )}
                </button>

                <AnimatePresence>
                  {agentResult && (
                    <motion.div
                      className={styles.agentResult}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 12 }}
                      transition={{ duration: 0.3 }}
                    >
                      <h4 className={styles.resultTitle}>
                        <Shield size={16} /> Network Analyzer — Provider Assessment
                      </h4>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Tier Recommendation</span>
                        <span className={styles.resultValue}>{agentResult.tierRecommendation}</span>
                      </div>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Cost Optimization</span>
                        <span className={styles.resultValue}>{agentResult.costOptimization}</span>
                      </div>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Quality Improvement Areas</span>
                        {agentResult.qualityImprovementAreas.map((area, i) => (
                          <div key={i} className={styles.resultItem}>
                            <Activity size={12} /> {area}
                          </div>
                        ))}
                      </div>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Contract Negotiation Points</span>
                        {agentResult.contractNegotiationPoints.map((point, i) => (
                          <div key={i} className={styles.resultItem}>
                            <Target size={12} /> {point}
                          </div>
                        ))}
                      </div>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Savings Projection</span>
                        <span className={styles.resultValue}>{agentResult.savingsProjection}</span>
                      </div>

                      <div className={styles.rationaleSection}>
                        <span className={styles.resultLabel}>Rationale</span>
                        <ul className={styles.rationaleList}>
                          {agentResult.rationale.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* AI Chat Section */}
        <motion.section
          className={styles.chatSection}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className={styles.sectionTitle}>
            <Bot size={18} /> Network Optimization AI
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
                <p>Ask about network adequacy, provider tiering, contract negotiations, or cost optimization strategies.</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={msg.role === 'user' ? styles.chatMessageUser : styles.chatMessageAssistant}
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
              placeholder={chatConfigured ? 'Ask about network optimization, provider performance...' : 'AI not configured'}
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
        </motion.section>
      </div>
    </div>
  );
};

export default NetworkOptimizationWorkstation;
