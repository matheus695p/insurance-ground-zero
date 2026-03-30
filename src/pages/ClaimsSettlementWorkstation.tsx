// ============================================================================
// ClaimsSettlementWorkstation — Claims Handling & Settlement Optimization
// Claims Management domain accent: #f59e0b (amber)
// ============================================================================

import { useState, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bot, Scale, Users, Activity, DollarSign, BarChart3, Send, Loader2, Search, Clock, TrendingDown, AlertTriangle } from 'lucide-react';
import { getUseCase } from '../data/domains';
import Breadcrumb from '../components/Breadcrumb';
import { useAIChat } from '../hooks/useAIChat';
import styles from './ClaimsSettlementWorkstation.module.css';
import { openClaims } from '../data/claims/claims-settlement-data';
import type { OpenClaim } from '../data/claims/types';

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

const daysAgingClass = (days: number): string => {
  if (days > 120) return styles.daysAgingCritical;
  if (days > 60) return styles.daysAgingHigh;
  if (days > 30) return styles.daysAgingMedium;
  return styles.daysAgingLow;
};

const leakageClass = (risk: number): string => {
  if (risk > 0.3) return styles.leakageHigh;
  if (risk >= 0.15) return styles.leakageMedium;
  return styles.leakageLow;
};

const statusClass = (status: string): string => {
  if (status === 'In Negotiation') return styles.statusNegotiation;
  if (status === 'Under Review') return styles.statusReview;
  return styles.statusAssessment;
};

// ---------------------------------------------------------------------------
// Agent result type
// ---------------------------------------------------------------------------

interface AgentResult {
  optimalRange: string;
  negotiationStrategy: string;
  leakageAssessment: string;
  counterOfferRecommendations: string[];
  timelineRecommendation: string;
  rationale: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ClaimsSettlementWorkstation: React.FC = () => {
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
    id: 'claims-settlement',
    title: 'Claims Handling & Settlement Optimization',
    description: 'Optimize settlement negotiations through data-driven recommendations, leakage analysis, and counter-offer strategies to minimize overpayment while ensuring fair claim resolution.',
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
      'You are a Claims Settlement Optimization AI agent for a health insurance company. You help adjusters optimize settlement negotiations by analyzing billed amounts, reserve estimates, leakage risk, negotiation history, and counter-offer strategies. Answer questions about settlement best practices, negotiation tactics, leakage prevention, and reserve adequacy.',
  });

  // ---------------------------------------------------------------------------
  // KPIs
  // ---------------------------------------------------------------------------

  const kpis = useMemo(() => {
    const totalClaims = openClaims.length;
    const avgDaysOpen = openClaims.reduce((s, c) => s + c.daysOpen, 0) / totalClaims;
    const totalBilled = openClaims.reduce((s, c) => s + c.billedAmount, 0);
    const avgLeakageRisk = openClaims.reduce((s, c) => s + c.leakageRisk, 0) / totalClaims;
    return { totalClaims, avgDaysOpen, totalBilled, avgLeakageRisk };
  }, []);

  // ---------------------------------------------------------------------------
  // Filtered claims
  // ---------------------------------------------------------------------------

  const filteredClaims = useMemo(() => {
    let result = openClaims;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.claimNumber.toLowerCase().includes(q) ||
          c.memberName.toLowerCase().includes(q) ||
          c.adjuster.toLowerCase().includes(q) ||
          c.claimType.toLowerCase().includes(q) ||
          c.status.toLowerCase().includes(q)
      );
    }
    return result;
  }, [searchQuery]);

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  const selectedClaim = useMemo(
    () => openClaims.find((c) => c.id === selectedClaimId) ?? null,
    [selectedClaimId],
  );

  const handleRowClick = useCallback((claim: OpenClaim) => {
    setSelectedClaimId((prev) => (prev === claim.id ? null : claim.id));
    setAgentResult(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Agent: Settlement Optimizer
  // ---------------------------------------------------------------------------

  const generateAnalysis = useCallback(() => {
    if (!selectedClaim) return;
    setIsGenerating(true);
    setAgentResult(null);

    setTimeout(() => {
      const claim = selectedClaim;

      const gap = claim.billedAmount - claim.reserveEstimate;
      const gapPct = ((gap / claim.billedAmount) * 100).toFixed(1);
      const settlementRange = {
        low: Math.round(claim.settlementRecommendation * 0.92),
        high: Math.round(claim.settlementRecommendation * 1.05),
      };

      const optimalRange = `${fmtCurrency(settlementRange.low)} - ${fmtCurrency(settlementRange.high)} (recommended target: ${fmtCurrency(claim.settlementRecommendation)})`;

      const strategyMap: Record<string, string> = {
        'In Negotiation': `Continue structured negotiation with ${claim.adjuster}. After ${claim.negotiationRound} round(s), focus on narrowing the gap between billed (${fmtCurrency(claim.billedAmount)}) and reserve (${fmtCurrency(claim.reserveEstimate)}). Leverage comparable claim data and clinical benchmarks for the ${claim.claimType} category to justify the settlement range.`,
        'Under Review': `Complete detailed review of all supporting documentation before initiating negotiations. For this ${claim.claimType} claim, establish reserve adequacy through clinical review and comparable case analysis. Prepare negotiation framework with initial offer at ${fmtCurrency(settlementRange.low)}.`,
        'Initial Assessment': `Prioritize documentation collection and initial clinical review. For ${claim.claimType} claims at this stage, focus on establishing accurate reserve estimates. Current billed amount of ${fmtCurrency(claim.billedAmount)} requires validation against provider fee schedules and clinical guidelines.`,
      };

      const negotiationStrategy = strategyMap[claim.status] || strategyMap['Under Review'];

      const leakageLabel =
        claim.leakageRisk > 0.3
          ? `HIGH RISK (${(claim.leakageRisk * 100).toFixed(0)}%) — Significant overpayment risk detected. The ${gapPct}% gap between billed amount and reserve indicates potential billing inflation. Immediate line-item review recommended.`
          : claim.leakageRisk >= 0.15
          ? `MODERATE RISK (${(claim.leakageRisk * 100).toFixed(0)}%) — Some overpayment indicators present. The ${gapPct}% billed-to-reserve gap warrants closer examination of ${claim.claimType}-specific billing codes.`
          : `LOW RISK (${(claim.leakageRisk * 100).toFixed(0)}%) — Minimal overpayment indicators. Billed amount aligns reasonably with reserve estimate and clinical benchmarks.`;

      const counterOfferTemplates: Record<string, string[]> = {
        'In Negotiation': [
          `Present counter-offer at ${fmtCurrency(settlementRange.low)} backed by comparable ${claim.claimType} claim settlements in the region`,
          `Request itemized billing breakdown from provider to identify specific line items above market rate`,
          `Propose structured settlement with payment schedule if total exceeds ${fmtCurrency(claim.reserveEstimate)}`,
          `Leverage network discount agreements and fee schedule benchmarks for ${claim.claimType} procedures`,
          `If provider resists, offer expedited payment processing as incentive for accepting ${fmtCurrency(claim.settlementRecommendation)}`,
        ],
        'Under Review': [
          `Set initial offer anchor at ${fmtCurrency(settlementRange.low)} (8% below settlement recommendation)`,
          `Gather three comparable claim settlements for ${claim.claimType} category before opening negotiations`,
          `Review provider contract terms for applicable discount structures`,
          `Prepare clinical justification memo supporting the recommended reserve of ${fmtCurrency(claim.reserveEstimate)}`,
        ],
        'Initial Assessment': [
          `Defer counter-offer preparation until clinical review is complete`,
          `Validate all billing codes against CMS fee schedules for ${claim.claimType} claims`,
          `Request complete medical records and itemized bills within 10 business days`,
          `Establish communication timeline with ${claim.adjuster} for weekly status updates`,
        ],
      };

      const counterOffers = counterOfferTemplates[claim.status] || counterOfferTemplates['Under Review'];

      const timelineMap: Record<string, string> = {
        'In Negotiation': `Target resolution within ${Math.max(14, 45 - claim.negotiationRound * 7)} days. Claim has been open ${claim.daysOpen} days across ${claim.negotiationRound} negotiation rounds. ${claim.daysOpen > 120 ? 'URGENT: Claim aging exceeds 120 days — prioritize accelerated resolution to reduce carrying costs.' : claim.daysOpen > 60 ? 'Moderate aging — maintain bi-weekly negotiation cadence.' : 'On track — continue standard negotiation timeline.'}`,
        'Under Review': `Complete review within 14 days and initiate first negotiation round by day 21. Current claim age: ${claim.daysOpen} days. Assign dedicated adjuster time for document review this week.`,
        'Initial Assessment': `Complete initial assessment within 7 days. Target first review milestone by day 14. Current claim age: ${claim.daysOpen} days — well within assessment window.`,
      };

      const timelineRecommendation = timelineMap[claim.status] || timelineMap['Under Review'];

      const rationale: string[] = [
        `Claim ${claim.claimNumber} filed by ${claim.memberName} (${claim.claimType}) with billed amount of $${fmt(claim.billedAmount)}.`,
        `Reserve estimate of ${fmtCurrency(claim.reserveEstimate)} represents a ${gapPct}% reduction from billed amount, indicating ${parseFloat(gapPct) > 20 ? 'significant billing-to-reserve gap requiring careful negotiation' : 'reasonable alignment between billed and estimated costs'}.`,
        `Settlement recommendation of ${fmtCurrency(claim.settlementRecommendation)} is ${((1 - claim.settlementRecommendation / claim.billedAmount) * 100).toFixed(1)}% below billed amount and ${claim.settlementRecommendation <= claim.reserveEstimate ? 'within' : 'above'} the current reserve.`,
        `Leakage risk score of ${(claim.leakageRisk * 100).toFixed(0)}% places this claim in the ${claim.leakageRisk > 0.3 ? 'high-risk category requiring immediate attention' : claim.leakageRisk >= 0.15 ? 'moderate-risk category requiring monitoring' : 'low-risk category with standard processing'}.`,
        `Adjuster ${claim.adjuster} is managing this claim through ${claim.negotiationRound > 0 ? `${claim.negotiationRound} negotiation round(s)` : 'initial assessment'} with current status: ${claim.status}.`,
        `Claim has been open for ${claim.daysOpen} days. ${claim.daysOpen > 120 ? 'Extended duration increases carrying costs and settlement pressure.' : claim.daysOpen > 60 ? 'Moderate duration — on track for standard resolution timeline.' : 'Early stage — adequate time for thorough analysis.'}`,
      ];

      setAgentResult({
        optimalRange,
        negotiationStrategy,
        leakageAssessment: leakageLabel,
        counterOfferRecommendations: counterOffers,
        timelineRecommendation,
        rationale,
      });
      setIsGenerating(false);
    }, 2500);
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
          <h1 className={styles.heroTitle}>Claims Handling & Settlement Optimization</h1>
          <p className={styles.heroSubtitle}>
            Optimize settlement negotiations and reduce leakage through data-driven recommendations, reserve analysis, and counter-offer strategies. Monitor open claims aging, adjuster performance, and financial exposure across your settlement portfolio.
          </p>
        </motion.div>

        {/* KPI Row */}
        <motion.div
          className={styles.kpiRow}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className={styles.kpiCard}>
            <Scale size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{fmt(kpis.totalClaims)}</span>
            <span className={styles.kpiLabel}>Open Claims</span>
          </div>
          <div className={styles.kpiCard}>
            <Clock size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{kpis.avgDaysOpen.toFixed(0)}</span>
            <span className={styles.kpiLabel}>Avg Days Open</span>
          </div>
          <div className={styles.kpiCard}>
            <DollarSign size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{fmtCurrency(kpis.totalBilled)}</span>
            <span className={styles.kpiLabel}>Total Billed Amount</span>
          </div>
          <div className={styles.kpiCard}>
            <TrendingDown size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{(kpis.avgLeakageRisk * 100).toFixed(1)}%</span>
            <span className={styles.kpiLabel}>Avg Leakage Risk</span>
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
            placeholder="Search by claim number, member, adjuster, type, or status..."
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
            <BarChart3 size={18} /> Open Claims Settlement Dashboard
          </h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Claim #</th>
                  <th>Member</th>
                  <th>Type</th>
                  <th>Date Opened</th>
                  <th>Days Open</th>
                  <th>Billed Amount</th>
                  <th>Reserve Estimate</th>
                  <th>Adjuster</th>
                  <th>Neg. Round</th>
                  <th>Settlement Rec.</th>
                  <th>Leakage Risk</th>
                  <th>Status</th>
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
                    <td>{claim.claimType}</td>
                    <td>{claim.dateOpened}</td>
                    <td>
                      <span className={`${styles.daysAgingBadge} ${daysAgingClass(claim.daysOpen)}`}>
                        {claim.daysOpen}d
                      </span>
                    </td>
                    <td>${fmt(claim.billedAmount)}</td>
                    <td>${fmt(claim.reserveEstimate)}</td>
                    <td>{claim.adjuster}</td>
                    <td>{claim.negotiationRound}</td>
                    <td>{fmtCurrency(claim.settlementRecommendation)}</td>
                    <td>
                      <span className={`${styles.leakageBadge} ${leakageClass(claim.leakageRisk)}`}>
                        {(claim.leakageRisk * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${statusClass(claim.status)}`}>
                        {claim.status}
                      </span>
                    </td>
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
                  <Scale size={20} /> {selectedClaim.claimNumber}
                </h3>
                <span className={`${styles.statusBadge} ${statusClass(selectedClaim.status)}`}>
                  {selectedClaim.status}
                </span>
                <span className={`${styles.leakageBadge} ${leakageClass(selectedClaim.leakageRisk)}`}>
                  Leakage: {(selectedClaim.leakageRisk * 100).toFixed(0)}%
                </span>
              </div>

              <div className={styles.detailGrid}>
                {/* Claim Overview */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Claim Overview</h4>
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
                    <span className={styles.metricLabel}>Claim Type</span>
                    <span className={styles.metricValue}>{selectedClaim.claimType}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Date Opened</span>
                    <span className={styles.metricValue}>{selectedClaim.dateOpened}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Days Open</span>
                    <span className={styles.metricValue}>{selectedClaim.daysOpen}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Adjuster</span>
                    <span className={styles.metricValue}>{selectedClaim.adjuster}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Status</span>
                    <span className={styles.metricValue}>{selectedClaim.status}</span>
                  </div>
                </div>

                {/* Financial Analysis */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Financial Analysis</h4>

                  {/* Visual bars */}
                  <div className={styles.financialBarGroup}>
                    <div className={styles.financialBarRow}>
                      <span className={styles.financialBarLabel}>Billed Amount</span>
                      <div className={styles.financialBar}>
                        <div
                          className={`${styles.financialBarFill} ${styles.financialBarBilled}`}
                          style={{ width: '100%' }}
                        />
                      </div>
                      <span className={styles.financialBarValue}>${fmt(selectedClaim.billedAmount)}</span>
                    </div>
                    <div className={styles.financialBarRow}>
                      <span className={styles.financialBarLabel}>Reserve Est.</span>
                      <div className={styles.financialBar}>
                        <div
                          className={`${styles.financialBarFill} ${styles.financialBarReserve}`}
                          style={{ width: `${(selectedClaim.reserveEstimate / selectedClaim.billedAmount * 100).toFixed(1)}%` }}
                        />
                      </div>
                      <span className={styles.financialBarValue}>${fmt(selectedClaim.reserveEstimate)}</span>
                    </div>
                    <div className={styles.financialBarRow}>
                      <span className={styles.financialBarLabel}>Settlement Rec.</span>
                      <div className={styles.financialBar}>
                        <div
                          className={`${styles.financialBarFill} ${styles.financialBarSettlement}`}
                          style={{ width: `${(selectedClaim.settlementRecommendation / selectedClaim.billedAmount * 100).toFixed(1)}%` }}
                        />
                      </div>
                      <span className={styles.financialBarValue}>${fmt(selectedClaim.settlementRecommendation)}</span>
                    </div>
                  </div>

                  {/* Gap Analysis */}
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Billed-Reserve Gap</span>
                    <span className={styles.metricValue}>
                      {fmtCurrency(selectedClaim.billedAmount - selectedClaim.reserveEstimate)} ({((1 - selectedClaim.reserveEstimate / selectedClaim.billedAmount) * 100).toFixed(1)}%)
                    </span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Settlement-Reserve Delta</span>
                    <span className={styles.metricValue}>
                      {fmtCurrency(Math.abs(selectedClaim.settlementRecommendation - selectedClaim.reserveEstimate))} {selectedClaim.settlementRecommendation <= selectedClaim.reserveEstimate ? 'under' : 'over'}
                    </span>
                  </div>

                  {/* Leakage Risk Meter */}
                  <div className={styles.leakageMeterSection}>
                    <span className={styles.metricLabel}>Leakage Risk</span>
                    <div className={styles.leakageMeter}>
                      <div
                        className={styles.leakageMeterFill}
                        style={{
                          width: `${(selectedClaim.leakageRisk * 100).toFixed(0)}%`,
                          background: selectedClaim.leakageRisk > 0.3 ? '#ef4444' : selectedClaim.leakageRisk >= 0.15 ? '#f59e0b' : '#22c55e',
                        }}
                      />
                    </div>
                    <span className={styles.leakageMeterValue}>{(selectedClaim.leakageRisk * 100).toFixed(0)}%</span>
                  </div>
                </div>

                {/* Negotiation History */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Negotiation History</h4>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Negotiation Rounds</span>
                    <span className={styles.metricValue}>{selectedClaim.negotiationRound}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Current Status</span>
                    <span className={styles.metricValue}>{selectedClaim.status}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Assigned Adjuster</span>
                    <span className={styles.metricValue}>{selectedClaim.adjuster}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Days in Current Status</span>
                    <span className={styles.metricValue}>{selectedClaim.daysOpen}d</span>
                  </div>

                  {/* Status Timeline */}
                  <div className={styles.timelineSection}>
                    <span className={styles.timelineLabel}>Status Timeline</span>
                    <div className={styles.timeline}>
                      <div className={`${styles.timelineStep} ${styles.timelineStepComplete}`}>
                        <div className={styles.timelineDot} />
                        <span>Initial Assessment</span>
                      </div>
                      <div className={`${styles.timelineStep} ${selectedClaim.status !== 'Initial Assessment' ? styles.timelineStepComplete : styles.timelineStepCurrent}`}>
                        <div className={styles.timelineDot} />
                        <span>Under Review</span>
                      </div>
                      <div className={`${styles.timelineStep} ${selectedClaim.status === 'In Negotiation' ? styles.timelineStepCurrent : styles.timelineStepPending}`}>
                        <div className={styles.timelineDot} />
                        <span>In Negotiation</span>
                      </div>
                      <div className={`${styles.timelineStep} ${styles.timelineStepPending}`}>
                        <div className={styles.timelineDot} />
                        <span>Settled</span>
                      </div>
                    </div>
                  </div>

                  {/* Adjuster Info */}
                  <div className={styles.adjusterInfo}>
                    <Users size={14} className={styles.adjusterIcon} />
                    <span className={styles.adjusterText}>
                      {selectedClaim.adjuster} is managing {openClaims.filter((c) => c.adjuster === selectedClaim.adjuster).length} open claim(s) with total exposure of {fmtCurrency(openClaims.filter((c) => c.adjuster === selectedClaim.adjuster).reduce((s, c) => s + c.billedAmount, 0))}.
                    </span>
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
                      <Loader2 size={18} className={styles.spinner} /> Running Settlement Optimizer...
                    </>
                  ) : (
                    <>
                      <Bot size={18} /> Run Settlement Optimizer
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
                        <Scale size={16} /> Settlement Optimizer — Recommendation
                      </h4>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Optimal Settlement Range</span>
                        <span className={styles.resultValue}>{agentResult.optimalRange}</span>
                      </div>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Negotiation Strategy</span>
                        <span className={styles.resultValue}>{agentResult.negotiationStrategy}</span>
                      </div>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Leakage Assessment</span>
                        <span className={styles.resultValue}>{agentResult.leakageAssessment}</span>
                      </div>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Counter-Offer Recommendations</span>
                        {agentResult.counterOfferRecommendations.map((rec, i) => (
                          <div key={i} className={styles.actionItem}>
                            <span className={styles.actionStep}>{i + 1}</span>
                            <span className={styles.actionText}>{rec}</span>
                          </div>
                        ))}
                      </div>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Timeline Recommendation</span>
                        <span className={styles.resultValue}>{agentResult.timelineRecommendation}</span>
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
            <Bot size={18} /> Settlement Optimization AI
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
                <p>Ask about settlement strategies, negotiation tactics, leakage prevention, reserve adequacy, or specific claim analysis.</p>
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
              placeholder={chatConfigured ? 'Ask about settlement strategies, negotiation tactics...' : 'AI not configured'}
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

export default ClaimsSettlementWorkstation;
