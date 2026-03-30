export interface UseCase {
  id: string;
  title: string;
  description: string;
}

export interface Domain {
  id: string;
  name: string;
  position: number;
  accentColor: string;
  description: string;
  useCases: UseCase[];
}

export const domains: Domain[] = [
  {
    id: 'distribution',
    name: 'Distribution, Sales & Marketing',
    position: 1,
    accentColor: '#00d4aa',
    description:
      'Optimize agent/broker channel performance, prospect targeting, cross-sell execution, and policyholder retention to maximize premium growth and reduce lapse rates.',
    useCases: [
      {
        id: 'distribution-productivity',
        title: 'Distribution Productivity Management',
        description:
          'Monitor and optimize insurance agent/broker performance across territories, analyzing conversion funnels, policies sold, and revenue to rebalance workloads and maximize channel output.',
      },
      {
        id: 'value-based-prospecting',
        title: 'Value-Based Prospecting',
        description:
          'Rank and prioritize prospects by estimated lifetime value, conversion probability, and demographic fit to optimize acquisition spend and improve targeting yield.',
      },
      {
        id: 'next-best-action',
        title: 'Next Best Action & Product Propensity',
        description:
          'Generate personalized action recommendations for existing members — cross-sell dental, upgrade plans, schedule wellness — ranked by expected value and uptake probability.',
      },
      {
        id: 'retention-management',
        title: 'Retention Management',
        description:
          'Identify policyholders at risk of lapsing using behavioral signals, tenure, claims history, and satisfaction scores, then recommend targeted retention interventions.',
      },
    ],
  },
  {
    id: 'underwriting',
    name: 'Underwriting & Pricing',
    position: 2,
    accentColor: '#3b82f6',
    description:
      'Automate risk assessment, calibrate actuarial models, and optimize market pricing to balance growth, profitability, and policyholder retention.',
    useCases: [
      {
        id: 'underwriting-automation',
        title: 'Underwriting Automation',
        description:
          'Process health insurance applications through automated risk assessment, flagging exceptions and generating auto-decisions with confidence scores to maximize straight-through processing.',
      },
      {
        id: 'technical-pricing',
        title: 'Technical Pricing',
        description:
          'Calibrate actuarial rating factors (age, BMI, smoking, chronic conditions) against emerging loss experience to maintain rate adequacy and premium sufficiency.',
      },
      {
        id: 'lifetime-pricing',
        title: 'Lifetime-Based Pricing',
        description:
          'Optimize first-year acquisition pricing by modeling multi-year persistency curves, claims trajectories, and lifetime P&L to maximize long-term portfolio value.',
      },
      {
        id: 'market-pricing-new',
        title: 'Market Pricing — New Business',
        description:
          'Benchmark against competitor rates and model price elasticity by segment to find optimal price points that balance market share growth with profitability targets.',
      },
      {
        id: 'market-pricing-lapses',
        title: 'Market Pricing — Lapse Prevention',
        description:
          'Generate personalized renewal offers for policies approaching renewal, balancing price sensitivity, retention probability, and margin preservation.',
      },
    ],
  },
  {
    id: 'claims',
    name: 'Claims Management',
    position: 3,
    accentColor: '#f59e0b',
    description:
      'Reduce claims costs through prevention, intelligent triage, settlement optimization, provider network management, and fraud detection.',
    useCases: [
      {
        id: 'e2e-claims',
        title: 'Gestión E2E de Siniestros',
        description:
          'Gestión integral del ciclo de vida del siniestro punta a punta — desde la ingesta multicanal y validación de elegibilidad, pasando por triage inteligente de 6 variables, supervisión hospitalaria con contención de costos, hasta la liquidación y pago optimizado.',
      },
      {
        id: 'claims-prevention',
        title: 'Claims Prevention',
        description:
          'Identify high-risk members through health profiling and proactively enroll them in wellness and disease management programs to reduce future claim frequency and severity.',
      },
      {
        id: 'fnol-triage',
        title: 'FNOL Triage & Best-Match Routing',
        description:
          'Intelligently score and classify incoming claims at first notice of loss, then route each claim to the best-matched adjuster based on specialization, capacity, and complexity.',
      },
      {
        id: 'claims-settlement',
        title: 'Claims Handling & Settlement Optimization',
        description:
          'Optimize open claim settlements by analyzing billed amounts, reserve estimates, negotiation history, and leakage risk to recommend fair and efficient settlement strategies.',
      },
      {
        id: 'network-optimization',
        title: 'Provider Network & Supplier Performance',
        description:
          'Evaluate healthcare providers by cost, quality scores, and patient outcomes to optimize network composition and identify tier adjustment opportunities.',
      },
      {
        id: 'fraud-detection',
        title: 'Fraud Detection',
        description:
          'Score claims for fraud risk using anomaly detection, pattern matching, and provider/member linkage analysis, with explainable AI confidence breakdowns.',
      },
      {
        id: 'provider-ranking',
        title: 'Gestión de Proveedores Hospitalarios',
        description:
          'Ranking integral de proveedores hospitalarios con scoring de 4 pilares (Costo, Eficiencia, Calidad, Integridad), mapa interactivo de México, radar de 18 KPIs, y motor de oportunidades de negociación.',
      },
    ],
  },
];

export function getDomain(domainId: string): Domain | undefined {
  return domains.find((d) => d.id === domainId);
}

export function getUseCase(
  domainId: string,
  useCaseId: string
): { domain: Domain; useCase: UseCase } | undefined {
  const domain = getDomain(domainId);
  if (!domain) return undefined;
  const useCase = domain.useCases.find((uc) => uc.id === useCaseId);
  if (!useCase) return undefined;
  return { domain, useCase };
}
