import type React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Construction } from 'lucide-react';
import { getUseCase } from '../data/domains';
import Breadcrumb from '../components/Breadcrumb';
import DistributionProductivityWorkstation from './DistributionProductivityWorkstation';
import ValueBasedProspectingWorkstation from './ValueBasedProspectingWorkstation';
import NextBestActionWorkstation from './NextBestActionWorkstation';
import RetentionManagementWorkstation from './RetentionManagementWorkstation';
import UnderwritingAutomationWorkstation from './UnderwritingAutomationWorkstation';
import TechnicalPricingWorkstation from './TechnicalPricingWorkstation';
import LifetimePricingWorkstation from './LifetimePricingWorkstation';
import MarketPricingNewWorkstation from './MarketPricingNewWorkstation';
import MarketPricingLapsesWorkstation from './MarketPricingLapsesWorkstation';
import E2EClaimsWorkstation from './E2EClaimsWorkstation';
import ClaimsPreventionWorkstation from './ClaimsPreventionWorkstation';
import FnolTriageWorkstation from './FnolTriageWorkstation';
import ClaimsSettlementWorkstation from './ClaimsSettlementWorkstation';
import NetworkOptimizationWorkstation from './NetworkOptimizationWorkstation';
import FraudDetectionWorkstation from './FraudDetectionWorkstation';
import ProviderRankingWorkstation from './ProviderRankingWorkstation';
import styles from './WorkstationRouter.module.css';

/* Specialized workstation pages by use case ID */
const WORKSTATION_MAP: Record<string, React.FC> = {
  'distribution-productivity': DistributionProductivityWorkstation,
  'value-based-prospecting': ValueBasedProspectingWorkstation,
  'next-best-action': NextBestActionWorkstation,
  'retention-management': RetentionManagementWorkstation,
  'underwriting-automation': UnderwritingAutomationWorkstation,
  'technical-pricing': TechnicalPricingWorkstation,
  'lifetime-pricing': LifetimePricingWorkstation,
  'market-pricing-new': MarketPricingNewWorkstation,
  'market-pricing-lapses': MarketPricingLapsesWorkstation,
  'e2e-claims': E2EClaimsWorkstation,
  'claims-prevention': ClaimsPreventionWorkstation,
  'fnol-triage': FnolTriageWorkstation,
  'claims-settlement': ClaimsSettlementWorkstation,
  'network-optimization': NetworkOptimizationWorkstation,
  'fraud-detection': FraudDetectionWorkstation,
  'provider-ranking': ProviderRankingWorkstation,
};

const WorkstationRouter: React.FC = () => {
  const { domainId, useCaseId } = useParams<{ domainId: string; useCaseId: string }>();
  const result = getUseCase(domainId ?? '', useCaseId ?? '');

  if (!result) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h2 style={{ color: 'var(--text-primary)' }}>Use case not found</h2>
          <Link to="/" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { domain, useCase } = result;

  /* If a specialized workstation exists, render it */
  const SpecializedWorkstation = WORKSTATION_MAP[useCaseId ?? ''];
  if (SpecializedWorkstation) {
    return <SpecializedWorkstation />;
  }

  /* Otherwise show placeholder */
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Breadcrumb items={[
          { label: 'Home', to: '/' },
          { label: domain.name, to: `/domain/${domain.id}` },
          { label: useCase.title },
        ]} />
        <Link to={`/domain/${domain.id}`} className={styles.backLink}>
          <ArrowLeft size={16} /> Back to {domain.name}
        </Link>
        <motion.div
          className={styles.placeholder}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Construction size={48} style={{ color: domain.accentColor }} />
          <h1 className={styles.title}>{useCase.title}</h1>
          <p className={styles.description}>{useCase.description}</p>
          <span className={styles.badge} style={{ borderColor: domain.accentColor, color: domain.accentColor }}>
            {domain.name}
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default WorkstationRouter;
