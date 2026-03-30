// ============================================================================
// Provider Ranking — V2 Data File
// 7-Category Analysis, Negotiation Arguments, Cost Evolution
// ============================================================================

import type {
  CategoryDefinition,
  CostEvolutionPoint,
  StateDataV2,
  HospitalCategoryAnalysis,
  NegotiationArgument,
  ProcedureCostItem,
  SupplyPricingItem,
  OverutilizationItem,
  LOSReadmissionItem,
  SLAComplianceItem,
  PGNPForfaitItem,
  SupervisionCorrectionItem,
  AnalysisCategory,
} from './types';

// Re-export all original data
export * from './provider-ranking-data';

// ---------------------------------------------------------------------------
// A. Category Definitions
// ---------------------------------------------------------------------------
export const CATEGORY_DEFINITIONS: CategoryDefinition[] = [
  { id: 'procedure-cost', name: 'Costo por Procedimiento', shortName: 'Procedimientos', description: 'Costo total por procedimiento fuera de benchmark (CPT/ICD)', icon: 'Stethoscope', color: '#ef4444' },
  { id: 'supply-pricing', name: 'Precios de Insumos', shortName: 'Insumos', description: 'Precios unitarios fuera de benchmark (insumos médicos)', icon: 'Package', color: '#f97316' },
  { id: 'overutilization', name: 'Sobreutilización', shortName: 'Sobre-uso', description: 'Sobreutilización de actos médicos', icon: 'TrendingUp', color: '#eab308' },
  { id: 'los-readmission', name: 'Estancia y Reingresos', shortName: 'Estancia', description: 'Estancia hospitalaria y reingresos fuera de benchmark', icon: 'Clock', color: '#22c55e' },
  { id: 'sla-compliance', name: 'Cumplimiento de SLAs', shortName: 'SLAs', description: 'Incumplimiento de SLAs y KPIs contractuales', icon: 'FileCheck', color: '#3b82f6' },
  { id: 'pgnp-forfait', name: 'Potencial PGNP/Forfait', shortName: 'PGNP', description: 'Alta concentración por patología con variabilidad alta', icon: 'Target', color: '#8b5cf6' },
  { id: 'supervision-corrections', name: 'Correcciones por Supervisión', shortName: 'Supervisión', description: 'Correcciones recurrentes detectadas por supervisión hospitalaria', icon: 'Shield', color: '#ec4899' },
];

// ---------------------------------------------------------------------------
// B. Cost Evolution (12 months — national level)
// ---------------------------------------------------------------------------
export const costEvolution: CostEvolutionPoint[] = [
  { month: '2025-04', totalPaid: 595_000_000, benchmarkExpected: 553_000_000, savingsCaptured: 8_200_000 },
  { month: '2025-05', totalPaid: 610_000_000, benchmarkExpected: 567_000_000, savingsCaptured: 9_500_000 },
  { month: '2025-06', totalPaid: 580_000_000, benchmarkExpected: 541_000_000, savingsCaptured: 10_800_000 },
  { month: '2025-07', totalPaid: 620_000_000, benchmarkExpected: 574_000_000, savingsCaptured: 12_100_000 },
  { month: '2025-08', totalPaid: 630_000_000, benchmarkExpected: 583_000_000, savingsCaptured: 13_700_000 },
  { month: '2025-09', totalPaid: 605_000_000, benchmarkExpected: 562_000_000, savingsCaptured: 15_200_000 },
  { month: '2025-10', totalPaid: 645_000_000, benchmarkExpected: 596_000_000, savingsCaptured: 17_400_000 },
  { month: '2025-11', totalPaid: 660_000_000, benchmarkExpected: 608_000_000, savingsCaptured: 19_800_000 },
  { month: '2025-12', totalPaid: 690_000_000, benchmarkExpected: 634_000_000, savingsCaptured: 21_500_000 },
  { month: '2026-01', totalPaid: 640_000_000, benchmarkExpected: 592_000_000, savingsCaptured: 23_800_000 },
  { month: '2026-02', totalPaid: 625_000_000, benchmarkExpected: 579_000_000, savingsCaptured: 25_600_000 },
  { month: '2026-03', totalPaid: 650_000_000, benchmarkExpected: 601_000_000, savingsCaptured: 28_200_000 },
];

// ---------------------------------------------------------------------------
// C. States Data V2 (extends original 12 states)
// ---------------------------------------------------------------------------
export const statesDataV2: StateDataV2[] = [
  { stateCode: 'CMX', stateName: 'Ciudad de México', score05: 3.18, paidU12M: 3_400_000_000, casesU12M: 32000, trend: 'up', hospitalCount: 8, opportunityCount: 5, riskFlagCount: 4, benchmarkU12M: 2_992_000_000, savingsPotentialMXN: 408_000_000, savingsCapturedMXN: 142_800_000 },
  { stateCode: 'JAL', stateName: 'Jalisco', score05: 2.88, paidU12M: 680_000_000, casesU12M: 6900, trend: 'stable', hospitalCount: 2, opportunityCount: 2, riskFlagCount: 3, benchmarkU12M: 591_600_000, savingsPotentialMXN: 88_400_000, savingsCapturedMXN: 26_520_000 },
  { stateCode: 'NLE', stateName: 'Nuevo León', score05: 2.85, paidU12M: 1_420_000_000, casesU12M: 14300, trend: 'down', hospitalCount: 4, opportunityCount: 3, riskFlagCount: 5, benchmarkU12M: 1_234_400_000, savingsPotentialMXN: 185_600_000, savingsCapturedMXN: 55_680_000 },
  { stateCode: 'PUE', stateName: 'Puebla', score05: 2.72, paidU12M: 240_000_000, casesU12M: 2600, trend: 'stable', hospitalCount: 1, opportunityCount: 1, riskFlagCount: 1, benchmarkU12M: 211_200_000, savingsPotentialMXN: 28_800_000, savingsCapturedMXN: 8_640_000 },
  { stateCode: 'CHH', stateName: 'Chihuahua', score05: 1.95, paidU12M: 180_000_000, casesU12M: 2000, trend: 'down', hospitalCount: 1, opportunityCount: 1, riskFlagCount: 2, benchmarkU12M: 153_000_000, savingsPotentialMXN: 27_000_000, savingsCapturedMXN: 5_400_000 },
  { stateCode: 'QRO', stateName: 'Querétaro', score05: 3.15, paidU12M: 300_000_000, casesU12M: 3000, trend: 'up', hospitalCount: 1, opportunityCount: 0, riskFlagCount: 0, benchmarkU12M: 270_000_000, savingsPotentialMXN: 30_000_000, savingsCapturedMXN: 12_000_000 },
  { stateCode: 'ROO', stateName: 'Quintana Roo', score05: 2.50, paidU12M: 160_000_000, casesU12M: 1600, trend: 'stable', hospitalCount: 1, opportunityCount: 0, riskFlagCount: 1, benchmarkU12M: 140_800_000, savingsPotentialMXN: 19_200_000, savingsCapturedMXN: 5_760_000 },
  { stateCode: 'SON', stateName: 'Sonora', score05: 1.88, paidU12M: 140_000_000, casesU12M: 1400, trend: 'down', hospitalCount: 1, opportunityCount: 1, riskFlagCount: 2, benchmarkU12M: 119_000_000, savingsPotentialMXN: 21_000_000, savingsCapturedMXN: 4_200_000 },
  { stateCode: 'MEX', stateName: 'Estado de México', score05: 3.48, paidU12M: 580_000_000, casesU12M: 5200, trend: 'up', hospitalCount: 1, opportunityCount: 0, riskFlagCount: 0, benchmarkU12M: 522_000_000, savingsPotentialMXN: 58_000_000, savingsCapturedMXN: 23_200_000 },
  { stateCode: 'GUA', stateName: 'Guanajuato', score05: 2.65, paidU12M: 120_000_000, casesU12M: 1200, trend: 'stable', hospitalCount: 0, opportunityCount: 0, riskFlagCount: 0, benchmarkU12M: 105_600_000, savingsPotentialMXN: 14_400_000, savingsCapturedMXN: 4_320_000 },
  { stateCode: 'AGS', stateName: 'Aguascalientes', score05: 2.80, paidU12M: 95_000_000, casesU12M: 980, trend: 'up', hospitalCount: 0, opportunityCount: 0, riskFlagCount: 0, benchmarkU12M: 84_550_000, savingsPotentialMXN: 10_450_000, savingsCapturedMXN: 3_658_000 },
  { stateCode: 'YUC', stateName: 'Yucatán', score05: 2.55, paidU12M: 110_000_000, casesU12M: 1100, trend: 'stable', hospitalCount: 0, opportunityCount: 0, riskFlagCount: 0, benchmarkU12M: 96_800_000, savingsPotentialMXN: 13_200_000, savingsCapturedMXN: 3_960_000 },
];

// ---------------------------------------------------------------------------
// D. Hospital Category Analyses — helpers
// ---------------------------------------------------------------------------

// Procedure definitions
const PROCEDURES = [
  { code: '27447', name: 'Artroplastía de rodilla', baseCost: 142000 },
  { code: '47562', name: 'Colecistectomía laparoscópica', baseCost: 68000 },
  { code: '44950', name: 'Apendicectomía', baseCost: 55000 },
  { code: '59510', name: 'Cesárea', baseCost: 72000 },
  { code: '58150', name: 'Histerectomía', baseCost: 95000 },
  { code: '33533', name: 'Bypass coronario', baseCost: 320000 },
  { code: '29881', name: 'Artroscopia', baseCost: 48000 },
  { code: '44140', name: 'Colectomía', baseCost: 115000 },
  { code: '49505', name: 'Hernioplastía', baseCost: 42000 },
  { code: '19303', name: 'Mastectomía', baseCost: 88000 },
];

const SUPPLIES = [
  { name: 'Prótesis de rodilla', category: 'ortopedia', basePrice: 85000 },
  { name: 'Stent coronario', category: 'cardiovascular', basePrice: 42000 },
  { name: 'Sutura absorbible', category: 'general', basePrice: 1200 },
  { name: 'Material de osteosíntesis', category: 'ortopedia', basePrice: 35000 },
  { name: 'Malla quirúrgica', category: 'general', basePrice: 8500 },
  { name: 'Catéter venoso central', category: 'cardiovascular', basePrice: 3800 },
  { name: 'Bomba de infusión (uso)', category: 'general', basePrice: 2200 },
  { name: 'Kit de laparoscopía', category: 'general', basePrice: 12000 },
  { name: 'Implante mamario', category: 'general', basePrice: 28000 },
  { name: 'Clips hemostáticos', category: 'general', basePrice: 950 },
];

const ACTS = [
  { name: 'Hemograma completo', type: 'laboratorio', baseFreq: 2.1 },
  { name: 'Química sanguínea', type: 'laboratorio', baseFreq: 2.4 },
  { name: 'Tomografía', type: 'imagen', baseFreq: 0.8 },
  { name: 'Resonancia magnética', type: 'imagen', baseFreq: 0.4 },
  { name: 'Radiografía', type: 'imagen', baseFreq: 1.5 },
  { name: 'Electrocardiograma', type: 'procedimiento', baseFreq: 1.2 },
  { name: 'Ultrasonido', type: 'imagen', baseFreq: 0.9 },
  { name: 'Gasometría arterial', type: 'laboratorio', baseFreq: 0.6 },
];

const PATHOLOGIES = [
  { name: 'Colecistitis', icd: 'K80', baseCost: 72000 },
  { name: 'Apendicitis aguda', icd: 'K35', baseCost: 58000 },
  { name: 'Parto/cesárea', icd: 'O82', baseCost: 75000 },
  { name: 'Fractura de cadera', icd: 'S72', baseCost: 145000 },
  { name: 'Hernia inguinal', icd: 'K40', baseCost: 45000 },
  { name: 'Insuficiencia cardíaca', icd: 'I50', baseCost: 98000 },
  { name: 'Neumonía', icd: 'J18', baseCost: 65000 },
];

const SLA_KPIS = [
  { name: 'Estancia promedio <4 días', target: '<4 días' },
  { name: 'Tasa reingreso <5%', target: '<5%' },
  { name: '% Urgencias <25%', target: '<25%' },
  { name: 'Tasa corrección <10%', target: '<10%' },
  { name: 'Satisfacción >4.0', target: '>4.0' },
  { name: 'Tiempo respuesta autorización <2h', target: '<2h' },
];

const CORRECTION_TYPES = [
  'Cobro excesivo de insumos',
  'Días estancia no justificados',
  'Procedimientos no autorizados',
  'Facturación duplicada',
  'Honorarios fuera de tabulador',
  'Medicamentos no cubiertos',
];

// Profile multipliers
type HospitalProfile = 'excellent' | 'good' | 'average' | 'poor';

const profileConfig: Record<HospitalProfile, {
  costMult: number;      // how much above peer cost
  supplyMult: number;    // supply price gap
  overuseMult: number;   // overutilization factor
  losMult: number;       // length-of-stay multiplier
  readmitMult: number;   // readmission multiplier
  slaFailRate: number;   // proportion of SLAs failed
  cvAdd: number;         // extra CV% for forfait
  corrFreqMult: number;  // correction frequency multiplier
  corrAmtMult: number;   // correction amount multiplier
}> = {
  excellent: { costMult: 1.03, supplyMult: 1.02, overuseMult: 1.05, losMult: 1.02, readmitMult: 0.7, slaFailRate: 0.1, cvAdd: 0, corrFreqMult: 0.3, corrAmtMult: 0.2 },
  good:      { costMult: 1.10, supplyMult: 1.08, overuseMult: 1.15, losMult: 1.08, readmitMult: 0.9, slaFailRate: 0.25, cvAdd: 5, corrFreqMult: 0.6, corrAmtMult: 0.5 },
  average:   { costMult: 1.22, supplyMult: 1.18, overuseMult: 1.30, losMult: 1.20, readmitMult: 1.15, slaFailRate: 0.50, cvAdd: 12, corrFreqMult: 1.0, corrAmtMult: 1.0 },
  poor:      { costMult: 1.38, supplyMult: 1.32, overuseMult: 1.50, losMult: 1.42, readmitMult: 1.5, slaFailRate: 0.80, cvAdd: 20, corrFreqMult: 1.8, corrAmtMult: 2.0 },
};

// Seeded pseudo-random for deterministic data
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function genProcedureCosts(profile: HospitalProfile, seed: number, cases: number): ProcedureCostItem[] {
  const rand = seededRandom(seed);
  const cfg = profileConfig[profile];
  const count = profile === 'poor' ? 10 : profile === 'average' ? 9 : 8;
  return PROCEDURES.slice(0, count).map(p => {
    const volume = Math.round(20 + rand() * 180 * (cases / 7000));
    const costPeers = p.baseCost;
    const jitter = 0.92 + rand() * 0.16;
    const costHospital = Math.round(costPeers * cfg.costMult * jitter);
    const gapPct = +((costHospital / costPeers - 1) * 100).toFixed(1);
    const impactMXN = Math.max(0, (costHospital - costPeers) * volume);
    return {
      procedureCode: p.code,
      procedureName: p.name,
      volume,
      costHospital,
      costPeers,
      gapPct,
      impactMXN,
    };
  });
}

function genSupplyPricing(profile: HospitalProfile, seed: number): SupplyPricingItem[] {
  const rand = seededRandom(seed + 1000);
  const cfg = profileConfig[profile];
  const count = profile === 'poor' ? 10 : profile === 'average' ? 9 : 8;
  return SUPPLIES.slice(0, count).map(s => {
    const priceBenchmark = s.basePrice;
    const jitter = 0.93 + rand() * 0.14;
    const priceHospital = Math.round(priceBenchmark * cfg.supplyMult * jitter);
    const gapPct = +((priceHospital / priceBenchmark - 1) * 100).toFixed(1);
    const volumeU12M = Math.round(15 + rand() * 300);
    const impactMXN = Math.max(0, (priceHospital - priceBenchmark) * volumeU12M);
    return {
      supplyName: s.name,
      category: s.category,
      priceHospital,
      priceBenchmark,
      gapPct,
      volumeU12M,
      impactMXN,
    };
  });
}

function genOverutilization(profile: HospitalProfile, seed: number, cases: number): OverutilizationItem[] {
  const rand = seededRandom(seed + 2000);
  const cfg = profileConfig[profile];
  const count = profile === 'poor' ? 8 : profile === 'average' ? 7 : 6;
  return ACTS.slice(0, count).map(a => {
    const freqPerCasePeers = a.baseFreq;
    const jitter = 0.90 + rand() * 0.20;
    const freqPerCaseHospital = +(freqPerCasePeers * cfg.overuseMult * jitter).toFixed(2);
    const overusePct = +((freqPerCaseHospital / freqPerCasePeers - 1) * 100).toFixed(1);
    const costPerAct = a.type === 'imagen' ? 3500 : a.type === 'laboratorio' ? 450 : 1200;
    const impactMXN = Math.max(0, Math.round((freqPerCaseHospital - freqPerCasePeers) * cases * costPerAct));
    return {
      actName: a.name,
      actType: a.type,
      freqPerCaseHospital,
      freqPerCasePeers,
      overusePct,
      impactMXN,
    };
  });
}

function genLOSReadmission(profile: HospitalProfile, seed: number): LOSReadmissionItem[] {
  const rand = seededRandom(seed + 3000);
  const cfg = profileConfig[profile];
  const baseLOS: Record<string, number> = {
    'Artroplastía de rodilla': 4.2,
    'Colecistectomía laparoscópica': 2.1,
    'Apendicectomía': 2.0,
    'Cesárea': 2.5,
    'Histerectomía': 3.0,
    'Bypass coronario': 7.5,
    'Artroscopia': 1.2,
    'Colectomía': 5.0,
  };
  const count = profile === 'poor' ? 8 : profile === 'average' ? 7 : 6;
  const procs = PROCEDURES.slice(0, count);
  return procs.map(p => {
    const alosPeers = baseLOS[p.name] ?? 3.0;
    const jitter = 0.92 + rand() * 0.16;
    const alosHospital = +(alosPeers * cfg.losMult * jitter).toFixed(1);
    const excessDays = +(Math.max(0, alosHospital - alosPeers)).toFixed(1);
    const costExtraMXN = Math.round(excessDays * 18000);
    const readmissionRatePeers = +(3.0 + rand() * 2.0).toFixed(1);
    const readmissionRateHospital = +(readmissionRatePeers * cfg.readmitMult * (0.9 + rand() * 0.2)).toFixed(1);
    return {
      procedureName: p.name,
      alosHospital,
      alosPeers,
      excessDays,
      costExtraMXN,
      readmissionRateHospital,
      readmissionRatePeers,
    };
  });
}

function genSLACompliance(profile: HospitalProfile, seed: number): SLAComplianceItem[] {
  const rand = seededRandom(seed + 4000);
  const cfg = profileConfig[profile];
  // Generate current values and compliance
  const slaValues: { current: string; compliant: boolean; penalty: number; trend6m: number[] }[] = [
    // Estancia promedio <4 días
    (() => {
      const val = +(3.2 + (cfg.losMult - 1) * 5 + rand() * 0.5).toFixed(1);
      const comp = val < 4.0;
      const trend = Array.from({ length: 6 }, (_, i) => +(val - 0.3 + rand() * 0.6 + i * (comp ? -0.02 : 0.03)).toFixed(1));
      return { current: `${val} días`, compliant: comp, penalty: comp ? 0 : Math.round((val - 4.0) * 500_000), trend6m: trend };
    })(),
    // Tasa reingreso <5%
    (() => {
      const val = +(3.5 + (cfg.readmitMult - 0.7) * 4 + rand() * 1.0).toFixed(1);
      const comp = val < 5.0;
      const trend = Array.from({ length: 6 }, (_, i) => +(val - 0.5 + rand() * 1.0 + i * (comp ? -0.05 : 0.04)).toFixed(1));
      return { current: `${val}%`, compliant: comp, penalty: comp ? 0 : Math.round((val - 5.0) * 300_000), trend6m: trend };
    })(),
    // % Urgencias <25%
    (() => {
      const val = +(18 + (cfg.overuseMult - 1) * 30 + rand() * 5).toFixed(1);
      const comp = val < 25.0;
      const trend = Array.from({ length: 6 }, (_, i) => +(val - 2 + rand() * 4 + i * (comp ? -0.2 : 0.3)).toFixed(1));
      return { current: `${val}%`, compliant: comp, penalty: comp ? 0 : Math.round((val - 25.0) * 200_000), trend6m: trend };
    })(),
    // Tasa corrección <10%
    (() => {
      const val = +(5 + cfg.corrFreqMult * 6 + rand() * 3).toFixed(1);
      const comp = val < 10.0;
      const trend = Array.from({ length: 6 }, (_, i) => +(val - 1.5 + rand() * 3 + i * (comp ? -0.1 : 0.15)).toFixed(1));
      return { current: `${val}%`, compliant: comp, penalty: comp ? 0 : Math.round((val - 10.0) * 250_000), trend6m: trend };
    })(),
    // Satisfacción >4.0
    (() => {
      const val = +(4.5 - (cfg.costMult - 1) * 4 + rand() * 0.3).toFixed(1);
      const comp = val > 4.0;
      const trend = Array.from({ length: 6 }, (_, i) => +(val - 0.2 + rand() * 0.4 + i * (comp ? 0.01 : -0.02)).toFixed(1));
      return { current: `${val}`, compliant: comp, penalty: comp ? 0 : Math.round((4.0 - val) * 400_000), trend6m: trend };
    })(),
    // Tiempo respuesta autorización <2h
    (() => {
      const val = +(1.2 + (cfg.costMult - 1) * 4 + rand() * 0.5).toFixed(1);
      const comp = val < 2.0;
      const trend = Array.from({ length: 6 }, (_, i) => +(val - 0.3 + rand() * 0.6 + i * (comp ? -0.02 : 0.04)).toFixed(1));
      return { current: `${val}h`, compliant: comp, penalty: comp ? 0 : Math.round((val - 2.0) * 150_000), trend6m: trend };
    })(),
  ];

  return SLA_KPIS.map((sla, i) => ({
    kpiName: sla.name,
    contractualTarget: sla.target,
    currentValue: slaValues[i].current,
    compliant: slaValues[i].compliant,
    penaltyApplicable: slaValues[i].penalty,
    trend6m: slaValues[i].trend6m,
  }));
}

function genPGNPForfait(profile: HospitalProfile, seed: number, cases: number): PGNPForfaitItem[] {
  const rand = seededRandom(seed + 5000);
  const cfg = profileConfig[profile];
  const count = profile === 'poor' ? 7 : profile === 'average' ? 6 : 5;
  return PATHOLOGIES.slice(0, count).map(p => {
    const volume = Math.round(15 + rand() * 120 * (cases / 7000));
    const avgCost = Math.round(p.baseCost * cfg.costMult * (0.9 + rand() * 0.2));
    const cvPct = +(15 + cfg.cvAdd + rand() * 20).toFixed(1);
    const potentialSavingsMXN = Math.round(avgCost * volume * 0.08 * (cvPct < 30 ? 1 : 0.4));
    const forfaitRecommended = volume > 30 && cvPct < 30;
    return {
      pathologyName: p.name,
      icdCode: p.icd,
      volume,
      avgCost,
      cvPct,
      potentialSavingsMXN,
      forfaitRecommended,
    };
  });
}

function genSupervisionCorrections(profile: HospitalProfile, seed: number): SupervisionCorrectionItem[] {
  const rand = seededRandom(seed + 6000);
  const cfg = profileConfig[profile];
  const count = profile === 'poor' ? 6 : profile === 'average' ? 5 : 4;
  return CORRECTION_TYPES.slice(0, count).map(ct => {
    const baseFreq = 12 + rand() * 30;
    const frequency = Math.round(baseFreq * cfg.corrFreqMult);
    const baseAmt = 80_000 + rand() * 400_000;
    const amountCorrectedMXN = Math.round(baseAmt * cfg.corrAmtMult);
    const trend: ('up' | 'down' | 'stable') =
      profile === 'excellent' ? 'down' :
      profile === 'good' ? (rand() > 0.5 ? 'down' : 'stable') :
      profile === 'average' ? 'stable' :
      (rand() > 0.3 ? 'up' : 'stable');
    const isStructural = frequency > 20;
    return {
      correctionType: ct,
      frequency,
      amountCorrectedMXN,
      trend,
      isStructural,
    };
  });
}

function genCategorySummary(
  procedureCosts: ProcedureCostItem[],
  supplyPricing: SupplyPricingItem[],
  overutilization: OverutilizationItem[],
  losReadmission: LOSReadmissionItem[],
  slaCompliance: SLAComplianceItem[],
  pgnpForfait: PGNPForfaitItem[],
  supervisionCorrections: SupervisionCorrectionItem[],
  profile: HospitalProfile,
): { category: AnalysisCategory; score: number; impactMXN: number; itemCount: number }[] {
  const scoreBase: Record<HospitalProfile, number> = { excellent: 15, good: 35, average: 60, poor: 82 };
  const base = scoreBase[profile];

  const procImpact = procedureCosts.reduce((s, i) => s + i.impactMXN, 0);
  const procCount = procedureCosts.filter(i => i.gapPct > 0).length;

  const supImpact = supplyPricing.reduce((s, i) => s + i.impactMXN, 0);
  const supCount = supplyPricing.filter(i => i.gapPct > 0).length;

  const overImpact = overutilization.reduce((s, i) => s + i.impactMXN, 0);
  const overCount = overutilization.filter(i => i.overusePct > 0).length;

  const losImpact = losReadmission.reduce((s, i) => s + i.costExtraMXN, 0);
  const losCount = losReadmission.filter(i => i.excessDays > 0).length;

  const slaImpact = slaCompliance.reduce((s, i) => s + i.penaltyApplicable, 0);
  const slaCount = slaCompliance.filter(i => !i.compliant).length;

  const pgnpImpact = pgnpForfait.reduce((s, i) => s + i.potentialSavingsMXN, 0);
  const pgnpCount = pgnpForfait.filter(i => i.forfaitRecommended).length;

  const supvImpact = supervisionCorrections.reduce((s, i) => s + i.amountCorrectedMXN, 0);
  const supvCount = supervisionCorrections.filter(i => i.isStructural).length;

  return [
    { category: 'procedure-cost', score: Math.min(100, Math.round(base + (procImpact > 5_000_000 ? 10 : 0))), impactMXN: procImpact, itemCount: procCount },
    { category: 'supply-pricing', score: Math.min(100, Math.round(base * 0.9 + (supImpact > 2_000_000 ? 8 : 0))), impactMXN: supImpact, itemCount: supCount },
    { category: 'overutilization', score: Math.min(100, Math.round(base * 0.85 + (overImpact > 3_000_000 ? 12 : 0))), impactMXN: overImpact, itemCount: overCount },
    { category: 'los-readmission', score: Math.min(100, Math.round(base * 0.95 + (losImpact > 1_000_000 ? 7 : 0))), impactMXN: losImpact, itemCount: losCount },
    { category: 'sla-compliance', score: Math.min(100, Math.round(base * 1.05 + slaCount * 5)), impactMXN: slaImpact, itemCount: slaCount },
    { category: 'pgnp-forfait', score: Math.min(100, Math.round(base * 0.7 + pgnpCount * 8)), impactMXN: pgnpImpact, itemCount: pgnpCount },
    { category: 'supervision-corrections', score: Math.min(100, Math.round(base * 1.1 + supvCount * 6)), impactMXN: supvImpact, itemCount: supvCount },
  ];
}

// Hospital definitions for generation (matching provider-ranking-data.ts)
const hospitalMeta: { id: string; name: string; profile: HospitalProfile; paid: number; cases: number }[] = [
  { id: 'medica-sur', name: 'Médica Sur', profile: 'excellent', paid: 780_000_000, cases: 7200 },
  { id: 'abc-observatorio', name: 'Hospital ABC - Observatorio', profile: 'excellent', paid: 720_000_000, cases: 6800 },
  { id: 'abc-santa-fe', name: 'Hospital ABC - Santa Fe', profile: 'good', paid: 650_000_000, cases: 5900 },
  { id: 'angeles-pedregal', name: 'Hospital Ángeles Pedregal', profile: 'good', paid: 600_000_000, cases: 5500 },
  { id: 'angeles-lomas', name: 'Hospital Ángeles Lomas', profile: 'good', paid: 580_000_000, cases: 5200 },
  { id: 'angeles-carmen', name: 'Hospital Ángeles del Carmen', profile: 'good', paid: 420_000_000, cases: 4100 },
  { id: 'christus-alta', name: 'Christus Muguerza Alta Especialidad', profile: 'good', paid: 480_000_000, cases: 4600 },
  { id: 'christus-sur', name: 'Christus Muguerza Sur', profile: 'average', paid: 320_000_000, cases: 3400 },
  { id: 'star-medica', name: 'Hospital Star Médica', profile: 'average', paid: 350_000_000, cases: 3800 },
  { id: 'hospital-espanol', name: 'Hospital Español', profile: 'average', paid: 280_000_000, cases: 3100 },
  { id: 'angeles-metropolitano', name: 'Hospital Ángeles Metropolitano', profile: 'average', paid: 380_000_000, cases: 3600 },
  { id: 'san-javier', name: 'Hospital San Javier', profile: 'average', paid: 260_000_000, cases: 2800 },
  { id: 'christus-conchita', name: 'Christus Muguerza Conchita', profile: 'poor', paid: 220_000_000, cases: 2400 },
  { id: 'angeles-puebla', name: 'Hospital Ángeles Puebla', profile: 'average', paid: 240_000_000, cases: 2600 },
  { id: 'angeles-chihuahua', name: 'Hospital Ángeles Chihuahua', profile: 'poor', paid: 180_000_000, cases: 2000 },
  { id: 'siglo-xxi', name: 'Centro Médico Nacional Siglo XXI', profile: 'poor', paid: 190_000_000, cases: 2200 },
  { id: 'galenia', name: 'Hospital Galenia', profile: 'average', paid: 160_000_000, cases: 1600 },
  { id: 'cima-hermosillo', name: 'Hospital CIMA Hermosillo', profile: 'poor', paid: 140_000_000, cases: 1400 },
  { id: 'angeles-queretaro', name: 'Hospital Ángeles Querétaro', profile: 'good', paid: 300_000_000, cases: 3000 },
  { id: 'san-jose-tecsalud', name: 'Hospital San José TecSalud', profile: 'good', paid: 400_000_000, cases: 3900 },
];

// Build all hospital analyses
function buildHospitalAnalyses(): Record<string, HospitalCategoryAnalysis> {
  const result: Record<string, HospitalCategoryAnalysis> = {};
  hospitalMeta.forEach((h, idx) => {
    const seed = (idx + 1) * 7919; // distinct seed per hospital
    const procedureCosts = genProcedureCosts(h.profile, seed, h.cases);
    const supplyPricing = genSupplyPricing(h.profile, seed);
    const overutil = genOverutilization(h.profile, seed, h.cases);
    const losReadmission = genLOSReadmission(h.profile, seed);
    const slaCompliance = genSLACompliance(h.profile, seed);
    const pgnpForfait = genPGNPForfait(h.profile, seed, h.cases);
    const supervisionCorrections = genSupervisionCorrections(h.profile, seed);
    const categorySummary = genCategorySummary(procedureCosts, supplyPricing, overutil, losReadmission, slaCompliance, pgnpForfait, supervisionCorrections, h.profile);

    result[h.id] = {
      hospitalId: h.id,
      procedureCosts,
      supplyPricing,
      overutilization: overutil,
      losReadmission,
      slaCompliance,
      pgnpForfait,
      supervisionCorrections,
      categorySummary,
    };
  });
  return result;
}

export const hospitalCategoryAnalyses: Record<string, HospitalCategoryAnalysis> = buildHospitalAnalyses();

// ---------------------------------------------------------------------------
// E. Negotiation Arguments
// ---------------------------------------------------------------------------

function buildNegotiationArguments(): NegotiationArgument[] {
  const args: NegotiationArgument[] = [];
  let argIdx = 0;

  // Helper to format currency
  const fmt = (n: number): string => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `$${Math.round(n / 1000)}K`;
    return `$${n}`;
  };

  const fmtFull = (n: number): string => `$${n.toLocaleString('es-MX')}`;

  hospitalMeta.forEach(h => {
    const analysis = hospitalCategoryAnalyses[h.id];
    if (!analysis) return;

    const argCount = h.profile === 'poor' ? 5 : h.profile === 'average' ? 4 : h.profile === 'good' ? 3 : 2;

    // 1) Procedure cost argument — pick the highest-impact procedure
    if (argIdx - args.length < argCount) {
      const topProc = [...analysis.procedureCosts].sort((a, b) => b.impactMXN - a.impactMXN)[0];
      if (topProc && topProc.gapPct > 2) {
        args.push({
          id: `arg-${++argIdx}`,
          hospitalId: h.id,
          category: 'procedure-cost',
          lever: `${topProc.procedureName} (CPT ${topProc.procedureCode})`,
          context: `${h.name} cobra ${fmtFull(topProc.costHospital)} por ${topProc.procedureName.toLowerCase()} vs media de peers de ${fmtFull(topProc.costPeers)} (+${topProc.gapPct}%)`,
          arguments: [
            `El costo de este hospital supera en ${topProc.gapPct}% el promedio de hospitales pares para el mismo procedimiento.`,
            `Con ${topProc.volume} casos anuales, el sobrecosto acumulado asciende a ${fmt(topProc.impactMXN)}.`,
            `Los hospitales de referencia mantienen costos entre ${fmtFull(Math.round(topProc.costPeers * 0.95))} y ${fmtFull(Math.round(topProc.costPeers * 1.05))}.`,
            `La estandarización del protocolo quirúrgico podría reducir la variabilidad y el costo.`,
          ],
          proposal: `Establecer tarifa máxima de ${fmtFull(Math.round(topProc.costPeers * 1.05))} para ${topProc.procedureName.toLowerCase()}, con revisión semestral y ajuste por inflación médica.`,
          supportData: [
            { label: h.name, hospitalValue: fmtFull(topProc.costHospital), peerValue: '-', gap: `+${topProc.gapPct}%` },
            { label: 'Promedio peers', hospitalValue: '-', peerValue: fmtFull(topProc.costPeers), gap: 'Benchmark' },
            { label: 'Volumen anual', hospitalValue: `${topProc.volume} casos`, peerValue: '-', gap: '-' },
            { label: 'Impacto estimado', hospitalValue: fmt(topProc.impactMXN), peerValue: '-', gap: '-' },
          ],
        });
      }
    }

    // 2) Supply pricing argument — pick highest impact supply
    if (args.length - (argIdx - argCount) < argCount) {
      const topSupply = [...analysis.supplyPricing].sort((a, b) => b.impactMXN - a.impactMXN)[0];
      if (topSupply && topSupply.gapPct > 2) {
        args.push({
          id: `arg-${++argIdx}`,
          hospitalId: h.id,
          category: 'supply-pricing',
          lever: topSupply.supplyName,
          context: `${h.name} cobra ${fmtFull(topSupply.priceHospital)} por ${topSupply.supplyName.toLowerCase()} vs benchmark de ${fmtFull(topSupply.priceBenchmark)} (+${topSupply.gapPct}%)`,
          arguments: [
            `El precio unitario de ${topSupply.supplyName.toLowerCase()} supera el benchmark en ${topSupply.gapPct}%.`,
            `Con un volumen de ${topSupply.volumeU12M} unidades en los últimos 12 meses, el sobrecosto acumulado es de ${fmt(topSupply.impactMXN)}.`,
            `Los proveedores de referencia negocian precios hasta un 15% por debajo del benchmark actual.`,
            `Se recomienda implementar un cuadro básico con precios tope por categoría de insumo.`,
          ],
          proposal: `Fijar precio máximo de ${fmtFull(Math.round(topSupply.priceBenchmark * 1.03))} para ${topSupply.supplyName.toLowerCase()} e implementar cuadro básico de insumos.`,
          supportData: [
            { label: h.name, hospitalValue: fmtFull(topSupply.priceHospital), peerValue: '-', gap: `+${topSupply.gapPct}%` },
            { label: 'Benchmark', hospitalValue: '-', peerValue: fmtFull(topSupply.priceBenchmark), gap: 'Ref.' },
            { label: 'Volumen U12M', hospitalValue: `${topSupply.volumeU12M} uds`, peerValue: '-', gap: '-' },
            { label: 'Impacto estimado', hospitalValue: fmt(topSupply.impactMXN), peerValue: '-', gap: '-' },
          ],
        });
      }
    }

    // 3) Overutilization argument (for average and poor)
    if (h.profile === 'average' || h.profile === 'poor') {
      const topOver = [...analysis.overutilization].sort((a, b) => b.impactMXN - a.impactMXN)[0];
      if (topOver && topOver.overusePct > 5) {
        args.push({
          id: `arg-${++argIdx}`,
          hospitalId: h.id,
          category: 'overutilization',
          lever: topOver.actName,
          context: `${h.name} realiza ${topOver.freqPerCaseHospital} ${topOver.actName.toLowerCase()} por caso vs ${topOver.freqPerCasePeers} de peers (+${topOver.overusePct}%)`,
          arguments: [
            `La frecuencia de ${topOver.actName.toLowerCase()} por caso supera la media de pares en ${topOver.overusePct}%.`,
            `El exceso genera un sobrecosto estimado de ${fmt(topOver.impactMXN)} anuales.`,
            `Guías clínicas nacionales recomiendan una frecuencia máxima de ${topOver.freqPerCasePeers} por caso para este tipo de estudio.`,
            `La reducción al benchmark generaría ahorros inmediatos sin impacto en la calidad de atención.`,
          ],
          proposal: `Implementar protocolo de autorización previa para ${topOver.actName.toLowerCase()} cuando supere ${topOver.freqPerCasePeers} por caso, con revisión trimestral.`,
          supportData: [
            { label: h.name, hospitalValue: `${topOver.freqPerCaseHospital}/caso`, peerValue: '-', gap: `+${topOver.overusePct}%` },
            { label: 'Peers', hospitalValue: '-', peerValue: `${topOver.freqPerCasePeers}/caso`, gap: 'Benchmark' },
            { label: 'Impacto anual', hospitalValue: fmt(topOver.impactMXN), peerValue: '-', gap: '-' },
          ],
        });
      }
    }

    // 4) LOS/Readmission argument (for average and poor)
    if (h.profile === 'average' || h.profile === 'poor') {
      const topLOS = [...analysis.losReadmission].sort((a, b) => b.costExtraMXN - a.costExtraMXN)[0];
      if (topLOS && topLOS.excessDays > 0.2) {
        args.push({
          id: `arg-${++argIdx}`,
          hospitalId: h.id,
          category: 'los-readmission',
          lever: `Estancia — ${topLOS.procedureName}`,
          context: `${h.name} tiene ALOS de ${topLOS.alosHospital} días para ${topLOS.procedureName.toLowerCase()} vs ${topLOS.alosPeers} días de peers (+${topLOS.excessDays} días)`,
          arguments: [
            `La estancia promedio para ${topLOS.procedureName.toLowerCase()} excede el benchmark en ${topLOS.excessDays} días.`,
            `Cada día adicional de estancia genera un sobrecosto de $18,000 por caso.`,
            topLOS.readmissionRateHospital && topLOS.readmissionRatePeers
              ? `La tasa de reingreso es de ${topLOS.readmissionRateHospital}% vs ${topLOS.readmissionRatePeers}% de referencia.`
              : `Se requiere monitoreo de tasa de reingreso para complementar el análisis.`,
            `Un programa de alta temprana con seguimiento domiciliario puede reducir la estancia sin comprometer calidad.`,
          ],
          proposal: `Establecer SLA de estancia máxima de ${topLOS.alosPeers} días para ${topLOS.procedureName.toLowerCase()}, con penalización por excedente y programa de alta temprana.`,
          supportData: [
            { label: h.name, hospitalValue: `${topLOS.alosHospital} días`, peerValue: '-', gap: `+${topLOS.excessDays} días` },
            { label: 'Peers', hospitalValue: '-', peerValue: `${topLOS.alosPeers} días`, gap: 'Benchmark' },
            { label: 'Sobrecosto/día', hospitalValue: '$18,000', peerValue: '-', gap: '-' },
            { label: 'Costo extra estimado', hospitalValue: fmtFull(topLOS.costExtraMXN), peerValue: '-', gap: '-' },
          ],
        });
      }
    }

    // 5) Supervision corrections (for poor hospitals)
    if (h.profile === 'poor') {
      const topCorr = [...analysis.supervisionCorrections].sort((a, b) => b.amountCorrectedMXN - a.amountCorrectedMXN)[0];
      if (topCorr) {
        args.push({
          id: `arg-${++argIdx}`,
          hospitalId: h.id,
          category: 'supervision-corrections',
          lever: topCorr.correctionType,
          context: `${h.name} acumula ${topCorr.frequency} correcciones por "${topCorr.correctionType.toLowerCase()}" con un monto de ${fmt(topCorr.amountCorrectedMXN)}`,
          arguments: [
            `Se han identificado ${topCorr.frequency} incidencias de "${topCorr.correctionType.toLowerCase()}" en los últimos 12 meses.`,
            `El monto total corregido por este concepto asciende a ${fmt(topCorr.amountCorrectedMXN)}.`,
            `La tendencia de estas correcciones es ${topCorr.trend === 'up' ? 'al alza, lo que indica un problema estructural' : topCorr.trend === 'stable' ? 'estable, sin señales de mejora' : 'a la baja, aunque los niveles siguen siendo inaceptables'}.`,
            `Se requiere un plan de acción correctiva con hitos verificables para garantizar la continuidad contractual.`,
          ],
          proposal: `Condicionar renovación contractual a la reducción de correcciones por "${topCorr.correctionType.toLowerCase()}" a menos de ${Math.round(topCorr.frequency * 0.3)} incidencias por año en un plazo de 6 meses.`,
          supportData: [
            { label: 'Frecuencia actual', hospitalValue: `${topCorr.frequency}/año`, peerValue: '<10/año', gap: `+${topCorr.frequency - 10}` },
            { label: 'Monto corregido', hospitalValue: fmt(topCorr.amountCorrectedMXN), peerValue: '-', gap: '-' },
            { label: 'Tendencia', hospitalValue: topCorr.trend === 'up' ? 'Al alza' : topCorr.trend === 'stable' ? 'Estable' : 'A la baja', peerValue: 'A la baja', gap: '-' },
            { label: 'Estructural', hospitalValue: topCorr.isStructural ? 'Sí' : 'No', peerValue: 'No', gap: '-' },
          ],
        });
      }
    }

    // 6) SLA compliance argument (for poor and some average)
    if (h.profile === 'poor' || (h.profile === 'average' && args.filter(a => a.hospitalId === h.id).length < argCount)) {
      const failedSLAs = analysis.slaCompliance.filter(s => !s.compliant);
      if (failedSLAs.length > 0) {
        const topSLA = failedSLAs.sort((a, b) => b.penaltyApplicable - a.penaltyApplicable)[0];
        args.push({
          id: `arg-${++argIdx}`,
          hospitalId: h.id,
          category: 'sla-compliance',
          lever: topSLA.kpiName,
          context: `${h.name} incumple el SLA "${topSLA.kpiName}" con valor actual de ${topSLA.currentValue} vs meta contractual de ${topSLA.contractualTarget}`,
          arguments: [
            `El KPI "${topSLA.kpiName}" se encuentra fuera del objetivo contractual (${topSLA.currentValue} vs ${topSLA.contractualTarget}).`,
            `La penalización aplicable por este incumplimiento asciende a ${fmt(topSLA.penaltyApplicable)}.`,
            `La tendencia de los últimos 6 meses muestra ${topSLA.trend6m[5] > topSLA.trend6m[0] ? 'un deterioro progresivo' : 'estancamiento sin mejora significativa'}.`,
            `Se han identificado ${failedSLAs.length} SLAs incumplidos en total, lo que sugiere un problema sistémico de gestión.`,
          ],
          proposal: `Aplicar penalización contractual de ${fmt(topSLA.penaltyApplicable)} y establecer plan de mejora con metas mensuales para alcanzar ${topSLA.contractualTarget} en 90 días.`,
          supportData: [
            { label: 'Valor actual', hospitalValue: topSLA.currentValue, peerValue: topSLA.contractualTarget, gap: 'Incumple' },
            { label: 'Penalización', hospitalValue: fmt(topSLA.penaltyApplicable), peerValue: '-', gap: '-' },
            { label: 'SLAs incumplidos', hospitalValue: `${failedSLAs.length} de ${analysis.slaCompliance.length}`, peerValue: '0', gap: `-${failedSLAs.length}` },
            { label: 'Tendencia 6m', hospitalValue: topSLA.trend6m[5] > topSLA.trend6m[0] ? 'Deterioro' : 'Sin mejora', peerValue: 'Cumplimiento', gap: '-' },
          ],
        });
      }
    }

    // 7) PGNP/Forfait argument (for good and excellent to balance out)
    if ((h.profile === 'excellent' || h.profile === 'good') && args.filter(a => a.hospitalId === h.id).length < argCount) {
      const forfaitCandidates = analysis.pgnpForfait.filter(p => p.forfaitRecommended);
      if (forfaitCandidates.length > 0) {
        const topForfait = forfaitCandidates.sort((a, b) => b.potentialSavingsMXN - a.potentialSavingsMXN)[0];
        args.push({
          id: `arg-${++argIdx}`,
          hospitalId: h.id,
          category: 'pgnp-forfait',
          lever: `Forfait — ${topForfait.pathologyName} (${topForfait.icdCode})`,
          context: `${h.name} tiene ${topForfait.volume} casos de ${topForfait.pathologyName.toLowerCase()} con CV de ${topForfait.cvPct}%, candidato ideal para pago por paquete`,
          arguments: [
            `${topForfait.pathologyName} concentra ${topForfait.volume} casos anuales con un coeficiente de variación de ${topForfait.cvPct}%, lo que indica alta estandarización.`,
            `El costo promedio actual es de ${fmtFull(topForfait.avgCost)} por caso.`,
            `La implementación de un forfait podría generar ahorros de ${fmt(topForfait.potentialSavingsMXN)} anuales.`,
            `El volumen y la baja variabilidad hacen de esta patología un candidato ideal para pago prospectivo por paquete.`,
          ],
          proposal: `Implementar pago por paquete (forfait) para ${topForfait.pathologyName.toLowerCase()} con tarifa fija de ${fmtFull(Math.round(topForfait.avgCost * 0.92))}, incluyendo honorarios, insumos y estancia.`,
          supportData: [
            { label: 'Volumen anual', hospitalValue: `${topForfait.volume} casos`, peerValue: '-', gap: '-' },
            { label: 'Costo promedio', hospitalValue: fmtFull(topForfait.avgCost), peerValue: '-', gap: '-' },
            { label: 'CV%', hospitalValue: `${topForfait.cvPct}%`, peerValue: '<30%', gap: 'Candidato' },
            { label: 'Ahorro potencial', hospitalValue: fmt(topForfait.potentialSavingsMXN), peerValue: '-', gap: '-' },
          ],
        });
      }
    }
  });

  return args;
}

export const negotiationArguments: NegotiationArgument[] = buildNegotiationArguments();
