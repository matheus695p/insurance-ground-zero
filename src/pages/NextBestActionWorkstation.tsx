// ============================================================================
// NextBestActionWorkstation — Cross-sell & Product Propensity Engine
// Distribution domain accent: #00d4aa (teal)
// ============================================================================

import { useState, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Bot,
  TrendingUp,
  Users,
  Target,
  DollarSign,
  Activity,
  BarChart3,
  Send,
  Loader2,
  ShieldCheck,
  Heart,
  Package,
} from 'lucide-react';
import { getUseCase } from '../data/domains';
import Breadcrumb from '../components/Breadcrumb';
import { useAIChat } from '../hooks/useAIChat';
import styles from './NextBestActionWorkstation.module.css';
import { members } from '../data/distribution/next-best-action-data';
import type { Member } from '../data/distribution/types';

/* ── Agent result type ──────────────────────────────────────── */
interface AgentResult {
  primaryAction: string;
  secondaryActions: string[];
  expectedRevenueUplift: string;
  optimalTiming: string;
  rationale: string[];
}

/* ── Simulated agent recommendation ─────────────────────────── */
function generateRecommendation(member: Member): Promise<AgentResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const secondaryMap: Record<string, string[]> = {
        'Add Vision': [
          'Schedule annual wellness check-in',
          'Introduce HSA contribution matching',
          'Offer telemedicine add-on at 50% discount',
        ],
        'Add Dental': [
          'Bundle dental + vision for 15% savings',
          'Enroll in preventive care rewards program',
          'Recommend annual health risk assessment',
        ],
        'Upgrade to Family': [
          'Offer dependent coverage trial period',
          'Present maternity/newborn rider benefit',
          'Cross-sell pediatric dental bundle',
        ],
        'Wellness Package': [
          'Activate gym membership reimbursement',
          'Enroll in chronic care management program',
          'Offer mental health & EAP add-on',
        ],
      };

      const timingOptions = [
        '3 days before next engagement touchpoint',
        'Within 48 hours — high recent engagement detected',
        'At next policy review (7 days)',
        'During upcoming open enrollment window',
        'Immediately — engagement spike detected',
      ];

      const rationales: Record<string, string[]> = {
        'Add Vision': [
          `Member has ${member.tenure} years tenure with strong plan loyalty`,
          `Engagement score of ${member.engagementScore}/100 indicates receptivity`,
          `Propensity model shows ${(member.propensity * 100).toFixed(0)}% uptake probability`,
          `Vision add-on has 72% acceptance rate for similar demographic profiles`,
        ],
        'Add Dental': [
          `Current product gap: no dental coverage in ${member.currentPlan}`,
          `Claims history (${member.claimsCount} claims) suggests health-conscious behavior`,
          `Dental cross-sell yields avg $${member.expectedUplift} annual revenue`,
          `Members with dental coverage show 28% lower churn rate`,
        ],
        'Upgrade to Family': [
          `Age ${member.age} falls in peak family formation demographic`,
          `Current individual premium of $${member.monthlyPremium}/mo suggests upgrade capacity`,
          `Family plan upgrade averages $${member.expectedUplift} annual uplift`,
          `Propensity score ${(member.propensity * 100).toFixed(0)}% driven by life-stage indicators`,
        ],
        'Wellness Package': [
          `High engagement score (${member.engagementScore}/100) correlates with wellness adoption`,
          `Already holds ${member.productHoldings.length} products — strong cross-sell candidate`,
          `Wellness members have 35% higher 5-year retention`,
          `Expected uplift of $${member.expectedUplift} with 85% margin`,
        ],
      };

      resolve({
        primaryAction: member.crossSellOpportunity,
        secondaryActions:
          secondaryMap[member.crossSellOpportunity] ?? [
            'Schedule personalized consultation',
            'Send targeted email campaign',
            'Offer loyalty discount on add-on',
          ],
        expectedRevenueUplift: `$${member.expectedUplift.toLocaleString()}/yr`,
        optimalTiming: timingOptions[Math.floor(Math.random() * timingOptions.length)],
        rationale:
          rationales[member.crossSellOpportunity] ?? [
            `Member profile suggests high receptivity (score: ${member.engagementScore})`,
            `Propensity model confidence: ${(member.propensity * 100).toFixed(0)}%`,
            `Estimated uplift: $${member.expectedUplift}`,
            `Recommended based on peer cohort behavior`,
          ],
      });
    }, 2200);
  });
}

/* ══════════════════════════════════════════════════════════════ */
/*  Component                                                     */
/* ══════════════════════════════════════════════════════════════ */

const NextBestActionWorkstation: React.FC = () => {
  const { domainId, useCaseId } = useParams<{ domainId: string; useCaseId: string }>();
  const result = getUseCase(domainId ?? '', useCaseId ?? '');

  const domain = result?.domain ?? {
    id: 'distribution',
    name: 'Distribution, Sales & Marketing',
    accentColor: '#00d4aa',
    description: '',
    position: 1,
    useCases: [],
  };
  const useCase = result?.useCase ?? {
    id: 'next-best-action',
    title: 'Next Best Action & Product Propensity',
    description: 'Generate personalized action recommendations for existing members.',
  };

  /* ── State ──────────────────────────────────────────────────── */
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [agentResult, setAgentResult] = useState<AgentResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  /* ── KPIs ───────────────────────────────────────────────────── */
  const kpis = useMemo(() => {
    const totalMembers = members.length;
    const crossSellRate =
      (members.filter((m) => m.propensity > 0.5).length / totalMembers) * 100;
    const avgUplift =
      members.reduce((sum, m) => sum + m.expectedUplift, 0) / totalMembers;
    const avgEngagement =
      members.reduce((sum, m) => sum + m.engagementScore, 0) / totalMembers;
    return { totalMembers, crossSellRate, avgUplift, avgEngagement };
  }, []);

  /* ── Handlers ───────────────────────────────────────────────── */
  const handleSelectMember = useCallback((member: Member) => {
    setSelectedMember(member);
    setAgentResult(null);
  }, []);

  const handleRunAgent = useCallback(async () => {
    if (!selectedMember || isProcessing) return;
    setIsProcessing(true);
    setAgentResult(null);
    try {
      const rec = await generateRecommendation(selectedMember);
      setAgentResult(rec);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedMember, isProcessing]);

  /* ── Chat ───────────────────────────────────────────────────── */
  const {
    messages,
    inputValue,
    setInputValue,
    isLoading: chatLoading,
    send,
    handleKeyDown,
    configured,
  } = useAIChat({
    systemPrompt:
      'You are a Next Best Action AI agent for a health insurance company. You generate personalized action recommendations for members — cross-sell dental, upgrade plans, schedule wellness visits — ranked by expected value and uptake probability. Answer questions about member engagement, product propensity, and cross-sell strategies.',
  });

  /* ── Propensity color helper ────────────────────────────────── */
  const propensityClass = (p: number) => {
    if (p >= 0.75) return styles.propensityHigh;
    if (p >= 0.5) return styles.propensityMedium;
    return styles.propensityLow;
  };

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Breadcrumb & back */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Breadcrumb
            items={[
              { label: 'Home', to: '/' },
              { label: domain.name, to: `/domain/${domain.id}` },
              { label: useCase.title },
            ]}
          />
        </motion.div>

        <Link to={`/domain/${domain.id}`} className={styles.backLink}>
          <ArrowLeft size={16} /> Back to {domain.name}
        </Link>

        {/* Hero banner */}
        <motion.div
          className={styles.heroBanner}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className={styles.heroTitle}>{useCase.title}</h1>
          <p className={styles.heroSubtitle}>{useCase.description}</p>
        </motion.div>

        {/* KPI row */}
        <motion.div
          className={styles.kpiRow}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className={styles.kpiCard}>
            <Users size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{kpis.totalMembers}</span>
            <span className={styles.kpiLabel}>Total Members</span>
          </div>
          <div className={styles.kpiCard}>
            <Target size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{kpis.crossSellRate.toFixed(1)}%</span>
            <span className={styles.kpiLabel}>Avg Cross-Sell Rate</span>
          </div>
          <div className={styles.kpiCard}>
            <DollarSign size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>${kpis.avgUplift.toFixed(0)}</span>
            <span className={styles.kpiLabel}>Avg Revenue Uplift</span>
          </div>
          <div className={styles.kpiCard}>
            <Activity size={20} className={styles.kpiIcon} />
            <span className={styles.kpiValue}>{kpis.avgEngagement.toFixed(1)}</span>
            <span className={styles.kpiLabel}>Avg Engagement</span>
          </div>
        </motion.div>

        {/* Data table */}
        <motion.section
          className={styles.section}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <h2 className={styles.sectionTitle}>
            <BarChart3 size={18} /> Member Cross-Sell Portfolio
          </h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Current Plan</th>
                  <th>Monthly Premium</th>
                  <th>Product Holdings</th>
                  <th>Cross-Sell Opportunity</th>
                  <th>Propensity</th>
                  <th>Expected Uplift</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr
                    key={m.id}
                    className={`${styles.tableRow} ${selectedMember?.id === m.id ? styles.selectedRow : ''}`}
                    onClick={() => handleSelectMember(m)}
                  >
                    <td className={styles.nameCell}>{m.name}</td>
                    <td>{m.age}</td>
                    <td>{m.currentPlan}</td>
                    <td>${m.monthlyPremium.toLocaleString()}</td>
                    <td>
                      <span className={styles.holdingsList}>
                        {m.productHoldings.join(', ')}
                      </span>
                    </td>
                    <td>
                      <span className={styles.badge}>{m.crossSellOpportunity}</span>
                    </td>
                    <td>
                      <span className={propensityClass(m.propensity)}>
                        {(m.propensity * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className={styles.upliftCell}>
                      ${m.expectedUplift.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.section>

        {/* Detail panel */}
        <AnimatePresence>
          {selectedMember && (
            <motion.section
              className={styles.detailPanel}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
            >
              <div className={styles.detailGrid}>
                {/* Profile card */}
                <div className={styles.profileCard}>
                  <h3 className={styles.detailTitle}>
                    <ShieldCheck size={18} /> Member Profile
                  </h3>
                  <div className={styles.profileRow}>
                    <span className={styles.profileLabel}>Name</span>
                    <span className={styles.profileValue}>{selectedMember.name}</span>
                  </div>
                  <div className={styles.profileRow}>
                    <span className={styles.profileLabel}>Age</span>
                    <span className={styles.profileValue}>{selectedMember.age}</span>
                  </div>
                  <div className={styles.profileRow}>
                    <span className={styles.profileLabel}>Plan</span>
                    <span className={styles.profileValue}>{selectedMember.currentPlan}</span>
                  </div>
                  <div className={styles.profileRow}>
                    <span className={styles.profileLabel}>Tenure</span>
                    <span className={styles.profileValue}>{selectedMember.tenure} yrs</span>
                  </div>
                  <div className={styles.profileRow}>
                    <span className={styles.profileLabel}>Claims</span>
                    <span className={styles.profileValue}>{selectedMember.claimsCount}</span>
                  </div>
                  <div className={styles.profileRow}>
                    <span className={styles.profileLabel}>Engagement</span>
                    <span className={styles.profileValue}>{selectedMember.engagementScore}/100</span>
                  </div>

                  <h4 className={styles.subTitle}>Product Holdings</h4>
                  <div className={styles.tagList}>
                    {selectedMember.productHoldings.map((p) => (
                      <span key={p} className={styles.tag}>
                        <Package size={12} /> {p}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action queue */}
                <div className={styles.actionQueue}>
                  <h3 className={styles.detailTitle}>
                    <Target size={18} /> Recommended Actions
                  </h3>

                  <div className={styles.actionItem}>
                    <span className={styles.actionRank}>1</span>
                    <div className={styles.actionBody}>
                      <strong>{selectedMember.crossSellOpportunity}</strong>
                      <span className={styles.actionMeta}>
                        Propensity: {(selectedMember.propensity * 100).toFixed(0)}% | Uplift: $
                        {selectedMember.expectedUplift.toLocaleString()}/yr
                      </span>
                    </div>
                  </div>

                  <button
                    className={`${styles.agentButton} ${isProcessing ? styles.processing : ''}`}
                    onClick={handleRunAgent}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className={styles.spinner} /> Generating action queue...
                      </>
                    ) : (
                      <>
                        <Bot size={16} /> Generate Full Action Queue
                      </>
                    )}
                  </button>

                  {isProcessing && <div className={styles.processingBar} />}

                  <AnimatePresence>
                    {agentResult && (
                      <motion.div
                        className={styles.agentResult}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h4 className={styles.resultTitle}>
                          <TrendingUp size={16} /> AI-Generated Action Queue
                        </h4>

                        <div className={styles.resultSection}>
                          <span className={styles.resultLabel}>Primary Action</span>
                          <span className={styles.resultValue}>{agentResult.primaryAction}</span>
                        </div>

                        <div className={styles.resultSection}>
                          <span className={styles.resultLabel}>Secondary Actions</span>
                          {agentResult.secondaryActions.map((a, i) => (
                            <div key={i} className={styles.resultItem}>
                              <span className={styles.actionRankSmall}>{i + 2}</span>
                              {a}
                            </div>
                          ))}
                        </div>

                        <div className={styles.resultSection}>
                          <span className={styles.resultLabel}>Expected Revenue Uplift</span>
                          <span className={styles.resultValue}>{agentResult.expectedRevenueUplift}</span>
                        </div>

                        <div className={styles.resultSection}>
                          <span className={styles.resultLabel}>Optimal Timing</span>
                          <span className={styles.resultValue}>{agentResult.optimalTiming}</span>
                        </div>

                        <div className={styles.rationale}>
                          <span className={styles.resultLabel}>Rationale</span>
                          <ul>
                            {agentResult.rationale.map((r, i) => (
                              <li key={i}>{r}</li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Chat section */}
        <motion.section
          className={styles.chatSection}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <h2 className={styles.sectionTitle}>
            <Bot size={18} /> AI Agent Chat
          </h2>

          {!configured && (
            <p className={styles.chatNotice}>
              AI chat is not configured. Set your API key in the environment to enable live responses.
            </p>
          )}

          <div className={styles.chatMessages}>
            {messages.length === 0 && (
              <div className={styles.chatEmpty}>
                <Bot size={32} />
                <p>Ask about member engagement, cross-sell strategies, or product propensity.</p>
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${styles.chatMessage} ${
                  msg.role === 'user' ? styles.chatUser : styles.chatAssistant
                }`}
              >
                {msg.isTyping ? (
                  <span className={styles.typingDots}>
                    <span />
                    <span />
                    <span />
                  </span>
                ) : (
                  <p>{msg.content}</p>
                )}
                {!msg.isTyping && <span className={styles.chatTimestamp}>{msg.timestamp}</span>}
              </div>
            ))}
          </div>

          <div className={styles.chatInputRow}>
            <input
              type="text"
              className={styles.chatInput}
              placeholder="Ask the NBA agent..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={chatLoading}
            />
            <button
              className={styles.chatSend}
              onClick={() => send()}
              disabled={chatLoading || !inputValue.trim()}
            >
              {chatLoading ? <Loader2 size={16} className={styles.spinner} /> : <Send size={16} />}
            </button>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default NextBestActionWorkstation;
