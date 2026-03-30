export interface MemberHealthProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  chronicConditions: string[];
  riskScore: number;
  wellnessEnrolled: boolean;
  lastScreening: string;
  medicationAdherence: number;
  claimsLast12Months: number;
  costLast12Months: number;
  preventionEligible: string[];
}

export interface Claim {
  id: string;
  claimNumber: string;
  memberName: string;
  claimType: string;
  severity: string;
  amount: number;
  dateSubmitted: string;
  diagnosis: string;
  provider: string;
  status: string;
  triageScore: number;
  assignedAdjuster: string;
}

export interface AdjusterProfile {
  id: string;
  name: string;
  specialization: string;
  activeCase: number;
  maxCapacity: number;
  avgCycleTime: number;
  accuracyRate: number;
  experienceYears: number;
}

export interface OpenClaim {
  id: string;
  claimNumber: string;
  memberName: string;
  claimType: string;
  dateOpened: string;
  daysOpen: number;
  billedAmount: number;
  reserveEstimate: number;
  adjuster: string;
  negotiationRound: number;
  settlementRecommendation: number;
  leakageRisk: number;
  status: string;
}

export interface Provider {
  id: string;
  name: string;
  type: string;
  specialty: string;
  tier: string;
  avgCostPerProcedure: number;
  qualityScore: number;
  patientVolume: number;
  networkStatus: string;
  contractExpiry: string;
  savingsPotential: number;
  patientSatisfaction: number;
}

export interface SuspiciousClaim {
  id: string;
  claimNumber: string;
  memberName: string;
  providerName: string;
  claimAmount: number;
  anomalyScore: number;
  fraudIndicators: string[];
  patternMatch: string;
  confidence: number;
  investigationStatus: string;
  potentialRecovery: number;
}

// ---------------------------------------------------------------------------
// E2E Claims Management types
// ---------------------------------------------------------------------------

export type TriageSegment =
  | 'Fraude'
  | 'Gestión de Caso'
  | 'Gestión Proactiva'
  | 'Gestión Reactiva'
  | 'Análisis Detallado'
  | 'Dictamen Automático';

export interface SegmentationVariables {
  perfilClinico: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  severidadEconomica: 'Baja' | 'Media' | 'Alta' | 'Muy Alta';
  faseEvento: 'Agudo' | 'Post-Agudo' | 'Crónico' | 'Electivo';
  perfilProveedor: 'Nivel 1' | 'Nivel 2' | 'Nivel 3' | 'Fuera de Red';
  condicionesContractuales: 'Estándar' | 'Mejorado' | 'Premium' | 'VIP';
  alertasFraude: 'Ninguna' | 'Baja' | 'Media' | 'Alta';
}

export interface SegmentSummary {
  segment: TriageSegment;
  count: number;
  color: string;
  description: string;
}

export type E2EClaimStep = 'ingesta' | 'dictamen' | 'supervision' | 'pagos';

// ---------------------------------------------------------------------------
// Workflow types (interactive dictaminador)
// ---------------------------------------------------------------------------

export type WorkflowStage = 'inbox' | 'ingesta' | 'completar' | 'triage' | 'dictamen' | 'liquidacion';

export type StageStatus = 'pending' | 'running' | 'blocked' | 'complete';

export interface AgentReasoningStep {
  texto: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  duracionMs: number;
}

export interface StageReasoningData {
  nombreAgente: string;
  pasos: AgentReasoningStep[];
  decision: string;
  confianza: number;
}

export interface SegmentWorkflow {
  segment: TriageSegment;
  color: string;
  pasos: string[];
  requiereInvestigacion: boolean;
  requiereSupervision: boolean;
  automatizable: boolean;
  tiempoEstimadoHoras: number;
  accionesDictamen: string[];
}

export interface TriageVariableExplanation {
  variable: string;
  valor: string;
  explicacion: string;
  impacto: 'bajo' | 'medio' | 'alto' | 'critico';
}

export interface E2EClaim {
  id: string;
  numeroSiniestro: string;
  nombreAsegurado: string;
  idAsegurado: string;
  edad: number;
  tipoPoliza: string;
  canal: 'Portal' | 'App' | 'Call Center' | 'Correo' | 'Presencial';
  fechaIngreso: string;
  montoReclamado: number;
  diagnostico: string;
  codigoCIE: string;
  proveedor: string;
  nivelProveedor: 'Nivel 1' | 'Nivel 2' | 'Nivel 3' | 'Fuera de Red';
  estadoElegibilidad: 'Verificado' | 'Pendiente' | 'Excepción';
  pasoActual: E2EClaimStep;
  // Segmentación
  segmentacion: SegmentationVariables;
  segmentoAsignado: TriageSegment;
  scorePertinencia: number;
  confianzaSegmentacion: number;
  // Supervisión Hospitalaria
  hospital: string;
  diasEstancia: number;
  costoEstimado: number;
  costoReal: number;
  supervisorMedico: string;
  deltaCosto: number;
  cumplimientoProveedor: number;
  accionesContencion: string[];
  // Pagos
  montoFacturado: number;
  reserva: number;
  recomendacionLiquidacion: number;
  riesgoFuga: number;
  estadoFraude: 'Limpio' | 'Marcado' | 'En Revisión';
  estadoPago: 'Pendiente' | 'Aprobado' | 'Procesado' | 'Retenido';
  // Documentos para workflow interactivo
  documentosFaltantes: string[];
  deducible: number;
  coaseguro: number;
  montoAutorizado: number;
}

// ---------------------------------------------------------------------------
// Agent types (banking-style)
// ---------------------------------------------------------------------------

export type AgentRole = 'ingesta' | 'completar-info' | 'triage-predictivo' | 'reglas-negocio';

export type FindingSeverity = 'bajo' | 'medio' | 'alto' | 'critico';

export interface AgentFinding {
  severidad: FindingSeverity;
  categoria: string;
  hallazgo: string;
  evidencia: string;
  recomendacion: string;
}

export interface ClaimsAgent {
  id: string;
  nombre: string;
  rol: AgentRole;
  descripcion: string;
  inputs: string[];
  outputs: string[];
  promptPersonalizado: string;
  reglasDecision: string[];
  logicaEscalamiento: string[];
  herramientas: string[];
  scoreRiesgo: number;
  tiempoEjecucionMs: number;
  escalamientoDisparado: boolean;
  hallazgos: AgentFinding[];
}

export interface AgentLogEntry {
  timestamp: string;
  nombreAgente: string;
  rolAgente: AgentRole;
  accion: string;
  decision: string;
  confianza: number;
  duracionMs: number;
  escalado: boolean;
  razonamiento: string;
  salidaProducida: string;
  datosAccedidos: string[];
}

// ---------------------------------------------------------------------------
// Process flow node types
// ---------------------------------------------------------------------------

export interface ProcessNode {
  id: string;
  tipo: 'fuente-datos' | 'modelo' | 'agente' | 'accion' | 'salida';
  etiqueta: string;
  descripcion: string;
  detalles?: string[];
}

export interface ProcessConnection {
  from: string;
  to: string;
  etiqueta?: string;
}

// ---------------------------------------------------------------------------
// Invoice / Factura
// ---------------------------------------------------------------------------

export interface ConceptoFactura {
  codigo: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface FacturaSiniestro {
  numeroFactura: string;
  fechaEmision: string;
  proveedor: string;
  rfcProveedor: string;
  nombreAsegurado: string;
  numeroPoliza: string;
  numeroSiniestro: string;
  diagnosticoPrincipal: string;
  codigoCIE: string;
  conceptos: ConceptoFactura[];
  subtotal: number;
  iva: number;
  total: number;
  observaciones: string;
}
