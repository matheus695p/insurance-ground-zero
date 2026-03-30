// ============================================================================
// FnolTriageWorkstation — FNOL Triage & Best-Match Routing
// Claims Management domain accent: #f59e0b (amber)
// ============================================================================

import { useState, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Bot,
  AlertTriangle,
  Users,
  Activity,
  DollarSign,
  BarChart3,
  Send,
  Loader2,
  Search,
  GitBranch,
  UserCheck,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { getUseCase } from '../data/domains';
import Breadcrumb from '../components/Breadcrumb';
import { useAIChat } from '../hooks/useAIChat';
import styles from './FnolTriageWorkstation.module.css';
import { incomingClaims, adjusterProfiles } from '../data/claims/fnol-triage-data';
import type { Claim, AdjusterProfile } from '../data/claims/types';

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

const severityClass = (severity: string): string => {
  switch (severity) {
    case 'Catastrophic': return styles.severityCatastrophic;
    case 'High': return styles.severityHigh;
    case 'Medium': return styles.severityMedium;
    case 'Low': return styles.severityLow;
    default: return '';
  }
};

const triageScoreClass = (score: number): string => {
  if (score > 75) return styles.triageHigh;
  if (score >= 40) return styles.triageMedium;
  return styles.triageLow;
};

// ---------------------------------------------------------------------------
// Agent result type
// ---------------------------------------------------------------------------

interface AgentResult {
  triageClassification: string;
  priorityLevel: string;
  matchedAdjuster: string;
  matchReasoning: string;
  expectedCycleTime: string;
  escalationTriggers: string[];
  rationale: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FnolTriageWorkstation: React.FC = () => {
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
    id: 'fnol-triage',
    title: 'FNOL Triage & Best-Match Routing',
    description:
      'Intelligent first notice of loss processing with automated triage scoring and optimal adjuster assignment based on specialization, capacity, and performance.',
  };

  // State
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [claimsOpen, setClaimsOpen] = useState(true);
  const [adjustersOpen, setAdjustersOpen] = useState(true);

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
      'You are an FNOL Triage AI agent for a health insurance company. You help process first notice of loss claims, assess severity and complexity, recommend triage classifications, and match claims to the best-qualified adjuster. Answer questions about claim triage, routing logic, adjuster workload balancing, and severity assessment.',
  });

  // ---------------------------------------------------------------------------
  // KPIs
  // ---------------------------------------------------------------------------

  const kpis = useMemo(() => {
    const totalClaims = incomingClaims.length;
    const avgTriageScore =
      incomingClaims.reduce((s, c) => s + c.triageScore, 0) / totalClaims;
    const catastrophicClaims = incomingClaims.filter(
      (c) => c.severity === 'Catastrophic'
    ).length;
    const availableCapacity = adjusterProfiles.reduce(
      (s, a) => s + (a.maxCapacity - a.activeCase),
      0
    );
    return { totalClaims, avgTriageScore, catastrophicClaims, availableCapacity };
  }, []);

  // ---------------------------------------------------------------------------
  // Filtered claims
  // ---------------------------------------------------------------------------

  const filteredClaims = useMemo(() => {
    let result = incomingClaims;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.claimNumber.toLowerCase().includes(q) ||
          c.memberName.toLowerCase().includes(q) ||
          c.provider.toLowerCase().includes(q) ||
          c.diagnosis.toLowerCase().includes(q) ||
          c.claimType.toLowerCase().includes(q)
      );
    }
    return result;
  }, [searchQuery]);

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  const selectedClaim = useMemo(
    () => incomingClaims.find((c) => c.id === selectedClaimId) ?? null,
    [selectedClaimId],
  );

  const handleRowClick = useCallback((claim: Claim) => {
    setSelectedClaimId((prev) => (prev === claim.id ? null : claim.id));
    setAgentResult(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Best-match adjuster logic
  // ---------------------------------------------------------------------------

  const getTopAdjusters = useCallback(
    (claim: Claim): (AdjusterProfile & { matchScore: number })[] => {
      const scored = adjusterProfiles.map((adj) => {
        let score = 0;

        // Specialization match
        const specMap: Record<string, string[]> = {
          Medical: ['Medical', 'Surgical'],
          Dental: ['Dental'],
          Vision: ['Vision'],
        };
        const matchSpecs = specMap[claim.claimType] || ['Medical'];
        if (matchSpecs.includes(adj.specialization)) score += 40;
        else if (adj.specialization === 'Medical') score += 15;

        // Mental-health claims bonus
        if (
          claim.diagnosis.toLowerCase().includes('depress') ||
          claim.diagnosis.toLowerCase().includes('substance') ||
          claim.diagnosis.toLowerCase().includes('behavioral')
        ) {
          if (adj.specialization === 'Mental Health') score += 40;
        }

        // Capacity (more room = better)
        const utilization = adj.activeCase / adj.maxCapacity;
        score += Math.round((1 - utilization) * 30);

        // Accuracy
        score += Math.round(adj.accuracyRate * 20);

        // Experience bonus for high-severity
        if (claim.severity === 'Catastrophic' || claim.severity === 'High') {
          score += Math.min(adj.experienceYears, 10);
        }

        return { ...adj, matchScore: Math.min(score, 100) };
      });

      return scored.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3);
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Agent: Triage Engine
  // ---------------------------------------------------------------------------

  const generateAnalysis = useCallback(() => {
    if (!selectedClaim) return;
    setIsGenerating(true);
    setAgentResult(null);

    setTimeout(() => {
      const claim = selectedClaim;

      const classificationMap: Record<string, string> = {
        Catastrophic: 'Critical Priority — Immediate senior adjuster assignment with medical director oversight',
        High: 'High Priority — Expedited review with experienced specialist adjuster',
        Medium: 'Standard Priority — Normal workflow with matched adjuster',
        Low: 'Auto-Adjudication Eligible — Fast-track processing, minimal manual review',
      };

      const priorityMap: Record<string, string> = {
        Catastrophic: 'P1 — Critical (SLA: 2 hours)',
        High: 'P2 — High (SLA: 24 hours)',
        Medium: 'P3 — Standard (SLA: 72 hours)',
        Low: 'P4 — Routine (SLA: 5 business days)',
      };

      const topAdj = getTopAdjusters(claim);
      const bestMatch = topAdj[0];

      const matchReasonParts: string[] = [];
      const specMap: Record<string, string[]> = {
        Medical: ['Medical', 'Surgical'],
        Dental: ['Dental'],
        Vision: ['Vision'],
      };
      const matchSpecs = specMap[claim.claimType] || ['Medical'];
      if (matchSpecs.includes(bestMatch.specialization)) {
        matchReasonParts.push(`Specialization match: ${bestMatch.specialization} aligns with ${claim.claimType} claim type`);
      }
      const util = ((bestMatch.activeCase / bestMatch.maxCapacity) * 100).toFixed(0);
      matchReasonParts.push(`Current utilization at ${util}% (${bestMatch.activeCase}/${bestMatch.maxCapacity} cases) — has capacity for new assignments`);
      matchReasonParts.push(`Accuracy rate of ${(bestMatch.accuracyRate * 100).toFixed(0)}% with ${bestMatch.experienceYears} years experience`);
      matchReasonParts.push(`Average cycle time of ${bestMatch.avgCycleTime} days aligns with SLA requirements`);

      const escalationTriggers: string[] = [];
      if (claim.severity === 'Catastrophic') {
        escalationTriggers.push('Auto-escalate to Medical Director for catastrophic claims');
        escalationTriggers.push('Notify VP of Claims within 1 hour of assignment');
      }
      if (claim.amount > 100000) {
        escalationTriggers.push(`High-value claim ($${fmt(claim.amount)}) — requires dual adjuster review`);
      }
      if (claim.triageScore > 90) {
        escalationTriggers.push(`Triage score ${claim.triageScore}/100 — flag for SIU pre-screening`);
      }
      if (claim.severity === 'High') {
        escalationTriggers.push('Senior adjuster sign-off required before settlement authorization');
      }
      if (escalationTriggers.length === 0) {
        escalationTriggers.push('No escalation triggers — standard processing workflow applies');
      }

      const expectedCycleMap: Record<string, string> = {
        Catastrophic: `${(bestMatch.avgCycleTime * 1.5).toFixed(1)} days (extended for catastrophic complexity)`,
        High: `${(bestMatch.avgCycleTime * 1.2).toFixed(1)} days (adjusted for high severity)`,
        Medium: `${bestMatch.avgCycleTime.toFixed(1)} days (standard cycle)`,
        Low: `${(bestMatch.avgCycleTime * 0.5).toFixed(1)} days (fast-track eligible)`,
      };

      const rationale: string[] = [
        `Claim ${claim.claimNumber} submitted by ${claim.memberName} for ${claim.diagnosis} at ${claim.provider}, valued at ${fmtCurrency(claim.amount)}.`,
        `Triage score of ${claim.triageScore}/100 classifies this as ${claim.severity} severity. ${claim.triageScore > 75 ? 'High complexity — requires experienced adjuster.' : claim.triageScore >= 40 ? 'Moderate complexity — standard adjuster pool.' : 'Low complexity — eligible for auto-adjudication.'}`,
        `Best-match adjuster: ${bestMatch.name} (${bestMatch.specialization}, ${(bestMatch.accuracyRate * 100).toFixed(0)}% accuracy, ${bestMatch.experienceYears}yr experience). Match score: ${bestMatch.matchScore}/100.`,
        `Runner-up options: ${topAdj[1]?.name ?? 'N/A'} (score: ${topAdj[1]?.matchScore ?? 0}) and ${topAdj[2]?.name ?? 'N/A'} (score: ${topAdj[2]?.matchScore ?? 0}).`,
        `Expected cycle time: ${expectedCycleMap[claim.severity] ?? `${bestMatch.avgCycleTime} days`}. SLA window: ${priorityMap[claim.severity] ?? 'Standard'}.`,
        `${escalationTriggers.length > 1 ? `${escalationTriggers.length - (escalationTriggers[0].includes('No escalation') ? 0 : 0)} escalation trigger(s) identified.` : 'No escalation triggers identified — standard workflow.'}`,
      ];

      setAgentResult({
        triageClassification: classificationMap[claim.severity] ?? 'Standard Priority',
        priorityLevel: priorityMap[claim.severity] ?? 'P3 — Standard',
        matchedAdjuster: `${bestMatch.name} (${bestMatch.specialization}) — Match Score: ${bestMatch.matchScore}/100`,
        matchReasoning: matchReasonParts.join('. ') + '.',
        expectedCycleTime: expectedCycleMap[claim.severity] ?? `${bestMatch.avgCycleTime} days`,
        escalationTriggers,
        rationale,
      });
      setIsGenerating(false);
    }, 2400);
  }, [selectedClaim, getTopAdjusters]);

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
          <h1 className={styles.heroTitle}>FNOL Triage &amp; Best-Match Routing</h1>
          <p className={styles.heroSubtitle}>
            Intelligent first notice of loss processing with automated triage scoring and optimal adjuster assignment.
            Leverages severity analysis, specialization matching, capacity balancing, and performance metrics to route
            each claim to the best-qualified adjuster for faster resolution and higher accuracy.
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
            <GitBranch size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{fmt(kpis.totalClaims)}</span>
            <span className={styles.kpiLabel}>Incoming Claims</span>
          </div>
          <div className={styles.kpiCard}>
            <Activity size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{kpis.avgTriageScore.toFixed(1)}</span>
            <span className={styles.kpiLabel}>Avg Triage Score</span>
          </div>
          <div className={styles.kpiCard}>
            <AlertTriangle size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{fmt(kpis.catastrophicClaims)}</span>
            <span className={styles.kpiLabel}>Catastrophic Claims</span>
          </div>
          <div className={styles.kpiCard}>
            <Users size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{fmt(kpis.availableCapacity)}</span>
            <span className={styles.kpiLabel}>Available Adjuster Capacity</span>
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
            placeholder="Search by claim number, member, provider, diagnosis, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </motion.div>

        {/* Incoming Claims Queue */}
        <motion.section
          className={styles.tableSection}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div
            className={styles.collapsibleHeader}
            onClick={() => setClaimsOpen((prev) => !prev)}
          >
            <h2 className={styles.sectionTitle}>
              <BarChart3 size={18} /> Incoming Claims Queue
              <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                ({filteredClaims.length} claims)
              </span>
            </h2>
            {claimsOpen ? (
              <ChevronDown size={18} className={styles.collapsibleIcon} />
            ) : (
              <ChevronRight size={18} className={styles.collapsibleIcon} />
            )}
          </div>
          <AnimatePresence initial={false}>
            {claimsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{ overflow: 'hidden' }}
              >
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Claim #</th>
                        <th>Member</th>
                        <th>Type</th>
                        <th>Severity</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Diagnosis</th>
                        <th>Provider</th>
                        <th>Triage Score</th>
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
                          <td>
                            <span className={`${styles.severityBadge} ${severityClass(claim.severity)}`}>
                              {claim.severity}
                            </span>
                          </td>
                          <td>{fmtCurrency(claim.amount)}</td>
                          <td>{claim.dateSubmitted}</td>
                          <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {claim.diagnosis}
                          </td>
                          <td>{claim.provider}</td>
                          <td>
                            <span className={`${styles.triageBadge} ${triageScoreClass(claim.triageScore)}`}>
                              {claim.triageScore}
                            </span>
                          </td>
                          <td>{claim.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* Adjuster Pool */}
        <motion.section
          className={styles.tableSection}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <div
            className={styles.collapsibleHeader}
            onClick={() => setAdjustersOpen((prev) => !prev)}
          >
            <h2 className={styles.sectionTitle}>
              <UserCheck size={18} /> Adjuster Pool
              <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>
                ({adjusterProfiles.length} adjusters)
              </span>
            </h2>
            {adjustersOpen ? (
              <ChevronDown size={18} className={styles.collapsibleIcon} />
            ) : (
              <ChevronRight size={18} className={styles.collapsibleIcon} />
            )}
          </div>
          <AnimatePresence initial={false}>
            {adjustersOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                style={{ overflow: 'hidden' }}
              >
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Specialization</th>
                        <th>Active Cases</th>
                        <th>Max Capacity</th>
                        <th>Utilization %</th>
                        <th>Avg Cycle Time</th>
                        <th>Accuracy Rate</th>
                        <th>Experience</th>
                      </tr>
                    </thead>
                    <tbody>
                      {adjusterProfiles.map((adj) => {
                        const utilization = ((adj.activeCase / adj.maxCapacity) * 100).toFixed(1);
                        return (
                          <tr key={adj.id} className={styles.tableRow}>
                            <td className={styles.nameCell}>{adj.id}</td>
                            <td>{adj.name}</td>
                            <td>{adj.specialization}</td>
                            <td>{adj.activeCase}</td>
                            <td>{adj.maxCapacity}</td>
                            <td>
                              <span
                                className={styles.triageBadge}
                                style={{
                                  background:
                                    parseFloat(utilization) > 90
                                      ? 'rgba(239, 68, 68, 0.14)'
                                      : parseFloat(utilization) > 75
                                      ? 'rgba(245, 158, 11, 0.14)'
                                      : 'rgba(34, 197, 94, 0.14)',
                                  color:
                                    parseFloat(utilization) > 90
                                      ? '#ef4444'
                                      : parseFloat(utilization) > 75
                                      ? '#f59e0b'
                                      : '#22c55e',
                                  border: `1px solid ${
                                    parseFloat(utilization) > 90
                                      ? 'rgba(239, 68, 68, 0.25)'
                                      : parseFloat(utilization) > 75
                                      ? 'rgba(245, 158, 11, 0.25)'
                                      : 'rgba(34, 197, 94, 0.25)'
                                  }`,
                                }}
                              >
                                {utilization}%
                              </span>
                            </td>
                            <td>{adj.avgCycleTime} days</td>
                            <td>{(adj.accuracyRate * 100).toFixed(0)}%</td>
                            <td>{adj.experienceYears} yrs</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
                  <GitBranch size={20} /> {selectedClaim.claimNumber}
                </h3>
                <span className={`${styles.severityBadge} ${severityClass(selectedClaim.severity)}`}>
                  {selectedClaim.severity}
                </span>
                <span className={`${styles.triageBadge} ${triageScoreClass(selectedClaim.triageScore)}`}>
                  Triage: {selectedClaim.triageScore}/100
                </span>
              </div>

              <div className={styles.detailGrid}>
                {/* Claim Summary */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Claim Summary</h4>
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
                    <span className={styles.metricLabel}>Type</span>
                    <span className={styles.metricValue}>{selectedClaim.claimType}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Amount</span>
                    <span className={styles.metricValue}>{fmtCurrency(selectedClaim.amount)}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Date Submitted</span>
                    <span className={styles.metricValue}>{selectedClaim.dateSubmitted}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Diagnosis</span>
                    <span className={styles.metricValue}>{selectedClaim.diagnosis}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Provider</span>
                    <span className={styles.metricValue}>{selectedClaim.provider}</span>
                  </div>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Status</span>
                    <span className={styles.metricValue}>{selectedClaim.status}</span>
                  </div>
                </div>

                {/* Triage Assessment */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Triage Assessment</h4>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Triage Score</span>
                    <span className={styles.metricValue}>
                      <span className={`${styles.triageBadge} ${triageScoreClass(selectedClaim.triageScore)}`}>
                        {selectedClaim.triageScore}/100
                      </span>
                    </span>
                  </div>

                  {/* Score Bar */}
                  <div style={{ margin: '12px 0 16px' }}>
                    <div
                      style={{
                        width: '100%',
                        height: 8,
                        borderRadius: 4,
                        background: 'rgba(148, 163, 184, 0.12)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${selectedClaim.triageScore}%`,
                          height: '100%',
                          borderRadius: 4,
                          background:
                            selectedClaim.triageScore > 75
                              ? '#ef4444'
                              : selectedClaim.triageScore >= 40
                              ? '#f59e0b'
                              : '#22c55e',
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                  </div>

                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Severity Analysis</span>
                    <span className={styles.metricValue}>
                      <span className={`${styles.severityBadge} ${severityClass(selectedClaim.severity)}`}>
                        {selectedClaim.severity}
                      </span>
                    </span>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <span className={styles.metricLabel} style={{ display: 'block', marginBottom: 8 }}>Complexity Factors</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {selectedClaim.amount > 50000 && (
                        <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>
                          High-value claim (${fmt(selectedClaim.amount)})
                        </span>
                      )}
                      {selectedClaim.severity === 'Catastrophic' && (
                        <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>
                          Catastrophic severity - requires senior adjuster
                        </span>
                      )}
                      {selectedClaim.triageScore > 85 && (
                        <span style={{ fontSize: '0.8rem', color: '#f97316' }}>
                          Elevated triage score - prioritize assignment
                        </span>
                      )}
                      {selectedClaim.claimType === 'Medical' && selectedClaim.amount > 10000 && (
                        <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>
                          Complex medical procedure - specialist review recommended
                        </span>
                      )}
                      {selectedClaim.amount <= 5000 && selectedClaim.severity === 'Low' && (
                        <span style={{ fontSize: '0.8rem', color: '#22c55e' }}>
                          Low complexity - auto-adjudication eligible
                        </span>
                      )}
                      {!(selectedClaim.amount > 50000) &&
                        selectedClaim.severity !== 'Catastrophic' &&
                        !(selectedClaim.triageScore > 85) &&
                        !(selectedClaim.claimType === 'Medical' && selectedClaim.amount > 10000) &&
                        !(selectedClaim.amount <= 5000 && selectedClaim.severity === 'Low') && (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            Standard complexity - normal workflow
                          </span>
                        )}
                    </div>
                  </div>
                </div>

                {/* Best-Match Adjuster */}
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Best-Match Adjuster</h4>
                  {getTopAdjusters(selectedClaim).map((adj, idx) => (
                    <div key={adj.id} className={styles.matchCard}>
                      <span className={styles.matchRank}>#{idx + 1}</span>
                      <div className={styles.matchInfo}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                          {adj.name}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {adj.specialization} | {adj.activeCase}/{adj.maxCapacity} cases |{' '}
                          {(adj.accuracyRate * 100).toFixed(0)}% accuracy | {adj.experienceYears}yr exp
                        </span>
                      </div>
                      <span className={styles.matchScore}>{adj.matchScore}</span>
                    </div>
                  ))}
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
                      <Loader2 size={18} className={styles.spinner} /> Running Triage Engine...
                    </>
                  ) : (
                    <>
                      <Bot size={18} /> Run Triage Engine
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
                        <GitBranch size={16} /> Triage Engine — Assessment
                      </h4>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Triage Classification</span>
                        <span className={styles.resultValue}>{agentResult.triageClassification}</span>
                      </div>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Priority Level</span>
                        <span className={styles.resultValue}>{agentResult.priorityLevel}</span>
                      </div>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Matched Adjuster</span>
                        <span className={styles.resultValue}>{agentResult.matchedAdjuster}</span>
                      </div>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Match Reasoning</span>
                        <span className={styles.resultValue}>{agentResult.matchReasoning}</span>
                      </div>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Expected Cycle Time</span>
                        <span className={styles.resultValue}>{agentResult.expectedCycleTime}</span>
                      </div>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Escalation Triggers</span>
                        {agentResult.escalationTriggers.map((trigger, i) => (
                          <div key={i} className={styles.actionItem}>
                            <span className={styles.actionStep}>{i + 1}</span>
                            <span className={styles.actionText}>{trigger}</span>
                          </div>
                        ))}
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
            <Bot size={18} /> FNOL Triage AI
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
                <p>Ask about claim triage logic, adjuster matching, severity assessment, routing strategies, or specific claim analysis.</p>
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
              placeholder={chatConfigured ? 'Ask about triage logic, adjuster matching, routing strategies...' : 'AI not configured'}
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

export default FnolTriageWorkstation;
