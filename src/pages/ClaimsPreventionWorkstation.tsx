// ============================================================================
// ClaimsPreventionWorkstation — Claims Prevention
// Claims Management domain accent: #f59e0b (amber)
// ============================================================================

import { useState, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Bot, Heart, Users, Activity, DollarSign, BarChart3, Send, Loader2, Search, Shield, TrendingDown } from 'lucide-react';
import { getUseCase } from '../data/domains';
import Breadcrumb from '../components/Breadcrumb';
import { useAIChat } from '../hooks/useAIChat';
import styles from './ClaimsPreventionWorkstation.module.css';
import { memberHealthProfiles } from '../data/claims/claims-prevention-data';
import type { MemberHealthProfile } from '../data/claims/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number): string => n.toLocaleString('en-US');

const fmtCurrency = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const riskClass = (score: number): string => {
  if (score > 80) return styles.riskCritical;
  if (score > 60) return styles.riskHigh;
  if (score > 40) return styles.riskMedium;
  return styles.riskLow;
};

const wellnessClass = (enrolled: boolean): string =>
  enrolled ? styles.wellnessYes : styles.wellnessNo;

// ---------------------------------------------------------------------------
// Agent result type
// ---------------------------------------------------------------------------

interface AgentResult {
  riskAssessment: string;
  recommendedInterventions: { program: string; expectedImpact: string }[];
  estimatedCostSavings: string;
  engagementStrategy: string;
  rationale: string[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ClaimsPreventionWorkstation: React.FC = () => {
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
    id: 'claims-prevention',
    title: 'Claims Prevention',
    description: 'Identify high-risk members and proactively enroll them in wellness programs.',
  };

  // State
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
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
      'You are a Claims Prevention AI agent for a health insurance company. You analyze member health profiles, identify high-risk individuals, recommend wellness programs, design early intervention strategies, and optimize preventive care initiatives to reduce future claims. Answer questions about population health management, chronic disease prevention, wellness program design, and cost-effectiveness of preventive measures.',
  });

  // ---------------------------------------------------------------------------
  // KPIs
  // ---------------------------------------------------------------------------

  const kpis = useMemo(() => {
    const totalMembers = memberHealthProfiles.length;
    const avgRiskScore = memberHealthProfiles.reduce((s, m) => s + m.riskScore, 0) / totalMembers;
    const highRiskMembers = memberHealthProfiles.filter((m) => m.riskScore > 70).length;
    const totalAnnualCost = memberHealthProfiles.reduce((s, m) => s + m.costLast12Months, 0);
    return { totalMembers, avgRiskScore, highRiskMembers, totalAnnualCost };
  }, []);

  // ---------------------------------------------------------------------------
  // Filtered members
  // ---------------------------------------------------------------------------

  const filteredMembers = useMemo(() => {
    let data = memberHealthProfiles;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.chronicConditions.some((cc) => cc.toLowerCase().includes(q)) ||
          m.preventionEligible.some((pe) => pe.toLowerCase().includes(q)) ||
          m.id.toLowerCase().includes(q)
      );
    }
    return data;
  }, [searchQuery]);

  // ---------------------------------------------------------------------------
  // Selection
  // ---------------------------------------------------------------------------

  const selectedMember = useMemo(
    () => memberHealthProfiles.find((m) => m.id === selectedMemberId) ?? null,
    [selectedMemberId],
  );

  const handleRowClick = useCallback((member: MemberHealthProfile) => {
    setSelectedMemberId((prev) => (prev === member.id ? null : member.id));
    setAgentResult(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Agent: Prevention Advisor
  // ---------------------------------------------------------------------------

  const generateAnalysis = useCallback(() => {
    if (!selectedMember) return;
    setIsGenerating(true);
    setAgentResult(null);

    setTimeout(() => {
      const member = selectedMember;

      const riskLabel =
        member.riskScore > 80
          ? 'Critical Risk — Immediate intervention recommended'
          : member.riskScore > 60
          ? 'High Risk — Prioritize for prevention programs'
          : member.riskScore > 40
          ? 'Moderate Risk — Monitor and engage in wellness'
          : 'Low Risk — Maintain current wellness participation';

      const interventionMap: Record<string, { program: string; expectedImpact: string }> = {
        'Diabetes Management Program': { program: 'Diabetes Management Program', expectedImpact: '18-25% reduction in diabetes-related claims within 12 months' },
        'Blood Pressure Monitoring': { program: 'Blood Pressure Monitoring', expectedImpact: '15-20% reduction in hypertension-related ER visits' },
        'Cardiac Rehabilitation': { program: 'Cardiac Rehabilitation', expectedImpact: '22-30% reduction in cardiac event readmissions' },
        'Weight Management Program': { program: 'Weight Management Program', expectedImpact: '12-18% reduction in obesity-related comorbidity costs' },
        'Pulmonary Rehabilitation': { program: 'Pulmonary Rehabilitation', expectedImpact: '20-28% reduction in COPD-related hospitalizations' },
        'Mental Health Wellness Program': { program: 'Mental Health Wellness Program', expectedImpact: '15-22% improvement in treatment adherence and reduced crisis interventions' },
        'Medication Therapy Management': { program: 'Medication Therapy Management', expectedImpact: '25-35% improvement in medication adherence scores' },
        'Cholesterol Screening': { program: 'Cholesterol Screening', expectedImpact: '10-15% early detection of cardiovascular risk factors' },
        'Flu Vaccination': { program: 'Flu Vaccination', expectedImpact: '40-60% reduction in influenza-related claims during season' },
        'Annual Wellness Visit': { program: 'Annual Wellness Visit', expectedImpact: '8-12% reduction in undetected chronic condition progression' },
        'Nutritional Counseling': { program: 'Nutritional Counseling', expectedImpact: '10-16% improvement in metabolic markers' },
        'Smoking Cessation': { program: 'Smoking Cessation', expectedImpact: '30-40% reduction in respiratory claims over 24 months' },
        'Fall Prevention Program': { program: 'Fall Prevention Program', expectedImpact: '25-35% reduction in fall-related injury claims' },
        'Stress Management Workshop': { program: 'Stress Management Workshop', expectedImpact: '12-18% reduction in stress-related absenteeism claims' },
        'Cardiac Monitoring': { program: 'Cardiac Monitoring', expectedImpact: '20-25% earlier detection of cardiac events' },
        'Annual Eye Exam': { program: 'Annual Eye Exam', expectedImpact: '15-20% early detection of diabetic retinopathy' },
        'Pulmonary Function Testing': { program: 'Pulmonary Function Testing', expectedImpact: '12-18% better asthma management outcomes' },
        'A1C Monitoring': { program: 'A1C Monitoring', expectedImpact: '20-28% improvement in glycemic control' },
        'Annual Stress Test': { program: 'Annual Stress Test', expectedImpact: '15-22% earlier detection of cardiac conditions' },
      };

      const recommendedInterventions = member.preventionEligible.map((pe) =>
        interventionMap[pe] || { program: pe, expectedImpact: '10-15% estimated claims reduction through proactive engagement' }
      );

      const baseSavings = member.costLast12Months * (member.riskScore > 80 ? 0.22 : member.riskScore > 60 ? 0.18 : member.riskScore > 40 ? 0.12 : 0.08);
      const adherenceMultiplier = member.medicationAdherence < 0.6 ? 1.3 : member.medicationAdherence < 0.8 ? 1.1 : 1.0;
      const estimatedSavings = baseSavings * adherenceMultiplier;

      const riskLevel = member.riskScore > 60 ? 'high' : member.riskScore > 40 ? 'moderate' : 'low';

      const strategyMap: Record<string, string> = {
        high_true: `${member.name} is already enrolled in wellness programs. Focus on increasing medication adherence (currently ${(member.medicationAdherence * 100).toFixed(0)}%) through personalized reminders, pharmacist consultations, and care coordinator follow-ups.`,
        high_false: `${member.name} is HIGH PRIORITY for enrollment. With a risk score of ${member.riskScore} and no current wellness participation, outreach should include: personal health coach call within 48 hours, simplified enrollment in ${member.preventionEligible[0]}, and financial incentive for first 90 days.`,
        moderate_true: `${member.name} is on track with wellness participation. Maintain engagement through regular communications and gradually introduce additional programs like ${member.preventionEligible[member.preventionEligible.length - 1]}.`,
        moderate_false: `${member.name} would benefit from wellness enrollment. Approach with educational materials about ${member.chronicConditions.join(' and ')} management and offer guided onboarding.`,
        low_true: `${member.name} is well-managed. Continue current wellness program participation and ensure annual screenings remain up to date.`,
        low_false: `${member.name} has low risk but could benefit from basic wellness programs. Invite to community health events and offer ${member.preventionEligible.join(' and ')} at next annual visit.`,
      };

      const strategyKey = `${riskLevel}_${member.wellnessEnrolled}`;
      const engagementStrategy = strategyMap[strategyKey] || `Personalized outreach recommended for ${member.name}.`;

      const rationale: string[] = [
        `${member.name} (${member.age}y/${member.gender}) presents with ${member.chronicConditions.length} chronic condition(s): ${member.chronicConditions.join(', ')}.`,
        `Risk score of ${member.riskScore}/100 places this member in the ${riskLevel} risk tier.`,
        `Medication adherence is ${(member.medicationAdherence * 100).toFixed(0)}% — ${member.medicationAdherence >= 0.8 ? 'within acceptable range' : member.medicationAdherence >= 0.6 ? 'below optimal levels' : 'critically low, increasing adverse event likelihood'}.`,
        `${member.claimsLast12Months} claims totaling ${fmtCurrency(member.costLast12Months)} in the past 12 months.`,
        `Last screening: ${member.lastScreening}. ${new Date(member.lastScreening) < new Date('2025-06-01') ? 'Overdue for screening.' : 'Screening is relatively current.'}`,
        `${member.preventionEligible.length} prevention programs identified. Estimated annual savings of ${fmtCurrency(estimatedSavings)} through full program participation.`,
      ];

      setAgentResult({
        riskAssessment: riskLabel,
        recommendedInterventions,
        estimatedCostSavings: `${fmtCurrency(estimatedSavings)} estimated annual savings (${((estimatedSavings / member.costLast12Months) * 100).toFixed(1)}% reduction)`,
        engagementStrategy,
        rationale,
      });
      setIsGenerating(false);
    }, 2200);
  }, [selectedMember]);

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
          <p className={styles.heroSubtitle}>
            Prevent claims through proactive wellness programs, early intervention strategies, and member health risk
            stratification. Identify high-risk members, recommend targeted prevention programs, and track engagement
            to reduce future claims and improve health outcomes.
          </p>
        </motion.div>

        {/* KPI Row */}
        <motion.div className={styles.kpiRow} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <div className={styles.kpiCard}>
            <Users size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{fmt(kpis.totalMembers)}</span>
            <span className={styles.kpiLabel}>Total Members</span>
          </div>
          <div className={styles.kpiCard}>
            <Activity size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{kpis.avgRiskScore.toFixed(1)}</span>
            <span className={styles.kpiLabel}>Avg Risk Score</span>
          </div>
          <div className={styles.kpiCard}>
            <Shield size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{fmt(kpis.highRiskMembers)}</span>
            <span className={styles.kpiLabel}>High-Risk Members</span>
          </div>
          <div className={styles.kpiCard}>
            <DollarSign size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{fmtCurrency(kpis.totalAnnualCost)}</span>
            <span className={styles.kpiLabel}>Total Annual Cost</span>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div className={styles.searchBar} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name, conditions, eligibility programs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </motion.div>

        {/* Data Table */}
        <motion.section className={styles.tableSection} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
          <h2 className={styles.sectionTitle}>
            <BarChart3 size={18} /> Member Health Profiles
          </h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>Chronic Conditions</th>
                  <th>Risk Score</th>
                  <th>Wellness</th>
                  <th>Last Screening</th>
                  <th>Med. Adherence</th>
                  <th>Claims (12mo)</th>
                  <th>Cost (12mo)</th>
                  <th>Prevention Programs</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => (
                  <tr
                    key={member.id}
                    className={`${styles.tableRow} ${selectedMemberId === member.id ? styles.selectedRow : ''}`}
                    onClick={() => handleRowClick(member)}
                  >
                    <td className={styles.nameCell}>{member.id}</td>
                    <td>{member.name}</td>
                    <td>{member.age}</td>
                    <td>{member.gender}</td>
                    <td>
                      <div className={styles.conditionGroup}>
                        {member.chronicConditions.slice(0, 2).map((cc) => (
                          <span key={cc} className={styles.conditionTag}>{cc}</span>
                        ))}
                        {member.chronicConditions.length > 2 && (
                          <span className={styles.conditionMore}>+{member.chronicConditions.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.riskBadge} ${riskClass(member.riskScore)}`}>{member.riskScore}</span>
                    </td>
                    <td>
                      <span className={`${styles.wellnessBadge} ${wellnessClass(member.wellnessEnrolled)}`}>
                        {member.wellnessEnrolled ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td>{member.lastScreening}</td>
                    <td>{(member.medicationAdherence * 100).toFixed(0)}%</td>
                    <td>{member.claimsLast12Months}</td>
                    <td>{fmtCurrency(member.costLast12Months)}</td>
                    <td>
                      <div className={styles.conditionGroup}>
                        {member.preventionEligible.slice(0, 1).map((pe) => (
                          <span key={pe} className={styles.programTag}>{pe}</span>
                        ))}
                        {member.preventionEligible.length > 1 && (
                          <span className={styles.conditionMore}>+{member.preventionEligible.length - 1}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedMember && (
            <motion.section
              className={styles.detailPanel}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className={styles.detailHeader}>
                <h3 className={styles.detailTitle}>
                  <Heart size={20} /> {selectedMember.name}
                </h3>
                <span className={`${styles.riskBadge} ${riskClass(selectedMember.riskScore)}`}>
                  Risk: {selectedMember.riskScore}
                </span>
                <span className={`${styles.wellnessBadge} ${wellnessClass(selectedMember.wellnessEnrolled)}`}>
                  {selectedMember.wellnessEnrolled ? 'Wellness Enrolled' : 'Not Enrolled'}
                </span>
              </div>

              <div className={styles.detailGrid}>
                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Member Profile</h4>
                  <div className={styles.metricRow}><span className={styles.metricLabel}>Name</span><span className={styles.metricValue}>{selectedMember.name}</span></div>
                  <div className={styles.metricRow}><span className={styles.metricLabel}>Age</span><span className={styles.metricValue}>{selectedMember.age}</span></div>
                  <div className={styles.metricRow}><span className={styles.metricLabel}>Gender</span><span className={styles.metricValue}>{selectedMember.gender}</span></div>
                  <div className={styles.metricRow}><span className={styles.metricLabel}>Conditions</span><span className={styles.metricValue}>{selectedMember.chronicConditions.join(', ')}</span></div>
                  <div className={styles.metricRow}><span className={styles.metricLabel}>Risk Score</span><span className={styles.metricValue}>{selectedMember.riskScore}/100</span></div>
                </div>

                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Health Metrics</h4>
                  <div className={styles.metricRow}><span className={styles.metricLabel}>Medication Adherence</span><span className={styles.metricValue}>{(selectedMember.medicationAdherence * 100).toFixed(0)}%</span></div>
                  <div className={styles.adherenceBarWrapper}>
                    <div className={styles.adherenceBar} style={{ width: `${selectedMember.medicationAdherence * 100}%` }} />
                  </div>
                  <div className={styles.metricRow}><span className={styles.metricLabel}>Claims (12 months)</span><span className={styles.metricValue}>{selectedMember.claimsLast12Months}</span></div>
                  <div className={styles.metricRow}><span className={styles.metricLabel}>Annual Cost</span><span className={styles.metricValue}>{fmtCurrency(selectedMember.costLast12Months)}</span></div>
                  <div className={styles.metricRow}><span className={styles.metricLabel}>Last Screening</span><span className={styles.metricValue}>{selectedMember.lastScreening}</span></div>
                </div>

                <div className={styles.detailCard}>
                  <h4 className={styles.detailCardTitle}>Prevention Opportunities</h4>
                  <div className={styles.metricRow}>
                    <span className={styles.metricLabel}>Wellness Enrollment</span>
                    <span className={styles.metricValue}>{selectedMember.wellnessEnrolled ? 'Currently Enrolled' : 'Not Enrolled'}</span>
                  </div>
                  <div className={styles.programList}>
                    <span className={styles.programListTitle}>Eligible Programs</span>
                    {selectedMember.preventionEligible.map((pe) => (
                      <div key={pe} className={styles.programItem}>
                        <TrendingDown size={12} />
                        <span>{pe}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Agent Button */}
              <div className={styles.agentSection}>
                <button className={styles.agentButton} onClick={generateAnalysis} disabled={isGenerating}>
                  {isGenerating ? (
                    <><Loader2 size={18} className={styles.spinner} /> Running Prevention Advisor...</>
                  ) : (
                    <><Bot size={18} /> Analyze with Prevention Advisor</>
                  )}
                </button>

                <AnimatePresence>
                  {agentResult && (
                    <motion.div className={styles.agentResult} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }} transition={{ duration: 0.3 }}>
                      <h4 className={styles.resultTitle}><Shield size={16} /> Prevention Advisor — Assessment</h4>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Risk Assessment</span>
                        <span className={styles.resultValue}>{agentResult.riskAssessment}</span>
                      </div>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Recommended Interventions</span>
                        {agentResult.recommendedInterventions.map((intervention, i) => (
                          <div key={i} className={styles.actionItem}>
                            <span className={styles.actionStep}>{i + 1}</span>
                            <span className={styles.actionText}>
                              <strong>{intervention.program}</strong> — {intervention.expectedImpact}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Estimated Cost Savings</span>
                        <span className={styles.resultValue}>{agentResult.estimatedCostSavings}</span>
                      </div>

                      <div className={styles.resultSection}>
                        <span className={styles.resultLabel}>Engagement Strategy</span>
                        <span className={styles.resultValue}>{agentResult.engagementStrategy}</span>
                      </div>

                      <div className={styles.rationaleSection}>
                        <span className={styles.resultLabel}>Rationale</span>
                        <ul className={styles.rationaleList}>
                          {agentResult.rationale.map((r, i) => (<li key={i}>{r}</li>))}
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
        <motion.section className={styles.chatSection} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <h2 className={styles.sectionTitle}><Bot size={18} /> Claims Prevention AI</h2>

          {!chatConfigured && (
            <p className={styles.chatNotice}>AI chat requires configuration. Set up your AI provider to enable this feature.</p>
          )}

          <div className={styles.chatMessages}>
            {messages.length === 0 && (
              <div className={styles.chatPlaceholder}>
                <Bot size={32} />
                <p>Ask about wellness programs, prevention strategies, member risk management, or health intervention design.</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={msg.role === 'user' ? styles.chatMessageUser : styles.chatMessageAssistant}>
                {msg.isTyping ? (
                  <div className={styles.typingIndicator}><span /><span /><span /></div>
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
              placeholder={chatConfigured ? 'Ask about wellness programs, prevention strategies...' : 'AI not configured'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!chatConfigured || chatLoading}
            />
            <button className={styles.chatSendButton} onClick={() => sendChat()} disabled={!chatConfigured || chatLoading || !inputValue.trim()}>
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

export default ClaimsPreventionWorkstation;
