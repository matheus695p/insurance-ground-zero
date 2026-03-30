// ============================================================================
// Provider Ranking Domain — Type Definitions
// Gestión de Proveedores Hospitalarios (GNP – GMM)
// ============================================================================

export type ScoringPreset = 'balanced' | 'cost-containment' | 'experience-focused';

export interface ScoringWeights {
  cost: number;
  efficiency: number;
  quality: number;
  integrity: number;
}

export type KPIPillar = 'cost' | 'efficiency' | 'quality' | 'integrity';

export interface KPIDefinition {
  id: string;
  name: string;
  pillar: KPIPillar;
  unit: string;
  higherIsBetter: boolean;
  benchmark: number;
}

export interface KPIValue {
  kpiId: string;
  value: number;
  score05: number;
  score100: number;
  benchmark: number;
  trend: 'up' | 'down' | 'stable';
  delta: number;
}

export interface PillarScore {
  pillar: KPIPillar;
  label: string;
  score05: number;
  score100: number;
  weight: number;
  kpis: KPIValue[];
}

export type HospitalLevel = 'P100' | 'P200' | 'P300';
export type HospitalSegment = 'Premier' | 'Flexibles';

export interface RiskFlag {
  id: string;
  label: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface Hospital {
  id: string;
  name: string;
  city: string;
  state: string;
  stateCode: string;
  level: HospitalLevel;
  segment: HospitalSegment;
  paidU12M: number;
  casesU12M: number;
  score05: number;
  score100: number;
  pillarScores: PillarScore[];
  kpiValues: KPIValue[];
  riskFlags: RiskFlag[];
  highReadmissions: boolean;
  highALOS: boolean;
  highEmergencyPct: boolean;
  highCostPct: boolean;
  fraudAlerts: boolean;
  supervisionDependency: boolean;
  infrastructureRating: number;
  atcFlag: boolean;
  supervisionIndex: number;
  correctionReasons: string[];
  supervisionTrend: 'improving' | 'stable' | 'worsening';
  monthlySeries: MonthlyDataPoint[];
}

export interface StateData {
  stateCode: string;
  stateName: string;
  score05: number;
  paidU12M: number;
  casesU12M: number;
  trend: 'up' | 'down' | 'stable';
  hospitalCount: number;
  opportunityCount: number;
  riskFlagCount: number;
}

export interface MonthlyDataPoint {
  month: string;
  score05: number;
  paidAmount: number;
  cases: number;
}

export interface NationalTimeSeries {
  month: string;
  score05: number;
  totalPaid: number;
  totalCases: number;
}

export type OpportunityCategory =
  | 'pricing-deviation'
  | 'procedure-cost'
  | 'utilization'
  | 'los-optimization'
  | 'readmission-reduction'
  | 'sla-breach'
  | 'fraud-indicator'
  | 'bundling'
  | 'supervision-dependency';

export type OpportunityStatus =
  | 'identified'
  | 'in-analysis'
  | 'proposal-ready'
  | 'negotiating'
  | 'agreed'
  | 'implemented'
  | 'closed';

export type OpportunityPriority = 'critical' | 'high' | 'medium' | 'low';
export type OpportunityComplexity = 'low' | 'medium' | 'high';

export interface NegotiationOpportunity {
  id: string;
  hospitalId: string;
  hospitalName: string;
  category: OpportunityCategory;
  categoryLabel: string;
  description: string;
  triggerKPI: string;
  triggerValue: number;
  benchmark: number;
  estimatedImpactMXN: number;
  complexity: OpportunityComplexity;
  priority: OpportunityPriority;
  status: OpportunityStatus;
  owner: string;
  targetDate: string;
  executiveSummary: string;
  quantitativeEvidence: string[];
  drivers: string[];
  negotiationProposal: string;
  risks: string[];
  actionPlan: string[];
}

export interface DynamicInsight {
  id: string;
  title: string;
  description: string;
  magnitude: string;
  benchmark: string;
  financialImpact: string;
  actionLabel: string;
  relatedHospitalId?: string;
}

export interface ProviderAgentResult {
  hospitalSummary: string;
  pillarAnalysis: { pillar: string; assessment: string; recommendation: string }[];
  topRisks: { risk: string; severity: string; mitigation: string }[];
  negotiationRecommendations: string[];
  estimatedSavings: string;
  factPackSections: string[];
  rationale: string[];
}

// ============================================================================
// V2 — 7 Category Analysis Types
// ============================================================================

export type AnalysisCategory =
  | 'procedure-cost'      // 1) Costo total por procedimiento
  | 'supply-pricing'      // 2) Precios unitarios insumos
  | 'overutilization'     // 3) Sobreutilización de actos médicos
  | 'los-readmission'     // 4) Estancia y reingresos
  | 'sla-compliance'      // 5) Incumplimiento SLAs
  | 'pgnp-forfait'        // 6) Potencial PGNP/Forfait
  | 'supervision-corrections'; // 7) Correcciones supervisión

export interface CategoryDefinition {
  id: AnalysisCategory;
  name: string;
  shortName: string;
  description: string;
  icon: string; // lucide icon name
  color: string;
}

// 1) Procedure cost comparison
export interface ProcedureCostItem {
  procedureCode: string; // CPT/ICD code
  procedureName: string;
  volume: number;
  costHospital: number;
  costPeers: number;
  gapPct: number;
  impactMXN: number;
}

// 2) Supply pricing
export interface SupplyPricingItem {
  supplyName: string;
  category: string;
  priceHospital: number;
  priceBenchmark: number;
  gapPct: number;
  volumeU12M: number;
  impactMXN: number;
}

// 3) Overutilization
export interface OverutilizationItem {
  actName: string;
  actType: string; // 'laboratorio' | 'imagen' | 'procedimiento' | 'consulta'
  freqPerCaseHospital: number;
  freqPerCasePeers: number;
  overusePct: number;
  impactMXN: number;
}

// 4) LOS & readmission
export interface LOSReadmissionItem {
  procedureName: string;
  alosHospital: number;
  alosPeers: number;
  excessDays: number;
  costExtraMXN: number;
  readmissionRateHospital?: number;
  readmissionRatePeers?: number;
}

// 5) SLA compliance
export interface SLAComplianceItem {
  kpiName: string;
  contractualTarget: string;
  currentValue: string;
  compliant: boolean;
  penaltyApplicable: number;
  trend6m: number[]; // 6 monthly values
}

// 6) PGNP Forfait potential
export interface PGNPForfaitItem {
  pathologyName: string;
  icdCode: string;
  volume: number;
  avgCost: number;
  cvPct: number; // coefficient of variation
  potentialSavingsMXN: number;
  forfaitRecommended: boolean;
}

// 7) Supervision corrections
export interface SupervisionCorrectionItem {
  correctionType: string;
  frequency: number;
  amountCorrectedMXN: number;
  trend: 'up' | 'down' | 'stable';
  isStructural: boolean;
}

// Hospital analysis for all 7 categories
export interface HospitalCategoryAnalysis {
  hospitalId: string;
  procedureCosts: ProcedureCostItem[];
  supplyPricing: SupplyPricingItem[];
  overutilization: OverutilizationItem[];
  losReadmission: LOSReadmissionItem[];
  slaCompliance: SLAComplianceItem[];
  pgnpForfait: PGNPForfaitItem[];
  supervisionCorrections: SupervisionCorrectionItem[];
  categorySummary: { category: AnalysisCategory; score: number; impactMXN: number; itemCount: number }[];
}

// Negotiation argument generated per opportunity
export interface NegotiationArgument {
  id: string;
  hospitalId: string;
  category: AnalysisCategory;
  lever: string; // specific procedure/item name
  context: string; // "Hospital X cobra $185K vs media peers $142K (+30%)"
  arguments: string[]; // 3-4 value arguments
  proposal: string;
  supportData: { label: string; hospitalValue: string; peerValue: string; gap: string }[];
}

// Cost evolution time series (national level with benchmark)
export interface CostEvolutionPoint {
  month: string;
  totalPaid: number;
  benchmarkExpected: number;
  savingsCaptured: number;
}

// State with savings data
export interface StateDataV2 extends StateData {
  benchmarkU12M: number;
  savingsPotentialMXN: number;
  savingsCapturedMXN: number;
}
