// ============================================================================
// FraudDetectionWorkstation — Claims Fraud Detection Engine
// Claims Management domain accent: #f59e0b (amber)
// ============================================================================

import { useState, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bot, TrendingUp, Users, Target, DollarSign, Activity, BarChart3, Send, Loader2, AlertTriangle, Shield, Search, Eye } from 'lucide-react';
import { getUseCase } from '../data/domains';
import Breadcrumb from '../components/Breadcrumb';
import { useAIChat } from '../hooks/useAIChat';
import styles from './FraudDetectionWorkstation.module.css';
import { suspiciousClaims } from '../data/claims/fraud-detection-data';
import type { SuspiciousClaim } from '../data/claims/types';

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

const anomalyClass = (score: number): string => {
  if (score > 0.9) return styles.anomalyRed;
  if (score > 0.8) return styles.anomalyOrange;
  if (score >= 0.65) return styles.anomalyYellow;
  return styles.anomalyGreen;
};

const indicatorColor = (indicator: string): string => {
  const map: Record<string, string> = {
    'Duplicate Billing': styles.indicatorBlue,
    'Upcoding': styles.indicatorPurple,
    'Unbundling': styles.indicatorTeal,
    'Phantom Services': styles.indicatorRed,
    'Provider Mill': styles.indicatorOrange,
    'Geographic Anomaly': styles.indicatorYellow,
    'Impossible Day': styles.indicatorPink,
  };
  return map[indicator] || styles.indicatorDefault;
};

// ---------------------------------------------------------------------------
// Agent result type
// ---------------------------------------------------------------------------

interface AgentResult {
  fraudProbability: string;
  topSignals: { signal: string; contribution: string }[];
  patternAnalysis: string;
  recommendedActions: string[];
  estimatedRecovery: string;
  similarCases: number;
  rationale: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FraudDetectionWorkstation: React.FC = () => {
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
    id: 'fraud-detection',
    title: 'Fraud Detection',
    description: 'Score claims for fraud risk using anomaly detection, pattern matching, and provider/member linkage analysis.',
  };

  // State
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
      'You are a Fraud Detection AI agent for a health insurance company. You score claims for fraud risk using anomaly detection and pattern matching, with explainable confidence breakdowns. Answer questions about fraud patterns, investigation strategies, and anomaly detection methods.',
  });

  // ---------------------------------------------------------------------------
  // KPIs
  // ---------------------------------------------------------------------------

  const kpis = useMemo(() => {
    const flaggedClaims = suspiciousClaims.length;
    const avgAnomaly = suspiciousClaims.reduce((s, c) => s + c.anomalyScore, 0) / flaggedClaims;
    const totalRecovery = suspiciousClaims.reduce((s, c) => s + c.potentialRecovery, 0);
    const underInvestigation = suspiciousClaims.filter(
      (c) => c.investigationStatus === 'Under Investigation'
    ).length;
    return { flaggedClaims, avgAnomaly, totalRecovery, underInvestigation };
  }, []);

  // ---------------------------------------------------------------------------
  // Filtered claims
  // ---------------------------------------------------------------------------

  const filteredClaims = useMemo(() => {
    let result = suspiciousClaims;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.claimNumber.toLowerCase().includes(q) ||
          c.memberName.toLowerCase().includes(q) ||
          c.providerName.toLowerCase().includes(q) ||
          c.fraudIndicators.some((fi) => fi.toLowerCase().includes(q)) ||
          c.investigationStatus.toLowerCase().includes(q)
      );
    }
    return result;
  }, [searchQuery]);

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  const selectedClaim = useMemo(
    () => suspiciousClaims.find((c) => c.id === selectedClaimId) ?? null,
    [selectedClaimId],
  );

  const handleRowClick = useCallback((claim: SuspiciousClaim) => {
    setSelectedClaimId((prev) => (prev === claim.id ? null : claim.id));
    setAgentResult(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Agent: Fraud Detection Engine
  // ---------------------------------------------------------------------------

  const generateAnalysis = useCallback(() => {
    if (!selectedClaim) return;
    setIsGenerating(true);
    setAgentResult(null);

    setTimeout(() => {
      const claim = selectedClaim;

      const probabilityLabel =
        claim.anomalyScore >= 0.9
          ? 'Very High — Strongly recommend immediate investigation'
          : claim.anomalyScore >= 0.8
          ? 'High — Escalate for priority review'
          : claim.anomalyScore >= 0.65
          ? 'Moderate — Flag for further analysis'
          : 'Low-Moderate — Monitor and gather additional data';

      const signalMap: Record<string, string> = {
        'Duplicate Billing': 'Same service billed multiple times across overlapping date ranges',
        'Upcoding': 'Procedure codes systematically inflated beyond clinical documentation support',
        'Unbundling': 'Bundled procedure codes split into individual components to increase reimbursement',
        'Phantom Services': 'Services billed with no corresponding clinical documentation or patient confirmation',
        'Provider Mill': 'Provider shows patterns consistent with high-volume, low-quality referral mill',
        'Geographic Anomaly': 'Patient-provider geographic distance exceeds reasonable service delivery range',
        'Impossible Day': 'Billed service hours exceed 24-hour day or overlap with verified conflicting activities',
      };

      const topSignals = claim.fraudIndicators.map((indicator) => {
        const baseContrib = (100 / claim.fraudIndicators.length).toFixed(0);
        const adjustment = indicator === claim.fraudIndicators[0] ? 5 : indicator === claim.fraudIndicators[claim.fraudIndicators.length - 1] ? -5 : 0;
        return {
          signal: `${indicator}: ${signalMap[indicator] || 'Anomalous billing pattern detected'}`,
          contribution: `${parseInt(baseContrib) + adjustment}%`,
        };
      });

      const actionTemplates: Record<string, string[]> = {
        'Under Investigation': [
          'Continue active investigation with current case manager',
          `Request complete medical records from ${claim.providerName} for dates of service`,
          'Cross-reference patient treatment history with billing timeline',
          'Interview member to confirm services received',
          `Flag all claims from ${claim.providerName} in the past 12 months for pattern review`,
        ],
        Flagged: [
          `Escalate ${claim.claimNumber} to Special Investigations Unit (SIU)`,
          'Assign dedicated fraud analyst for deep-dive review',
          `Issue document preservation notice to ${claim.providerName}`,
          'Run linked-provider analysis to identify potential network fraud',
          'Prepare preliminary fraud assessment report for case committee',
        ],
      };

      const actions = actionTemplates[claim.investigationStatus] || [
        'Open formal investigation case file',
        'Request supporting documentation from provider',
        'Cross-check with claims database for similar patterns',
        'Conduct member outreach to verify services',
        'Prepare evidence summary for legal review',
      ];

      const estimatedRecovery = `${fmtCurrency(claim.potentialRecovery)} (direct recovery) + ${fmtCurrency(claim.potentialRecovery * 0.15)} (penalties and interest) = ${fmtCurrency(claim.potentialRecovery * 1.15)} total estimated recovery`;

      const similarCasesCount = Math.round(3 + claim.anomalyScore * 12);

      const rationale: string[] = [
        `Claim ${claim.claimNumber} submitted by ${claim.memberName} through ${claim.providerName} for $${fmt(claim.claimAmount)}.`,
        `Anomaly score of ${(claim.anomalyScore * 100).toFixed(0)}% places this claim in the ${claim.anomalyScore >= 0.9 ? 'top 5%' : claim.anomalyScore >= 0.8 ? 'top 15%' : 'top 30%'} of flagged claims by risk severity.`,
        `${claim.fraudIndicators.length} distinct fraud indicators detected: ${claim.fraudIndicators.join(', ')}.`,
        `Pattern match: "${claim.patternMatch}".`,
        `Confidence level: ${(claim.confidence * 100).toFixed(0)}% — ${claim.confidence >= 0.9 ? 'very high confidence in fraud indicators' : claim.confidence >= 0.8 ? 'high confidence, corroborated by multiple signals' : 'moderate confidence, additional evidence recommended'}.`,
        `Current status: ${claim.investigationStatus}. ${claim.investigationStatus === 'Under Investigation' ? 'Active case — maintaining evidence chain.' : 'Awaiting escalation decision.'}`,
      ];

      setAgentResult({
        fraudProbability: probabilityLabel,
        topSignals,
        patternAnalysis: claim.patternMatch,
        recommendedActions: actions,
        estimatedRecovery,
        similarCases: similarCasesCount,
        rationale,
      });
      setIsGenerating(false);
    }, 2600);
  }, [selectedClaim]);

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
            <AlertTriangle size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{fmt(kpis.flaggedClaims)}</span>
            <span className={styles.kpiLabel}>Flagged Claims</span>
          </div>
          <div className={styles.kpiCard}>
            <Activity size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{(kpis.avgAnomaly * 100).toFixed(1)}%</span>
            <span className={styles.kpiLabel}>Avg Anomaly Score</span>
          </div>
          <div className={styles.kpiCard}>
            <DollarSign size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{fmtCurrency(kpis.totalRecovery)}</span>
            <span className={styles.kpiLabel}>Total Potential Recovery</span>
          </div>
          <div className={styles.kpiCard}>
            <Shield size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{fmt(kpis.underInvestigation)}</span>
            <span className={styles.kpiLabel}>Under Investigation</span>
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
            placeholder="Search by claim number, member, provider, indicator, or status..."
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
            <BarChart3 size={18} /> Suspicious Claims Dashboard
          </h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Claim #</th>
                  <th>Member Name</th>
                  <th>Provider Name</th>
                  <th>Claim Amount ($)</th>
                  <th>Anomaly Score</th>
                  <th>Fraud Indicators</th>
                  <th>Pattern Match</th>
                  <th>Confidence %</th>
                  <th>Investigation Status</th>
                  <th>Potential Recovery ($)</th>
                </tr>
              </thead>
              <tbody>
                {filteredClaims.map((claim) => (
                  <tr
                    key={claim.id}
                    className={`${styles.tableRow} ${selectedClaimId === claim.id ? styles.selectedRow : ''}`}
                    onClick={() => handleRowClick(claim)}
                  >
                    <td className={styles.nameCell}>{claim.claimNumber}</td>
                    <td>{claim.memberName}</td>
                    <td>{claim.providerName}</td>
                    <td>${fmt(claim.claimAmount)}</td>
                    <td>
                      <span className={`${styles.anomalyBadge} ${anomalyClass(claim.anomalyScore)}`}>
                        {(claim.anomalyScore * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td>
                      <div className={styles.indicatorGroup}>
                        {claim.fraudIndicators.slice(0, 2).map((fi) => (
                          <span key={fi} className={`${styles.indicatorTag} ${indicatorColor(fi)}`}>
                            {fi}
                          </span>
                        ))}
                        {claim.fraudIndicators.length > 2 && (
                          <span className={styles.indicatorMore}>+{claim.fraudIndicators.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className={styles.patternCell}>{claim.patternMatch.slice(0, 50)}...</td>
                    <td>{(claim.confidence * 100).toFixed(0)}%</td>
                    <td>
                      <span className={`${styles.statusBadge} ${claim.investigationStatus === 'Under Investigation' ? styles.statusInvestigation : styles.statusFlagged}`}>
                        {claim.investigationStatus}
                      </span>
                    </td>
                    <td>{fmtCurrency(claim.potentialRecovery)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedClaim && (
            <motion.section
              className={styles.detailPanel}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className={styles.detailHeader}>
                <h3 className={styles.detailTitle}>
                  <Eye size={20} /> {selectedClaim.claimNumber}
                </h3>
                <span className={`${styles.statusBadge} ${selectedClaim.investigationStatus === 'Under Investigation' ? styles.statusInvestigation : styles.statusFlagged}`}>
                  {selectedClaim.investigationStatus}
                </span>
                <span className={`${styles.anomalyBadge} ${anomalyClass(selectedClaim.anomalyScore)}`}>
                  Anomaly: {(selectedClaim.anomalyScore * 100).toFixed(0)}%
                </span>
              </div>

              <div className={styles.detailGrid}>
                {/* Claim Details */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Claim Details</h4>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Claim ID</span>
                    <span className={styles.metricValue}>{selectedClaim.id}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Claim Number</span>
                    <span className={styles.metricValue}>{selectedClaim.claimNumber}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Member</span>
                    <span className={styles.metricValue}>{selectedClaim.memberName}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Provider</span>
                    <span className={styles.metricValue}>{selectedClaim.providerName}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Claim Amount</span>
                    <span className={styles.metricValue}>${fmt(selectedClaim.claimAmount)}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Potential Recovery</span>
                    <span className={styles.metricValue}>{fmtCurrency(selectedClaim.potentialRecovery)}</span>
                  </div>
                </div>

                {/* Fraud Indicators */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Fraud Indicators</h4>
                  <div className={styles.indicatorList}>
                    {selectedClaim.fraudIndicators.map((fi) => (
                      <div key={fi} className={styles.indicatorRow}>
                        <span className={`${styles.indicatorTagLarge} ${indicatorColor(fi)}`}>
                          <AlertTriangle size={12} /> {fi}
                        </span>
                      </div>
                    ))}
                  </div>

                  <h4 className={styles.subSectionTitle}>Pattern Match</h4>
                  <p className={styles.patternDescription}>{selectedClaim.patternMatch}</p>

                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Confidence</span>
                    <span className={styles.metricValue}>{(selectedClaim.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Anomaly Score</span>
                    <span className={styles.metricValue}>{(selectedClaim.anomalyScore * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* Investigation & Linked Network */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Investigation & Linked Network</h4>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Status</span>
                    <span className={styles.metricValue}>{selectedClaim.investigationStatus}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Priority</span>
                    <span className={styles.metricValue}>
                      {selectedClaim.anomalyScore >= 0.9 ? 'Critical' : selectedClaim.anomalyScore >= 0.8 ? 'High' : 'Standard'}
                    </span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Related Provider Claims</span>
                    <span className={styles.metricValue}>
                      {suspiciousClaims.filter((c) => c.providerName === selectedClaim.providerName).length} flagged
                    </span>
                  </div>

                  <h4 className={styles.subSectionTitle}>Linked Network Summary</h4>
                  <p className={styles.networkDescription}>
                    Provider "{selectedClaim.providerName}" has {suspiciousClaims.filter((c) => c.providerName === selectedClaim.providerName).length} flagged
                    claim(s) in the current review cycle. Total exposure across linked claims:
                    {' '}{fmtCurrency(
                      suspiciousClaims
                        .filter((c) => c.providerName === selectedClaim.providerName)
                        .reduce((s, c) => s + c.potentialRecovery, 0)
                    )}.
                    {selectedClaim.fraudIndicators.includes('Provider Mill') && ' This provider shows patterns consistent with a referral mill operation — recommend expanded network analysis.'}
                    {selectedClaim.fraudIndicators.includes('Geographic Anomaly') && ' Geographic anomalies suggest multi-state billing scheme — coordinate with regional investigators.'}
                  </p>
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
                      <Loader2 size={18} className={styles.spinner} /> Running Fraud Detection Engine...
                    </>
                  ) : (
                    <>
                      <Bot size={18} /> Analyze with Fraud Detection Engine
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
                        <Shield size={16} /> Fraud Detection Engine — Assessment
                      </h4>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Fraud Probability Assessment</span>
                        <span className={styles.resultValue}>{agentResult.fraudProbability}</span>
                      </div>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Top Fraud Signals (by contribution)</span>
                        {agentResult.topSignals.map((sig, i) => (
                          <div key={i} className={styles.signalItem}>
                            <span className={styles.signalRank}>{i + 1}</span>
                            <div className={styles.signalBody}>
                              <span className={styles.signalText}>{sig.signal}</span>
                              <span className={styles.signalContrib}>{sig.contribution}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Pattern Analysis</span>
                        <span className={styles.resultValue}>{agentResult.patternAnalysis}</span>
                      </div>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Recommended Investigation Actions</span>
                        {agentResult.recommendedActions.map((action, i) => (
                          <div key={i} className={styles.actionItem}>
                            <span className={styles.actionStep}>{i + 1}</span>
                            <span className={styles.actionText}>{action}</span>
                          </div>
                        ))}
                      </div>

                      <div className={styles.resultRow}>
                        <div className={styles.resultSection}>
                          <span className={styles.resultLabel}>Estimated Recovery</span>
                          <span className={styles.resultValue}>{agentResult.estimatedRecovery}</span>
                        </div>
                        <div className={styles.resultSection}>
                          <span className={styles.resultLabel}>Similar Historical Cases</span>
                          <span className={styles.resultValue}>{agentResult.similarCases} cases in database</span>
                        </div>
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
            <Bot size={18} /> Fraud Detection AI
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
                <p>Ask about fraud patterns, investigation strategies, anomaly detection methods, or specific claim analysis.</p>
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
              placeholder={chatConfigured ? 'Ask about fraud patterns, investigation strategies...' : 'AI not configured'}
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

export default FraudDetectionWorkstation;
