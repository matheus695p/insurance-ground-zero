// ============================================================================
// Provider Ranking — Data File
// Gestión de Proveedores Hospitalarios (GNP – GMM)
// ============================================================================

import type {
  ScoringPreset, ScoringWeights, KPIDefinition, Hospital, StateData,
  NationalTimeSeries, DynamicInsight, NegotiationOpportunity, KPIValue, PillarScore,
} from './types';

// ---------------------------------------------------------------------------
// 1. Scoring Presets
// ---------------------------------------------------------------------------
export const SCORING_PRESETS: Record<ScoringPreset, ScoringWeights> = {
  'balanced': { cost: 0.40, efficiency: 0.25, quality: 0.20, integrity: 0.15 },
  'cost-containment': { cost: 0.55, efficiency: 0.20, quality: 0.15, integrity: 0.10 },
  'experience-focused': { cost: 0.20, efficiency: 0.25, quality: 0.40, integrity: 0.15 },
};

// ---------------------------------------------------------------------------
// 2. KPI Definitions (18 KPIs)
// ---------------------------------------------------------------------------
export const KPI_DEFINITIONS: KPIDefinition[] = [
  // Cost (6)
  { id: 'avg-ticket', name: 'Ticket Promedio', pillar: 'cost', unit: 'MXN', higherIsBetter: false, benchmark: 45000 },
  { id: 'high-cost-pct', name: '% Casos >300K', pillar: 'cost', unit: '%', higherIsBetter: false, benchmark: 8 },
  { id: 'cost-per-day', name: 'Costo por Día', pillar: 'cost', unit: 'MXN', higherIsBetter: false, benchmark: 18000 },
  { id: 'supply-cost-ratio', name: 'Ratio Insumos/Costo', pillar: 'cost', unit: '%', higherIsBetter: false, benchmark: 35 },
  { id: 'pharmacy-cost-ratio', name: 'Ratio Farmacia/Costo', pillar: 'cost', unit: '%', higherIsBetter: false, benchmark: 22 },
  { id: 'avg-case-cost', name: 'Costo Promedio Caso', pillar: 'cost', unit: 'MXN', higherIsBetter: false, benchmark: 85000 },
  // Efficiency (5)
  { id: 'avg-los', name: 'Estancia Promedio', pillar: 'efficiency', unit: 'días', higherIsBetter: false, benchmark: 3.8 },
  { id: 'emergency-pct', name: '% Urgencias', pillar: 'efficiency', unit: '%', higherIsBetter: false, benchmark: 25 },
  { id: 'scheduled-pct', name: '% Programadas', pillar: 'efficiency', unit: '%', higherIsBetter: true, benchmark: 65 },
  { id: 'occupancy-rate', name: 'Tasa Ocupación', pillar: 'efficiency', unit: '%', higherIsBetter: true, benchmark: 75 },
  { id: 'turnaround-days', name: 'Días Rotación', pillar: 'efficiency', unit: 'días', higherIsBetter: false, benchmark: 2.5 },
  // Quality (4)
  { id: 'readmission-rate', name: 'Tasa Reingreso', pillar: 'quality', unit: '%', higherIsBetter: false, benchmark: 5 },
  { id: 'complication-rate', name: 'Tasa Complicaciones', pillar: 'quality', unit: '%', higherIsBetter: false, benchmark: 3 },
  { id: 'patient-satisfaction', name: 'Satisfacción Paciente', pillar: 'quality', unit: 'score', higherIsBetter: true, benchmark: 4.2 },
  { id: 'mortality-index', name: 'Índice Mortalidad', pillar: 'quality', unit: 'ratio', higherIsBetter: false, benchmark: 0.9 },
  // Integrity (3)
  { id: 'fraud-risk-score', name: 'Score Riesgo Fraude', pillar: 'integrity', unit: 'score', higherIsBetter: false, benchmark: 15 },
  { id: 'correction-rate', name: 'Tasa Corrección', pillar: 'integrity', unit: '%', higherIsBetter: false, benchmark: 10 },
  { id: 'billing-accuracy', name: 'Precisión Facturación', pillar: 'integrity', unit: '%', higherIsBetter: true, benchmark: 92 },
];

// ---------------------------------------------------------------------------
// Helper: generate monthly series
// ---------------------------------------------------------------------------
function genMonthly(baseScore: number, basePaid: number, baseCases: number): { month: string; score05: number; paidAmount: number; cases: number }[] {
  const months = ['2025-04','2025-05','2025-06','2025-07','2025-08','2025-09','2025-10','2025-11','2025-12','2026-01','2026-02','2026-03'];
  return months.map((m, i) => ({
    month: m,
    score05: +(baseScore + (Math.sin(i * 0.5) * 0.15) + (Math.random() - 0.5) * 0.1).toFixed(2),
    paidAmount: Math.round(basePaid / 12 * (0.85 + Math.random() * 0.3)),
    cases: Math.round(baseCases / 12 * (0.85 + Math.random() * 0.3)),
  }));
}

// ---------------------------------------------------------------------------
// Helper: generate KPI values for a hospital
// ---------------------------------------------------------------------------
function genKPIs(profile: 'excellent' | 'good' | 'average' | 'poor'): KPIValue[] {
  const mult = profile === 'excellent' ? 0.8 : profile === 'good' ? 0.95 : profile === 'average' ? 1.1 : 1.35;
  const invMult = profile === 'excellent' ? 1.15 : profile === 'good' ? 1.05 : profile === 'average' ? 0.95 : 0.8;
  const jitter = () => 0.9 + Math.random() * 0.2;
  return KPI_DEFINITIONS.map(d => {
    const val = d.higherIsBetter
      ? +(d.benchmark * invMult * jitter()).toFixed(2)
      : +(d.benchmark * mult * jitter()).toFixed(2);
    const diff = d.higherIsBetter ? val - d.benchmark : d.benchmark - val;
    const s05 = Math.max(0, Math.min(5, 2.5 + diff / d.benchmark * 5));
    return {
      kpiId: d.id,
      value: val,
      score05: +s05.toFixed(2),
      score100: +(s05 * 20).toFixed(0),
      benchmark: d.benchmark,
      trend: diff > 0 ? 'up' as const : diff < -d.benchmark * 0.05 ? 'down' as const : 'stable' as const,
      delta: +(diff / d.benchmark * 100).toFixed(1),
    };
  });
}

function buildPillars(kpis: KPIValue[]): PillarScore[] {
  const groups: Record<string, { label: string; ids: string[]; weight: number }> = {
    cost: { label: 'Costo', ids: ['avg-ticket','high-cost-pct','cost-per-day','supply-cost-ratio','pharmacy-cost-ratio','avg-case-cost'], weight: 0.40 },
    efficiency: { label: 'Eficiencia', ids: ['avg-los','emergency-pct','scheduled-pct','occupancy-rate','turnaround-days'], weight: 0.25 },
    quality: { label: 'Calidad', ids: ['readmission-rate','complication-rate','patient-satisfaction','mortality-index'], weight: 0.20 },
    integrity: { label: 'Integridad', ids: ['fraud-risk-score','correction-rate','billing-accuracy'], weight: 0.15 },
  };
  return Object.entries(groups).map(([pillar, g]) => {
    const pKpis = g.ids.map(id => kpis.find(k => k.kpiId === id)!);
    const avg = pKpis.reduce((s, k) => s + k.score05, 0) / pKpis.length;
    return {
      pillar: pillar as any,
      label: g.label,
      score05: +avg.toFixed(2),
      score100: +(avg * 20).toFixed(0),
      weight: g.weight,
      kpis: pKpis,
    };
  });
}

// ---------------------------------------------------------------------------
// 3. Hospitals (20)
// ---------------------------------------------------------------------------
const hospitalDefs: { id: string; name: string; city: string; state: string; stateCode: string; level: 'P100'|'P200'|'P300'; segment: 'Premier'|'Flexibles'; profile: 'excellent'|'good'|'average'|'poor'; paid: number; cases: number; infra: number; atc: boolean }[] = [
  { id: 'medica-sur', name: 'Médica Sur', city: 'Ciudad de México', state: 'Ciudad de México', stateCode: 'CMX', level: 'P100', segment: 'Premier', profile: 'excellent', paid: 780_000_000, cases: 7200, infra: 5, atc: false },
  { id: 'abc-observatorio', name: 'Hospital ABC - Observatorio', city: 'Ciudad de México', state: 'Ciudad de México', stateCode: 'CMX', level: 'P100', segment: 'Premier', profile: 'excellent', paid: 720_000_000, cases: 6800, infra: 5, atc: false },
  { id: 'abc-santa-fe', name: 'Hospital ABC - Santa Fe', city: 'Ciudad de México', state: 'Ciudad de México', stateCode: 'CMX', level: 'P100', segment: 'Premier', profile: 'good', paid: 650_000_000, cases: 5900, infra: 5, atc: false },
  { id: 'angeles-pedregal', name: 'Hospital Ángeles Pedregal', city: 'Ciudad de México', state: 'Ciudad de México', stateCode: 'CMX', level: 'P100', segment: 'Premier', profile: 'good', paid: 600_000_000, cases: 5500, infra: 4, atc: false },
  { id: 'angeles-lomas', name: 'Hospital Ángeles Lomas', city: 'Huixquilucan', state: 'Estado de México', stateCode: 'MEX', level: 'P100', segment: 'Premier', profile: 'good', paid: 580_000_000, cases: 5200, infra: 5, atc: false },
  { id: 'angeles-carmen', name: 'Hospital Ángeles del Carmen', city: 'Guadalajara', state: 'Jalisco', stateCode: 'JAL', level: 'P200', segment: 'Premier', profile: 'good', paid: 420_000_000, cases: 4100, infra: 4, atc: false },
  { id: 'christus-alta', name: 'Christus Muguerza Alta Especialidad', city: 'Monterrey', state: 'Nuevo León', stateCode: 'NLE', level: 'P200', segment: 'Premier', profile: 'good', paid: 480_000_000, cases: 4600, infra: 4, atc: false },
  { id: 'christus-sur', name: 'Christus Muguerza Sur', city: 'Monterrey', state: 'Nuevo León', stateCode: 'NLE', level: 'P200', segment: 'Flexibles', profile: 'average', paid: 320_000_000, cases: 3400, infra: 3, atc: false },
  { id: 'star-medica', name: 'Hospital Star Médica', city: 'Ciudad de México', state: 'Ciudad de México', stateCode: 'CMX', level: 'P200', segment: 'Flexibles', profile: 'average', paid: 350_000_000, cases: 3800, infra: 3, atc: true },
  { id: 'hospital-espanol', name: 'Hospital Español', city: 'Ciudad de México', state: 'Ciudad de México', stateCode: 'CMX', level: 'P200', segment: 'Flexibles', profile: 'average', paid: 280_000_000, cases: 3100, infra: 3, atc: false },
  { id: 'angeles-metropolitano', name: 'Hospital Ángeles Metropolitano', city: 'Ciudad de México', state: 'Ciudad de México', stateCode: 'CMX', level: 'P200', segment: 'Premier', profile: 'average', paid: 380_000_000, cases: 3600, infra: 4, atc: false },
  { id: 'san-javier', name: 'Hospital San Javier', city: 'Guadalajara', state: 'Jalisco', stateCode: 'JAL', level: 'P200', segment: 'Flexibles', profile: 'average', paid: 260_000_000, cases: 2800, infra: 3, atc: true },
  { id: 'christus-conchita', name: 'Christus Muguerza Conchita', city: 'Monterrey', state: 'Nuevo León', stateCode: 'NLE', level: 'P200', segment: 'Flexibles', profile: 'poor', paid: 220_000_000, cases: 2400, infra: 2, atc: false },
  { id: 'angeles-puebla', name: 'Hospital Ángeles Puebla', city: 'Puebla', state: 'Puebla', stateCode: 'PUE', level: 'P200', segment: 'Flexibles', profile: 'average', paid: 240_000_000, cases: 2600, infra: 3, atc: false },
  { id: 'angeles-chihuahua', name: 'Hospital Ángeles Chihuahua', city: 'Chihuahua', state: 'Chihuahua', stateCode: 'CHH', level: 'P300', segment: 'Flexibles', profile: 'poor', paid: 180_000_000, cases: 2000, infra: 2, atc: false },
  { id: 'siglo-xxi', name: 'Centro Médico Nacional Siglo XXI', city: 'Ciudad de México', state: 'Ciudad de México', stateCode: 'CMX', level: 'P300', segment: 'Flexibles', profile: 'poor', paid: 190_000_000, cases: 2200, infra: 3, atc: true },
  { id: 'galenia', name: 'Hospital Galenia', city: 'Cancún', state: 'Quintana Roo', stateCode: 'ROO', level: 'P300', segment: 'Flexibles', profile: 'average', paid: 160_000_000, cases: 1600, infra: 3, atc: false },
  { id: 'cima-hermosillo', name: 'Hospital CIMA Hermosillo', city: 'Hermosillo', state: 'Sonora', stateCode: 'SON', level: 'P300', segment: 'Flexibles', profile: 'poor', paid: 140_000_000, cases: 1400, infra: 2, atc: false },
  { id: 'angeles-queretaro', name: 'Hospital Ángeles Querétaro', city: 'Querétaro', state: 'Querétaro', stateCode: 'QRO', level: 'P200', segment: 'Premier', profile: 'good', paid: 300_000_000, cases: 3000, infra: 4, atc: false },
  { id: 'san-jose-tecsalud', name: 'Hospital San José TecSalud', city: 'Monterrey', state: 'Nuevo León', stateCode: 'NLE', level: 'P200', segment: 'Premier', profile: 'good', paid: 400_000_000, cases: 3900, infra: 4, atc: false },
];

const scoreMap: Record<string, number> = {
  'medica-sur': 4.21, 'abc-observatorio': 3.95, 'abc-santa-fe': 3.72, 'angeles-pedregal': 3.55,
  'angeles-lomas': 3.48, 'angeles-carmen': 3.30, 'christus-alta': 3.25, 'christus-sur': 2.68,
  'star-medica': 2.55, 'hospital-espanol': 2.62, 'angeles-metropolitano': 2.78, 'san-javier': 2.45,
  'christus-conchita': 2.10, 'angeles-puebla': 2.72, 'angeles-chihuahua': 1.95, 'siglo-xxi': 2.05,
  'galenia': 2.50, 'cima-hermosillo': 1.88, 'angeles-queretaro': 3.15, 'san-jose-tecsalud': 3.35,
};

const riskDefs: Record<string, { flags: { id: string; label: string; severity: 'low'|'medium'|'high'|'critical'; description: string }[]; hr: boolean; ha: boolean; he: boolean; hc: boolean; fr: boolean; sd: boolean }> = {
  'medica-sur': { flags: [], hr: false, ha: false, he: false, hc: false, fr: false, sd: false },
  'abc-observatorio': { flags: [], hr: false, ha: false, he: false, hc: false, fr: false, sd: false },
  'abc-santa-fe': { flags: [{ id: 'r1', label: 'Costo Alto', severity: 'medium', description: 'Ticket promedio ligeramente elevado vs peers' }], hr: false, ha: false, he: false, hc: true, fr: false, sd: false },
  'angeles-pedregal': { flags: [{ id: 'r2', label: 'Ticket Elevado', severity: 'high', description: 'Ticket promedio +22% vs grupo par' }], hr: false, ha: false, he: false, hc: true, fr: false, sd: false },
  'angeles-lomas': { flags: [], hr: false, ha: false, he: false, hc: false, fr: false, sd: false },
  'angeles-carmen': { flags: [{ id: 'r3', label: 'Reingreso Alto', severity: 'medium', description: 'Tasa de reingreso 7.2% vs benchmark 5%' }], hr: true, ha: false, he: false, hc: false, fr: false, sd: false },
  'christus-alta': { flags: [], hr: false, ha: false, he: false, hc: false, fr: false, sd: false },
  'christus-sur': { flags: [{ id: 'r4', label: 'Estancia Alta', severity: 'high', description: 'ALOS 5.2 días vs benchmark 3.8' }, { id: 'r5', label: 'Urgencias Alto', severity: 'medium', description: '38% urgencias vs benchmark 25%' }], hr: false, ha: true, he: true, hc: false, fr: false, sd: false },
  'star-medica': { flags: [{ id: 'r6', label: 'Supervisión Alta', severity: 'high', description: 'Índice de dependencia de supervisión 28%' }], hr: false, ha: false, he: false, hc: false, fr: false, sd: true },
  'hospital-espanol': { flags: [{ id: 'r7', label: 'Estancia Alta', severity: 'medium', description: 'ALOS 4.5 días' }], hr: false, ha: true, he: false, hc: false, fr: false, sd: false },
  'angeles-metropolitano': { flags: [], hr: false, ha: false, he: false, hc: false, fr: false, sd: false },
  'san-javier': { flags: [{ id: 'r8', label: 'Fraude Alerta', severity: 'high', description: 'Score de riesgo fraude elevado' }, { id: 'r9', label: 'Corrección Alta', severity: 'medium', description: 'Tasa corrección 18%' }], hr: false, ha: false, he: false, hc: false, fr: true, sd: true },
  'christus-conchita': { flags: [{ id: 'r10', label: 'Rendimiento Bajo', severity: 'critical', description: 'Score general en zona crítica' }, { id: 'r11', label: 'Reingreso Crítico', severity: 'high', description: 'Tasa de reingreso 9.8%' }, { id: 'r12', label: 'Estancia Excesiva', severity: 'high', description: 'ALOS 6.1 días' }], hr: true, ha: true, he: true, hc: true, fr: false, sd: true },
  'angeles-puebla': { flags: [{ id: 'r13', label: 'Urgencias Alto', severity: 'medium', description: '% urgencias por encima del benchmark' }], hr: false, ha: false, he: true, hc: false, fr: false, sd: false },
  'angeles-chihuahua': { flags: [{ id: 'r14', label: 'Score Bajo', severity: 'critical', description: 'Score general < 2.0' }, { id: 'r15', label: 'Costo Excesivo', severity: 'high', description: 'Costo promedio caso +40% vs benchmark' }], hr: true, ha: true, he: false, hc: true, fr: false, sd: false },
  'siglo-xxi': { flags: [{ id: 'r16', label: 'Fraude Potencial', severity: 'high', description: 'Múltiples alertas de facturación' }, { id: 'r17', label: 'Supervisión Crítica', severity: 'critical', description: 'Índice dependencia 32%' }], hr: false, ha: false, he: true, hc: false, fr: true, sd: true },
  'galenia': { flags: [{ id: 'r18', label: 'Volumen Bajo', severity: 'low', description: 'Muestra estadística limitada' }], hr: false, ha: false, he: false, hc: false, fr: false, sd: false },
  'cima-hermosillo': { flags: [{ id: 'r19', label: 'Score Crítico', severity: 'critical', description: 'Rendimiento consistentemente bajo' }, { id: 'r20', label: 'Calidad Baja', severity: 'high', description: 'Indicadores de calidad deficientes' }], hr: true, ha: true, he: true, hc: true, fr: false, sd: false },
  'angeles-queretaro': { flags: [], hr: false, ha: false, he: false, hc: false, fr: false, sd: false },
  'san-jose-tecsalud': { flags: [], hr: false, ha: false, he: false, hc: false, fr: false, sd: false },
};

const correctionMap: Record<string, { reasons: string[]; index: number; trend: 'improving'|'stable'|'worsening' }> = {
  'medica-sur': { reasons: ['Ajuste menor de honorarios'], index: 0.05, trend: 'improving' },
  'abc-observatorio': { reasons: ['Corrección de codificación'], index: 0.06, trend: 'stable' },
  'abc-santa-fe': { reasons: ['Cobro excesivo insumos', 'Días estancia no justificados'], index: 0.09, trend: 'stable' },
  'angeles-pedregal': { reasons: ['Sobrecobro en insumos quirúrgicos', 'Honorarios excesivos'], index: 0.12, trend: 'worsening' },
  'angeles-lomas': { reasons: ['Ajuste de tarifa por convenio'], index: 0.07, trend: 'improving' },
  'angeles-carmen': { reasons: ['Días estancia adicionales', 'Procedimientos no autorizados'], index: 0.11, trend: 'stable' },
  'christus-alta': { reasons: ['Corrección menor facturación'], index: 0.08, trend: 'improving' },
  'christus-sur': { reasons: ['Cobro excesivo farmacia', 'Estancia no justificada', 'Insumos duplicados'], index: 0.18, trend: 'worsening' },
  'star-medica': { reasons: ['Facturación duplicada', 'Cobro excesivo insumos', 'Procedimientos no cubiertos'], index: 0.28, trend: 'worsening' },
  'hospital-espanol': { reasons: ['Días estancia no justificados'], index: 0.10, trend: 'stable' },
  'angeles-metropolitano': { reasons: ['Ajuste de tarifa'], index: 0.08, trend: 'improving' },
  'san-javier': { reasons: ['Facturación inconsistente', 'Insumos no utilizados cobrados', 'Procedimientos duplicados'], index: 0.22, trend: 'worsening' },
  'christus-conchita': { reasons: ['Sobrefacturación generalizada', 'Estancia excesiva', 'Insumos inflados'], index: 0.30, trend: 'worsening' },
  'angeles-puebla': { reasons: ['Ajuste de urgencias', 'Corrección honorarios'], index: 0.11, trend: 'stable' },
  'angeles-chihuahua': { reasons: ['Costo excesivo insumos', 'Honorarios fuera de rango', 'Procedimientos no justificados'], index: 0.25, trend: 'worsening' },
  'siglo-xxi': { reasons: ['Facturación irregular', 'Insumos fantasma', 'Cobro duplicado'], index: 0.32, trend: 'worsening' },
  'galenia': { reasons: ['Ajuste menor tarifa'], index: 0.08, trend: 'stable' },
  'cima-hermosillo': { reasons: ['Sobrecobro generalizado', 'Estancia injustificada'], index: 0.20, trend: 'worsening' },
  'angeles-queretaro': { reasons: ['Corrección menor'], index: 0.07, trend: 'improving' },
  'san-jose-tecsalud': { reasons: ['Ajuste de codificación'], index: 0.06, trend: 'improving' },
};

export const hospitals: Hospital[] = hospitalDefs.map(d => {
  const kpis = genKPIs(d.profile);
  const pillars = buildPillars(kpis);
  const s05 = scoreMap[d.id];
  const risk = riskDefs[d.id];
  const corr = correctionMap[d.id];
  return {
    id: d.id,
    name: d.name,
    city: d.city,
    state: d.state,
    stateCode: d.stateCode,
    level: d.level,
    segment: d.segment,
    paidU12M: d.paid,
    casesU12M: d.cases,
    score05: s05,
    score100: Math.round(s05 * 20),
    pillarScores: pillars,
    kpiValues: kpis,
    riskFlags: risk.flags,
    highReadmissions: risk.hr,
    highALOS: risk.ha,
    highEmergencyPct: risk.he,
    highCostPct: risk.hc,
    fraudAlerts: risk.fr,
    supervisionDependency: risk.sd,
    infrastructureRating: d.infra,
    atcFlag: d.atc,
    supervisionIndex: corr.index,
    correctionReasons: corr.reasons,
    supervisionTrend: corr.trend,
    monthlySeries: genMonthly(s05, d.paid, d.cases),
  };
});

// ---------------------------------------------------------------------------
// 4. States Data
// ---------------------------------------------------------------------------
export const statesData: StateData[] = [
  { stateCode: 'CMX', stateName: 'Ciudad de México', score05: 3.18, paidU12M: 3_400_000_000, casesU12M: 32000, trend: 'up', hospitalCount: 8, opportunityCount: 5, riskFlagCount: 4 },
  { stateCode: 'JAL', stateName: 'Jalisco', score05: 2.88, paidU12M: 680_000_000, casesU12M: 6900, trend: 'stable', hospitalCount: 2, opportunityCount: 2, riskFlagCount: 3 },
  { stateCode: 'NLE', stateName: 'Nuevo León', score05: 2.85, paidU12M: 1_420_000_000, casesU12M: 14300, trend: 'down', hospitalCount: 4, opportunityCount: 3, riskFlagCount: 5 },
  { stateCode: 'PUE', stateName: 'Puebla', score05: 2.72, paidU12M: 240_000_000, casesU12M: 2600, trend: 'stable', hospitalCount: 1, opportunityCount: 1, riskFlagCount: 1 },
  { stateCode: 'CHH', stateName: 'Chihuahua', score05: 1.95, paidU12M: 180_000_000, casesU12M: 2000, trend: 'down', hospitalCount: 1, opportunityCount: 1, riskFlagCount: 2 },
  { stateCode: 'QRO', stateName: 'Querétaro', score05: 3.15, paidU12M: 300_000_000, casesU12M: 3000, trend: 'up', hospitalCount: 1, opportunityCount: 0, riskFlagCount: 0 },
  { stateCode: 'ROO', stateName: 'Quintana Roo', score05: 2.50, paidU12M: 160_000_000, casesU12M: 1600, trend: 'stable', hospitalCount: 1, opportunityCount: 0, riskFlagCount: 1 },
  { stateCode: 'SON', stateName: 'Sonora', score05: 1.88, paidU12M: 140_000_000, casesU12M: 1400, trend: 'down', hospitalCount: 1, opportunityCount: 1, riskFlagCount: 2 },
  { stateCode: 'MEX', stateName: 'Estado de México', score05: 3.48, paidU12M: 580_000_000, casesU12M: 5200, trend: 'up', hospitalCount: 1, opportunityCount: 0, riskFlagCount: 0 },
  { stateCode: 'GUA', stateName: 'Guanajuato', score05: 2.65, paidU12M: 120_000_000, casesU12M: 1200, trend: 'stable', hospitalCount: 0, opportunityCount: 0, riskFlagCount: 0 },
  { stateCode: 'AGS', stateName: 'Aguascalientes', score05: 2.80, paidU12M: 95_000_000, casesU12M: 980, trend: 'up', hospitalCount: 0, opportunityCount: 0, riskFlagCount: 0 },
  { stateCode: 'YUC', stateName: 'Yucatán', score05: 2.55, paidU12M: 110_000_000, casesU12M: 1100, trend: 'stable', hospitalCount: 0, opportunityCount: 0, riskFlagCount: 0 },
];

// ---------------------------------------------------------------------------
// 5. National Time Series
// ---------------------------------------------------------------------------
export const nationalTimeSeries: NationalTimeSeries[] = [
  { month: '2025-04', score05: 2.71, totalPaid: 595_000_000, totalCases: 5800 },
  { month: '2025-05', score05: 2.73, totalPaid: 610_000_000, totalCases: 5950 },
  { month: '2025-06', score05: 2.70, totalPaid: 580_000_000, totalCases: 5700 },
  { month: '2025-07', score05: 2.75, totalPaid: 620_000_000, totalCases: 6100 },
  { month: '2025-08', score05: 2.78, totalPaid: 630_000_000, totalCases: 6200 },
  { month: '2025-09', score05: 2.74, totalPaid: 605_000_000, totalCases: 5900 },
  { month: '2025-10', score05: 2.80, totalPaid: 645_000_000, totalCases: 6300 },
  { month: '2025-11', score05: 2.82, totalPaid: 660_000_000, totalCases: 6450 },
  { month: '2025-12', score05: 2.76, totalPaid: 690_000_000, totalCases: 6700 },
  { month: '2026-01', score05: 2.84, totalPaid: 640_000_000, totalCases: 6250 },
  { month: '2026-02', score05: 2.86, totalPaid: 625_000_000, totalCases: 6100 },
  { month: '2026-03', score05: 2.88, totalPaid: 650_000_000, totalCases: 6350 },
];

// ---------------------------------------------------------------------------
// 6. Dynamic Insights
// ---------------------------------------------------------------------------
export const dynamicInsights: DynamicInsight[] = [
  { id: 'ins-1', title: 'Ticket Elevado — Ángeles Pedregal', description: 'Hospital Ángeles Pedregal muestra ticket promedio +22% vs grupo par P100 Premier. Oportunidad directa de renegociación de tarifas.', magnitude: '+22% vs peers', benchmark: 'Ticket promedio P100: $45,000', financialImpact: '$18.5M anuales', actionLabel: 'Crear Oportunidad', relatedHospitalId: 'angeles-pedregal' },
  { id: 'ins-2', title: 'Tendencia Descendente — Nuevo León', description: 'El estado de Nuevo León presenta tendencia descendente de score en los últimos 6 meses. Posible problema sistémico con la red de proveedores regional.', magnitude: '-0.15 score / 6m', benchmark: 'Tendencia nacional: +0.08', financialImpact: '$12.2M en riesgo', actionLabel: 'Investigar', relatedHospitalId: undefined },
  { id: 'ins-3', title: 'Candidato a Bundle Pricing — Médica Sur', description: 'Médica Sur concentra 72% de cirugías programadas. Alta predictibilidad permite modelo de pago por paquete con ahorro estimado de 8-12%.', magnitude: '72% programadas', benchmark: 'Promedio red: 65%', financialImpact: '$62.4M–$93.6M', actionLabel: 'Simular Bundle', relatedHospitalId: 'medica-sur' },
  { id: 'ins-4', title: 'Supervisión Crítica — Siglo XXI', description: 'Centro Médico Siglo XXI presenta índice de dependencia de supervisión de 32%, el más alto de la red. Facturación irregular recurrente.', magnitude: '32% dependencia', benchmark: 'Benchmark: <10%', financialImpact: '$8.1M en correcciones', actionLabel: 'Auditoría Urgente', relatedHospitalId: 'siglo-xxi' },
  { id: 'ins-5', title: 'Estancia Excesiva — Christus Conchita', description: 'Christus Muguerza Conchita tiene ALOS de 6.1 días, 60% por encima del benchmark. Genera sobrecosto significativo en casos hospitalarios.', magnitude: '+60% ALOS', benchmark: 'Benchmark: 3.8 días', financialImpact: '$15.3M anuales', actionLabel: 'Plan de Mejora', relatedHospitalId: 'christus-conchita' },
  { id: 'ins-6', title: 'Fraude Potencial — San Javier', description: 'Hospital San Javier muestra patrones de facturación inconsistente con 3 tipos de alerta activa. Se recomienda auditoría in-situ inmediata.', magnitude: '3 alertas activas', benchmark: 'Umbral: 0 alertas', financialImpact: '$5.8M sospechoso', actionLabel: 'Iniciar Auditoría', relatedHospitalId: 'san-javier' },
  { id: 'ins-7', title: 'Top Performer — Red CDMX', description: 'Los hospitales P100 de CDMX (Médica Sur, ABC) mantienen scores >3.9 consistentemente. Modelo de referencia para establecer benchmarks nacionales.', magnitude: 'Score >3.9', benchmark: 'Promedio nacional: 2.74', financialImpact: 'Potencial replicación', actionLabel: 'Exportar Benchmark', relatedHospitalId: 'medica-sur' },
  { id: 'ins-8', title: 'Riesgo Zona Norte — CIMA Hermosillo', description: 'Hospital CIMA Hermosillo acumula el score más bajo de la red (1.88) con rendimiento consistentemente deficiente en las 4 dimensiones.', magnitude: 'Score 1.88/5.00', benchmark: 'Mínimo aceptable: 2.5', financialImpact: '$4.2M en sobrecostos', actionLabel: 'Revisión de Contrato', relatedHospitalId: 'cima-hermosillo' },
];

// ---------------------------------------------------------------------------
// 7. Negotiation Opportunities
// ---------------------------------------------------------------------------
export const negotiationOpportunities: NegotiationOpportunity[] = [
  {
    id: 'opp-1', hospitalId: 'angeles-pedregal', hospitalName: 'Hospital Ángeles Pedregal',
    category: 'pricing-deviation', categoryLabel: 'Desviación de Precios',
    description: 'Ticket promedio excede benchmark P100 en 22%. Renegociación de tarifa base requerida.',
    triggerKPI: 'avg-ticket', triggerValue: 54900, benchmark: 45000,
    estimatedImpactMXN: 18_500_000, complexity: 'medium', priority: 'high', status: 'proposal-ready',
    owner: 'Carlos Mendoza', targetDate: '2026-06-30',
    executiveSummary: 'Hospital Ángeles Pedregal opera con un ticket promedio 22% superior al benchmark para hospitales P100 Premier. La desviación se concentra en insumos quirúrgicos y honorarios médicos, generando un sobrecosto anual de $18.5M.',
    quantitativeEvidence: ['Ticket promedio: $54,900 vs benchmark $45,000 (+22%)', 'Ratio insumos/costo: 42% vs benchmark 35%', 'Honorarios médicos: +18% vs grupo par', 'Tendencia ascendente últimos 3 trimestres'],
    drivers: ['Falta de tope contractual en insumos', 'Honorarios negociados individualmente', 'Incremento en complejidad de casos'],
    negotiationProposal: 'Establecer tarifa tope por GRD para los 20 procedimientos de mayor frecuencia, con cláusula de revisión semestral vinculada al índice de precios médicos.',
    risks: ['Posible resistencia del hospital por reducción de margen', 'Riesgo de derivación de pacientes a otras unidades'],
    actionPlan: ['Generar fact pack con evidencia', 'Agendar mesa de negociación', 'Presentar propuesta de tarifa por GRD', 'Negociar cláusulas de revisión', 'Formalizar adendum contractual'],
  },
  {
    id: 'opp-2', hospitalId: 'christus-conchita', hospitalName: 'Christus Muguerza Conchita',
    category: 'los-optimization', categoryLabel: 'Optimización de Estancia',
    description: 'ALOS de 6.1 días excede benchmark en 60%. Plan de reducción de estancia con metas trimestrales.',
    triggerKPI: 'avg-los', triggerValue: 6.1, benchmark: 3.8,
    estimatedImpactMXN: 15_300_000, complexity: 'high', priority: 'critical', status: 'in-analysis',
    owner: 'Ana Rodríguez', targetDate: '2026-05-15',
    executiveSummary: 'Christus Muguerza Conchita presenta la estancia promedio más alta de la red (6.1 días vs 3.8 benchmark), resultando en sobrecostos por $15.3M anuales. El problema es sistémico y requiere intervención multidimensional.',
    quantitativeEvidence: ['ALOS: 6.1 días vs benchmark 3.8 (+60%)', 'Costo adicional por día extra: ~$18,000', 'Días excedentes anuales: ~5,400', 'Impacto directo en prima de siniestralidad'],
    drivers: ['Protocolos de alta no estandarizados', 'Demoras en estudios diagnósticos', 'Falta de programa de alta temprana', 'Coordinación deficiente con áreas de apoyo'],
    negotiationProposal: 'Implementar programa conjunto de gestión de estancia con SLAs contractuales: meta Q3 2026 = 4.5 días, meta Q4 2026 = 4.0 días, con bonificación por cumplimiento y penalización gradual.',
    risks: ['Complejidad de implementación operativa', 'Posible impacto en calidad de atención si se reduce sin control', 'Requiere inversión en procesos del hospital'],
    actionPlan: ['Diagnóstico detallado de causas de estancia prolongada', 'Diseñar programa de alta temprana conjunto', 'Establecer SLAs con metas escalonadas', 'Implementar monitoreo semanal', 'Revisión trimestral de avance'],
  },
  {
    id: 'opp-3', hospitalId: 'medica-sur', hospitalName: 'Médica Sur',
    category: 'bundling', categoryLabel: 'Bundle Pricing',
    description: 'Alta concentración de cirugías programadas (72%) permite modelo de pago por paquete con ahorro estimado de 8-12%.',
    triggerKPI: 'scheduled-pct', triggerValue: 72, benchmark: 65,
    estimatedImpactMXN: 45_000_000, complexity: 'high', priority: 'high', status: 'identified',
    owner: 'Sin asignar', targetDate: '2026-09-30',
    executiveSummary: 'Médica Sur es candidato ideal para bundle pricing dado su alto porcentaje de cirugías programadas (72%) y la predictibilidad de su case mix. El modelo de paquete puede generar ahorros de $45M-$93M anuales.',
    quantitativeEvidence: ['72% cirugías programadas vs 65% benchmark', 'Top 10 procedimientos representan 58% del monto', 'Variabilidad de costo por procedimiento: ±15%', 'Volumen suficiente para análisis actuarial robusto'],
    drivers: ['Alta concentración de procedimientos estandarizables', 'Volumen predictible y constante', 'Infraestructura hospitalaria de primer nivel', 'Disposición histórica a modelos innovadores'],
    negotiationProposal: 'Diseñar paquetes cerrados para los 10 procedimientos de mayor frecuencia, incluyendo honorarios, insumos, estancia y estudios. Tarifa fija con ajuste anual por inflación médica.',
    risks: ['Resistencia de cuerpo médico por tope de honorarios', 'Casos complejos que excedan el paquete', 'Necesidad de definir protocolos de exclusión'],
    actionPlan: ['Análisis actuarial de top 10 procedimientos', 'Diseño de estructura de paquetes', 'Validación con comité médico del hospital', 'Piloto con 3 procedimientos', 'Expansión gradual a 10 procedimientos'],
  },
  {
    id: 'opp-4', hospitalId: 'siglo-xxi', hospitalName: 'Centro Médico Nacional Siglo XXI',
    category: 'fraud-indicator', categoryLabel: 'Indicador de Fraude',
    description: 'Múltiples alertas de facturación irregular. Auditoría urgente recomendada.',
    triggerKPI: 'fraud-risk-score', triggerValue: 38, benchmark: 15,
    estimatedImpactMXN: 8_100_000, complexity: 'medium', priority: 'critical', status: 'in-analysis',
    owner: 'Roberto Sánchez', targetDate: '2026-04-30',
    executiveSummary: 'Centro Médico Siglo XXI presenta un score de riesgo fraude de 38 (vs benchmark 15), con patrones recurrentes de facturación duplicada e insumos no utilizados cobrados. El índice de dependencia de supervisión es 32%.',
    quantitativeEvidence: ['Score riesgo fraude: 38 vs benchmark 15', 'Índice supervisión: 32%', '3 tipos de alerta activa', 'Correcciones acumuladas: $8.1M en U12M'],
    drivers: ['Procesos de facturación no automatizados', 'Rotación alta de personal administrativo', 'Falta de controles internos efectivos'],
    negotiationProposal: 'Condicionar continuidad contractual a implementación de sistema de facturación electrónica con validación automática en un plazo de 90 días.',
    risks: ['Posible escalamiento legal', 'Interrupción de servicios durante transición', 'Hallazgos adicionales durante auditoría'],
    actionPlan: ['Programar auditoría in-situ inmediata', 'Revisión de facturación últimos 24 meses', 'Requerir plan de acción correctiva', 'Implementar monitoreo reforzado', 'Evaluar continuidad contractual'],
  },
  {
    id: 'opp-5', hospitalId: 'christus-sur', hospitalName: 'Christus Muguerza Sur',
    category: 'utilization', categoryLabel: 'Utilización',
    description: '38% de urgencias vs 25% benchmark. Programa de derivación a consulta programada.',
    triggerKPI: 'emergency-pct', triggerValue: 38, benchmark: 25,
    estimatedImpactMXN: 9_500_000, complexity: 'medium', priority: 'high', status: 'negotiating',
    owner: 'María López', targetDate: '2026-07-31',
    executiveSummary: 'Christus Muguerza Sur tiene un porcentaje de urgencias de 38%, significativamente superior al benchmark de 25%. Esto genera sobrecostos por atención no programada y reduce la eficiencia operativa.',
    quantitativeEvidence: ['% urgencias: 38% vs benchmark 25% (+52%)', 'Costo promedio urgencia vs programada: +45%', 'Casos de urgencia que podrían ser programados: ~30%'],
    drivers: ['Falta de programa de canalización', 'Convenios con empresas sin filtro de urgencia', 'Acceso limitado a consulta externa'],
    negotiationProposal: 'Implementar protocolo de pre-autorización para urgencias no vitales con derivación a consulta programada. Meta: reducir a 28% en 6 meses.',
    risks: ['Impacto en satisfacción del paciente por derivación', 'Resistencia del hospital por menor ingreso de urgencias'],
    actionPlan: ['Definir protocolo de clasificación de urgencias', 'Capacitar personal de admisión', 'Implementar línea de pre-autorización', 'Monitorear mensualmente'],
  },
  {
    id: 'opp-6', hospitalId: 'san-javier', hospitalName: 'Hospital San Javier',
    category: 'supervision-dependency', categoryLabel: 'Dependencia de Supervisión',
    description: 'Índice de supervisión de 22% con 3 alertas activas. Requiere programa de mejora de facturación.',
    triggerKPI: 'correction-rate', triggerValue: 18, benchmark: 10,
    estimatedImpactMXN: 5_800_000, complexity: 'low', priority: 'high', status: 'proposal-ready',
    owner: 'Laura García', targetDate: '2026-06-15',
    executiveSummary: 'Hospital San Javier presenta un índice de dependencia de supervisión de 22% con tasa de corrección del 18%. Las principales causas son facturación inconsistente e insumos no utilizados cobrados.',
    quantitativeEvidence: ['Tasa corrección: 18% vs benchmark 10%', 'Índice supervisión: 22%', 'Monto corregido U12M: $5.8M', '3 alertas de fraude activas'],
    drivers: ['Sistema de facturación obsoleto', 'Procesos manuales propensos a error', 'Falta de auditoría interna'],
    negotiationProposal: 'Exigir implementación de sistema de facturación electrónica validada como condición para renovación contractual. Plazo: 120 días.',
    risks: ['Costo de implementación para el hospital', 'Curva de aprendizaje del personal'],
    actionPlan: ['Presentar hallazgos al hospital', 'Requerir plan de migración a facturación electrónica', 'Establecer hitos de implementación', 'Auditoría de seguimiento a 90 días'],
  },
  {
    id: 'opp-7', hospitalId: 'angeles-chihuahua', hospitalName: 'Hospital Ángeles Chihuahua',
    category: 'procedure-cost', categoryLabel: 'Costo de Procedimientos',
    description: 'Costo promedio caso +40% vs benchmark. Revisión integral de tarifa y case mix.',
    triggerKPI: 'avg-case-cost', triggerValue: 119000, benchmark: 85000,
    estimatedImpactMXN: 12_200_000, complexity: 'high', priority: 'critical', status: 'identified',
    owner: 'Sin asignar', targetDate: '2026-08-31',
    executiveSummary: 'Hospital Ángeles Chihuahua presenta costo promedio por caso de $119,000, 40% superior al benchmark de $85,000. La desviación no se justifica por complejidad del case mix y requiere revisión integral.',
    quantitativeEvidence: ['Costo promedio caso: $119,000 vs $85,000 (+40%)', 'Ratio insumos: 48% vs 35% benchmark', 'Farmacia: 30% vs 22% benchmark', 'Score general: 1.95/5.00'],
    drivers: ['Precios de insumos no competitivos', 'Ausencia de topes contractuales', 'Baja eficiencia operativa', 'Mercado local sin competencia suficiente'],
    negotiationProposal: 'Renegociación integral de tarifa con topes por categoría. Si no se logra reducción a <$95,000 en 6 meses, evaluar redirección de volumen.',
    risks: ['Hospital único en la plaza con cobertura GNP', 'Riesgo de pérdida de acceso para asegurados locales'],
    actionPlan: ['Benchmark detallado por procedimiento', 'Mesa de negociación con dirección del hospital', 'Propuesta de tarifa escalonada', 'Evaluación de alternativas en la plaza'],
  },
  {
    id: 'opp-8', hospitalId: 'angeles-carmen', hospitalName: 'Hospital Ángeles del Carmen',
    category: 'readmission-reduction', categoryLabel: 'Reducción de Reingreso',
    description: 'Tasa de reingreso 7.2% vs benchmark 5%. Programa de seguimiento post-alta.',
    triggerKPI: 'readmission-rate', triggerValue: 7.2, benchmark: 5,
    estimatedImpactMXN: 6_800_000, complexity: 'medium', priority: 'medium', status: 'negotiating',
    owner: 'Patricia Hernández', targetDate: '2026-07-15',
    executiveSummary: 'Hospital Ángeles del Carmen tiene tasa de reingreso de 7.2%, 44% superior al benchmark. Los reingresos se concentran en cirugías de trauma y procedimientos cardíacos.',
    quantitativeEvidence: ['Tasa reingreso: 7.2% vs 5% benchmark (+44%)', 'Reingresos en trauma: 12%', 'Reingresos cardíacos: 9%', 'Costo promedio reingreso: $95,000'],
    drivers: ['Altas prematuras por presión de ocupación', 'Seguimiento post-alta insuficiente', 'Falta de coordinación con medicina ambulatoria'],
    negotiationProposal: 'Implementar programa conjunto de seguimiento post-alta con SLA: máximo 5.5% reingreso en 6 meses, con penalización por reingreso evitable.',
    risks: ['Definición de "reingreso evitable" puede ser contenciosa', 'Costo del programa de seguimiento'],
    actionPlan: ['Análisis de causas raíz por especialidad', 'Diseñar programa de seguimiento post-alta', 'Definir criterios de reingreso evitable', 'Implementar monitoreo quincenal'],
  },
  {
    id: 'opp-9', hospitalId: 'abc-santa-fe', hospitalName: 'Hospital ABC - Santa Fe',
    category: 'sla-breach', categoryLabel: 'Incumplimiento de SLA',
    description: 'Días estancia en casos quirúrgicos exceden SLA contractual. Penalización aplicable.',
    triggerKPI: 'avg-los', triggerValue: 4.3, benchmark: 3.8,
    estimatedImpactMXN: 7_200_000, complexity: 'low', priority: 'medium', status: 'proposal-ready',
    owner: 'Diego Torres', targetDate: '2026-05-31',
    executiveSummary: 'Hospital ABC Santa Fe excede el SLA de estancia promedio en casos quirúrgicos (4.3 vs 3.8 días), generando un sobrecosto estimado de $7.2M. La penalización contractual es aplicable.',
    quantitativeEvidence: ['ALOS quirúrgico: 4.3 vs SLA 3.8 (+13%)', 'Días excedentes: ~1,475 días/año', 'Costo por día: $18,000', 'Meses consecutivos con excedente: 4'],
    drivers: ['Incremento en complejidad de cirugías', 'Disponibilidad de quirófanos para reintervención', 'Demoras en estudios de gabinete'],
    negotiationProposal: 'Aplicar penalización contractual retroactiva y establecer plan de reducción con meta de 3.8 días en Q3 2026.',
    risks: ['Relación comercial puede afectarse', 'Hospital puede argumentar cambio en case mix'],
    actionPlan: ['Notificar incumplimiento de SLA', 'Calcular penalización aplicable', 'Negociar plan de reducción de estancia', 'Monitoreo semanal'],
  },
  {
    id: 'opp-10', hospitalId: 'star-medica', hospitalName: 'Hospital Star Médica',
    category: 'supervision-dependency', categoryLabel: 'Dependencia de Supervisión',
    description: 'Índice de dependencia 28% con facturación duplicada recurrente.',
    triggerKPI: 'correction-rate', triggerValue: 15, benchmark: 10,
    estimatedImpactMXN: 4_200_000, complexity: 'low', priority: 'high', status: 'in-analysis',
    owner: 'Fernando Ruiz', targetDate: '2026-05-15',
    executiveSummary: 'Hospital Star Médica presenta índice de dependencia de supervisión de 28% con patrones de facturación duplicada. Las correcciones acumulan $4.2M en el último año.',
    quantitativeEvidence: ['Índice supervisión: 28%', 'Facturaciones duplicadas identificadas: 124', 'Monto corregido: $4.2M', 'Tasa corrección: 15%'],
    drivers: ['Sistema de facturación desactualizado', 'Procesos manuales de captura', 'Falta de reconciliación automática'],
    negotiationProposal: 'Condicionar tarifas preferenciales a implementación de validación electrónica de facturas en 90 días.',
    risks: ['Posible interrupción temporal de servicios durante migración', 'Costo de implementación'],
    actionPlan: ['Reunión con dirección administrativa', 'Definir requisitos de sistema de facturación', 'Establecer timeline de implementación', 'Auditoría de cierre a 90 días'],
  },
  {
    id: 'opp-11', hospitalId: 'cima-hermosillo', hospitalName: 'Hospital CIMA Hermosillo',
    category: 'pricing-deviation', categoryLabel: 'Desviación de Precios',
    description: 'Rendimiento general bajo (1.88) con costos excesivos en todas las categorías.',
    triggerKPI: 'avg-ticket', triggerValue: 62000, benchmark: 45000,
    estimatedImpactMXN: 4_200_000, complexity: 'medium', priority: 'critical', status: 'identified',
    owner: 'Sin asignar', targetDate: '2026-06-30',
    executiveSummary: 'Hospital CIMA Hermosillo acumula el score más bajo de la red con costos excesivos en todas las categorías. Se requiere evaluación de continuidad contractual.',
    quantitativeEvidence: ['Score general: 1.88/5.00', 'Ticket promedio: $62,000 vs $45,000 (+38%)', 'Calidad: 2 de 4 indicadores en zona roja', 'Tendencia: empeorando'],
    drivers: ['Infraestructura limitada', 'Personal médico insuficiente', 'Gestión administrativa deficiente', 'Mercado sin competencia'],
    negotiationProposal: 'Ultimátum: plan de mejora integral con metas a 90 días o cancelación progresiva del convenio con plan de migración de asegurados.',
    risks: ['Hospital es referencia regional', 'Migración de asegurados costosa y compleja'],
    actionPlan: ['Evaluación formal de continuidad', 'Notificación de incumplimiento', 'Plan de mejora con metas claras', 'Identificación de alternativas regionales'],
  },
  {
    id: 'opp-12', hospitalId: 'hospital-espanol', hospitalName: 'Hospital Español',
    category: 'los-optimization', categoryLabel: 'Optimización de Estancia',
    description: 'ALOS de 4.5 días con oportunidad de reducción mediante programa de alta temprana.',
    triggerKPI: 'avg-los', triggerValue: 4.5, benchmark: 3.8,
    estimatedImpactMXN: 3_800_000, complexity: 'low', priority: 'medium', status: 'negotiating',
    owner: 'Alejandra Vega', targetDate: '2026-06-30',
    executiveSummary: 'Hospital Español tiene una estancia promedio de 4.5 días, 18% superior al benchmark. Un programa de alta temprana puede generar ahorros de $3.8M sin impacto en calidad.',
    quantitativeEvidence: ['ALOS: 4.5 vs 3.8 benchmark (+18%)', 'Días excedentes: ~2,170/año', 'Tasa reingreso: 4.8% (dentro de benchmark)', 'Potencial de alta temprana: 35% de casos'],
    drivers: ['Protocolos de alta conservadores', 'Disponibilidad de camas no limitante', 'Cultura institucional de estancia prolongada'],
    negotiationProposal: 'Programa piloto de alta temprana para 5 procedimientos de alto volumen con meta de 4.0 días en Q2 2026.',
    risks: ['Resistencia del cuerpo médico', 'Necesidad de programa de seguimiento domiciliario'],
    actionPlan: ['Identificar procedimientos candidatos', 'Diseñar protocolo de alta temprana', 'Piloto con 5 procedimientos', 'Expansión gradual'],
  },
];

// ---------------------------------------------------------------------------
// 8. Mexico States Geo (simplified SVG paths)
// ---------------------------------------------------------------------------
export const MEXICO_STATES_GEO: { code: string; name: string; path: string; cx: number; cy: number }[] = [
  { code: 'AGS', name: 'Aguascalientes', path: 'M340,285 L350,280 L355,290 L348,298 L338,295Z', cx: 347, cy: 290 },
  { code: 'BC', name: 'Baja California', path: 'M28,40 L55,35 L70,60 L75,100 L65,140 L50,170 L35,160 L25,120 L20,80Z', cx: 48, cy: 100 },
  { code: 'BCS', name: 'Baja California Sur', path: 'M50,175 L65,170 L80,200 L90,240 L85,280 L70,300 L55,290 L45,250 L40,210Z', cx: 65, cy: 235 },
  { code: 'CAM', name: 'Campeche', path: 'M600,390 L640,375 L660,395 L650,430 L630,450 L605,440 L590,415Z', cx: 625, cy: 415 },
  { code: 'CHH', name: 'Chihuahua', path: 'M150,80 L230,75 L260,90 L270,140 L260,200 L230,230 L180,235 L140,200 L130,140Z', cx: 200, cy: 155 },
  { code: 'CHP', name: 'Chiapas', path: 'M560,450 L600,440 L620,460 L615,500 L590,520 L560,510 L545,480Z', cx: 580, cy: 480 },
  { code: 'CMX', name: 'Ciudad de México', path: 'M400,370 L410,365 L415,375 L410,385 L400,382Z', cx: 407, cy: 375 },
  { code: 'COA', name: 'Coahuila', path: 'M230,100 L310,90 L340,110 L350,160 L330,200 L280,210 L240,190 L225,150Z', cx: 285, cy: 150 },
  { code: 'COL', name: 'Colima', path: 'M290,380 L305,375 L310,390 L300,400 L288,395Z', cx: 298, cy: 388 },
  { code: 'DUR', name: 'Durango', path: 'M180,170 L240,160 L270,185 L275,230 L250,260 L210,265 L175,240 L165,200Z', cx: 222, cy: 215 },
  { code: 'GUA', name: 'Guanajuato', path: 'M350,300 L385,295 L395,310 L388,330 L365,340 L345,325Z', cx: 370, cy: 318 },
  { code: 'GRO', name: 'Guerrero', path: 'M350,410 L400,395 L430,415 L425,450 L395,470 L355,460 L340,435Z', cx: 385, cy: 435 },
  { code: 'HID', name: 'Hidalgo', path: 'M410,320 L440,315 L448,330 L440,348 L420,350 L408,338Z', cx: 428, cy: 335 },
  { code: 'JAL', name: 'Jalisco', path: 'M260,290 L310,280 L340,300 L345,340 L320,370 L290,380 L265,360 L250,320Z', cx: 300, cy: 332 },
  { code: 'MEX', name: 'Estado de México', path: 'M385,350 L415,345 L425,360 L418,385 L395,390 L380,375Z', cx: 402, cy: 368 },
  { code: 'MIC', name: 'Michoacán', path: 'M310,360 L360,345 L385,365 L380,400 L350,415 L315,410 L295,390Z', cx: 342, cy: 382 },
  { code: 'MOR', name: 'Morelos', path: 'M405,388 L418,385 L422,398 L415,408 L403,403Z', cx: 412, cy: 396 },
  { code: 'NAY', name: 'Nayarit', path: 'M230,265 L260,255 L275,275 L265,300 L240,305 L225,285Z', cx: 250, cy: 280 },
  { code: 'NLE', name: 'Nuevo León', path: 'M320,130 L365,120 L385,145 L380,185 L355,200 L325,195 L310,165Z', cx: 348, cy: 162 },
  { code: 'OAX', name: 'Oaxaca', path: 'M430,430 L490,415 L530,435 L535,475 L510,500 L460,505 L430,480Z', cx: 480, cy: 460 },
  { code: 'PUE', name: 'Puebla', path: 'M425,370 L460,360 L475,380 L470,415 L448,425 L425,410Z', cx: 450, cy: 392 },
  { code: 'QRO', name: 'Querétaro', path: 'M370,290 L395,285 L403,305 L395,320 L375,318Z', cx: 387, cy: 305 },
  { code: 'ROO', name: 'Quintana Roo', path: 'M660,370 L690,355 L700,380 L695,430 L680,460 L655,445 L650,400Z', cx: 675, cy: 408 },
  { code: 'SLP', name: 'San Luis Potosí', path: 'M330,220 L380,210 L400,235 L395,275 L365,290 L335,280 L320,250Z', cx: 360, cy: 252 },
  { code: 'SIN', name: 'Sinaloa', path: 'M150,190 L195,180 L220,210 L225,260 L200,280 L170,275 L145,240Z', cx: 185, cy: 232 },
  { code: 'SON', name: 'Sonora', path: 'M60,60 L150,50 L165,80 L160,150 L140,190 L100,200 L60,170 L40,120Z', cx: 108, cy: 125 },
  { code: 'TAB', name: 'Tabasco', path: 'M540,400 L575,390 L590,410 L580,430 L555,435 L535,420Z', cx: 562, cy: 415 },
  { code: 'TAM', name: 'Tamaulipas', path: 'M350,140 L400,130 L420,160 L425,220 L410,260 L380,270 L355,240 L340,190Z', cx: 385, cy: 200 },
  { code: 'TLA', name: 'Tlaxcala', path: 'M430,360 L445,355 L450,368 L442,375 L430,372Z', cx: 440, cy: 365 },
  { code: 'VER', name: 'Veracruz', path: 'M450,290 L480,280 L510,310 L530,370 L540,410 L520,430 L490,420 L470,390 L455,340Z', cx: 495, cy: 360 },
  { code: 'YUC', name: 'Yucatán', path: 'M620,340 L665,330 L680,350 L670,375 L645,380 L620,370Z', cx: 650, cy: 355 },
  { code: 'ZAC', name: 'Zacatecas', path: 'M270,215 L330,205 L345,235 L340,275 L310,285 L275,280 L258,250Z', cx: 305, cy: 248 },
];
