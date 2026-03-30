// ============================================================================
// E2EClaimsWorkstation - Interactive Claims Flow Simulator
// GNP Brand: Primary #0175D8 (blue), CTA #F5A623 (orange)
// All UI text in Spanish. No company names.
// ============================================================================

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Bot, Loader2, Shield, Activity,
  DollarSign, Clock, FileText, CheckCircle, BarChart3,
  Zap, Building2, CreditCard, Play, RotateCcw,
  ChevronRight, AlertTriangle, Eye, Users, Cpu, Stethoscope,
  Scale, Search, Smartphone, MessageSquare, Upload, UserCheck,
  Database,
} from 'lucide-react';
import { getUseCase } from '../data/domains';
import Breadcrumb from '../components/Breadcrumb';
import styles from './E2EClaimsWorkstation.module.css';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ClaimTypeId = 'case-management' | 'proactiva' | 'reactiva' | 'detallado' | 'automatica';
type SegmentoGestion = 'case-management' | 'proactiva' | 'reactiva' | 'detallado' | 'automatica';
type StageId = 'validaciones' | 'elegibilidad' | 'triaje' | 'dictamen-medico' | 'pago';
type StageStatus = 'pending' | 'active' | 'complete' | 'skipped';
type ProcessMode = 'manual' | 'ia-asistido' | 'automatizado';

interface AgentOutput {
  agentName: string;
  agentRole: string;
  outputs: { label: string; value: string }[];
  confidence: number;
  duration: string;
}

type AgentFlowNodeType = 'data-source' | 'model' | 'agent' | 'action' | 'output';

interface StageAgentFlowNode {
  id: string;
  type: AgentFlowNodeType;
  label: string;
  description: string;
  details?: string[];
}

interface StageAgentFlowConnection {
  from: string;
  to: string;
  label?: string;
}

interface StageAgentFlow {
  nodes: StageAgentFlowNode[];
  connections: StageAgentFlowConnection[];
}

interface StageConfig {
  id: StageId;
  label: string;
  icon: React.ReactNode;
  mode: ProcessMode;
  duration: number;
  agents: AgentOutput[];
  agentFlow?: StageAgentFlow;
}

interface ClaimTypeConfig {
  id: ClaimTypeId;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  monto: number;
  diagnostico: string;
  proveedor: string;
  segmento: SegmentoGestion;
  stages: StageConfig[];
  validaciones: {
    canal: string;
    completitud: number;
    ocrConfianza: number;
    folioId: string;
    documentosDetectados: { nombre: string; tipo: string; estado: 'verificado' | 'pendiente' | 'faltante' }[];
    transcripcion: { campo: string; valor: string; confianza: number }[];
    faltantes: string[];
    pdfMaestro: { version: string; paginas: number; pesoMB: number };
    fraudeScoreInicial: number;
  };
  elegibilidad: {
    resultado: string;
    alertaHumana: boolean;
    deducible: number;
    coaseguro: number;
    poliza: { tipo: string; vigente: boolean; pagada: boolean; producto: string };
    coberturas: { nombre: string; activa: boolean; limite: number }[];
    preexistencias: { condicion: string; declarada: boolean; aplica: boolean; justificacion: string }[];
    endosos: { id: string; nombre: string; descripcion: string; impacto: string; aplica: boolean }[];
    dictamenPreliminar: string;
    recetaMedicaPendiente: boolean;
  };
  triaje: {
    rutaActiva: SegmentoGestion;
    scoreTriaje: number;
    variables: {
      perfilClinico: { valor: string; nivel: 'Bajo' | 'Medio' | 'Alto' | 'Crítico'; peso: number };
      severidadEconomica: { valor: string; nivel: 'Baja' | 'Media' | 'Alta' | 'Muy Alta'; peso: number };
      faseEvento: { valor: string; nivel: 'Electivo' | 'Post-Agudo' | 'Agudo' | 'Crónico'; peso: number };
      perfilProveedor: { valor: string; nivel: 'Nivel 1' | 'Nivel 2' | 'Nivel 3' | 'Fuera de Red'; peso: number };
      condicionesContractuales: { valor: string; nivel: 'Estándar' | 'Mejorado' | 'Premium' | 'VIP'; peso: number };
      alertasFraude: { valor: string; nivel: 'Ninguna' | 'Baja' | 'Media' | 'Alta'; peso: number };
    };
    arbolDecision: string[];
    caseManagement: {
      potencialAhorro: number;
      probabilidadAhorro: number;
      cargaEquipo: number;
      recomendacion: string;
      palancas?: {
        medicamentosBiocompatibles: { actual: string; alternativa: string; ahorroPotencial: string; aplica: boolean };
        honorariosMedicos: { montoActual: string; promedioHistorico: string; desviacion: string; alerta: boolean };
        duracionEstancia: { diasProgramados: number; promedioHistorico: number; desviacion: string; alerta: boolean };
      };
    };
  };
  dictamenMedico: {
    expedienteMedico: {
      diagnosticoPrincipal: string;
      codigoCIE: string;
      historialRelevante: string[];
      observaciones: string[];
    };
    programacionCirugia?: {
      procedimiento: string;
      fecha: string;
      cirujano: string;
      duracionEstimada: string;
      pertinente: boolean;
      argumentosPertinencia: string[];
    };
    contextoClinico: {
      timeline: { fecha: string; evento: string }[];
      pruebasDiagnosticas: { prueba: string; resultado: string }[];
      adjuntos: { tipo: string; cantidad: number }[];
    };
    checksPertinencia: string[];
    insumos: { nombre: string; checks: string[] }[];
    checksDictamen: string[];
    resumenFinanciero: {
      montoReclamado: number;
      deducible: number;
      coaseguro: number;
      coaseguroPct: number;
      totalCargoAsegurado: number;
      totalCargoAseguradora: number;
      sumaAseguradaRemanente: number;
    };
    alertasMedico: string[];
    asistenciaFraudeManual: string;
  };
  pago: { validaciones: string[]; montoFinal: number; ajustes: string[]; estado: string };
  analitica: { automatizacion: number; tiempoHumano: string; riesgoResidual: number; ahorro: number };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtCurrency = (n: number): string => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const fmtPercent = (n: number): string => `${n}%`;

// ---------------------------------------------------------------------------
// Agent flow definitions per stage (shared across all claim types)
// ---------------------------------------------------------------------------

const AGENT_FLOWS: Record<StageId, StageAgentFlow> = {
  validaciones: {
    nodes: [
      { id: 'doc-ingestion', type: 'data-source', label: 'Ingesta Documental', description: 'Recepción y digitalización de documentos', details: ['OCR de facturas médicas', 'Extracción de datos del asegurado'] },
      { id: 'data-validation', type: 'agent', label: 'Validación de Datos', description: 'Verifica completitud y consistencia', details: ['Campos obligatorios', 'Validación de formatos'] },
      { id: 'policy-context', type: 'agent', label: 'Contexto de Póliza', description: 'Consulta reglas y vigencia de la póliza', details: ['Consulta base de pólizas', 'Verificación de vigencia'] },
    ],
    connections: [
      { from: 'doc-ingestion', to: 'data-validation', label: 'Datos extraídos' },
      { from: 'data-validation', to: 'policy-context', label: 'Datos validados' },
    ],
  },
  elegibilidad: {
    nodes: [
      { id: 'fraud-screening', type: 'agent', label: 'Detección Temprana de Fraude', description: 'Análisis preventivo con mínima información disponible', details: ['Fraudes anteriores', 'Duplicidad documentos', 'Listados negros'] },
      { id: 'coverage-rules', type: 'action', label: 'Motor de Coberturas', description: 'Revisa coberturas según producto GNP', details: ['Versátil', 'Personaliza', 'Esencial'] },
      { id: 'preexistence-rules', type: 'action', label: 'Motor de Preexistencias', description: 'Evalúa condiciones previas a la contratación', details: ['Enfermedades declaradas', 'Exclusiones'] },
      { id: 'endorsement-rules', type: 'action', label: 'Motor de Endosos', description: 'Revisa catálogo de endosos de la póliza', details: ['Endosos activos', 'Exclusiones específicas'] },
      { id: 'dictamen-agent', type: 'agent', label: 'Agente Dictaminador', description: 'Consolida motores y emite dictamen', details: ['Dictamen automático o supervisión humana'] },
    ],
    connections: [
      { from: 'fraud-screening', to: 'coverage-rules', label: 'Score fraude' },
      { from: 'coverage-rules', to: 'preexistence-rules', label: 'Coberturas' },
      { from: 'preexistence-rules', to: 'endorsement-rules', label: 'Preexistencias' },
      { from: 'endorsement-rules', to: 'dictamen-agent', label: 'Endosos' },
    ],
  },
  triaje: {
    nodes: [
      { id: 'triage-ml', type: 'model', label: 'Motor de Triaje ML', description: 'Modelo predictivo de 6 variables,segmentación inteligente', details: ['Perfil Clínico', 'Severidad Económica', 'Fase del Evento', 'Perfil del Proveedor', 'Condiciones Contractuales', 'Alertas de Fraude'] },
    ],
    connections: [],
  },
  'dictamen-medico': {
    nodes: [],
    connections: [],
  },
  pago: {
    nodes: [
      { id: 'payment-validation', type: 'agent', label: 'Validación de Pago', description: 'Verifica dictamen, pertinencia y reglas' },
      { id: 'compliance-agent', type: 'model', label: 'Cumplimiento Regulatorio', description: 'Verifica reglas fiscales y SAT' },
      { id: 'disbursement', type: 'output', label: 'Liquidación', description: 'Calcula monto final y autoriza pago' },
    ],
    connections: [
      { from: 'payment-validation', to: 'compliance-agent', label: 'Validaciones' },
      { from: 'compliance-agent', to: 'disbursement', label: 'Autorizado' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Claim type configurations (all 5 types, inline)
// ---------------------------------------------------------------------------

const CLAIM_TYPES: ClaimTypeConfig[] = [
  // -- 1. Case Management (most complex) --
  {
    id: 'case-management',
    title: 'Cirugía Mayor Bypass Coronario',
    subtitle: 'Case Management con supervisión hospitalaria dedicada',
    icon: <Building2 size={24} />,
    monto: 520000,
    diagnostico: 'Cirugia de Bypass Coronario - CABG (I25.1)',
    proveedor: 'Hospital Angeles Pedregal',
    segmento: 'case-management',
    stages: [
      {
        id: 'validaciones', label: 'Validaciones', icon: <Upload size={16} />, mode: 'ia-asistido', duration: 1.5,
        agents: [
          { agentName: 'Agente de Ingesta Documental', agentRole: 'Extracción', outputs: [{ label: 'Documentos procesados', value: '7 de 8' }, { label: 'Confianza OCR', value: '92%' }], confidence: 92, duration: '3.0s' },
          { agentName: 'Agente de Validación de Datos', agentRole: 'Validación', outputs: [{ label: 'Campos completos', value: '90%' }, { label: 'Inconsistencias', value: '0' }], confidence: 95, duration: '2.0s' },
          { agentName: 'Agente de Contexto de Póliza', agentRole: 'Póliza', outputs: [{ label: 'Póliza', value: 'Premium Salud Total,Vigente' }, { label: 'Producto', value: 'Individual' }], confidence: 99, duration: '1.4s' },
        ],
      },
      {
        id: 'elegibilidad', label: 'Elegibilidad', icon: <CheckCircle size={16} />, mode: 'manual', duration: 1.5,
        agents: [
          { agentName: 'Detección Temprana de Fraude', agentRole: 'Antifraude', outputs: [{ label: 'Score fraude', value: '4%' }, { label: 'Duplicidad documentos', value: 'No detectada' }, { label: 'Listas negras', value: 'Sin coincidencias' }, { label: 'Hospital verificado', value: 'Nivel 1,convenio activo' }], confidence: 98, duration: '2.4s' },
          { agentName: 'Motor de Coberturas', agentRole: 'Producto GNP', outputs: [{ label: 'Producto', value: 'Versátil Premium Plus' }, { label: 'Cirugía cardiovascular', value: 'Cubierta,$1.5M tope' }, { label: 'UCI', value: 'Cubierta,$800K' }, { label: 'Rehabilitación', value: 'Cubierta,$200K' }, { label: 'Prótesis', value: 'Cubierta por endoso' }], confidence: 96, duration: '2.2s' },
          { agentName: 'Motor de Preexistencias', agentRole: 'Preexistencias', outputs: [{ label: 'Cardiopatía isquémica', value: 'Declarada,cubierta' }, { label: 'Hipertensión', value: 'Declarada,sin exclusión' }, { label: 'Evaluación', value: 'Condiciones declaradas correctamente' }], confidence: 97, duration: '1.6s' },
          { agentName: 'Motor de Endosos', agentRole: 'Endosos', outputs: [{ label: 'END-201 Cirugía Mayor', value: 'Aplica,cobertura ampliada' }, { label: 'END-089 Prótesis', value: 'Aplica,stents y válvulas' }, { label: 'END-155 Rehabilitación Extendida', value: 'Aplica,30 sesiones' }], confidence: 96, duration: '1.8s' },
          { agentName: 'Agente Dictaminador', agentRole: 'Dictamen', outputs: [{ label: 'Decisión', value: 'Requiere Supervisión Humana' }, { label: 'Motivo', value: 'Monto muy alto + multicobertura' }, { label: 'Recomendación', value: 'ELEGIBLE,comité médico requerido' }], confidence: 94, duration: '1.4s' },
        ],
      },
      {
        id: 'triaje', label: 'Triaje', icon: <Cpu size={16} />, mode: 'automatizado', duration: 1.5,
        agents: [
          { agentName: 'Motor de Triaje ML', agentRole: 'Segmentación', outputs: [{ label: 'Segmento asignado', value: 'Case Management' }, { label: 'Score', value: '82%' }, { label: 'Variables evaluadas', value: '6' }], confidence: 82, duration: '0.6s' },
        ],
      },
      {
        id: 'dictamen-medico', label: 'Dictamen Médico', icon: <Users size={16} />, mode: 'manual', duration: 1.5,
        agents: [],
      },
      {
        id: 'pago', label: 'Pago', icon: <CreditCard size={16} />, mode: 'ia-asistido', duration: 1.5,
        agents: [
          { agentName: 'Agente de Liquidación', agentRole: 'Pagos', outputs: [{ label: 'Monto autorizado', value: '$420,000' }, { label: 'Validaciones', value: '5/5 completadas' }, { label: 'Contención total', value: '-$100,000 vs reserva' }], confidence: 95, duration: '1.8s' },
          { agentName: 'Agente Antifraude Final', agentRole: 'Control', outputs: [{ label: 'Score fraude final', value: '4%' }, { label: 'Resultado', value: 'Limpio' }], confidence: 98, duration: '0.7s' },
        ],
      },
    ],
    validaciones: {
      canal: 'Portal Web', completitud: 90, ocrConfianza: 92, folioId: 'SIN-2026-00204',
      documentosDetectados: [
        { nombre: 'Factura Hospital Angeles', tipo: 'Factura Medica', estado: 'verificado' },
        { nombre: 'Nota Operatoria Bypass', tipo: 'Nota Quirúrgica', estado: 'verificado' },
        { nombre: 'Protocolo de Cirugia', tipo: 'Protocolo', estado: 'verificado' },
        { nombre: 'Estudios Preoperatorios', tipo: 'Estudios', estado: 'verificado' },
        { nombre: 'Nota de Ingreso UCI', tipo: 'Nota Clínica', estado: 'verificado' },
        { nombre: 'Cotizacion de Protesis', tipo: 'Presupuesto', estado: 'verificado' },
        { nombre: 'Plan de Rehabilitación', tipo: 'Plan Clínico', estado: 'verificado' },
        { nombre: 'Segunda Opinion Medica', tipo: 'Dictamen', estado: 'pendiente' },
      ],
      transcripcion: [
        { campo: 'Diagnostico Principal', valor: 'Cirugia de Bypass Coronario - CABG (I25.1)', confianza: 97 },
        { campo: 'Monto Total Facturado', valor: '$520,000', confianza: 94 },
        { campo: 'Proveedor', valor: 'Hospital Angeles Pedregal', confianza: 99 },
        { campo: 'Días de Estancia Estimados', valor: '8-10', confianza: 92 },
        { campo: 'Protesis/Implantes', valor: '3 stents + valvula', confianza: 90 },
        { campo: 'Equipo Quirurgico', valor: 'Dr. Martinez (Cardiovascular)', confianza: 96 },
      ],
      faltantes: ['Segunda Opinion Medica (en tramite)'],
      pdfMaestro: { version: '1.2', paginas: 18, pesoMB: 5.2 },
      fraudeScoreInicial: 4,
    },
    elegibilidad: {
      resultado: 'Elegible,requiere supervision hospitalaria dedicada y comite medico', alertaHumana: true, deducible: 25000, coaseguro: 10,
      poliza: { tipo: 'Individual', vigente: true, pagada: true, producto: 'Premium Salud Total' },
      coberturas: [
        { nombre: 'Hospitalizacion', activa: true, limite: 3000000 },
        { nombre: 'Cirugia Cardiovascular Mayor', activa: true, limite: 2000000 },
        { nombre: 'UCI', activa: true, limite: 1000000 },
        { nombre: 'Protesis e Implantes', activa: true, limite: 500000 },
        { nombre: 'Rehabilitación Cardiaca', activa: true, limite: 300000 },
      ],
      preexistencias: [
        { condicion: 'Enfermedad Coronaria (I25.1)', declarada: true, aplica: false, justificacion: 'Condicion declarada al inicio de la poliza,cubierta bajo clausula de continuidad de tratamiento' },
      ],
      endosos: [
        { id: 'END-142', nombre: 'Endoso de Ampliacion Cardiovascular', descripcion: 'Amplia cobertura cardiovascular al 100% sin copago', impacto: 'Elimina coaseguro en cirugia CABG', aplica: true },
        { id: 'END-089', nombre: 'Endoso de Protesis/Implantes', descripcion: 'Cubre stents, valvulas y dispositivos implantables', impacto: 'Stents y valvula cubiertos al 100%', aplica: true },
        { id: 'END-205', nombre: 'Endoso de Segunda Opinion', descripcion: 'Cubre costo de segunda opinion medica especializada', impacto: 'Segunda opinion cardiovascular cubierta', aplica: true },
      ],
      dictamenPreliminar: 'ELEGIBLE,Multiples coberturas activas. Endosos de ampliacion cardiovascular, protesis e implantes, y segunda opinion aplican. Requiere supervision hospitalaria dedicada y comite medico por complejidad del caso.',
      recetaMedicaPendiente: true,
    },
    triaje: {
      rutaActiva: 'case-management',
      scoreTriaje: 82,
      variables: {
        perfilClinico: { valor: 'Bypass Coronario CABG (I25.1),cirugía mayor', nivel: 'Crítico', peso: 98 },
        severidadEconomica: { valor: '$520,000,monto extremadamente alto', nivel: 'Muy Alta', peso: 96 },
        faseEvento: { valor: 'Agudo,procedimiento quirúrgico mayor', nivel: 'Agudo', peso: 92 },
        perfilProveedor: { valor: 'Hospital Ángeles Pedregal,Nivel 1 con convenio', nivel: 'Nivel 1', peso: 15 },
        condicionesContractuales: { valor: 'Póliza Versátil Premium Plus,multicobertura', nivel: 'VIP', peso: 8 },
        alertasFraude: { valor: 'Sin alertas,score 4%', nivel: 'Ninguna', peso: 3 },
      },
      arbolDecision: [
        'Perfil Clínico = Crítico (CABG) → Cirugía de máxima complejidad',
        'Severidad Económica = Muy Alta ($520K) → Requiere supervisión de costos dedicada',
        'Fase del Evento = Agudo → Estancia prolongada esperada (8-12 días)',
        'Múltiples coberturas involucradas → Coordinación entre líneas requerida',
        'Proveedor Nivel 1 → Negociación de paquete quirúrgico integral posible',
        'RESULTADO: Complejidad máxima + Costo extremo + Multicobertura → Case Management',
      ],
      caseManagement: {
        potencialAhorro: 60000,
        probabilidadAhorro: 80,
        cargaEquipo: 72,
        recomendacion: 'Se recomienda intervención activa de Case Management por alto potencial de contención',
        palancas: {
          medicamentosBiocompatibles: { actual: 'Medicamentos UCI paquete premium', alternativa: 'Paquete estándar con genéricos equivalentes', ahorroPotencial: '$18,500 en estancia UCI', aplica: true },
          honorariosMedicos: { montoActual: '$45,000', promedioHistorico: '$42,000', desviacion: '+7.1%', alerta: false },
          duracionEstancia: { diasProgramados: 8, promedioHistorico: 10, desviacion: '-20% (favorable)', alerta: false },
        },
      },
    },
    dictamenMedico: {
      expedienteMedico: {
        diagnosticoPrincipal: 'Cirugía de Bypass Coronario,CABG (I25.1)',
        codigoCIE: 'I25.1',
        historialRelevante: [
          'Cardiopatía isquémica diagnosticada hace 3 años,declarada en póliza',
          'Hipertensión arterial controlada,medicación continua',
          '1 siniestro previo hace 2 años,cateterismo diagnóstico',
          'Última evaluación cardiológica hace 4 meses,progresión de enfermedad coronaria',
        ],
        observaciones: [
          'Cirugía de máxima complejidad,requiere equipo multidisciplinario',
          'Estancia en UCI estimada 3-4 días + 4-6 días en piso',
          'Negociación de paquete quirúrgico integral con el hospital recomendada',
          'Rehabilitación cardíaca post-operatoria será necesaria (30 sesiones estimadas)',
        ],
      },
      programacionCirugia: {
        procedimiento: 'Cirugía de Bypass Coronario (CABG),Triple Bypass',
        fecha: '2026-02-20',
        cirujano: 'Dr. Roberto Villalobos,Cirujano Cardiovascular',
        duracionEstimada: '5-6 horas',
        pertinente: true,
        argumentosPertinencia: [
          'Cateterismo previo confirmó enfermedad de 3 vasos,indicación clara de CABG',
          'Guías ESC/EACTS recomiendan CABG sobre angioplastía para enfermedad trivascular',
          'Fracción de eyección preservada (55%),buen candidato quirúrgico',
          'Comorbilidades controladas,riesgo quirúrgico aceptable (EuroSCORE II: 2.1%)',
        ],
      },
      contextoClinico: {
        timeline: [
          { fecha: '10/01/2026', evento: 'Consulta cardiológica por angina de esfuerzo progresiva' },
          { fecha: '15/01/2026', evento: 'Cateterismo diagnóstico,enfermedad de 3 vasos confirmada' },
          { fecha: '22/01/2026', evento: 'Junta médica multidisciplinaria,decisión de CABG' },
          { fecha: '30/01/2026', evento: 'Estudios preoperatorios completos (laboratorios, EKG, Rx tórax, ecocardiograma)' },
          { fecha: '05/02/2026', evento: 'Valoración preanestésica y evaluación de riesgo quirúrgico' },
          { fecha: '10/02/2026', evento: 'Segunda opinión cardiológica,confirma indicación CABG' },
          { fecha: '15/02/2026', evento: 'Ingreso hospitalario y preparación preoperatoria' },
          { fecha: '20/02/2026', evento: 'Cirugía programada: Bypass Coronario Triple (CABG)' },
        ],
        pruebasDiagnosticas: [
          { prueba: 'Cateterismo cardíaco', resultado: 'Enfermedad trivascular: DA 90%, Cx 80%, CD 75%' },
          { prueba: 'Ecocardiograma transtorácico', resultado: 'FEVI 55%, sin valvulopatía significativa' },
          { prueba: 'Electrocardiograma', resultado: 'Ritmo sinusal, cambios isquémicos en V3-V5' },
          { prueba: 'Biometría hemática', resultado: 'Hemoglobina 14.2 g/dL, leucocitos normales' },
          { prueba: 'Química sanguínea', resultado: 'Glucosa 98, creatinina 0.9, electrolitos normales' },
          { prueba: 'Tiempos de coagulación', resultado: 'TP y TTP dentro de rango' },
          { prueba: 'Radiografía de tórax', resultado: 'Sin cardiomegalia, campos pulmonares limpios' },
          { prueba: 'Prueba de esfuerzo', resultado: 'Positiva para isquemia a baja carga,4 METs' },
        ],
        adjuntos: [
          { tipo: 'Informes médicos', cantidad: 10 },
          { tipo: 'Pruebas diagnósticas', cantidad: 8 },
          { tipo: 'Notas de evolución', cantidad: 6 },
          { tipo: 'Interconsultas', cantidad: 4 },
          { tipo: 'Consentimiento informado', cantidad: 2 },
          { tipo: 'Presupuesto hospitalario', cantidad: 1 },
          { tipo: 'Segunda opinión médica', cantidad: 1 },
          { tipo: 'Protocolo quirúrgico', cantidad: 1 },
        ],
      },
      checksPertinencia: [
        'Cateterismo confirmó enfermedad de 3 vasos,indicación clara de revascularización quirúrgica',
        'Guías ESC/EACTS respaldan CABG como tratamiento de primera línea para enfermedad trivascular',
        'FEVI preservada (55%),candidato quirúrgico adecuado',
        'Riesgo quirúrgico aceptable (EuroSCORE II: 2.1%)',
        'Comorbilidades controladas y evaluadas por equipo multidisciplinario',
        'Segunda opinión cardiológica confirma indicación quirúrgica',
      ],
      insumos: [
        { nombre: 'Honorarios Médicos (Equipo Cardiovascular)', checks: ['Equipo multidisciplinario: cirujano cardiovascular + ayudante + perfusionista', 'Importe de $45,000 dentro de tabulador para CABG triple'] },
        { nombre: 'Estancia Hospitalaria', checks: ['8-10 días adecuados para bypass coronario triple', 'UCI 3-4 días + piso 4-6 días,esquema estándar post-CABG'] },
        { nombre: 'Anestesia', checks: ['Anestesia general con monitoreo invasivo acorde a cirugía cardíaca mayor', 'Duración estimada de 5-6 horas coherente con procedimiento'] },
        { nombre: 'Quirófano y Material Quirúrgico', checks: ['Circuito de circulación extracorpórea dentro de costos esperados', 'Injertos venosos y material de sutura consistentes con técnica CABG'] },
        { nombre: 'Prótesis e Implantes', checks: ['3 stents de reserva y válvula incluidos por endoso END-089', 'Costos dentro de rango de referencia para dispositivos cardiovasculares'] },
        { nombre: 'Medicamentos UCI', checks: ['Protocolo farmacológico post-CABG estándar (inotrópicos, anticoagulantes)', 'No se identifican duplicidades o medicamentos no indicados'] },
      ],
      checksDictamen: [
        'Endoso END-142 (Ampliación Cardiovascular) verificado y aplicado correctamente',
        'Endoso END-089 (Prótesis/Implantes) verificado,stents y válvula cubiertos',
        'Preexistencia declarada (cardiopatía isquémica),cubierta bajo cláusula de continuidad',
        'Documentación médica completa y con alto nivel de congruencia clínica',
        'Importes verificados contra tabulador médico,sin desviaciones significativas',
      ],
      resumenFinanciero: {
        montoReclamado: 520000,
        deducible: 25000,
        coaseguro: 49500,
        coaseguroPct: 10,
        totalCargoAsegurado: 74500,
        totalCargoAseguradora: 420000,
        sumaAseguradaRemanente: 1580000,
      },
      alertasMedico: ['Verificar indicación de bypass vs angioplastía', 'Confirmar necesidad de 3 puentes', 'Revisar plan de rehabilitación cardíaca'],
      asistenciaFraudeManual: 'No se detectaron patrones de fraude que requieran atención del dictaminador médico',
    },
    pago: { validaciones: ['Cobertura multilinea vigente', 'Pertinencia medica 97%', 'Score fraude 4% (limpio)', 'Supervisor medico autorizo', 'Comite medico aprobo'], montoFinal: 420000, ajustes: ['Deducible: -$25,000', 'Coaseguro 10%: -$49,500', 'Contención hospitalaria: -$35,000 vs reserva', 'Paquete negociado: ahorro $25,500'], estado: 'Reclamo procesado bajo modelo inteligente' },
    analitica: { automatizacion: 55, tiempoHumano: '320 min', riesgoResidual: 12, ahorro: 100000 },
  },

  // -- 2. Gestión Proactiva --
  {
    id: 'proactiva',
    title: 'Hospitalización Cardiovascular',
    subtitle: 'Gestión proactiva con contención de costos',
    icon: <Activity size={24} />,
    monto: 185000,
    diagnostico: 'Infarto Agudo de Miocardio (I21.0)',
    proveedor: 'Hospital Angeles Pedregal',
    segmento: 'proactiva',
    stages: [
      {
        id: 'validaciones', label: 'Validaciones', icon: <Upload size={16} />, mode: 'ia-asistido', duration: 1.5,
        agents: [
          { agentName: 'Agente de Ingesta Documental', agentRole: 'Extracción', outputs: [{ label: 'Documentos procesados', value: '5 de 6' }, { label: 'Confianza OCR', value: '94%' }], confidence: 94, duration: '3.4s' },
          { agentName: 'Agente de Validación de Datos', agentRole: 'Validación', outputs: [{ label: 'Campos completos', value: '92%' }, { label: 'Inconsistencias', value: '0' }], confidence: 97, duration: '1.8s' },
          { agentName: 'Agente de Contexto de Póliza', agentRole: 'Póliza', outputs: [{ label: 'Póliza', value: 'Premium Salud,Vigente' }, { label: 'Producto', value: 'Flexible' }], confidence: 99, duration: '1.2s' },
        ],
      },
      {
        id: 'elegibilidad', label: 'Elegibilidad', icon: <CheckCircle size={16} />, mode: 'ia-asistido', duration: 1.5,
        agents: [
          { agentName: 'Detección Temprana de Fraude', agentRole: 'Antifraude', outputs: [{ label: 'Score fraude', value: '8%' }, { label: 'Duplicidad documentos', value: 'No detectada' }, { label: 'Listas negras', value: 'Sin coincidencias' }, { label: 'Incidencias previas', value: '0' }], confidence: 96, duration: '2.1s' },
          { agentName: 'Motor de Coberturas', agentRole: 'Producto GNP', outputs: [{ label: 'Producto', value: 'Versátil Premium' }, { label: 'Hospitalización', value: 'Activa,$2.5M tope' }, { label: 'Cardiovascular', value: 'Cubierta al 100%' }, { label: 'UCI', value: 'Incluida' }], confidence: 97, duration: '1.8s' },
          { agentName: 'Motor de Preexistencias', agentRole: 'Preexistencias', outputs: [{ label: 'Hipertensión Arterial', value: 'Declarada,Sin exclusión' }, { label: 'Evaluación', value: 'No genera exclusión para evento agudo' }], confidence: 95, duration: '1.5s' },
          { agentName: 'Motor de Endosos', agentRole: 'Endosos', outputs: [{ label: 'END-142 Ampliación Cardiovascular', value: 'Aplica,elimina coaseguro' }, { label: 'END-089 Prótesis/Implantes', value: 'Aplica,stents cubiertos 100%' }, { label: 'Endosos revisados', value: '4 de 4' }], confidence: 97, duration: '1.4s' },
          { agentName: 'Agente Dictaminador', agentRole: 'Dictamen', outputs: [{ label: 'Decisión', value: 'Requiere Supervisión Humana' }, { label: 'Motivo', value: 'Monto alto + evento crítico' }, { label: 'Recomendación', value: 'ELEGIBLE con monitoreo' }], confidence: 94, duration: '1.2s' },
        ],
      },
      {
        id: 'triaje', label: 'Triaje', icon: <Cpu size={16} />, mode: 'automatizado', duration: 1.5,
        agents: [
          { agentName: 'Motor de Triaje ML', agentRole: 'Segmentación', outputs: [{ label: 'Segmento asignado', value: 'Gestión Proactiva' }, { label: 'Score', value: '88%' }, { label: 'Variables evaluadas', value: '6' }], confidence: 88, duration: '0.5s' },
        ],
      },
      {
        id: 'dictamen-medico', label: 'Dictamen Médico', icon: <Activity size={16} />, mode: 'manual', duration: 1.5,
        agents: [],
      },
      {
        id: 'pago', label: 'Pago', icon: <CreditCard size={16} />, mode: 'ia-asistido', duration: 1.5,
        agents: [
          { agentName: 'Agente de Liquidación', agentRole: 'Pagos', outputs: [{ label: 'Monto autorizado', value: '$153,000' }, { label: 'Validaciones', value: '4/4 completadas' }, { label: 'Contención hospitalaria', value: '-$7,000 vs reserva' }], confidence: 96, duration: '1.2s' },
          { agentName: 'Agente Antifraude Final', agentRole: 'Control', outputs: [{ label: 'Score fraude final', value: '8%' }, { label: 'Resultado', value: 'Limpio' }], confidence: 97, duration: '0.6s' },
        ],
      },
    ],
    validaciones: {
      canal: 'Portal Web', completitud: 92, ocrConfianza: 94, folioId: 'SIN-2026-00201',
      documentosDetectados: [
        { nombre: 'Factura Hospital Angeles', tipo: 'Factura Medica', estado: 'verificado' },
        { nombre: 'Nota de Ingreso UCI', tipo: 'Nota Clínica', estado: 'verificado' },
        { nombre: 'Resultados Laboratorio Cardiaco', tipo: 'Estudios', estado: 'verificado' },
        { nombre: 'Receta de Alta', tipo: 'Prescripción', estado: 'verificado' },
        { nombre: 'Nota Operatoria Cateterismo', tipo: 'Nota Quirúrgica', estado: 'verificado' },
        { nombre: 'Consentimiento Informado', tipo: 'Legal', estado: 'pendiente' },
      ],
      transcripcion: [
        { campo: 'Diagnostico Principal', valor: 'Infarto Agudo de Miocardio (I21.0)', confianza: 98 },
        { campo: 'Fecha de Ingreso', valor: '2026-02-28', confianza: 99 },
        { campo: 'Monto Total Facturado', valor: '$185,000', confianza: 96 },
        { campo: 'Proveedor', valor: 'Hospital Angeles Pedregal', confianza: 99 },
        { campo: 'Días de Estancia', valor: '5', confianza: 97 },
        { campo: 'Procedimiento Principal', valor: 'Angioplastia con Stent', confianza: 95 },
      ],
      faltantes: ['Consentimiento Informado firmado'],
      pdfMaestro: { version: '1.0', paginas: 12, pesoMB: 3.4 },
      fraudeScoreInicial: 8,
    },
    elegibilidad: {
      resultado: 'Elegible con monitoreo proactivo recomendado', alertaHumana: true, deducible: 15000, coaseguro: 10,
      poliza: { tipo: 'Individual', vigente: true, pagada: true, producto: 'Premium Salud Flexible' },
      coberturas: [
        { nombre: 'Hospitalizacion', activa: true, limite: 2500000 },
        { nombre: 'Cirugia Cardiovascular', activa: true, limite: 1500000 },
        { nombre: 'UCI', activa: true, limite: 800000 },
        { nombre: 'Rehabilitación Cardiaca', activa: true, limite: 200000 },
      ],
      preexistencias: [
        { condicion: 'Hipertension Arterial', declarada: true, aplica: false, justificacion: 'Condicion declarada y cubierta,no genera exclusion para evento cardiaco agudo' },
      ],
      endosos: [
        { id: 'END-142', nombre: 'Endoso de Ampliacion Cardiovascular', descripcion: 'Amplia cobertura cardiovascular al 100% sin copago', impacto: 'Elimina coaseguro en procedimientos cardiacos', aplica: true },
        { id: 'END-089', nombre: 'Endoso de Protesis/Implantes', descripcion: 'Cubre stents y dispositivos implantables', impacto: 'Stents coronarios cubiertos al 100%', aplica: true },
      ],
      dictamenPreliminar: 'ELEGIBLE,Cobertura hospitalaria y cardiovascular confirmada. Endosos de ampliacion cardiovascular y protesis aplican favorablemente. Sin exclusiones activas.',
      recetaMedicaPendiente: true,
    },
    triaje: {
      rutaActiva: 'proactiva',
      scoreTriaje: 88,
      variables: {
        perfilClinico: { valor: 'Infarto Agudo de Miocardio (I21.0),evento cardíaco crítico', nivel: 'Crítico', peso: 95 },
        severidadEconomica: { valor: '$185,000,monto muy elevado', nivel: 'Muy Alta', peso: 88 },
        faseEvento: { valor: 'Agudo,ingreso por urgencias', nivel: 'Agudo', peso: 90 },
        perfilProveedor: { valor: 'Hospital Ángeles Pedregal,Nivel 1 con convenio', nivel: 'Nivel 1', peso: 15 },
        condicionesContractuales: { valor: 'Póliza Versátil Premium,cobertura amplia', nivel: 'Premium', peso: 10 },
        alertasFraude: { valor: 'Sin alertas,score 8%', nivel: 'Ninguna', peso: 5 },
      },
      arbolDecision: [
        'Perfil Clínico = Crítico (I21.0) → Evento de alto riesgo vital',
        'Severidad Económica = Muy Alta ($185K) → Supera umbral de gestión estándar',
        'Fase del Evento = Agudo → Requiere intervención inmediata',
        'Proveedor Nivel 1 → Alto potencial de contención negociada',
        'Alertas Fraude = Ninguna → Descartado como factor',
        'RESULTADO: Perfil Crítico + Severidad Alta + Potencial de Contención → Gestión Proactiva',
      ],
      caseManagement: {
        potencialAhorro: 32000,
        probabilidadAhorro: 75,
        cargaEquipo: 78,
        recomendacion: 'Se recomienda monitoreo proactivo. El potencial de ahorro justifica seguimiento activo',
        palancas: {
          medicamentosBiocompatibles: { actual: 'Stent coronario medicado Xience (Abbott)', alternativa: 'Stent Resolute Onyx (Medtronic),biocompatible equivalente', ahorroPotencial: '$4,200 por unidad', aplica: true },
          honorariosMedicos: { montoActual: '$8,600', promedioHistorico: '$7,800', desviacion: '+10.3%', alerta: false },
          duracionEstancia: { diasProgramados: 5, promedioHistorico: 6, desviacion: '-16.7% (favorable)', alerta: false },
        },
      },
    },
    dictamenMedico: {
      expedienteMedico: {
        diagnosticoPrincipal: 'Infarto Agudo de Miocardio (I21.0)',
        codigoCIE: 'I21.0',
        historialRelevante: [
          'Hipertensión arterial diagnosticada hace 5 años,controlada con medicación',
          'Sin eventos cardíacos previos',
          '2 siniestros previos en 18 meses,consultas cardiológicas de seguimiento',
          'IMC: 28.5,sobrepeso leve',
        ],
        observaciones: [
          'Evento agudo con ingreso por urgencias,cateterismo reveló oclusión de arteria descendente anterior',
          'Angioplastía primaria con colocación de 2 stents medicados',
          'Evolución favorable,descenso de UCI a piso día 3',
          'ATENCIÓN: Verificar congruencia entre stents colocados (2) y stents facturados',
        ],
      },
      programacionCirugia: {
        procedimiento: 'Angioplastía con colocación de Stent',
        fecha: '2026-02-28',
        cirujano: 'Dr. Carlos Méndez,Cardiólogo Intervencionista',
        duracionEstimada: '2.5 horas',
        pertinente: true,
        argumentosPertinencia: [
          'Diagnóstico I21.0 (IAM) confirma indicación de intervención percutánea urgente',
          'Guías clínicas AHA/ACC respaldan angioplastía primaria como tratamiento de primera línea',
          'Cateterismo diagnóstico previo confirmó oclusión,procedimiento congruente',
          'Hospital Nivel 1 con unidad de hemodinámica,capacidad verificada',
        ],
      },
      contextoClinico: {
        timeline: [
          { fecha: '28/02/2026', evento: 'Ingreso por urgencias,dolor torácico agudo, elevación ST en V1-V4' },
          { fecha: '28/02/2026', evento: 'Cateterismo diagnóstico urgente,oclusión de arteria descendente anterior' },
          { fecha: '28/02/2026', evento: 'Angioplastía primaria con colocación de 2 stents medicados' },
          { fecha: '01/03/2026', evento: 'Estancia en UCI,monitoreo hemodinámico continuo' },
          { fecha: '03/03/2026', evento: 'Descenso de UCI a piso,evolución favorable' },
          { fecha: '05/03/2026', evento: 'Alta hospitalaria programada con plan de rehabilitación cardíaca' },
        ],
        pruebasDiagnosticas: [
          { prueba: 'Electrocardiograma de ingreso', resultado: 'Elevación ST en V1-V4, compatible con IAM anterior' },
          { prueba: 'Troponina I', resultado: '12.5 ng/mL (positiva,confirma daño miocárdico)' },
          { prueba: 'Cateterismo cardíaco', resultado: 'Oclusión total de DA proximal, Cx y CD sin lesiones' },
          { prueba: 'Ecocardiograma post-procedimiento', resultado: 'FEVI 45%, hipocinesia apical leve' },
          { prueba: 'Biometría hemática', resultado: 'Valores dentro de parámetros normales' },
          { prueba: 'Perfil lipídico', resultado: 'LDL 165 mg/dL (elevado), HDL 38 mg/dL (bajo)' },
        ],
        adjuntos: [
          { tipo: 'Informes médicos', cantidad: 7 },
          { tipo: 'Pruebas diagnósticas', cantidad: 6 },
          { tipo: 'Notas de evolución', cantidad: 5 },
          { tipo: 'Interconsultas', cantidad: 3 },
          { tipo: 'Consentimiento informado', cantidad: 1 },
          { tipo: 'Nota operatoria cateterismo', cantidad: 1 },
        ],
      },
      checksPertinencia: [
        'Diagnóstico I21.0 (IAM) confirma indicación de intervención percutánea urgente',
        'Guías AHA/ACC respaldan angioplastía primaria como primera línea en IAM con elevación ST',
        'Cateterismo diagnóstico confirmó lesión culpable en DA,procedimiento congruente',
        'Colocación de 2 stents medicados acorde a extensión de la lesión',
        'Hospital Nivel 1 con unidad de hemodinámica certificada',
      ],
      insumos: [
        { nombre: 'Honorarios Médicos (Cardiólogo Intervencionista)', checks: ['Especialidad acorde al procedimiento de hemodinámica', 'Importe de $8,600 dentro de tabulador para angioplastía con stent'] },
        { nombre: 'Estancia Hospitalaria', checks: ['5 días adecuados para IAM con angioplastía primaria', 'UCI 2 días + piso 3 días,esquema estándar post-IAM'] },
        { nombre: 'Anestesia y Sedación', checks: ['Sedación consciente acorde a cateterismo intervencionista', 'Duración de 2.5 horas coherente con el procedimiento'] },
        { nombre: 'Stents Coronarios Medicados (x2)', checks: ['Stent Xience (Abbott) dentro de rango de precio aprobado', 'Cantidad (2) consistente con lesión reportada en cateterismo'] },
        { nombre: 'Medicamentos Intrahospitalarios', checks: ['Doble antiagregación (aspirina + clopidogrel) acorde a protocolo post-IAM', 'Heparina y protocolo UCI cardiovascular estándar'] },
      ],
      checksDictamen: [
        'Endoso END-142 (Ampliación Cardiovascular) verificado,elimina coaseguro',
        'Endoso END-089 (Prótesis/Implantes) verificado,stents cubiertos al 100%',
        'No se identifican indicios de preexistencia no declarada',
        'Documentación médica completa y congruente con evento agudo',
        'Importes verificados contra tabulador,desviación en honorarios de +10.3% (dentro de tolerancia)',
      ],
      resumenFinanciero: {
        montoReclamado: 185000,
        deducible: 15000,
        coaseguro: 17000,
        coaseguroPct: 10,
        totalCargoAsegurado: 32000,
        totalCargoAseguradora: 153000,
        sumaAseguradaRemanente: 2347000,
      },
      alertasMedico: ['Verificar congruencia entre stents facturados (2) y colocados', 'Confirmar indicación de cateterismo previo a angioplastía'],
      asistenciaFraudeManual: 'No se detectaron patrones de fraude que requieran atención del dictaminador médico',
    },
    pago: { validaciones: ['Cobertura hospitalaria vigente', 'Pertinencia medica 95%', 'Score fraude 8% (limpio)', 'Supervisor medico autorizo alta'], montoFinal: 153000, ajustes: ['Deducible: -$15,000', 'Coaseguro 10%: -$17,000', 'Contención hospitalaria: -$7,000 vs reserva'], estado: 'Reclamo procesado bajo modelo inteligente' },
    analitica: { automatizacion: 65, tiempoHumano: '45 min', riesgoResidual: 8, ahorro: 32000 },
  },

  // -- 3. Gestión Reactiva --
  {
    id: 'reactiva',
    title: 'Cirugía Programada Hernia Inguinal',
    subtitle: 'Gestión reactiva con dictamen estándar',
    icon: <Stethoscope size={24} />,
    monto: 125000,
    diagnostico: 'Hernia Inguinal (K40.9)',
    proveedor: 'Hospital Ángeles Pedregal',
    segmento: 'reactiva',
    stages: [
      {
        id: 'validaciones', label: 'Validaciones', icon: <Upload size={16} />, mode: 'ia-asistido', duration: 1.5,
        agents: [
          { agentName: 'Agente de Ingesta Documental', agentRole: 'Extracción', outputs: [{ label: 'Documentos procesados', value: '4 de 4' }, { label: 'Confianza OCR', value: '93%' }], confidence: 93, duration: '2.0s' },
          { agentName: 'Agente de Validación de Datos', agentRole: 'Validación', outputs: [{ label: 'Campos completos', value: '95%' }, { label: 'Inconsistencias', value: '0' }], confidence: 96, duration: '1.2s' },
          { agentName: 'Agente de Contexto de Póliza', agentRole: 'Póliza', outputs: [{ label: 'Póliza', value: 'Personaliza,Vigente' }, { label: 'Producto', value: 'Individual' }], confidence: 99, duration: '0.8s' },
        ],
      },
      {
        id: 'elegibilidad', label: 'Elegibilidad', icon: <CheckCircle size={16} />, mode: 'ia-asistido', duration: 1.5,
        agents: [
          { agentName: 'Detección Temprana de Fraude', agentRole: 'Antifraude', outputs: [{ label: 'Score fraude', value: '5%' }, { label: 'Duplicidad documentos', value: 'No detectada' }, { label: 'Listas negras', value: 'Sin coincidencias' }], confidence: 97, duration: '1.2s' },
          { agentName: 'Motor de Coberturas', agentRole: 'Producto GNP', outputs: [{ label: 'Producto', value: 'Personaliza' }, { label: 'Cirugía General', value: 'Activa,$800K tope' }, { label: 'Hospitalización', value: 'Activa,$1.5M tope' }], confidence: 96, duration: '1.0s' },
          { agentName: 'Motor de Preexistencias', agentRole: 'Preexistencias', outputs: [{ label: 'Preexistencias', value: 'Sin registros' }, { label: 'Exclusiones', value: 'Ninguna' }], confidence: 99, duration: '0.6s' },
          { agentName: 'Motor de Endosos', agentRole: 'Endosos', outputs: [{ label: 'END-067 Cirugía Ambulatoria', value: 'Aplica,alta el mismo día' }, { label: 'Endosos revisados', value: '3 de 3' }], confidence: 97, duration: '0.8s' },
          { agentName: 'Agente Dictaminador', agentRole: 'Dictamen', outputs: [{ label: 'Decisión', value: 'Requiere Validación Humana' }, { label: 'Motivo', value: 'Monto moderado-alto + cirugía programada' }, { label: 'Recomendación', value: 'ELEGIBLE con dictamen estándar' }], confidence: 93, duration: '0.9s' },
        ],
      },
      {
        id: 'triaje', label: 'Triaje', icon: <Cpu size={16} />, mode: 'automatizado', duration: 1.5,
        agents: [
          { agentName: 'Motor de Triaje ML', agentRole: 'Segmentación', outputs: [{ label: 'Segmento asignado', value: 'Gestión Reactiva' }, { label: 'Score', value: '85%' }, { label: 'Variables evaluadas', value: '6' }], confidence: 85, duration: '0.4s' },
        ],
      },
      {
        id: 'dictamen-medico', label: 'Dictamen Médico', icon: <Stethoscope size={16} />, mode: 'manual', duration: 1.5,
        agents: [],
      },
      {
        id: 'pago', label: 'Pago', icon: <CreditCard size={16} />, mode: 'ia-asistido', duration: 1.5,
        agents: [
          { agentName: 'Agente de Liquidación', agentRole: 'Pagos', outputs: [{ label: 'Monto autorizado', value: '$103,500' }, { label: 'Validaciones', value: '4/4 completadas' }], confidence: 95, duration: '0.8s' },
          { agentName: 'Agente Antifraude Final', agentRole: 'Control', outputs: [{ label: 'Score fraude final', value: '5%' }, { label: 'Resultado', value: 'Limpio' }], confidence: 97, duration: '0.4s' },
        ],
      },
    ],
    validaciones: {
      canal: 'Portal Web', completitud: 95, ocrConfianza: 93, folioId: 'SIN-2026-00312',
      documentosDetectados: [
        { nombre: 'Factura Hospital', tipo: 'Factura Médica', estado: 'verificado' },
        { nombre: 'Nota Operatoria', tipo: 'Nota Quirúrgica', estado: 'verificado' },
        { nombre: 'Estudios Preoperatorios', tipo: 'Estudios', estado: 'verificado' },
        { nombre: 'Receta de Alta', tipo: 'Prescripción', estado: 'pendiente' },
      ],
      transcripcion: [
        { campo: 'Diagnóstico', valor: 'Hernia Inguinal (K40.9)', confianza: 96 },
        { campo: 'Monto Total', valor: '$125,000', confianza: 94 },
        { campo: 'Procedimiento', valor: 'Hernioplastía Laparoscópica', confianza: 95 },
        { campo: 'Proveedor', valor: 'Hospital Ángeles Pedregal', confianza: 99 },
        { campo: 'Estancia', valor: '1 día', confianza: 97 },
      ],
      faltantes: ['Receta médica de alta'],
      pdfMaestro: { version: '1.0', paginas: 8, pesoMB: 2.1 },
      fraudeScoreInicial: 5,
    },
    elegibilidad: {
      resultado: 'Elegible,cobertura quirúrgica confirmada', alertaHumana: true, deducible: 10000, coaseguro: 10,
      poliza: { tipo: 'Individual', vigente: true, pagada: true, producto: 'Personaliza' },
      coberturas: [
        { nombre: 'Hospitalización', activa: true, limite: 1500000 },
        { nombre: 'Cirugía General', activa: true, limite: 800000 },
        { nombre: 'Anestesiología', activa: true, limite: 300000 },
      ],
      preexistencias: [],
      endosos: [
        { id: 'END-067', nombre: 'Cirugía Ambulatoria', descripcion: 'Permite cirugía con alta el mismo día', impacto: 'Reduce costo de habitación', aplica: true },
      ],
      dictamenPreliminar: 'ELEGIBLE,Cobertura quirúrgica confirmada. Cirugía programada dentro de beneficios.',
      recetaMedicaPendiente: false,
    },
    triaje: {
      rutaActiva: 'reactiva',
      scoreTriaje: 85,
      variables: {
        perfilClinico: { valor: 'Hernia inguinal,cirugía electiva programada', nivel: 'Medio', peso: 45 },
        severidadEconomica: { valor: '$125,000,monto moderado-alto', nivel: 'Media', peso: 55 },
        faseEvento: { valor: 'Electivo,cirugía programada', nivel: 'Electivo', peso: 20 },
        perfilProveedor: { valor: 'Hospital Ángeles,Nivel 1 con convenio', nivel: 'Nivel 1', peso: 10 },
        condicionesContractuales: { valor: 'Personaliza,cobertura estándar plus', nivel: 'Mejorado', peso: 15 },
        alertasFraude: { valor: 'Sin alertas,score 5%', nivel: 'Ninguna', peso: 3 },
      },
      arbolDecision: [
        'Perfil Clínico = Medio → Cirugía electiva sin riesgo vital',
        'Severidad Económica = Media ($125K) → Supera umbral automático pero no requiere supervisión',
        'Fase del Evento = Electivo → Programado, no urgente',
        'Alertas Fraude = Ninguna → Sin señales de riesgo',
        'RESULTADO: Complejidad media + Cirugía electiva + Sin alertas → Gestión Reactiva',
      ],
      caseManagement: {
        potencialAhorro: 8500,
        probabilidadAhorro: 40,
        cargaEquipo: 78,
        recomendacion: 'No se considera necesaria una intervención activa de Case Management. Potencial de ahorro limitado',
        palancas: {
          medicamentosBiocompatibles: { actual: 'Malla Proceed (Ethicon)', alternativa: 'Malla Ultrapro genérica equivalente', ahorroPotencial: '$8,500', aplica: true },
          honorariosMedicos: { montoActual: '$18,000', promedioHistorico: '$16,500', desviacion: '+9.1%', alerta: false },
          duracionEstancia: { diasProgramados: 1, promedioHistorico: 1, desviacion: '0% (dentro de rango)', alerta: false },
        },
      },
    },
    dictamenMedico: {
      expedienteMedico: {
        diagnosticoPrincipal: 'Hernia Inguinal Indirecta (K40.9)',
        codigoCIE: 'K40.9',
        historialRelevante: [
          'Sin cirugías abdominales previas',
          'Diagnóstico confirmado por ultrasonido hace 2 meses',
          'Sin comorbilidades relevantes',
        ],
        observaciones: [
          'Cirugía programada con técnica laparoscópica,abordaje estándar',
          'Alta esperada el mismo día o al día siguiente',
          'Verificar que honorarios estén dentro de rango de referencia',
        ],
      },
      programacionCirugia: {
        procedimiento: 'Hernioplastía Inguinal Laparoscópica con Malla',
        fecha: '2026-03-05',
        cirujano: 'Dr. Alejandro Fuentes,Cirugía General',
        duracionEstimada: '1.5 horas',
        pertinente: true,
        argumentosPertinencia: [
          'Ultrasonido confirma hernia inguinal indirecta,indicación quirúrgica clara',
          'Abordaje laparoscópico es primera línea para hernia inguinal unilateral',
          'Paciente sin contraindicaciones para cirugía bajo anestesia general',
        ],
      },
      contextoClinico: {
        timeline: [
          { fecha: '15/02/2026', evento: 'Consulta inicial con cirujano general' },
          { fecha: '18/02/2026', evento: 'Ultrasonido inguinal diagnóstico' },
          { fecha: '22/02/2026', evento: 'Estudios preoperatorios (laboratorios, EKG)' },
          { fecha: '28/02/2026', evento: 'Valoración preanestésica' },
          { fecha: '05/03/2026', evento: 'Cirugía programada: Hernioplastía laparoscópica' },
        ],
        pruebasDiagnosticas: [
          { prueba: 'Ultrasonido inguinal', resultado: 'Hernia inguinal indirecta derecha confirmada' },
          { prueba: 'Biometría hemática', resultado: 'Valores dentro de parámetros normales' },
          { prueba: 'Química sanguínea', resultado: 'Glucosa, creatinina y electrolitos normales' },
          { prueba: 'Electrocardiograma', resultado: 'Ritmo sinusal normal, sin alteraciones' },
          { prueba: 'Tiempos de coagulación', resultado: 'TP y TTP dentro de rango' },
        ],
        adjuntos: [
          { tipo: 'Informes médicos', cantidad: 6 },
          { tipo: 'Pruebas diagnósticas', cantidad: 4 },
          { tipo: 'Notas de evolución', cantidad: 3 },
          { tipo: 'Interconsultas', cantidad: 2 },
          { tipo: 'Consentimiento informado', cantidad: 1 },
          { tipo: 'Presupuesto hospitalario', cantidad: 1 },
        ],
      },
      checksPertinencia: [
        'Diagnóstico soportado por evidencia clínica (ultrasonido)',
        'Tratamiento alineado con guías clínicas de cirugía general',
        'Procedimiento indicado para hernia inguinal sintomática',
        'Abordaje laparoscópico apropiado como primera línea',
        'Sin contraindicaciones identificadas en valoración preanestésica',
      ],
      insumos: [
        { nombre: 'Honorarios Médicos', checks: ['Rol y especialidad consistentes con cirugía general', 'Importe de $18,000 dentro de tabulador médico'] },
        { nombre: 'Estancia Hospitalaria', checks: ['1 día adecuado para hernioplastía laparoscópica', 'Habitación estándar acorde a complejidad del procedimiento'] },
        { nombre: 'Anestesia', checks: ['Anestesia general acorde al procedimiento laparoscópico', 'Duración estimada de 1.5 horas coherente'] },
        { nombre: 'Quirófano y Material Quirúrgico', checks: ['Malla quirúrgica dentro de rangos esperados', 'Material consistente con técnica laparoscópica declarada'] },
        { nombre: 'Medicamentos Intrahospitalarios', checks: ['Consistencia con protocolo perioperatorio estándar', 'No se identifican duplicidades relevantes'] },
      ],
      checksDictamen: [
        'No existen endosos médicos aplicables',
        'No se identifican indicios de preexistencia',
        'Documentación médica presentada con elevado nivel de congruencia',
        'Importes correctos, incluyendo consistencia con tabulador médico',
      ],
      resumenFinanciero: {
        montoReclamado: 125000,
        deducible: 10000,
        coaseguro: 11500,
        coaseguroPct: 10,
        totalCargoAsegurado: 21500,
        totalCargoAseguradora: 103500,
        sumaAseguradaRemanente: 1396500,
      },
      alertasMedico: ['Verificar indicación quirúrgica laparoscópica vs abierta', 'Confirmar tipo de malla utilizada'],
      asistenciaFraudeManual: 'No se detectaron patrones de fraude que requieran atención del dictaminador médico',
    },
    pago: { validaciones: ['Cobertura quirúrgica vigente', 'Pertinencia médica 93%', 'Score fraude 5%', 'Dictaminador validó'], montoFinal: 103500, ajustes: ['Deducible: -$10,000', 'Coaseguro 10%: -$11,500', 'Malla genérica: ahorro $8,500'], estado: 'Reclamo procesado bajo modelo inteligente' },
    analitica: { automatizacion: 60, tiempoHumano: '25 min', riesgoResidual: 5, ahorro: 19000 },
  },

  // -- 4. Análisis Detallado --
  {
    id: 'detallado',
    title: 'Reembolso Sospechoso Fisioterapia',
    subtitle: 'Análisis detallado por anomalías detectadas',
    icon: <AlertTriangle size={24} />,
    monto: 78000,
    diagnostico: 'Fisioterapia 20 sesiones (M54.2)',
    proveedor: 'Centro de Rehabilitación Vita (Fuera de Red)',
    segmento: 'detallado',
    stages: [
      {
        id: 'validaciones', label: 'Validaciones', icon: <Upload size={16} />, mode: 'ia-asistido', duration: 1.5,
        agents: [
          { agentName: 'Agente de Ingesta Documental', agentRole: 'Extracción', outputs: [{ label: 'Documentos procesados', value: '2 de 4' }, { label: 'Confianza OCR', value: '78%' }], confidence: 78, duration: '2.3s' },
          { agentName: 'Agente de Validación de Datos', agentRole: 'Validación', outputs: [{ label: 'Campos completos', value: '72%' }, { label: 'Inconsistencias', value: '2' }], confidence: 72, duration: '1.5s' },
          { agentName: 'Agente de Contexto de Póliza', agentRole: 'Póliza', outputs: [{ label: 'Póliza', value: 'Salud Empresarial Plus,Vigente' }, { label: 'Producto', value: 'Colectivo' }], confidence: 90, duration: '1.0s' },
        ],
      },
      {
        id: 'elegibilidad', label: 'Elegibilidad', icon: <CheckCircle size={16} />, mode: 'manual', duration: 1.5,
        agents: [
          { agentName: 'Detección Temprana de Fraude', agentRole: 'Antifraude', outputs: [{ label: 'Score fraude', value: '72%' }, { label: 'Duplicidad documentos', value: '2 documentos sospechosos' }, { label: 'Proveedor en lista negra', value: 'ALERTA,proveedor marcado' }, { label: 'Patrón de reclamos', value: '3 reclamos similares en 6 meses' }], confidence: 78, duration: '3.2s' },
          { agentName: 'Motor de Coberturas', agentRole: 'Producto GNP', outputs: [{ label: 'Producto', value: 'Personaliza' }, { label: 'Rehabilitación', value: 'Activa,tope 12 sesiones' }, { label: 'Exceso sobre tope', value: '8 sesiones no cubiertas' }], confidence: 85, duration: '1.4s' },
          { agentName: 'Motor de Preexistencias', agentRole: 'Preexistencias', outputs: [{ label: 'Lumbalgia previa', value: 'No declarada' }, { label: 'Evaluación', value: 'Posible preexistencia oculta' }], confidence: 72, duration: '1.8s' },
          { agentName: 'Motor de Endosos', agentRole: 'Endosos', outputs: [{ label: 'Endoso rehabilitación', value: 'Límite 12 sesiones' }, { label: 'Proveedor fuera de red', value: 'Sin cobertura directa' }, { label: 'Resultado', value: 'Excede límites del endoso' }], confidence: 80, duration: '1.2s' },
          { agentName: 'Agente Dictaminador', agentRole: 'Dictamen', outputs: [{ label: 'Decisión', value: 'Requiere Supervisión Humana' }, { label: 'Motivo', value: 'Alerta de fraude + proveedor marcado' }, { label: 'Recomendación', value: 'DERIVAR a investigación' }], confidence: 75, duration: '1.5s' },
        ],
      },
      {
        id: 'triaje', label: 'Triaje', icon: <Cpu size={16} />, mode: 'automatizado', duration: 1.5,
        agents: [
          { agentName: 'Motor de Triaje ML', agentRole: 'Segmentación', outputs: [{ label: 'Segmento asignado', value: 'Análisis Detallado' }, { label: 'Score', value: '72%' }, { label: 'Variables evaluadas', value: '6' }], confidence: 72, duration: '0.4s' },
        ],
      },
      {
        id: 'dictamen-medico', label: 'Dictamen Médico', icon: <Search size={16} />, mode: 'manual', duration: 1.5,
        agents: [],
      },
      {
        id: 'pago', label: 'Pago', icon: <CreditCard size={16} />, mode: 'manual', duration: 1.5,
        agents: [
          { agentName: 'Agente de Liquidación', agentRole: 'Pagos', outputs: [{ label: 'Monto autorizado', value: '$0,retenido' }, { label: 'Validaciones', value: '2/4 pendientes' }], confidence: 40, duration: '1.0s' },
          { agentName: 'Agente Antifraude Final', agentRole: 'Control', outputs: [{ label: 'Score fraude final', value: '72%' }, { label: 'Resultado', value: 'Investigacion en curso' }, { label: 'Dictamen comite', value: 'Pendiente' }], confidence: 40, duration: '0.8s' },
        ],
      },
    ],
    validaciones: {
      canal: 'App Movil', completitud: 85, ocrConfianza: 78, folioId: 'SIN-2026-00203',
      documentosDetectados: [
        { nombre: 'Recibo Fisioterapia', tipo: 'Factura', estado: 'verificado' },
        { nombre: 'Referencia Medica', tipo: 'Nota Clínica', estado: 'pendiente' },
        { nombre: 'Estudios de Imagen', tipo: 'Estudios', estado: 'faltante' },
        { nombre: 'Historial de Sesiones', tipo: 'Registro', estado: 'faltante' },
      ],
      transcripcion: [
        { campo: 'Diagnostico', valor: 'Lumbalgia Cronica (M54.2)', confianza: 78 },
        { campo: 'Monto', valor: '$78,000', confianza: 82 },
        { campo: 'Sesiones Solicitadas', valor: '20', confianza: 85 },
        { campo: 'Proveedor', valor: 'Centro Rehabilitación Vita', confianza: 76 },
      ],
      faltantes: ['Estudios de Imagen (Resonancia)', 'Historial detallado de sesiones', 'Referencia del medico tratante'],
      pdfMaestro: { version: '0.7', paginas: 3, pesoMB: 0.8 },
      fraudeScoreInicial: 72,
    },
    elegibilidad: {
      resultado: 'Alerta de fraude activada,revision manual obligatoria', alertaHumana: true, deducible: 5000, coaseguro: 20,
      poliza: { tipo: 'Colectivo', vigente: true, pagada: true, producto: 'Salud Empresarial Plus' },
      coberturas: [
        { nombre: 'Rehabilitación Fisica', activa: true, limite: 60000 },
        { nombre: 'Consulta Especialidad', activa: true, limite: 25000 },
      ],
      preexistencias: [
        { condicion: 'Lumbalgia Cronica', declarada: false, aplica: true, justificacion: 'Condicion no declarada en solicitud original,potencial exclusion por omision de preexistencia' },
      ],
      endosos: [
        { id: 'END-201', nombre: 'Endoso de Rehabilitación Extendida', descripcion: 'Amplia sesiones de fisioterapia de 12 a 24', impacto: 'No aplica,proveedor fuera de red', aplica: false },
      ],
      dictamenPreliminar: 'ALERTA,Fraude potencial detectado. Preexistencia no declarada, proveedor fuera de red, patron de reclamos atipico. Requiere investigacion detallada antes de dictamen.',
      recetaMedicaPendiente: true,
    },
    triaje: {
      rutaActiva: 'detallado',
      scoreTriaje: 72,
      variables: {
        perfilClinico: { valor: 'Lumbalgia crónica (M54.2),complejidad media', nivel: 'Medio', peso: 40 },
        severidadEconomica: { valor: '$78,000,excede tope de cobertura (12 sesiones)', nivel: 'Media', peso: 55 },
        faseEvento: { valor: 'Post-Agudo,rehabilitación prolongada', nivel: 'Post-Agudo', peso: 45 },
        perfilProveedor: { valor: 'Centro Rehabilitación Vita,Fuera de Red, marcado', nivel: 'Fuera de Red', peso: 92 },
        condicionesContractuales: { valor: 'Póliza Personaliza,tope limitado rehabilitación', nivel: 'Estándar', peso: 60 },
        alertasFraude: { valor: 'ALERTA ALTA,score 72%, proveedor en lista negra', nivel: 'Alta', peso: 95 },
      },
      arbolDecision: [
        'Alertas Fraude = Alta (72%) → PRIORIDAD: señal dominante',
        'Proveedor = Fuera de Red + Lista negra → Factor agravante',
        'Historial = 3 reclamos similares en 6 meses → Patrón atípico',
        'Monto excede tope de cobertura → Incongruencia financiera',
        'RESULTADO: Alertas de Fraude dominantes + Proveedor marcado → Análisis Detallado (Investigación)',
      ],
      caseManagement: {
        potencialAhorro: 78000,
        probabilidadAhorro: 90,
        cargaEquipo: 78,
        recomendacion: 'Derivar a investigación de fraude. El potencial de recuperación justifica recursos dedicados',
        palancas: {
          medicamentosBiocompatibles: { actual: 'N/A', alternativa: 'N/A', ahorroPotencial: 'N/A', aplica: false },
          honorariosMedicos: { montoActual: '$3,900/sesión', promedioHistorico: '$1,800/sesión', desviacion: '+116.7%', alerta: true },
          duracionEstancia: { diasProgramados: 20, promedioHistorico: 10, desviacion: '+100% (ALERTA)', alerta: true },
        },
      },
    },
    dictamenMedico: {
      expedienteMedico: {
        diagnosticoPrincipal: 'Lumbalgia Crónica (M54.2),Fisioterapia 20 sesiones',
        codigoCIE: 'M54.2',
        historialRelevante: [
          '3 reclamos de fisioterapia en los últimos 6 meses,patrón atípico',
          'Diagnóstico de lumbalgia crónica sin estudios de imagen que lo respalden',
          'Proveedor "Centro Rehabilitación Vita" fuera de red y marcado en sistema',
        ],
        observaciones: [
          'ALERTA: Proveedor en lista de vigilancia,investigación activa',
          'ALERTA: 20 sesiones solicitadas exceden tope de póliza (12 sesiones)',
          'ALERTA: Sin resonancia magnética ni estudios que justifiquen tratamiento prolongado',
          'Referencia médica pendiente de verificación,posible documento editado',
        ],
      },
      contextoClinico: {
        timeline: [
          { fecha: '10/12/2025', evento: 'Primera consulta por lumbalgia,sin estudios de imagen' },
          { fecha: '15/12/2025', evento: 'Inicio de sesiones de fisioterapia (1er reclamo: 8 sesiones)' },
          { fecha: '20/01/2026', evento: 'Segundo reclamo de fisioterapia (10 sesiones adicionales)' },
          { fecha: '15/02/2026', evento: 'Tercer reclamo actual,20 sesiones de fisioterapia' },
        ],
        pruebasDiagnosticas: [
          { prueba: 'Resonancia magnética lumbar', resultado: 'NO PRESENTADA,faltante crítico' },
          { prueba: 'Radiografía lumbar', resultado: 'No disponible en expediente' },
          { prueba: 'Referencia médica', resultado: 'Documento en revisión,posibles alteraciones detectadas' },
        ],
        adjuntos: [
          { tipo: 'Recibos de fisioterapia', cantidad: 3 },
          { tipo: 'Referencia médica (en revisión)', cantidad: 1 },
        ],
      },
      checksPertinencia: [
        'FALLA: Diagnóstico NO soportado por estudios de imagen (resonancia o radiografía faltante)',
        'FALLA: 20 sesiones exceden el tope de póliza de 12 sesiones',
        'FALLA: Proveedor fuera de red y marcado en lista de vigilancia',
        'FALLA: Patrón de 3 reclamos en 6 meses sin evidencia de mejoría documentada',
        'FALLA: Referencia médica con posibles alteraciones,pendiente de verificación',
      ],
      insumos: [
        { nombre: 'Sesiones de Fisioterapia (20)', checks: ['FALLA: Costo por sesión de $3,900 supera el promedio de $1,800 (+116.7%)', 'FALLA: 20 sesiones exceden tope de póliza (12 sesiones máximo)'] },
        { nombre: 'Consulta de Evaluación Inicial', checks: ['Sin referencia médica válida que sustente la prescripción', 'FALLA: Diagnóstico sin soporte de estudios de imagen'] },
        { nombre: 'Material Terapéutico', checks: ['FALLA: Material facturado no consistente con fisioterapia estándar para lumbalgia', 'Montos por sesión significativamente elevados'] },
      ],
      checksDictamen: [
        'FALLA: Preexistencia no declarada (lumbalgia crónica),posible exclusión por omisión',
        'FALLA: Proveedor en lista de vigilancia,investigación activa',
        'FALLA: Documentación médica incompleta y con posibles alteraciones',
        'FALLA: Importes significativamente por encima del tabulador (+116.7% en honorarios)',
      ],
      resumenFinanciero: {
        montoReclamado: 78000,
        deducible: 5000,
        coaseguro: 14600,
        coaseguroPct: 20,
        totalCargoAsegurado: 19600,
        totalCargoAseguradora: 0,
        sumaAseguradaRemanente: 60000,
      },
      alertasMedico: ['ALERTA: Verificar existencia real del tratamiento', 'Confirmar diagnóstico de lumbalgia con estudios de imagen', 'Solicitar segunda opinión médica'],
      asistenciaFraudeManual: 'ATENCIÓN: Se detectaron patrones consistentes con facturación duplicada y sobre-codificación. Verificar que los servicios facturados correspondan a tratamientos efectivamente realizados. El proveedor se encuentra en lista de vigilancia.',
    },
    pago: { validaciones: ['Investigacion de fraude completada', 'Dictamen de comite antifraude', 'Revision de pertinencia medica', 'Validacion juridica'], montoFinal: 0, ajustes: ['Pago retenido,investigacion en curso', 'Proveedor marcado para auditoria', 'Exceso sobre tope de 12 sesiones: -$39,000'], estado: 'Reclamo procesado bajo modelo inteligente' },
    analitica: { automatizacion: 40, tiempoHumano: '180 min', riesgoResidual: 72, ahorro: 78000 },
  },

  // -- 5. Dictamen Automático --
  {
    id: 'automatica',
    title: 'Consulta Médica General',
    subtitle: 'Dictamen automático sin intervención humana',
    icon: <FileText size={24} />,
    monto: 450,
    diagnostico: 'Consulta medica general (Z00.0)',
    proveedor: 'Consultorio Dr. Ramirez',
    segmento: 'automatica',
    stages: [
      {
        id: 'validaciones', label: 'Validaciones', icon: <Upload size={16} />, mode: 'automatizado', duration: 1.5,
        agents: [
          { agentName: 'Agente de Ingesta Documental', agentRole: 'Extracción', outputs: [{ label: 'Documentos procesados', value: '1 de 1' }, { label: 'Confianza OCR', value: '99%' }], confidence: 99, duration: '0.5s' },
          { agentName: 'Agente de Validación de Datos', agentRole: 'Validación', outputs: [{ label: 'Campos completos', value: '100%' }, { label: 'Inconsistencias', value: '0' }], confidence: 100, duration: '0.3s' },
          { agentName: 'Agente de Contexto de Póliza', agentRole: 'Póliza', outputs: [{ label: 'Póliza', value: 'Basico Salud Empresarial,Vigente' }, { label: 'Producto', value: 'Colectivo' }], confidence: 100, duration: '0.2s' },
        ],
      },
      {
        id: 'elegibilidad', label: 'Elegibilidad', icon: <CheckCircle size={16} />, mode: 'automatizado', duration: 1.5,
        agents: [
          { agentName: 'Detección Temprana de Fraude', agentRole: 'Antifraude', outputs: [{ label: 'Score fraude', value: '<1%' }, { label: 'Verificación express', value: 'Sin anomalías' }], confidence: 100, duration: '0.3s' },
          { agentName: 'Motor de Coberturas', agentRole: 'Producto GNP', outputs: [{ label: 'Producto', value: 'Esencial Básico' }, { label: 'Consulta general', value: 'Cubierta al 100%' }], confidence: 100, duration: '0.2s' },
          { agentName: 'Motor de Preexistencias', agentRole: 'Preexistencias', outputs: [{ label: 'Preexistencias', value: 'Sin registros' }, { label: 'Exclusiones', value: 'Ninguna' }], confidence: 100, duration: '0.1s' },
          { agentName: 'Motor de Endosos', agentRole: 'Endosos', outputs: [{ label: 'Endosos revisados', value: '1' }, { label: 'Resultado', value: 'Sin impacto' }], confidence: 100, duration: '0.1s' },
          { agentName: 'Agente Dictaminador', agentRole: 'Dictamen', outputs: [{ label: 'Decisión', value: 'Dictamen Automático' }, { label: 'Resultado', value: 'APROBADO' }, { label: 'Supervisión humana', value: 'No requerida' }], confidence: 100, duration: '0.2s' },
        ],
      },
      {
        id: 'triaje', label: 'Triaje', icon: <Cpu size={16} />, mode: 'automatizado', duration: 1.5,
        agents: [
          { agentName: 'Motor de Triaje ML', agentRole: 'Segmentación', outputs: [{ label: 'Segmento asignado', value: 'Gestión Automática' }, { label: 'Score', value: '99%' }, { label: 'Variables evaluadas', value: '6' }], confidence: 99, duration: '0.2s' },
        ],
      },
      {
        id: 'dictamen-medico', label: 'Dictamen Médico', icon: <Zap size={16} />, mode: 'manual', duration: 1.5,
        agents: [],
      },
      {
        id: 'pago', label: 'Pago', icon: <CreditCard size={16} />, mode: 'automatizado', duration: 1.5,
        agents: [
          { agentName: 'Agente de Liquidación', agentRole: 'Pagos', outputs: [{ label: 'Monto autorizado', value: '$450' }, { label: 'Validaciones', value: '3/3 completadas' }], confidence: 100, duration: '0.3s' },
          { agentName: 'Agente Antifraude Final', agentRole: 'Control', outputs: [{ label: 'Score fraude final', value: '< 1%' }, { label: 'Resultado', value: 'Limpio' }], confidence: 100, duration: '0.1s' },
        ],
      },
    ],
    validaciones: {
      canal: 'Chatbot WhatsApp', completitud: 100, ocrConfianza: 99, folioId: 'SIN-2026-00315',
      documentosDetectados: [
        { nombre: 'Recibo de Consulta General', tipo: 'Factura', estado: 'verificado' },
      ],
      transcripcion: [
        { campo: 'Diagnostico', valor: 'Consulta medica general (Z00.0)', confianza: 100 },
        { campo: 'Monto', valor: '$450', confianza: 100 },
        { campo: 'Proveedor', valor: 'Consultorio Dr. Ramirez', confianza: 100 },
      ],
      faltantes: [],
      pdfMaestro: { version: '1.0', paginas: 1, pesoMB: 0.3 },
      fraudeScoreInicial: 1,
    },
    elegibilidad: {
      resultado: 'Aprobacion instantanea,cobertura basica confirmada', alertaHumana: false, deducible: 0, coaseguro: 0,
      poliza: { tipo: 'Colectivo', vigente: true, pagada: true, producto: 'Basico Salud Empresarial' },
      coberturas: [
        { nombre: 'Consulta General', activa: true, limite: 10000 },
      ],
      preexistencias: [],
      endosos: [],
      dictamenPreliminar: 'ELEGIBLE,Cobertura basica de consulta confirmada. Sin deducible ni coaseguro. Aprobacion instantanea.',
      recetaMedicaPendiente: false,
    },
    triaje: {
      rutaActiva: 'automatica',
      scoreTriaje: 99,
      variables: {
        perfilClinico: { valor: 'Consulta general (Z00.0),mínima complejidad', nivel: 'Bajo', peso: 2 },
        severidadEconomica: { valor: '$450,monto mínimo', nivel: 'Baja', peso: 1 },
        faseEvento: { valor: 'Electivo,consulta programada', nivel: 'Electivo', peso: 1 },
        perfilProveedor: { valor: 'Consultorio Dr. Ramírez,en red', nivel: 'Nivel 2', peso: 5 },
        condicionesContractuales: { valor: 'Póliza Esencial Básica', nivel: 'Estándar', peso: 2 },
        alertasFraude: { valor: 'Sin alertas,score <1%', nivel: 'Ninguna', peso: 0 },
      },
      arbolDecision: [
        'Todas las variables en nivel mínimo → Sin factores de complejidad',
        'Score de triaje = 99% → Confianza máxima en clasificación automática',
        'RESULTADO: Caso trivial → Dictamen Automático instantáneo',
      ],
      caseManagement: {
        potencialAhorro: 0,
        probabilidadAhorro: 0,
        cargaEquipo: 78,
        recomendacion: 'No requiere Case Management. Caso trivial con dictamen automático',
      },
    },
    dictamenMedico: {
      expedienteMedico: {
        diagnosticoPrincipal: 'Consulta médica general (Z00.0)',
        codigoCIE: 'Z00.0',
        historialRelevante: ['Sin antecedentes relevantes', 'Primera consulta del año'],
        observaciones: ['Caso trivial,sin hallazgos que requieran análisis'],
      },
      contextoClinico: {
        timeline: [
          { fecha: '01/03/2026', evento: 'Consulta médica general de rutina' },
        ],
        pruebasDiagnosticas: [
          { prueba: 'Exploración física', resultado: 'Sin hallazgos patológicos' },
        ],
        adjuntos: [
          { tipo: 'Recibo de consulta', cantidad: 1 },
        ],
      },
      checksPertinencia: [
        'Consulta general dentro de cobertura básica',
        'Monto consistente con tabulador de consulta de primer nivel',
      ],
      insumos: [
        { nombre: 'Consulta Médica General', checks: ['Importe de $450 dentro de rango para consulta de primer nivel', 'Proveedor en red,consultorio verificado'] },
      ],
      checksDictamen: [
        'Sin endosos aplicables',
        'Sin preexistencias relevantes',
        'Documentación mínima suficiente para caso trivial',
      ],
      resumenFinanciero: {
        montoReclamado: 450,
        deducible: 0,
        coaseguro: 0,
        coaseguroPct: 0,
        totalCargoAsegurado: 0,
        totalCargoAseguradora: 450,
        sumaAseguradaRemanente: 9550,
      },
      alertasMedico: [],
      asistenciaFraudeManual: 'No se detectaron patrones de fraude que requieran atención del dictaminador médico',
    },
    pago: { validaciones: ['Cobertura vigente', 'Sin deducible', 'Score fraude < 1%'], montoFinal: 450, ajustes: ['Sin ajustes,cobertura total'], estado: 'Reclamo procesado bajo modelo inteligente' },
    analitica: { automatizacion: 98, tiempoHumano: '0 min', riesgoResidual: 1, ahorro: 350 },
  },
];

// ---------------------------------------------------------------------------
// Color maps
// ---------------------------------------------------------------------------

const MODE_COLORS: Record<ProcessMode, string> = {
  'manual': '#3b82f6',
  'ia-asistido': '#d4a574',
  'automatizado': '#0175D8',
};

const MODE_LABELS: Record<ProcessMode, string> = {
  'manual': 'Manual',
  'ia-asistido': 'IA-Asistido',
  'automatizado': 'Automatizado',
};

const SEGMENTO_LABELS: Record<SegmentoGestion, string> = {
  'case-management': 'Case Management',
  'proactiva': 'Gestión Proactiva',
  'reactiva': 'Gestión Reactiva',
  'detallado': 'Análisis Detallado',
  'automatica': 'Dictamen Automático',
};

const SEGMENTO_COLORS: Record<SegmentoGestion, string> = {
  'case-management': '#ef4444',
  'proactiva': '#f97316',
  'reactiva': '#3b82f6',
  'detallado': '#8b5cf6',
  'automatica': '#22c55e',
};

const defaultStageStatuses = (): Record<StageId, StageStatus> => ({
  validaciones: 'pending',
  elegibilidad: 'pending',
  triaje: 'pending',
  'dictamen-medico': 'pending',
  pago: 'pending',
});

// ---------------------------------------------------------------------------
// Parrilla data (cases assigned to dictaminador at intake)
// Only information available at the moment of claim notification
// ---------------------------------------------------------------------------

const DICTAMINADOR_NAME = 'Dra. Alejandra Vázquez Moreno';

interface ParrillaCase {
  id: string;
  folioId: string;
  fechaAviso: string;
  asegurado: string;
  numPoliza: string;
  canal: string;
  tipoSiniestro: string;
  montoReservado: number;
  claimTypeId: ClaimTypeId;
}

const PARRILLA_CASES: ParrillaCase[] = [
  { id: 'c1', folioId: 'SIN-2026-00481', fechaAviso: '2026-03-28', asegurado: 'Roberto García Méndez', numPoliza: 'POL-4821093', canal: 'Hospital directo', tipoSiniestro: 'Cirugía mayor programada', montoReservado: 520000, claimTypeId: 'case-management' },
  { id: 'c2', folioId: 'SIN-2026-00483', fechaAviso: '2026-03-27', asegurado: 'María Elena Torres Vega', numPoliza: 'POL-3917254', canal: 'Hospital directo', tipoSiniestro: 'Cirugía mayor programada', montoReservado: 485000, claimTypeId: 'case-management' },
  { id: 'c3', folioId: 'SIN-2026-00479', fechaAviso: '2026-03-29', asegurado: 'Javier Hernández López', numPoliza: 'POL-5528410', canal: 'Urgencias', tipoSiniestro: 'Intervención cardiovascular', montoReservado: 310000, claimTypeId: 'proactiva' },
  { id: 'c4', folioId: 'SIN-2026-00485', fechaAviso: '2026-03-30', asegurado: 'Ana Sofía Ramírez Cruz', numPoliza: 'POL-6104837', canal: 'Hospital directo', tipoSiniestro: 'Hospitalización', montoReservado: 195000, claimTypeId: 'proactiva' },
  { id: 'c5', folioId: 'SIN-2026-00472', fechaAviso: '2026-03-26', asegurado: 'Carlos Pérez Domínguez', numPoliza: 'POL-2293015', canal: 'Call center', tipoSiniestro: 'Hospitalización', montoReservado: 185000, claimTypeId: 'proactiva' },
  { id: 'c6', folioId: 'SIN-2026-00488', fechaAviso: '2026-03-28', asegurado: 'Laura Martínez Sánchez', numPoliza: 'POL-7741562', canal: 'App móvil', tipoSiniestro: 'Cirugía programada', montoReservado: 125000, claimTypeId: 'reactiva' },
  { id: 'c7', folioId: 'SIN-2026-00490', fechaAviso: '2026-03-29', asegurado: 'Fernando Ríos Gutiérrez', numPoliza: 'POL-8356201', canal: 'Urgencias', tipoSiniestro: 'Cirugía de urgencia', montoReservado: 98000, claimTypeId: 'reactiva' },
  { id: 'c8', folioId: 'SIN-2026-00493', fechaAviso: '2026-03-27', asegurado: 'Diana Flores Castillo', numPoliza: 'POL-1489320', canal: 'Reembolso', tipoSiniestro: 'Reembolso rehabilitación', montoReservado: 78000, claimTypeId: 'detallado' },
  { id: 'c9', folioId: 'SIN-2026-00495', fechaAviso: '2026-03-30', asegurado: 'Eduardo Vargas Núñez', numPoliza: 'POL-9072148', canal: 'Urgencias', tipoSiniestro: 'Cirugía de urgencia', montoReservado: 65000, claimTypeId: 'reactiva' },
  { id: 'c10', folioId: 'SIN-2026-00498', fechaAviso: '2026-03-29', asegurado: 'Patricia Morales Ruiz', numPoliza: 'POL-3350917', canal: 'App móvil', tipoSiniestro: 'Consulta médica', montoReservado: 450, claimTypeId: 'automatica' },
  { id: 'c11', folioId: 'SIN-2026-00500', fechaAviso: '2026-03-30', asegurado: 'Miguel Ángel Soto Reyes', numPoliza: 'POL-4467283', canal: 'App móvil', tipoSiniestro: 'Estudios de laboratorio', montoReservado: 1200, claimTypeId: 'automatica' },
  { id: 'c12', folioId: 'SIN-2026-00502', fechaAviso: '2026-03-28', asegurado: 'Gabriela Jiménez Ortiz', numPoliza: 'POL-5584619', canal: 'Call center', tipoSiniestro: 'Consulta especialista', montoReservado: 3500, claimTypeId: 'automatica' },
];

// Stage summary generator
const generateStageSummary = (stageId: StageId, config: ClaimTypeConfig): { bullets: string[]; needsInput: boolean; inputReason: string } => {
  switch (stageId) {
    case 'validaciones': {
      const docs = config.validaciones.documentosDetectados.filter(d => d.estado === 'verificado').length;
      const total = config.validaciones.documentosDetectados.length;
      const needsInput = config.validaciones.ocrConfianza < 60;
      return {
        bullets: [
          `${docs} de ${total} documentos procesados y verificados`,
          `Confianza OCR: ${config.validaciones.ocrConfianza}%`,
          `Score fraude inicial: ${config.validaciones.fraudeScoreInicial}%`,
        ],
        needsInput,
        inputReason: needsInput ? 'Confianza OCR baja, verificar datos extraídos' : '',
      };
    }
    case 'elegibilidad': {
      const needsInput = config.elegibilidad.alertaHumana;
      return {
        bullets: [
          `Resultado: ${config.elegibilidad.resultado}`,
          `Deducible: ${fmtCurrency(config.elegibilidad.deducible)}, Coaseguro: ${config.elegibilidad.coaseguro}%`,
          `Coberturas activas: ${config.elegibilidad.coberturas.filter(c => c.activa).length} de ${config.elegibilidad.coberturas.length}`,
        ],
        needsInput,
        inputReason: needsInput ? 'Aprobar o rechazar dictamen de elegibilidad' : '',
      };
    }
    case 'triaje':
      return {
        bullets: [
          `Segmento asignado: ${SEGMENTO_LABELS[config.triaje.rutaActiva]}`,
          `Score de triaje: ${config.triaje.scoreTriaje}%`,
          `Variables evaluadas: 6`,
        ],
        needsInput: false,
        inputReason: '',
      };
    case 'dictamen-medico':
      return {
        bullets: [
          `Verificaciones de pertinencia: ${config.dictamenMedico.checksPertinencia.length} checks`,
          `Insumos a revisar: ${config.dictamenMedico.insumos.length} ítems`,
          `Monto a pagar: ${fmtCurrency(config.dictamenMedico.resumenFinanciero.totalCargoAseguradora)}`,
        ],
        needsInput: true,
        inputReason: 'Revisar pertinencia clínica y aprobar insumos',
      };
    case 'pago':
      return {
        bullets: [
          `Monto final: ${fmtCurrency(config.pago.montoFinal)}`,
          `Ajustes aplicados: ${config.pago.ajustes.length}`,
          config.pago.estado,
        ],
        needsInput: true,
        inputReason: 'Autorizar pago final',
      };
    default:
      return { bullets: [], needsInput: false, inputReason: '' };
  }
};

// Timer formatter
const formatTimer = (ms: number): string => {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const getTimerColor = (ms: number): string => {
  if (ms > 3600000) return '#22c55e';
  if (ms > 1800000) return '#f59e0b';
  return '#ef4444';
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const E2EClaimsWorkstation: React.FC = () => {
  const { domainId, useCaseId } = useParams<{ domainId: string; useCaseId: string }>();
  const result = getUseCase(domainId ?? '', useCaseId ?? '');

  const domain = result?.domain ?? {
    id: 'claims',
    name: 'Claims Management',
    accentColor: '#0175D8',
    description: '',
    position: 3,
    useCases: [],
  };
  const useCase = result?.useCase ?? {
    id: 'e2e-claims',
    title: 'Gestión E2E de Siniestros',
    description: 'Gestión integral del ciclo de vida del siniestro punta a punta.',
  };

  // -- Parrilla State --
  const [parrillaEntryTime, setParrillaEntryTime] = useState<Date | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [timerRemaining, setTimerRemaining] = useState(7200000); // 2 hours in ms
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [reviewedCases, setReviewedCases] = useState<Set<string>>(new Set());

  // -- Original State --
  const [selectedClaimType, setSelectedClaimType] = useState<ClaimTypeId | null>(null);
  const [simulationState, setSimulationState] = useState<'idle' | 'running' | 'complete'>('idle');
  const [stageStatuses, setStageStatuses] = useState<Record<StageId, StageStatus>>(defaultStageStatuses());
  const [showStageDetail, setShowStageDetail] = useState<StageId | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingStageIndex, setPendingStageIndex] = useState(0);
  const [dictamenAprobado, setDictamenAprobado] = useState<boolean | null>(null);
  const [pagoAprobado, setPagoAprobado] = useState<boolean | null>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  // -- Timer Effect --
  useEffect(() => {
    if (!parrillaEntryTime) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - parrillaEntryTime.getTime();
      const remaining = Math.max(0, 7200000 - elapsed);
      setTimerRemaining(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [parrillaEntryTime]);

  // -- Derived --
  const claimConfig = useMemo(
    () => CLAIM_TYPES.find((c) => c.id === selectedClaimType) ?? null,
    [selectedClaimType],
  );

  // Compute active stages
  const activeStages = useMemo(() => {
    if (!claimConfig) return [];
    return claimConfig.stages;
  }, [claimConfig]);

  // Helper: get agentFlow for a given stage
  const getAgentFlow = useCallback((stageId: StageId): StageAgentFlow | undefined => {
    return AGENT_FLOWS[stageId];
  }, []);

  // ---------------------------------------------------------------------------
  // Manual advance logic
  // ---------------------------------------------------------------------------

  const advanceStage = useCallback(() => {
    if (!claimConfig || isProcessing || simulationState === 'complete') return;

    if (pendingStageIndex >= activeStages.length) {
      setSimulationState('complete');
      return;
    }

    const currentStage = activeStages[pendingStageIndex];
    setIsProcessing(true);
    setSimulationState('running');

    // Set current stage to active
    setStageStatuses((prev) => ({ ...prev, [currentStage.id]: 'active' }));
    setShowStageDetail(currentStage.id);

    // After 2 seconds, mark as complete and move to next
    setTimeout(() => {
      setStageStatuses((prev) => ({ ...prev, [currentStage.id]: 'complete' }));
      setIsProcessing(false);

      const nextIndex = pendingStageIndex + 1;
      setPendingStageIndex(nextIndex);

      // Check if we are done
      if (nextIndex >= activeStages.length) {
        setSimulationState('complete');
      }
    }, 2000);
  }, [claimConfig, isProcessing, simulationState, pendingStageIndex, activeStages]);

  const handleSelectClaimType = useCallback((id: ClaimTypeId) => {
    const config = CLAIM_TYPES.find((c) => c.id === id);
    if (!config) return;

    setSelectedClaimType(id);
    setSimulationState('idle');
    setStageStatuses(defaultStageStatuses());
    setShowStageDetail(null);
    setIsProcessing(false);
    setPendingStageIndex(0);
    setDictamenAprobado(null);
    setPagoAprobado(null);
  }, []);

  const handleReset = useCallback(() => {
    setSimulationState('idle');
    setStageStatuses(defaultStageStatuses());
    setShowStageDetail(null);
    setSelectedClaimType(null);
    setIsProcessing(false);
    setPendingStageIndex(0);
    setDictamenAprobado(null);
    setPagoAprobado(null);
  }, []);

  const handleRestart = useCallback(() => {
    if (!claimConfig) return;
    setSimulationState('idle');
    setStageStatuses(defaultStageStatuses());
    setShowStageDetail(null);
    setIsProcessing(false);
    setPendingStageIndex(0);
  }, [claimConfig]);

  const scrollToSelector = useCallback(() => {
    selectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // -- Parrilla Handlers --
  const handleSelectCase = useCallback((caseItem: ParrillaCase) => {
    if (!parrillaEntryTime) {
      setParrillaEntryTime(new Date());
      setTimerRemaining(7200000);
    }
    setSelectedCaseId(caseItem.id);
    setSelectedClaimType(caseItem.claimTypeId);
    setSimulationState('idle');
    setStageStatuses(defaultStageStatuses());
    setShowStageDetail(null);
    setIsProcessing(false);
    setPendingStageIndex(0);
    setDictamenAprobado(null);
    setPagoAprobado(null);
    setShowSidePanel(false);
  }, [parrillaEntryTime]);

  const handleBackToParrilla = useCallback(() => {
    if (simulationState === 'complete' && selectedCaseId) {
      setReviewedCases(prev => new Set(prev).add(selectedCaseId));
    }
    setSelectedCaseId(null);
    setSelectedClaimType(null);
    setSimulationState('idle');
    setStageStatuses(defaultStageStatuses());
    setShowStageDetail(null);
    setIsProcessing(false);
    setPendingStageIndex(0);
    setDictamenAprobado(null);
    setPagoAprobado(null);
    setShowSidePanel(false);
  }, [simulationState, selectedCaseId]);

  // Derived: current case data
  const currentCase = useMemo(
    () => selectedCaseId ? PARRILLA_CASES.find(c => c.id === selectedCaseId) ?? null : null,
    [selectedCaseId],
  );

  // All parrilla cases sorted by monto reservado (highest first)
  const parrillaCases = useMemo(() => [...PARRILLA_CASES].sort((a, b) => b.montoReservado - a.montoReservado), []);

  const downloadMasterPDF = useCallback((config: ClaimTypeConfig) => {
    const fecha = new Date().toISOString().split('T')[0];
    const hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const g = config.dictamenMedico;
    const e = config.elegibilidad;
    const t = config.triaje;

    const statusIcon = (estado: string) => estado === 'verificado' ? '✅' : estado === 'pendiente' ? '⏳' : '❌';
    const confColor = (c: number) => c > 90 ? '#22c55e' : c > 80 ? '#F5A623' : '#ef4444';

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${config.validaciones.folioId},Expediente Consolidado</title>
<style>
  @page { margin: 20mm; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0e1a; color: #cbd5e1; font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.6; padding: 0; }
  .page { max-width: 800px; margin: 0 auto; padding: 40px; }
  .logo-bar { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 2px solid #0175D8; margin-bottom: 24px; }
  .logo { font-size: 22px; font-weight: 800; color: #0175D8; letter-spacing: -0.5px; }
  .logo-sub { font-size: 11px; color: #64748b; }
  .folio-box { text-align: right; }
  .folio-box .folio { font-size: 14px; font-weight: 700; color: #e2e8f0; font-family: monospace; }
  .folio-box .date { font-size: 11px; color: #64748b; }
  h2 { font-size: 14px; font-weight: 700; color: #0175D8; text-transform: uppercase; letter-spacing: 1px; margin: 28px 0 12px; padding-bottom: 6px; border-bottom: 1px solid #1e293b; }
  h3 { font-size: 12px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 16px 0 8px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th { text-align: left; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 10px; border-bottom: 1px solid #1e293b; background: #0f172a; }
  td { padding: 7px 10px; border-bottom: 1px solid #0f172a; font-size: 12px; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; }
  .badge-green { background: rgba(34,197,94,0.15); color: #22c55e; }
  .badge-amber { background: rgba(245,166,35,0.15); color: #F5A623; }
  .badge-red { background: rgba(239,68,68,0.15); color: #ef4444; }
  .badge-blue { background: rgba(1,117,216,0.15); color: #0175D8; }
  .kpi-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 16px; }
  .kpi { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 12px; text-align: center; }
  .kpi-val { font-size: 18px; font-weight: 800; color: #e2e8f0; }
  .kpi-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
  .alert-box { padding: 10px 14px; border-radius: 6px; margin: 8px 0; font-size: 11px; display: flex; align-items: flex-start; gap: 8px; }
  .alert-warn { background: rgba(245,166,35,0.08); border: 1px solid rgba(245,166,35,0.2); color: #F5A623; }
  .alert-ok { background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.2); color: #22c55e; }
  .alert-danger { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: #ef4444; }
  .section-card { background: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 12px; }
  .row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #0a0e1a; }
  .row:last-child { border-bottom: none; }
  .row-label { color: #64748b; font-size: 11px; }
  .row-value { color: #e2e8f0; font-weight: 600; font-size: 12px; }
  .tree-step { padding: 6px 0 6px 20px; border-left: 2px solid #1e293b; font-size: 11px; color: #94a3b8; position: relative; }
  .tree-step::before { content: ''; position: absolute; left: -5px; top: 10px; width: 8px; height: 8px; border-radius: 50%; background: #0175D8; }
  .tree-result { border-left-color: #0175D8; color: #0175D8; font-weight: 700; }
  .tree-result::before { background: #22c55e; }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 2px solid #0175D8; text-align: center; font-size: 10px; color: #475569; }
  .print-btn { display: block; margin: 24px auto; padding: 12px 32px; background: #0175D8; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 700; }
  .print-btn:hover { background: #0288ef; }
  @media print { .print-btn { display: none; } body { background: #fff; color: #1e293b; } .page { padding: 0; } .section-card, .kpi { background: #f8fafc; border-color: #e2e8f0; } th { background: #f1f5f9; } h2 { color: #0175D8; border-color: #e2e8f0; } .tree-step { border-color: #e2e8f0; } }
</style></head><body><div class="page">

<div class="logo-bar">
  <div><div class="logo">CLAIM MASTER FILE</div><div class="logo-sub">Expediente Digital Consolidado,Motor de Apertura Inteligente</div></div>
  <div class="folio-box"><div class="folio">${config.validaciones.folioId}</div><div class="date">${fecha} · ${hora}</div><div class="date">v${config.validaciones.pdfMaestro.version} · ${config.validaciones.pdfMaestro.paginas} págs · ${config.validaciones.pdfMaestro.pesoMB} MB</div></div>
</div>

<div class="kpi-row">
  <div class="kpi"><div class="kpi-val">${fmtCurrency(config.monto)}</div><div class="kpi-label">Monto Reclamado</div></div>
  <div class="kpi"><div class="kpi-val">${config.validaciones.completitud}%</div><div class="kpi-label">Completitud</div></div>
  <div class="kpi"><div class="kpi-val">${config.validaciones.ocrConfianza}%</div><div class="kpi-label">Confianza OCR</div></div>
  <div class="kpi"><div class="kpi-val">${config.analitica.automatizacion}%</div><div class="kpi-label">Automatización</div></div>
</div>

<h2>1. Datos del Reclamo</h2>
<div class="section-card">
  <div class="row"><span class="row-label">Tipo de Reclamo</span><span class="row-value">${config.title}</span></div>
  <div class="row"><span class="row-label">Diagnóstico Principal</span><span class="row-value">${config.diagnostico}</span></div>
  <div class="row"><span class="row-label">Código CIE</span><span class="row-value">${g.expedienteMedico.codigoCIE}</span></div>
  <div class="row"><span class="row-label">Proveedor</span><span class="row-value">${config.proveedor}</span></div>
  <div class="row"><span class="row-label">Canal de Ingreso</span><span class="row-value">${config.validaciones.canal}</span></div>
  <div class="row"><span class="row-label">Segmento Asignado</span><span class="row-value">${SEGMENTO_LABELS[config.segmento]}</span></div>
</div>

<h2>2. Documentos Recolectados</h2>
<table>
  <thead><tr><th>Documento</th><th>Tipo</th><th>Estado</th></tr></thead>
  <tbody>${config.validaciones.documentosDetectados.map(d => `<tr><td>${d.nombre}</td><td>${d.tipo}</td><td><span class="badge ${d.estado === 'verificado' ? 'badge-green' : d.estado === 'pendiente' ? 'badge-amber' : 'badge-red'}">${statusIcon(d.estado)} ${d.estado.charAt(0).toUpperCase() + d.estado.slice(1)}</span></td></tr>`).join('')}</tbody>
</table>
${config.validaciones.faltantes.length > 0 ? config.validaciones.faltantes.map(f => `<div class="alert-box alert-warn">⚠️ Faltante: ${f}</div>`).join('') : '<div class="alert-box alert-ok">✅ Todos los documentos obligatorios presentes</div>'}

<h2>3. Transcripción IA,Datos Extraídos</h2>
<table>
  <thead><tr><th>Campo</th><th>Valor Extraído</th><th>Confianza</th></tr></thead>
  <tbody>${config.validaciones.transcripcion.map(t => `<tr><td>${t.campo}</td><td style="font-weight:600;color:#e2e8f0">${t.valor}</td><td style="color:${confColor(t.confianza)};font-weight:700">${t.confianza}%</td></tr>`).join('')}</tbody>
</table>

<h2>4. Validación de Póliza y Coberturas</h2>
<div class="section-card">
  <div class="row"><span class="row-label">Póliza</span><span class="row-value">${e.poliza.producto}</span></div>
  <div class="row"><span class="row-label">Tipo</span><span class="row-value">${e.poliza.tipo}</span></div>
  <div class="row"><span class="row-label">Vigente</span><span class="row-value" style="color:${e.poliza.vigente ? '#22c55e' : '#ef4444'}">${e.poliza.vigente ? 'Sí' : 'No'}</span></div>
  <div class="row"><span class="row-label">Pagada</span><span class="row-value" style="color:${e.poliza.pagada ? '#22c55e' : '#ef4444'}">${e.poliza.pagada ? 'Sí' : 'No'}</span></div>
  <div class="row"><span class="row-label">Deducible</span><span class="row-value">${fmtCurrency(e.deducible)}</span></div>
  <div class="row"><span class="row-label">Coaseguro</span><span class="row-value">${e.coaseguro}%</span></div>
</div>

<h3>Coberturas Activas</h3>
<table>
  <thead><tr><th>Cobertura</th><th>Estado</th><th>Límite</th></tr></thead>
  <tbody>${e.coberturas.map(c => `<tr><td>${c.nombre}</td><td><span class="badge ${c.activa ? 'badge-green' : 'badge-red'}">${c.activa ? '✅ Activa' : '❌ Inactiva'}</span></td><td style="font-weight:700">${fmtCurrency(c.limite)}</td></tr>`).join('')}</tbody>
</table>

${e.preexistencias.length > 0 ? `<h3>Análisis de Preexistencias</h3>${e.preexistencias.map(p => `<div class="alert-box ${p.aplica ? 'alert-danger' : 'alert-ok'}"><div><strong>${p.condicion}</strong>,${p.declarada ? 'Declarada' : 'No Declarada'}<br/>${p.justificacion}</div></div>`).join('')}` : ''}

${e.endosos.length > 0 ? `<h3>Endosos Aplicables</h3><table><thead><tr><th>ID</th><th>Endoso</th><th>Impacto</th><th>Aplica</th></tr></thead><tbody>${e.endosos.map(en => `<tr><td style="font-family:monospace;color:#64748b">${en.id}</td><td><strong>${en.nombre}</strong><br/><span style="color:#94a3b8;font-size:11px">${en.descripcion}</span></td><td style="color:#F5A623;font-size:11px">${en.impacto}</td><td><span class="badge ${en.aplica ? 'badge-green' : 'badge-amber'}">${en.aplica ? 'Sí' : 'No'}</span></td></tr>`).join('')}</tbody></table>` : ''}

<h2>5. Motor de Triaje,6 Variables</h2>
<table>
  <thead><tr><th>Variable</th><th>Evaluación</th><th>Nivel</th><th>Peso</th></tr></thead>
  <tbody>
    <tr><td>Perfil Clínico</td><td style="font-size:11px">${t.variables.perfilClinico.valor}</td><td><span class="badge badge-blue">${t.variables.perfilClinico.nivel}</span></td><td style="font-weight:700">${t.variables.perfilClinico.peso}%</td></tr>
    <tr><td>Severidad Económica</td><td style="font-size:11px">${t.variables.severidadEconomica.valor}</td><td><span class="badge badge-blue">${t.variables.severidadEconomica.nivel}</span></td><td style="font-weight:700">${t.variables.severidadEconomica.peso}%</td></tr>
    <tr><td>Fase del Evento</td><td style="font-size:11px">${t.variables.faseEvento.valor}</td><td><span class="badge badge-blue">${t.variables.faseEvento.nivel}</span></td><td style="font-weight:700">${t.variables.faseEvento.peso}%</td></tr>
    <tr><td>Perfil del Proveedor</td><td style="font-size:11px">${t.variables.perfilProveedor.valor}</td><td><span class="badge badge-blue">${t.variables.perfilProveedor.nivel}</span></td><td style="font-weight:700">${t.variables.perfilProveedor.peso}%</td></tr>
    <tr><td>Condiciones Contractuales</td><td style="font-size:11px">${t.variables.condicionesContractuales.valor}</td><td><span class="badge badge-blue">${t.variables.condicionesContractuales.nivel}</span></td><td style="font-weight:700">${t.variables.condicionesContractuales.peso}%</td></tr>
    <tr><td>Alertas de Fraude</td><td style="font-size:11px">${t.variables.alertasFraude.valor}</td><td><span class="badge ${t.variables.alertasFraude.nivel === 'Alta' ? 'badge-red' : t.variables.alertasFraude.nivel === 'Media' ? 'badge-amber' : 'badge-green'}">${t.variables.alertasFraude.nivel}</span></td><td style="font-weight:700">${t.variables.alertasFraude.peso}%</td></tr>
  </tbody>
</table>

<h3>Árbol de Decisión</h3>
${t.arbolDecision.map(step => `<div class="tree-step ${step.startsWith('RESULTADO') ? 'tree-result' : ''}">${step}</div>`).join('')}

<h2>6. Expediente Médico,Pertinencia</h2>
<div class="section-card">
  <div class="row"><span class="row-label">Diagnóstico Principal</span><span class="row-value">${g.expedienteMedico.diagnosticoPrincipal}</span></div>
  <div class="row"><span class="row-label">Código CIE</span><span class="row-value" style="font-family:monospace">${g.expedienteMedico.codigoCIE}</span></div>
</div>
<h3>Historial Relevante</h3>
${g.expedienteMedico.historialRelevante.map(h => `<div style="padding:4px 0;font-size:11px;color:#94a3b8">• ${h}</div>`).join('')}
<h3>Observaciones y Alertas</h3>
${g.expedienteMedico.observaciones.map(o => `<div class="alert-box ${o.startsWith('ATENCIÓN') || o.startsWith('ALERTA') ? 'alert-warn' : 'alert-ok'}">${o}</div>`).join('')}

${g.programacionCirugia ? `
<h2>7. Programación de Cirugía</h2>
<div class="section-card">
  <div class="row"><span class="row-label">Procedimiento</span><span class="row-value">${g.programacionCirugia.procedimiento}</span></div>
  <div class="row"><span class="row-label">Fecha</span><span class="row-value">${g.programacionCirugia.fecha}</span></div>
  <div class="row"><span class="row-label">Cirujano</span><span class="row-value">${g.programacionCirugia.cirujano}</span></div>
  <div class="row"><span class="row-label">Duración Estimada</span><span class="row-value">${g.programacionCirugia.duracionEstimada}</span></div>
  <div class="row"><span class="row-label">Pertinencia</span><span class="row-value"><span class="badge ${g.programacionCirugia.pertinente ? 'badge-green' : 'badge-red'}">${g.programacionCirugia.pertinente ? '✅ Pertinente' : '❌ Cuestionable'}</span></span></div>
</div>
<h3>Argumentos de Pertinencia</h3>
${g.programacionCirugia.argumentosPertinencia.map(a => `<div style="padding:4px 0 4px 12px;font-size:11px;color:#94a3b8;border-left:2px solid #0175D8">→ ${a}</div>`).join('')}
` : ''}

${t.caseManagement.palancas ? `<h2>${g.programacionCirugia ? '8' : '7'}. Palancas de Optimización</h2>
${t.caseManagement.palancas.medicamentosBiocompatibles.aplica ? `
<div class="section-card" style="border-left:3px solid #0175D8">
  <h3 style="margin-top:0">Medicamentos Bio-compatibles</h3>
  <div class="row"><span class="row-label">Actual</span><span class="row-value">${t.caseManagement.palancas.medicamentosBiocompatibles.actual}</span></div>
  <div class="row"><span class="row-label">Alternativa</span><span class="row-value" style="color:#22c55e">${t.caseManagement.palancas.medicamentosBiocompatibles.alternativa}</span></div>
  <div class="row"><span class="row-label">Ahorro Potencial</span><span class="row-value" style="color:#22c55e;font-size:14px">${t.caseManagement.palancas.medicamentosBiocompatibles.ahorroPotencial}</span></div>
</div>` : ''}
<div class="section-card" style="border-left:3px solid ${t.caseManagement.palancas.honorariosMedicos.alerta ? '#ef4444' : '#1e293b'}">
  <h3 style="margin-top:0">Honorarios Médicos vs Distribución Histórica ${t.caseManagement.palancas.honorariosMedicos.alerta ? '<span class="badge badge-red">ALERTA</span>' : ''}</h3>
  <div class="row"><span class="row-label">Monto Actual</span><span class="row-value">${t.caseManagement.palancas.honorariosMedicos.montoActual}</span></div>
  <div class="row"><span class="row-label">Promedio Histórico</span><span class="row-value">${t.caseManagement.palancas.honorariosMedicos.promedioHistorico}</span></div>
  <div class="row"><span class="row-label">Desviación</span><span class="row-value" style="color:${t.caseManagement.palancas.honorariosMedicos.alerta ? '#ef4444' : '#e2e8f0'};font-size:14px;font-weight:800">${t.caseManagement.palancas.honorariosMedicos.desviacion}</span></div>
</div>
${t.caseManagement.palancas.duracionEstancia.diasProgramados > 0 ? `
<div class="section-card" style="border-left:3px solid ${t.caseManagement.palancas.duracionEstancia.alerta ? '#ef4444' : '#1e293b'}">
  <h3 style="margin-top:0">Duración de Estancia vs Distribución Histórica ${t.caseManagement.palancas.duracionEstancia.alerta ? '<span class="badge badge-red">ALERTA</span>' : ''}</h3>
  <div class="row"><span class="row-label">Días Programados</span><span class="row-value">${t.caseManagement.palancas.duracionEstancia.diasProgramados} días</span></div>
  <div class="row"><span class="row-label">Promedio Histórico</span><span class="row-value">${t.caseManagement.palancas.duracionEstancia.promedioHistorico} días</span></div>
  <div class="row"><span class="row-label">Desviación</span><span class="row-value" style="color:${t.caseManagement.palancas.duracionEstancia.alerta ? '#ef4444' : '#22c55e'};font-size:14px;font-weight:800">${t.caseManagement.palancas.duracionEstancia.desviacion}</span></div>
</div>` : ''}` : ''}

<h2>${g.programacionCirugia ? (t.caseManagement.palancas ? '9' : '8') : (t.caseManagement.palancas ? '8' : '7')}. Analítica del Reclamo</h2>
<div class="kpi-row">
  <div class="kpi"><div class="kpi-val">${config.analitica.automatizacion}%</div><div class="kpi-label">Automatización</div></div>
  <div class="kpi"><div class="kpi-val">${config.analitica.tiempoHumano}</div><div class="kpi-label">Intervención Humana</div></div>
  <div class="kpi"><div class="kpi-val" style="color:${config.analitica.riesgoResidual > 50 ? '#ef4444' : config.analitica.riesgoResidual > 20 ? '#F5A623' : '#22c55e'}">${config.analitica.riesgoResidual}%</div><div class="kpi-label">Riesgo Residual</div></div>
  <div class="kpi"><div class="kpi-val" style="color:#22c55e">${fmtCurrency(config.analitica.ahorro)}</div><div class="kpi-label">Ahorro Generado</div></div>
</div>

<h2>${g.programacionCirugia ? (t.caseManagement.palancas ? '10' : '9') : (t.caseManagement.palancas ? '9' : '8')}. Dictamen de Elegibilidad</h2>
<div class="alert-box ${e.alertaHumana ? 'alert-warn' : 'alert-ok'}" style="font-size:13px;font-weight:700">
  ${e.dictamenPreliminar}
</div>

<div class="footer">
  <div>CLAIM MASTER FILE,${config.validaciones.folioId},v${config.validaciones.pdfMaestro.version}</div>
  <div>Generado por Motor de Apertura Inteligente · ${fecha} ${hora}</div>
  <div style="margin-top:4px;color:#334155">Documento confidencial,Uso exclusivo para dictaminación de siniestros</div>
</div>

<button class="print-btn" onclick="window.print()">🖨️ Imprimir / Guardar como PDF</button>

</div></body></html>`;

    const w = window.open('', '_blank', 'width=900,height=1000,scrollbars=yes');
    if (w) {
      w.document.write(html);
      w.document.close();
    }
  }, []);

  // ---------------------------------------------------------------------------
  // StageAgentGraph,inline component (banking AgentProcessFlow pattern)
  // ---------------------------------------------------------------------------

  // StageAgentGraph as a plain render function (no hooks,avoids inline component remount issues)
  const renderStageAgentGraph = (flowNodes: StageAgentFlowNode[], flowConns: StageAgentFlowConnection[], isActive: boolean) => {
    if (!isActive || flowNodes.length === 0) return null;

    const NODE_DELAY = 2.0;
    const DETAIL_DELAY = 0.5;

    const getNodeDelay = (nodeIdx: number): number => {
      let delay = 0;
      for (let i = 0; i < nodeIdx; i++) {
        delay += NODE_DELAY + (flowNodes[i].details?.length || 0) * DETAIL_DELAY;
      }
      return delay;
    };

    const getTotalDuration = (): number => {
      let d = 0;
      flowNodes.forEach((n) => {
        d += NODE_DELAY + (n.details?.length || 0) * DETAIL_DELAY;
      });
      return d;
    };

    const orderedNodeIds = flowNodes.map((n) => n.id);

    const nodeMap = new Map<string, StageAgentFlowNode>();
    flowNodes.forEach((n) => nodeMap.set(n.id, n));

    const connectionBetween = (fromId: string, toId: string) =>
      flowConns.find((c) => c.from === fromId && c.to === toId);

    const FLOW_TYPE_LABELS: Record<AgentFlowNodeType, string> = {
      'data-source': 'FUENTE DE DATOS',
      model: 'MODELO ML',
      agent: 'AGENTE',
      action: 'ACCION',
      output: 'RESULTADO',
    };

    const FLOW_TYPE_COLORS: Record<AgentFlowNodeType, string> = {
      'data-source': '#3b82f6',
      model: '#8b5cf6',
      agent: '#0175D8',
      action: '#F5A623',
      output: '#22c55e',
    };

    const flowNodeStyleClass: Record<AgentFlowNodeType, string> = {
      'data-source': styles.afNodeDataSource,
      model: styles.afNodeModel,
      agent: styles.afNodeAgent,
      action: styles.afNodeAction,
      output: styles.afNodeOutput,
    };

    const flowBadgeStyleClass: Record<AgentFlowNodeType, string> = {
      'data-source': styles.afBadgeDataSource,
      model: styles.afBadgeModel,
      agent: styles.afBadgeAgent,
      action: styles.afBadgeAction,
      output: styles.afBadgeOutput,
    };

    const flowDotStyleClass: Record<AgentFlowNodeType, string> = {
      'data-source': styles.afDotDataSource,
      model: styles.afDotModel,
      agent: styles.afDotAgent,
      action: styles.afDotAction,
      output: styles.afDotOutput,
    };

    const flowIcon = (type: AgentFlowNodeType) => {
      switch (type) {
        case 'data-source': return <Database size={12} />;
        case 'model': return <Cpu size={12} />;
        case 'agent': return <Bot size={12} />;
        case 'action': return <Zap size={12} />;
        case 'output': return <CheckCircle size={12} />;
        default: return <Bot size={12} />;
      }
    };

    const totalDur = getTotalDuration();

    return (
      <div className={styles.afContainer}>
        <div className={styles.afHeader}>
          <span className={styles.afTitle}>
            <Cpu size={14} /> Flujo de Razonamiento del Agente
          </span>
          <motion.span
            className={styles.afCompleteBadge}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: totalDur + 0.5, duration: 0.4 }}
          >
            <CheckCircle size={12} /> Completo
          </motion.span>
        </div>

        <div className={styles.afFlowArea}>
          {orderedNodeIds.map((id, index) => {
            const node = nodeMap.get(id);
            if (!node) return null;

            const nodeDelay = getNodeDelay(index);
            const detailCount = node.details?.length || 0;
            const nodeCompleteDelay = nodeDelay + NODE_DELAY + detailCount * DETAIL_DELAY;
            const nextId = index < orderedNodeIds.length - 1 ? orderedNodeIds[index + 1] : null;
            const conn = nextId ? connectionBetween(id, nextId) : null;

            return (
              <div className={styles.afNodeGroup} key={id}>
                <motion.div
                  className={[
                    styles.afNode,
                    flowNodeStyleClass[node.type],
                    styles.afNodeActive,
                  ].filter(Boolean).join(' ')}
                  initial={{ opacity: 0.08, scale: 0.92, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: nodeDelay }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className={`${styles.afTypeBadge} ${flowBadgeStyleClass[node.type]}`}>
                      <span className={styles.afBadgeIcon}>{flowIcon(node.type)}</span>
                      {FLOW_TYPE_LABELS[node.type]}
                    </div>
                    {/* Green check appears after all details are done */}
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: nodeCompleteDelay }}
                      style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <CheckCircle size={14} style={{ color: '#22c55e' }} />
                    </motion.div>
                  </div>
                  <div className={styles.afNodeLabel}>{node.label}</div>
                  <div className={styles.afNodeDesc}>{node.description}</div>

                  {/* Details appear one by one with green checks */}
                  {node.details && node.details.length > 0 && (
                    <ul className={styles.afDetailsList} style={{ marginTop: 8 }}>
                      {node.details.map((detail, dIdx) => {
                        const detailDelay = nodeDelay + NODE_DELAY * 0.5 + dIdx * DETAIL_DELAY;
                        return (
                          <motion.li
                            key={dIdx}
                            className={styles.afDetailItem}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.35, delay: detailDelay }}
                            style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 0 }}
                          >
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: detailDelay + 0.2, type: 'spring', stiffness: 400 }}
                            >
                              <CheckCircle size={11} style={{ color: '#22c55e', flexShrink: 0 }} />
                            </motion.span>
                            <span>{detail}</span>
                          </motion.li>
                        );
                      })}
                    </ul>
                  )}
                </motion.div>

                {conn && (
                  <motion.div
                    initial={{ opacity: 0.08 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: nodeCompleteDelay - 0.2 }}
                    className={[
                      styles.afConnector,
                      styles.afConnectorActive,
                    ].filter(Boolean).join(' ')}
                  >
                    <div className={styles.afConnectorLine}>
                      <div className={styles.afConnectorArrow} />
                    </div>
                    {conn.label && (
                      <div className={styles.afConnectorLabel}>{conn.label}</div>
                    )}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------

  const renderModeBadge = (mode: ProcessMode) => (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 10px',
        fontSize: '0.7rem',
        fontWeight: 700,
        borderRadius: 20,
        background: `${MODE_COLORS[mode]}18`,
        color: MODE_COLORS[mode],
        border: `1px solid ${MODE_COLORS[mode]}33`,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.04em',
      }}
    >
      {MODE_LABELS[mode]}
    </span>
  );

  const renderAgentOutputs = (stageId: StageId) => {
    if (!claimConfig) return null;
    const stageConfig = claimConfig.stages.find((s) => s.id === stageId);
    if (!stageConfig || stageConfig.agents.length === 0) return null;
    const currentAgents = stageConfig.agents;

    // Calculate delay: wait for the graph animation to finish first
    // Graph nodes appear at index * 0.5s each, so total = nodeCount * 0.5s + 0.6s buffer
    const flow = getAgentFlow(stageId);
    // Calculate delay matching graph animation: 2s per node + 0.5s per detail
    const totalDetails = flow ? flow.nodes.reduce((s, n) => s + (n.details?.length || 0), 0) : 0;
    const graphDelay = flow && flow.nodes.length > 0 ? flow.nodes.length * 2.0 + totalDetails * 0.5 + 1.0 : 0.3;

    return (
      <motion.div
        className={styles.agentsSection}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut', delay: graphDelay }}
      >
        <h4 className={styles.agentsSectionTitle}><Bot size={16} /> Outputs de Agentes</h4>
        {currentAgents.map((agent, i) => (
          <motion.div
            key={i}
            className={styles.agentOutputCard}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: graphDelay + i * 0.2 }}
          >
            <div className={styles.agentOutputHeader}>
              <Bot size={16} />
              <div>
                <span className={styles.agentOutputName}>{agent.agentName}</span>
                <span className={styles.agentOutputRole}>{agent.agentRole}</span>
              </div>
              <span className={styles.agentOutputStatus}>
                <CheckCircle size={12} /> Completado
              </span>
            </div>
            <div className={styles.agentOutputBody}>
              {agent.outputs.map((out, j) => (
                <div key={j} className={styles.agentOutputRow}>
                  <span className={styles.agentOutputLabel}>{out.label}</span>
                  <span className={styles.agentOutputValue}>{out.value}</span>
                </div>
              ))}
            </div>
            <div className={styles.agentOutputFooter}>
              <span>Confianza: {agent.confidence}%</span>
              <span>Duración: {agent.duration}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    );
  };

  const renderAgentGraph = (stageId: StageId) => {
    const flow = getAgentFlow(stageId);
    if (!flow || flow.nodes.length === 0) return null;
    const stageStatus = stageStatuses[stageId];
    const isFlowActive = stageStatus === 'active' || stageStatus === 'complete';
    if (!isFlowActive) return null;
    try {
      return renderStageAgentGraph(flow.nodes, flow.connections, isFlowActive);
    } catch {
      return null;
    }
  };

  const renderFraudBanner = (score: number, stage: string) => (
    <div style={{
      marginTop: 16, padding: '12px 16px', borderRadius: 'var(--radius-md)',
      display: 'flex', alignItems: 'center', gap: 10,
      background: score > 30 ? 'rgba(239,68,68,0.06)' : 'rgba(34,197,94,0.06)',
      border: `1px solid ${score > 30 ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)'}`,
    }}>
      <Shield size={14} style={{ color: score > 30 ? '#ef4444' : '#22c55e' }} />
      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: score > 30 ? '#ef4444' : '#22c55e' }}>
        {score > 30
          ? `Alerta de fraude detectada durante ${stage} (score: ${score}%)`
          : `No se han detectado alertas automáticas de fraude durante ${stage} (score: ${score}%)`}
      </span>
    </div>
  );

  const renderStageDetailContent = (stageId: StageId) => {
    if (!claimConfig) return null;

    switch (stageId) {
      case 'validaciones': {
        const data = claimConfig.validaciones;
        return (
          <div>
            {renderAgentGraph(stageId)}
            {renderAgentOutputs(stageId)}

            {/* Step 1: Documentos Detectados */}
            <div className={styles.aperturaStep}>
              <h4 className={styles.aperturaStepTitle}>
                <Search size={14} /> Paso 1: Recolección Documental
              </h4>
              <div className={styles.docGrid}>
                {data.documentosDetectados.map((doc, i) => (
                  <div key={i} className={styles.docItem}>
                    <FileText size={14} style={{ color: doc.estado === 'verificado' ? '#22c55e' : doc.estado === 'pendiente' ? '#F5A623' : '#ef4444' }} />
                    <div className={styles.docInfo}>
                      <span className={styles.docName}>{doc.nombre}</span>
                      <span className={styles.docTipo}>{doc.tipo}</span>
                    </div>
                    <span className={styles.docEstado} style={{
                      color: doc.estado === 'verificado' ? '#22c55e' : doc.estado === 'pendiente' ? '#F5A623' : '#ef4444',
                      background: doc.estado === 'verificado' ? 'rgba(34,197,94,0.12)' : doc.estado === 'pendiente' ? 'rgba(245,166,35,0.12)' : 'rgba(239,68,68,0.12)',
                    }}>
                      {doc.estado === 'verificado' ? 'Verificado' : doc.estado === 'pendiente' ? 'Pendiente' : 'Faltante'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Transcripcion */}
            <div className={styles.aperturaStep}>
              <h4 className={styles.aperturaStepTitle}>
                <Eye size={14} /> Paso 2: Transcripción y Extracción IA
              </h4>
              <div className={styles.transcripcionGrid}>
                {data.transcripcion.map((t, i) => (
                  <div key={i} className={styles.transcripcionRow}>
                    <span className={styles.transcripcionCampo}>{t.campo}</span>
                    <span className={styles.transcripcionValor}>{t.valor}</span>
                    <span className={styles.transcripcionConfianza} style={{ color: t.confianza > 90 ? '#22c55e' : t.confianza > 80 ? '#F5A623' : '#ef4444' }}>
                      {t.confianza}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: PDF Maestro */}
            <div className={styles.aperturaStep}>
              <h4 className={styles.aperturaStepTitle}>
                <FileText size={14} /> Paso 3: PDF Consolidado del Reclamante
              </h4>
              <div className={styles.pdfMaestroCard}>
                <div className={styles.pdfMaestroIcon}><FileText size={24} /></div>
                <div className={styles.pdfMaestroInfo}>
                  <span className={styles.pdfMaestroTitle}>Claim Master File,v{data.pdfMaestro.version}</span>
                  <span className={styles.pdfMaestroMeta}>{data.pdfMaestro.paginas} paginas · {data.pdfMaestro.pesoMB} MB</span>
                </div>
                <div className={styles.pdfMaestroScore}>
                  <span style={{ color: data.completitud > 90 ? '#22c55e' : data.completitud > 70 ? '#F5A623' : '#ef4444' }}>
                    {data.completitud}% completo
                  </span>
                </div>
              </div>
            </div>

            {/* Step 4: Faltantes */}
            {data.faltantes.length > 0 && (
              <div className={styles.aperturaStep}>
                <h4 className={styles.aperturaStepTitle} style={{ color: '#F5A623' }}>
                  <AlertTriangle size={14} /> Documentacion Faltante
                </h4>
                <div className={styles.faltantesList}>
                  {data.faltantes.map((f, i) => (
                    <div key={i} className={styles.faltanteItem}>
                      <AlertTriangle size={12} style={{ color: '#F5A623' }} />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.faltanteNotice}>
                  Pendiente de carga manual por dictaminador
                </div>
              </div>
            )}

            {/* Fraud banner */}
            {renderFraudBanner(data.fraudeScoreInicial, 'validaciones iniciales')}

            {/* Download PDF button */}
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button className={styles.pdfDownloadButton} onClick={() => downloadMasterPDF(claimConfig)}>
                <FileText size={16} /> Descargar Resumen de Validaciones
              </button>
            </div>
          </div>
        );
      }

      case 'elegibilidad': {
        const data = claimConfig.elegibilidad;
        const requiresHumanApproval = data.alertaHumana;
        return (
          <div>
            {renderAgentGraph(stageId)}
            {renderAgentOutputs(stageId)}

            {/* Resumen de Validaciones Previas */}
            <div style={{ padding: '12px 16px', background: 'rgba(1,117,216,0.04)', border: '1px solid rgba(1,117,216,0.12)', borderRadius: 'var(--radius-md)', marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' as const }}>
              <div><span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' as const }}>Folio</span><br/><span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{claimConfig.validaciones.folioId}</span></div>
              <div><span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' as const }}>Completitud</span><br/><span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{claimConfig.validaciones.completitud}%</span></div>
              <div><span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase' as const }}>Documentos</span><br/><span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{claimConfig.validaciones.documentosDetectados.length}</span></div>
            </div>

            {/* BLOQUE A: Validación de Póliza */}
            <div className={styles.elegibilidadBloque}>
              <h4 className={styles.elegibilidadBloqueTitle}>
                <Shield size={14} /> Validación de Póliza y Coberturas
              </h4>
              <div className={styles.polizaStatusGrid}>
                <div className={styles.polizaStatusItem}>
                  <span className={styles.polizaStatusLabel}>Tipo</span>
                  <span className={styles.polizaStatusValue}>{data.poliza.tipo}</span>
                </div>
                <div className={styles.polizaStatusItem}>
                  <span className={styles.polizaStatusLabel}>Producto</span>
                  <span className={styles.polizaStatusValue}>{data.poliza.producto}</span>
                </div>
                <div className={styles.polizaStatusItem}>
                  <span className={styles.polizaStatusLabel}>Vigente</span>
                  <span style={{ color: data.poliza.vigente ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>
                    {data.poliza.vigente ? 'Sí' : 'No'}
                  </span>
                </div>
                <div className={styles.polizaStatusItem}>
                  <span className={styles.polizaStatusLabel}>Pagada</span>
                  <span style={{ color: data.poliza.pagada ? '#22c55e' : '#ef4444', fontWeight: 700, fontSize: '0.85rem' }}>
                    {data.poliza.pagada ? 'Sí' : 'No'}
                  </span>
                </div>
              </div>
              <div className={styles.coberturasSection}>
                <span className={styles.coberturasTitle}>Coberturas Activas</span>
                {data.coberturas.map((c, i) => (
                  <div key={i} className={styles.coberturaRow}>
                    <CheckCircle size={12} style={{ color: c.activa ? '#22c55e' : '#ef4444' }} />
                    <span className={styles.coberturaName}>{c.nombre}</span>
                    <span className={styles.coberturaLimite}>{fmtCurrency(c.limite)}</span>
                  </div>
                ))}
              </div>
              {data.preexistencias.length > 0 && (
                <div className={styles.preexistenciasSection}>
                  <span className={styles.preexistenciasTitle}>Análisis de Preexistencias</span>
                  {data.preexistencias.map((p, i) => (
                    <div key={i} className={styles.preexistenciaCard}>
                      <div className={styles.preexistenciaHeader}>
                        <span className={styles.preexistenciaCondicion}>{p.condicion}</span>
                        <span className={styles.preexistenciaBadge} style={{
                          color: p.aplica ? '#ef4444' : '#22c55e',
                          background: p.aplica ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                        }}>
                          {p.aplica ? 'Exclusión Activa' : 'Sin Exclusión'}
                        </span>
                      </div>
                      <p className={styles.preexistenciaJustificacion}>{p.justificacion}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* BLOQUE B: Endosos */}
            {data.endosos.length > 0 && (
              <div className={styles.elegibilidadBloque}>
                <h4 className={styles.elegibilidadBloqueTitle}>
                  <FileText size={14} /> Catálogo de Endosos Aplicables
                </h4>
                <div className={styles.endososList}>
                  {data.endosos.map((e, i) => (
                    <div key={i} className={styles.endosoCard} style={{ borderLeftColor: e.aplica ? '#0175D8' : 'var(--border-subtle)' }}>
                      <div className={styles.endosoHeader}>
                        <span className={styles.endosoId}>{e.id}</span>
                        <span className={styles.endosoNombre}>{e.nombre}</span>
                        <span className={styles.endosoAplica} style={{
                          color: e.aplica ? '#22c55e' : '#94a3b8',
                          background: e.aplica ? 'rgba(34,197,94,0.12)' : 'rgba(148,163,184,0.08)',
                        }}>
                          {e.aplica ? 'Aplica' : 'No Aplica'}
                        </span>
                      </div>
                      <p className={styles.endosoDescripcion}>{e.descripcion}</p>
                      <div className={styles.endosoImpacto}>
                        <Zap size={12} style={{ color: '#F5A623' }} />
                        <span>Impacto: {e.impacto}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Receta médica pendiente */}
            {data.recetaMedicaPendiente && (
              <div style={{ padding: '14px 16px', background: 'rgba(245,166,35,0.06)', border: '1px solid rgba(245,166,35,0.15)', borderRadius: 'var(--radius-md)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={14} style={{ color: '#F5A623' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#F5A623' }}>El dictaminador debe verificar la receta médica adjunta antes de emitir el dictamen</span>
              </div>
            )}

            {/* DICTAMEN FINAL */}
            <div className={styles.dictamenPreliminar}>
              <div className={styles.dictamenPreliminarHeader}>
                <CheckCircle size={16} style={{ color: requiresHumanApproval ? '#F5A623' : '#22c55e' }} />
                <span>Dictamen de Elegibilidad</span>
              </div>
              <p className={styles.dictamenPreliminarText}>{data.dictamenPreliminar}</p>
              <div className={styles.dictamenPreliminarMeta}>
                <span>Deducible: {fmtCurrency(data.deducible)}</span>
                <span>Coaseguro: {data.coaseguro}%</span>
              </div>

              {/* Human approval flow */}
              {requiresHumanApproval ? (
                <div>
                  {dictamenAprobado === null ? (
                    <div className={styles.alertaBanner} style={{ marginTop: 12 }}>
                      <AlertTriangle size={14} />
                      <span>Este dictamen requiere supervisión y aprobación humana</span>
                    </div>
                  ) : dictamenAprobado ? (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius-md)' }}>
                      <CheckCircle size={14} style={{ color: '#22c55e' }} />
                      <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.82rem' }}>Dictamen aprobado por el dictaminador</span>
                    </div>
                  ) : (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)' }}>
                      <AlertTriangle size={14} style={{ color: '#ef4444' }} />
                      <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.82rem' }}>Dictamen rechazado,derivado a revisión</span>
                    </div>
                  )}
                  {dictamenAprobado === null && (
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                      <button
                        className={styles.pdfDownloadButton}
                        onClick={() => setDictamenAprobado(true)}
                        style={{ background: '#22c55e' }}
                      >
                        <CheckCircle size={16} /> Aprobar Dictamen
                      </button>
                      <button
                        className={styles.pdfDownloadButton}
                        onClick={() => setDictamenAprobado(false)}
                        style={{ background: '#ef4444' }}
                      >
                        <AlertTriangle size={16} /> Rechazar Dictamen
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius-md)' }}>
                  <Zap size={14} style={{ color: '#22c55e' }} />
                  <span style={{ color: '#22c55e', fontWeight: 600, fontSize: '0.82rem' }}>Dictamen automático aprobado,sin intervención humana</span>
                </div>
              )}
            </div>

            {/* Fraud banner */}
            {renderFraudBanner(claimConfig.validaciones.fraudeScoreInicial, 'la evaluación de elegibilidad')}

            {/* Download button */}
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button className={styles.pdfDownloadButton} onClick={() => downloadMasterPDF(claimConfig)}>
                <FileText size={16} /> Descargar Nota de Elegibilidad
              </button>
            </div>
          </div>
        );
      }

      case 'triaje': {
        const data = claimConfig.triaje;
        const allSegmentos: SegmentoGestion[] = ['case-management', 'proactiva', 'reactiva', 'detallado', 'automatica'];
        const SEGMENTO_DESCRIPTIONS: Record<SegmentoGestion, string> = {
          'case-management': 'Supervisión hospitalaria dedicada con gestor de caso',
          'proactiva': 'Monitoreo continuo y contención anticipada de costos',
          'reactiva': 'Gestión estándar con validación humana del dictaminador',
          'detallado': 'Análisis profundo de reembolsos complejos o sospechosos',
          'automatica': 'Dictamen automático sin intervención humana',
        };
        const varEntries = [
          { key: 'perfilClinico', label: 'Perfil Clínico', icon: <Activity size={16} />, shortLabel: 'Clínico' },
          { key: 'severidadEconomica', label: 'Severidad Económica', icon: <DollarSign size={16} />, shortLabel: 'Económica' },
          { key: 'faseEvento', label: 'Fase del Evento', icon: <Clock size={16} />, shortLabel: 'Fase' },
          { key: 'perfilProveedor', label: 'Perfil del Proveedor', icon: <Building2 size={16} />, shortLabel: 'Proveedor' },
          { key: 'condicionesContractuales', label: 'Condiciones Contractuales', icon: <FileText size={16} />, shortLabel: 'Contrato' },
          { key: 'alertasFraude', label: 'Alertas de Fraude', icon: <AlertTriangle size={16} />, shortLabel: 'Fraude' },
        ] as const;

        const nivelColor = (nivel: string): string => {
          if (['Crítico', 'Muy Alta', 'Alta', 'Fuera de Red'].includes(nivel)) return '#ef4444';
          if (['Alto', 'Media', 'Agudo', 'Post-Agudo', 'Nivel 3'].includes(nivel)) return '#F5A623';
          if (['Medio', 'Mejorado', 'Nivel 2', 'Crónico'].includes(nivel)) return '#0175D8';
          return '#22c55e';
        };

        const nivelNumeric = (nivel: string): number => {
          if (['Crítico', 'Muy Alta', 'Alta', 'Fuera de Red'].includes(nivel)) return 4;
          if (['Alto', 'Media', 'Agudo', 'Post-Agudo', 'Nivel 3'].includes(nivel)) return 3;
          if (['Medio', 'Mejorado', 'Nivel 2', 'Crónico'].includes(nivel)) return 2;
          return 1;
        };

        // Compute aggregate score from all variables
        const totalPeso = Object.values(data.variables).reduce((s, v) => s + v.peso, 0);
        const maxPeso = 600;
        const agregadoPct = Math.round((totalPeso / maxPeso) * 100);

        return (
          <div>
            {renderAgentGraph(stageId)}
            {renderAgentOutputs(stageId)}

            {/* Score Summary Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, padding: '16px 20px', background: 'rgba(1,117,216,0.06)', border: '1px solid rgba(1,117,216,0.15)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0175D8', lineHeight: 1 }}>{data.scoreTriaje}%</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>Score Triaje</div>
              </div>
              <div style={{ width: 1, height: 40, background: 'var(--border-subtle)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>Motor de Segmentación Predictivo,6 Variables</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Índice de complejidad agregado: {agregadoPct}% · Confianza del modelo: {data.scoreTriaje}%</div>
              </div>
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: SEGMENTO_COLORS[data.rutaActiva] }}>{SEGMENTO_LABELS[data.rutaActiva].split(' ').slice(-1)[0]}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 4 }}>Segmento</div>
              </div>
            </div>

            {/* 6 Variables,Gauge-style Dashboard */}
            <div className={styles.triajeVariablesReport}>
              <h4 className={styles.triajeVariablesTitle}>
                <Cpu size={14} /> Evaluación de 6 Variables de Segmentación
              </h4>
              <div className={styles.triajeVariablesGrid}>
                {varEntries.map(({ key, label, icon }) => {
                  const v = data.variables[key];
                  const color = nivelColor(v.nivel);
                  const numLevel = nivelNumeric(v.nivel);
                  return (
                    <div key={key} className={styles.triajeVarCard} style={{ borderTop: `3px solid ${color}` }}>
                      <div className={styles.triajeVarHeader}>
                        <span style={{ color }}>{icon}</span>
                        <span className={styles.triajeVarLabel}>{label}</span>
                      </div>
                      {/* Gauge: 4 dots indicating severity level */}
                      <div style={{ display: 'flex', gap: 4, margin: '8px 0' }}>
                        {[1, 2, 3, 4].map(n => (
                          <div key={n} style={{
                            flex: 1, height: 6, borderRadius: 3,
                            background: n <= numLevel ? color : 'rgba(148,163,184,0.12)',
                            transition: 'background 0.4s',
                          }} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span className={styles.triajeVarNivel} style={{ color, background: `${color}14`, border: `1px solid ${color}33` }}>
                          {v.nivel}
                        </span>
                        <span style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color }}>{v.peso}%</span>
                      </div>
                      <p className={styles.triajeVarValor}>{v.valor}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visual Decision Tree,Branching structure */}
            <div className={styles.triajeDecisionTree} style={{ position: 'relative' }}>
              <h4 className={styles.triajeDecisionTreeTitle}>
                <BarChart3 size={14} /> Árbol de Decisión: Razonamiento del Motor
              </h4>

              {/* Tree: Root node */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {/* Input node */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: 'rgba(1,117,216,0.08)', border: '1px solid rgba(1,117,216,0.2)', borderRadius: 'var(--radius-md)', marginBottom: 2 }}>
                  <Cpu size={16} style={{ color: '#0175D8' }} />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0175D8' }}>ENTRADA: 6 Variables del Siniestro</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Score: {data.scoreTriaje}%</span>
                </div>

                {/* Vertical connector */}
                <div style={{ width: 2, height: 16, background: 'rgba(1,117,216,0.3)', marginLeft: 24 }} />

                {/* Decision steps as tree nodes */}
                {data.arbolDecision.map((step, i) => {
                  const isResult = step.startsWith('RESULTADO:');
                  const stepColor = isResult ? SEGMENTO_COLORS[data.rutaActiva] : '#0175D8';
                  return (
                    <div key={i}>
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: isResult ? '14px 16px' : '10px 16px',
                        background: isResult ? `${SEGMENTO_COLORS[data.rutaActiva]}0c` : 'rgba(10,14,26,0.4)',
                        border: `1px solid ${isResult ? `${SEGMENTO_COLORS[data.rutaActiva]}33` : 'var(--border-subtle)'}`,
                        borderLeft: `3px solid ${stepColor}`,
                        borderRadius: 'var(--radius-md)',
                        marginLeft: isResult ? 0 : 16,
                      }}>
                        <div style={{
                          width: 24, height: 24, minWidth: 24, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isResult ? SEGMENTO_COLORS[data.rutaActiva] : `${stepColor}22`,
                          color: isResult ? '#fff' : stepColor,
                          fontSize: '0.65rem', fontWeight: 800,
                        }}>
                          {isResult ? <CheckCircle size={12} /> : i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          {isResult ? (
                            <>
                              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: SEGMENTO_COLORS[data.rutaActiva], fontWeight: 700, marginBottom: 4 }}>Resultado del Motor</div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: SEGMENTO_COLORS[data.rutaActiva], lineHeight: 1.5 }}>{step.replace('RESULTADO: ', '')}</div>
                            </>
                          ) : (
                            <>
                              {step.includes('→') ? (
                                <>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{step.split('→')[0].trim()}</span>
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}> → </span>
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{step.split('→').slice(1).join('→').trim()}</span>
                                </>
                              ) : (
                                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{step}</span>
                              )}
                            </>
                          )}
                        </div>
                        {!isResult && (
                          <div style={{ fontSize: '0.65rem', color: '#22c55e', fontWeight: 700, whiteSpace: 'nowrap' }}>PASS</div>
                        )}
                      </div>
                      {/* Vertical connector between steps */}
                      {i < data.arbolDecision.length - 1 && (
                        <div style={{
                          width: 2,
                          height: data.arbolDecision[i + 1]?.startsWith('RESULTADO') ? 20 : 8,
                          background: `${stepColor}44`,
                          marginLeft: data.arbolDecision[i + 1]?.startsWith('RESULTADO') ? 24 : 32,
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Segmento Routes,Enhanced visualization */}
            <div className={styles.triajeMotor}>
              <div className={styles.triajeMotorHeader}>
                <Cpu size={16} style={{ color: '#0175D8' }} />
                <span>Caminos de Gestión: Segmento Asignado</span>
              </div>
              <div className={styles.triajeRoutes}>
                {allSegmentos.map((seg) => {
                  const isActive = seg === data.rutaActiva;
                  return (
                    <div
                      key={seg}
                      className={styles.triajeRoute}
                      style={{
                        borderColor: isActive ? SEGMENTO_COLORS[seg] : 'var(--border-subtle)',
                        background: isActive ? `${SEGMENTO_COLORS[seg]}12` : 'transparent',
                        opacity: isActive ? 1 : 0.35,
                        boxShadow: isActive ? `0 0 20px ${SEGMENTO_COLORS[seg]}22, inset 0 0 20px ${SEGMENTO_COLORS[seg]}08` : 'none',
                      }}
                    >
                      <div className={styles.triajeRouteIndicator} style={{ background: isActive ? SEGMENTO_COLORS[seg] : 'var(--border-subtle)', width: isActive ? 5 : 3 }} />
                      <div style={{ flex: 1 }}>
                        <span className={styles.triajeRouteLabel} style={{ color: isActive ? SEGMENTO_COLORS[seg] : 'var(--text-muted)', fontSize: isActive ? '0.88rem' : '0.82rem' }}>
                          {SEGMENTO_LABELS[seg]}
                        </span>
                        {isActive && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{SEGMENTO_DESCRIPTIONS[seg]}</div>
                        )}
                      </div>
                      {isActive && <ChevronRight size={16} style={{ color: SEGMENTO_COLORS[seg] }} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Evaluación de Case Management */}
            <div className={styles.pertinenciaSection} style={{ marginTop: 16 }}>
              <h4 className={styles.pertinenciaSectionTitle}>
                <Users size={14} /> Evaluación de Case Management
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
                <div className={styles.pertinenciaCard}>
                  <span className={styles.pertinenciaSubtitle}>Potencial de Ahorro</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#22c55e' }}>{fmtCurrency(data.caseManagement.potencialAhorro)}</div>
                </div>
                <div className={styles.pertinenciaCard}>
                  <span className={styles.pertinenciaSubtitle}>Probabilidad de Ahorro</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0175D8' }}>{data.caseManagement.probabilidadAhorro}%</div>
                </div>
                <div className={styles.pertinenciaCard}>
                  <span className={styles.pertinenciaSubtitle}>Carga del Equipo</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: data.caseManagement.cargaEquipo > 85 ? '#ef4444' : '#F5A623' }}>{data.caseManagement.cargaEquipo}%</div>
                </div>
              </div>
              <div style={{ padding: '12px 16px', background: data.caseManagement.potencialAhorro > 10000 ? 'rgba(34,197,94,0.06)' : 'rgba(148,163,184,0.06)', border: `1px solid ${data.caseManagement.potencialAhorro > 10000 ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.12)'}`, borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{data.caseManagement.recomendacion}</span>
              </div>
            </div>

            {/* Palancas de Optimización (conditional) */}
            {data.caseManagement.palancas && data.caseManagement.potencialAhorro > 10000 && (
              <div className={styles.pertinenciaSection}>
                <h4 className={styles.pertinenciaSectionTitle}>
                  <BarChart3 size={14} /> Palancas de Optimización: Oportunidades Detectadas
                </h4>

                {data.caseManagement.palancas.medicamentosBiocompatibles.aplica && (
                  <div className={styles.pertinenciaCard} style={{ borderLeftColor: '#0175D8', borderLeftWidth: 3 }}>
                    <span className={styles.pertinenciaSubtitle}>Medicamentos Bio-compatibles</span>
                    <div className={styles.pertinenciaRow}>
                      <span className={styles.pertinenciaLabel}>Actual</span>
                      <span className={styles.pertinenciaValue}>{data.caseManagement.palancas.medicamentosBiocompatibles.actual}</span>
                    </div>
                    <div className={styles.pertinenciaRow}>
                      <span className={styles.pertinenciaLabel}>Alternativa</span>
                      <span className={styles.pertinenciaValue} style={{ color: '#22c55e' }}>{data.caseManagement.palancas.medicamentosBiocompatibles.alternativa}</span>
                    </div>
                    <div className={styles.pertinenciaRow}>
                      <span className={styles.pertinenciaLabel}>Ahorro Potencial</span>
                      <span className={styles.pertinenciaValue} style={{ color: '#22c55e', fontWeight: 700 }}>{data.caseManagement.palancas.medicamentosBiocompatibles.ahorroPotencial}</span>
                    </div>
                  </div>
                )}

                <div className={styles.pertinenciaCard} style={{ marginTop: 10, borderLeftColor: data.caseManagement.palancas.honorariosMedicos.alerta ? '#ef4444' : 'var(--border-subtle)', borderLeftWidth: 3 }}>
                  <span className={styles.pertinenciaSubtitle}>
                    Honorarios Médicos vs Distribución Histórica
                    {data.caseManagement.palancas.honorariosMedicos.alerta && <span style={{ color: '#ef4444', marginLeft: 8 }}>ALERTA</span>}
                  </span>
                  <div className={styles.pertinenciaRow}>
                    <span className={styles.pertinenciaLabel}>Monto Actual</span>
                    <span className={styles.pertinenciaValue}>{data.caseManagement.palancas.honorariosMedicos.montoActual}</span>
                  </div>
                  <div className={styles.pertinenciaRow}>
                    <span className={styles.pertinenciaLabel}>Promedio Histórico</span>
                    <span className={styles.pertinenciaValue}>{data.caseManagement.palancas.honorariosMedicos.promedioHistorico}</span>
                  </div>
                  <div className={styles.pertinenciaRow}>
                    <span className={styles.pertinenciaLabel}>Desviación</span>
                    <span className={styles.pertinenciaValue} style={{ color: data.caseManagement.palancas.honorariosMedicos.alerta ? '#ef4444' : 'var(--text-primary)', fontWeight: 700 }}>
                      {data.caseManagement.palancas.honorariosMedicos.desviacion}
                    </span>
                  </div>
                </div>

                {data.caseManagement.palancas.duracionEstancia.diasProgramados > 0 && (
                  <div className={styles.pertinenciaCard} style={{ marginTop: 10, borderLeftColor: data.caseManagement.palancas.duracionEstancia.alerta ? '#ef4444' : 'var(--border-subtle)', borderLeftWidth: 3 }}>
                    <span className={styles.pertinenciaSubtitle}>
                      Duración de Estancia vs Distribución Histórica
                      {data.caseManagement.palancas.duracionEstancia.alerta && <span style={{ color: '#ef4444', marginLeft: 8 }}>ALERTA</span>}
                    </span>
                    <div className={styles.pertinenciaRow}>
                      <span className={styles.pertinenciaLabel}>Días Programados</span>
                      <span className={styles.pertinenciaValue}>{data.caseManagement.palancas.duracionEstancia.diasProgramados} días</span>
                    </div>
                    <div className={styles.pertinenciaRow}>
                      <span className={styles.pertinenciaLabel}>Promedio Histórico</span>
                      <span className={styles.pertinenciaValue}>{data.caseManagement.palancas.duracionEstancia.promedioHistorico} días</span>
                    </div>
                    <div className={styles.pertinenciaRow}>
                      <span className={styles.pertinenciaLabel}>Desviación</span>
                      <span className={styles.pertinenciaValue} style={{ color: data.caseManagement.palancas.duracionEstancia.alerta ? '#ef4444' : '#22c55e', fontWeight: 700 }}>
                        {data.caseManagement.palancas.duracionEstancia.desviacion}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Fraud banner */}
            {renderFraudBanner(claimConfig.validaciones.fraudeScoreInicial, 'el triaje')}
          </div>
        );
      }

      case 'dictamen-medico': {
        const data = claimConfig.dictamenMedico;
        const totalAdjuntos = data.contextoClinico.adjuntos.reduce((sum, a) => sum + a.cantidad, 0);
        const isFailed = (text: string) => text.startsWith('FALLA');
        const fmtFinanciero = (n: number) => '$' + n.toLocaleString('es-MX');
        return (
          <div>
            {/* Control Tower Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 16px', background: 'rgba(1,117,216,0.06)', border: '1px solid rgba(1,117,216,0.15)', borderRadius: 'var(--radius-md)' }}>
              <Stethoscope size={18} style={{ color: '#0175D8' }} />
              <div>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>Este apartado requiere revisión del dictaminador médico</span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>La IA proporciona análisis y el dictaminador médico decide.</p>
              </div>
            </div>

            {/* ============================================================ */}
            {/* 1. Contexto Médico y Clínico                                 */}
            {/* ============================================================ */}
            <div className={styles.pertinenciaSection}>
              <h4 className={styles.pertinenciaSectionTitle}>
                <Stethoscope size={14} /> Contexto Médico y Clínico
              </h4>

              {/* Resumen Clínico */}
              <div className={styles.pertinenciaCard}>
                <span className={styles.pertinenciaSubtitle}>Resumen Clínico</span>
                <div className={styles.pertinenciaRow}>
                  <span className={styles.pertinenciaLabel}>Diagnóstico Principal</span>
                  <span className={styles.pertinenciaValue}>{data.expedienteMedico.diagnosticoPrincipal}</span>
                </div>
                <div className={styles.pertinenciaRow}>
                  <span className={styles.pertinenciaLabel}>Código CIE</span>
                  <span className={styles.pertinenciaValue} style={{ fontFamily: 'var(--font-mono)' }}>{data.expedienteMedico.codigoCIE}</span>
                </div>
              </div>

              {/* Historial Relevante */}
              <div className={styles.pertinenciaCard} style={{ marginTop: 10 }}>
                <span className={styles.pertinenciaSubtitle}>Historial Relevante</span>
                {data.expedienteMedico.historialRelevante.map((h, i) => (
                  <div key={i} className={styles.pertinenciaListItem}>
                    <FileText size={12} style={{ color: '#0175D8', flexShrink: 0 }} />
                    <span>{h}</span>
                  </div>
                ))}
              </div>

              {/* Observaciones y Alertas */}
              <div className={styles.pertinenciaCard} style={{ marginTop: 10 }}>
                <span className={styles.pertinenciaSubtitle}>Observaciones y Alertas</span>
                {data.expedienteMedico.observaciones.map((o, i) => (
                  <div key={i} className={styles.pertinenciaListItem} style={{ color: o.startsWith('ATENCIÓN') || o.startsWith('ALERTA') ? '#F5A623' : 'var(--text-secondary)' }}>
                    {o.startsWith('ATENCIÓN') || o.startsWith('ALERTA') ? <AlertTriangle size={12} style={{ color: '#F5A623', flexShrink: 0 }} /> : <CheckCircle size={12} style={{ color: '#22c55e', flexShrink: 0 }} />}
                    <span>{o}</span>
                  </div>
                ))}
              </div>

              {/* Timeline de Eventos */}
              <div className={styles.pertinenciaCard} style={{ marginTop: 10 }}>
                <span className={styles.pertinenciaSubtitle}>
                  <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  Timeline de Eventos
                </span>
                {data.contextoClinico.timeline.map((t, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: i < data.contextoClinico.timeline.length - 1 ? '1px solid var(--border-subtle)' : 'none', fontSize: '0.82rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#0175D8', fontWeight: 600, flexShrink: 0, minWidth: 80 }}>{t.fecha}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{t.evento}</span>
                  </div>
                ))}
              </div>

              {/* Pruebas Diagnósticas */}
              <div className={styles.pertinenciaCard} style={{ marginTop: 10 }}>
                <span className={styles.pertinenciaSubtitle}>
                  <Eye size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  Pruebas Diagnósticas
                </span>
                {data.contextoClinico.pruebasDiagnosticas.map((p, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: i < data.contextoClinico.pruebasDiagnosticas.length - 1 ? '1px solid var(--border-subtle)' : 'none', fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0, minWidth: 180 }}>{p.prueba}</span>
                    <span style={{ color: p.resultado.includes('NO PRESENTADA') || p.resultado.includes('No disponible') ? '#ef4444' : 'var(--text-secondary)' }}>{p.resultado}</span>
                  </div>
                ))}
              </div>

              {/* Documentación Adjunta */}
              <div className={styles.pertinenciaCard} style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className={styles.pertinenciaSubtitle} style={{ marginBottom: 0 }}>
                    <FileText size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                    Documentación Adjunta
                  </span>
                  <span style={{ background: 'rgba(1,117,216,0.12)', color: '#0175D8', fontWeight: 700, fontSize: '0.75rem', padding: '2px 10px', borderRadius: 12 }}>{totalAdjuntos} documentos</span>
                </div>
                {data.contextoClinico.adjuntos.map((a, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: i < data.contextoClinico.adjuntos.length - 1 ? '1px solid var(--border-subtle)' : 'none', fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{a.tipo}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.cantidad}</span>
                  </div>
                ))}
              </div>

              {/* Download buttons */}
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className={styles.pdfDownloadButton} onClick={() => downloadMasterPDF(claimConfig)}>
                  <FileText size={16} /> Descargar Expediente Médico
                </button>
                <button className={styles.pdfDownloadButton} onClick={() => downloadMasterPDF(claimConfig)} style={{ background: 'var(--surface-secondary)' }}>
                  <FileText size={16} /> Descargar Resumen de Adjuntos
                </button>
              </div>
            </div>

            {/* ============================================================ */}
            {/* 2. Análisis de Pertinencia                                   */}
            {/* ============================================================ */}
            <div className={styles.pertinenciaSection}>
              <h4 className={styles.pertinenciaSectionTitle}>
                <Scale size={14} /> Análisis de Pertinencia
              </h4>

              {/* Resumen de Intervención (from programacionCirugia if available) */}
              {data.programacionCirugia && (
                <div className={styles.pertinenciaCard}>
                  <span className={styles.pertinenciaSubtitle}>Resumen de la Intervención</span>
                  <div className={styles.pertinenciaRow}>
                    <span className={styles.pertinenciaLabel}>Procedimiento</span>
                    <span className={styles.pertinenciaValue}>{data.programacionCirugia.procedimiento}</span>
                  </div>
                  <div className={styles.pertinenciaRow}>
                    <span className={styles.pertinenciaLabel}>Fecha</span>
                    <span className={styles.pertinenciaValue}>{data.programacionCirugia.fecha}</span>
                  </div>
                  <div className={styles.pertinenciaRow}>
                    <span className={styles.pertinenciaLabel}>Cirujano</span>
                    <span className={styles.pertinenciaValue}>{data.programacionCirugia.cirujano}</span>
                  </div>
                  <div className={styles.pertinenciaRow}>
                    <span className={styles.pertinenciaLabel}>Duración Estimada</span>
                    <span className={styles.pertinenciaValue}>{data.programacionCirugia.duracionEstimada}</span>
                  </div>
                </div>
              )}

              {/* Checks de Pertinencia */}
              <div className={styles.pertinenciaCard} style={{ marginTop: 10 }}>
                <span className={styles.pertinenciaSubtitle}>Verificaciones de Pertinencia Clínica</span>
                {data.checksPertinencia.map((check, i) => (
                  <div key={i} className={styles.pertinenciaListItem} style={{ color: isFailed(check) ? '#ef4444' : 'var(--text-secondary)' }}>
                    {isFailed(check) ? <AlertTriangle size={12} style={{ color: '#ef4444', flexShrink: 0 }} /> : <CheckCircle size={12} style={{ color: '#22c55e', flexShrink: 0 }} />}
                    <span>{isFailed(check) ? check.replace('FALLA: ', '') : check}</span>
                  </div>
                ))}
              </div>

              {/* Insumos a Aprobar */}
              <div className={styles.pertinenciaCard} style={{ marginTop: 10 }}>
                <span className={styles.pertinenciaSubtitle}>Insumos a Aprobar</span>

                {/* Global consistency check */}
                {!data.checksPertinencia.some(isFailed) ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 10, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: '#22c55e', fontWeight: 600 }}>
                    <CheckCircle size={14} />
                    <span>Consistencia global tratamiento e insumos: OK</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', marginBottom: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: '#ef4444', fontWeight: 600 }}>
                    <AlertTriangle size={14} />
                    <span>Se identificaron inconsistencias en la validación de insumos</span>
                  </div>
                )}

                {/* Individual insumos */}
                {data.insumos.map((insumo, i) => (
                  <div key={i} style={{ padding: '10px 12px', marginBottom: i < data.insumos.length - 1 ? 8 : 0, background: 'var(--surface-primary)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', borderLeftWidth: 3, borderLeftColor: insumo.checks.some(isFailed) ? '#ef4444' : '#22c55e' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)', display: 'block', marginBottom: 6 }}>{insumo.nombre}</span>
                    {insumo.checks.map((check, j) => (
                      <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '3px 0', fontSize: '0.78rem', color: isFailed(check) ? '#ef4444' : 'var(--text-secondary)' }}>
                        {isFailed(check) ? <AlertTriangle size={11} style={{ color: '#ef4444', flexShrink: 0, marginTop: 1 }} /> : <CheckCircle size={11} style={{ color: '#22c55e', flexShrink: 0, marginTop: 1 }} />}
                        <span>{isFailed(check) ? check.replace('FALLA: ', '') : check}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Verificaciones Adicionales del Dictamen */}
              <div className={styles.pertinenciaCard} style={{ marginTop: 10 }}>
                <span className={styles.pertinenciaSubtitle}>Verificaciones Adicionales del Dictamen</span>
                {data.checksDictamen.map((check, i) => (
                  <div key={i} className={styles.pertinenciaListItem} style={{ color: isFailed(check) ? '#ef4444' : 'var(--text-secondary)' }}>
                    {isFailed(check) ? <AlertTriangle size={12} style={{ color: '#ef4444', flexShrink: 0 }} /> : <CheckCircle size={12} style={{ color: '#22c55e', flexShrink: 0 }} />}
                    <span>{isFailed(check) ? check.replace('FALLA: ', '') : check}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ============================================================ */}
            {/* 3. Palancas de Optimización                                  */}
            {/* ============================================================ */}
            <div className={styles.pertinenciaSection}>
              <h4 className={styles.pertinenciaSectionTitle}>
                <BarChart3 size={14} /> Palancas de Optimización
              </h4>
              {claimConfig.segmento === 'reactiva' || claimConfig.segmento === 'automatica' ? (
                <div className={styles.pertinenciaCard} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  N/A: No aplica para este tipo de gestión
                </div>
              ) : (
                <>
                  {claimConfig.triaje.caseManagement.palancas && (
                    <>
                      {claimConfig.triaje.caseManagement.palancas.medicamentosBiocompatibles.aplica && (
                        <div className={styles.pertinenciaCard} style={{ borderLeftColor: '#0175D8', borderLeftWidth: 3 }}>
                          <span className={styles.pertinenciaSubtitle}>Medicamentos Bio-compatibles</span>
                          <div className={styles.pertinenciaRow}>
                            <span className={styles.pertinenciaLabel}>Actual</span>
                            <span className={styles.pertinenciaValue}>{claimConfig.triaje.caseManagement.palancas.medicamentosBiocompatibles.actual}</span>
                          </div>
                          <div className={styles.pertinenciaRow}>
                            <span className={styles.pertinenciaLabel}>Alternativa</span>
                            <span className={styles.pertinenciaValue} style={{ color: '#22c55e' }}>{claimConfig.triaje.caseManagement.palancas.medicamentosBiocompatibles.alternativa}</span>
                          </div>
                          <div className={styles.pertinenciaRow}>
                            <span className={styles.pertinenciaLabel}>Ahorro Potencial</span>
                            <span className={styles.pertinenciaValue} style={{ color: '#22c55e', fontWeight: 700 }}>{claimConfig.triaje.caseManagement.palancas.medicamentosBiocompatibles.ahorroPotencial}</span>
                          </div>
                        </div>
                      )}
                      <div className={styles.pertinenciaCard} style={{ marginTop: 10, borderLeftColor: claimConfig.triaje.caseManagement.palancas.honorariosMedicos.alerta ? '#ef4444' : 'var(--border-subtle)', borderLeftWidth: 3 }}>
                        <span className={styles.pertinenciaSubtitle}>
                          Honorarios Médicos vs Distribución Histórica
                          {claimConfig.triaje.caseManagement.palancas.honorariosMedicos.alerta && <span style={{ color: '#ef4444', marginLeft: 8 }}>ALERTA</span>}
                        </span>
                        <div className={styles.pertinenciaRow}>
                          <span className={styles.pertinenciaLabel}>Monto Actual</span>
                          <span className={styles.pertinenciaValue}>{claimConfig.triaje.caseManagement.palancas.honorariosMedicos.montoActual}</span>
                        </div>
                        <div className={styles.pertinenciaRow}>
                          <span className={styles.pertinenciaLabel}>Promedio Histórico</span>
                          <span className={styles.pertinenciaValue}>{claimConfig.triaje.caseManagement.palancas.honorariosMedicos.promedioHistorico}</span>
                        </div>
                        <div className={styles.pertinenciaRow}>
                          <span className={styles.pertinenciaLabel}>Desviación</span>
                          <span className={styles.pertinenciaValue} style={{ color: claimConfig.triaje.caseManagement.palancas.honorariosMedicos.alerta ? '#ef4444' : 'var(--text-primary)', fontWeight: 700 }}>{claimConfig.triaje.caseManagement.palancas.honorariosMedicos.desviacion}</span>
                        </div>
                      </div>
                      {claimConfig.triaje.caseManagement.palancas.duracionEstancia.diasProgramados > 0 && (
                        <div className={styles.pertinenciaCard} style={{ marginTop: 10, borderLeftColor: claimConfig.triaje.caseManagement.palancas.duracionEstancia.alerta ? '#ef4444' : 'var(--border-subtle)', borderLeftWidth: 3 }}>
                          <span className={styles.pertinenciaSubtitle}>
                            Duración de Estancia vs Distribución Histórica
                            {claimConfig.triaje.caseManagement.palancas.duracionEstancia.alerta && <span style={{ color: '#ef4444', marginLeft: 8 }}>ALERTA</span>}
                          </span>
                          <div className={styles.pertinenciaRow}>
                            <span className={styles.pertinenciaLabel}>Días Programados</span>
                            <span className={styles.pertinenciaValue}>{claimConfig.triaje.caseManagement.palancas.duracionEstancia.diasProgramados} días</span>
                          </div>
                          <div className={styles.pertinenciaRow}>
                            <span className={styles.pertinenciaLabel}>Promedio Histórico</span>
                            <span className={styles.pertinenciaValue}>{claimConfig.triaje.caseManagement.palancas.duracionEstancia.promedioHistorico} días</span>
                          </div>
                          <div className={styles.pertinenciaRow}>
                            <span className={styles.pertinenciaLabel}>Desviación</span>
                            <span className={styles.pertinenciaValue} style={{ color: claimConfig.triaje.caseManagement.palancas.duracionEstancia.alerta ? '#ef4444' : '#22c55e', fontWeight: 700 }}>{claimConfig.triaje.caseManagement.palancas.duracionEstancia.desviacion}</span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

            {/* ============================================================ */}
            {/* 4. Alertas para el Médico                                    */}
            {/* ============================================================ */}
            {data.alertasMedico.length > 0 && (
              <div className={styles.pertinenciaSection}>
                <h4 className={styles.pertinenciaSectionTitle} style={{ color: '#F5A623' }}>
                  <AlertTriangle size={14} /> Alertas para Revisión del Dictaminador Médico
                </h4>
                {data.alertasMedico.map((alerta, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.82rem', color: alerta.startsWith('ALERTA') ? '#ef4444' : '#F5A623' }}>
                    <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 2 }} />
                    <span>{alerta}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ============================================================ */}
            {/* 5. Asistencia IA Fraude                                      */}
            {/* ============================================================ */}
            <div className={styles.pertinenciaSection}>
              <h4 className={styles.pertinenciaSectionTitle}>
                <Shield size={14} /> Asistencia IA: Detección de Fraude
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{data.asistenciaFraudeManual}</p>
            </div>

            {/* Fraud banner */}
            {renderFraudBanner(claimConfig.validaciones.fraudeScoreInicial, 'el dictamen médico')}

            {/* ============================================================ */}
            {/* 6. Resumen Financiero del Siniestro                          */}
            {/* ============================================================ */}
            <div className={styles.pertinenciaSection}>
              <h4 className={styles.pertinenciaSectionTitle}>
                <DollarSign size={14} /> Resumen Financiero del Siniestro
              </h4>
              <div className={styles.pertinenciaCard} style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Monto reclamado</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{fmtFinanciero(data.resumenFinanciero.montoReclamado)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Deducible aplicado</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>-{fmtFinanciero(data.resumenFinanciero.deducible)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Coaseguro aplicado ({data.resumenFinanciero.coaseguroPct}%)</span>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>-{fmtFinanciero(data.resumenFinanciero.coaseguro)}</span>
                </div>
                <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 14px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total a cargo del asegurado</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>{fmtFinanciero(data.resumenFinanciero.totalCargoAsegurado)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.92rem', background: 'rgba(1,117,216,0.04)' }}>
                  <span style={{ fontWeight: 700, color: '#0175D8' }}>Total a cargo de la aseguradora</span>
                  <span style={{ fontWeight: 800, color: '#0175D8', fontSize: '1rem' }}>{fmtFinanciero(data.resumenFinanciero.totalCargoAseguradora)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', fontSize: '0.85rem', background: 'rgba(34,197,94,0.04)' }}>
                  <span style={{ color: '#22c55e', fontWeight: 600 }}>Suma asegurada remanente</span>
                  <span style={{ fontWeight: 700, color: '#22c55e' }}>{fmtFinanciero(data.resumenFinanciero.sumaAseguradaRemanente)}</span>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'pago': {
        const data = claimConfig.pago;
        return (
          <div>
            {renderAgentOutputs(stageId)}
            <div className={styles.pagoValidaciones}>
              <h4 className={styles.pagoValidacionesTitle}>
                <CheckCircle size={14} style={{ color: '#22c55e' }} /> Validaciones Completadas
              </h4>
              {data.validaciones.map((v, i) => (
                <div key={i} className={styles.pagoValidacionItem}>
                  <CheckCircle size={12} style={{ color: '#22c55e' }} />
                  <span>{v}</span>
                </div>
              ))}
            </div>
            <div className={styles.pagoAjustes}>
              <h4 className={styles.pagoAjustesTitle}>Ajustes Aplicados</h4>
              {data.ajustes.map((a, i) => (
                <div key={i} className={styles.pagoAjusteItem}>
                  <span>{a}</span>
                </div>
              ))}
            </div>
            <div className={styles.pagoFinal}>
              <div className={styles.pagoMontoRow}>
                <span>Monto Reclamado</span>
                <span>{fmtCurrency(claimConfig.monto)}</span>
              </div>
              <div className={styles.pagoMontoRowFinal}>
                <span>Monto Final a Pagar</span>
                <span style={{ color: '#0175D8', fontSize: '1.3rem', fontWeight: 800 }}>{fmtCurrency(data.montoFinal)}</span>
              </div>
            </div>

            {/* Approval / Rejection Flow */}
            {pagoAprobado === null ? (
              <div>
                <div style={{ padding: '14px 16px', background: 'rgba(1,117,216,0.06)', border: '1px solid rgba(1,117,216,0.15)', borderRadius: 'var(--radius-md)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CreditCard size={16} style={{ color: '#0175D8' }} />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: 600 }}>Autorización de pago pendiente,requiere aprobación del dictaminador</span>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    className={styles.pdfDownloadButton}
                    onClick={() => setPagoAprobado(true)}
                    style={{ background: '#22c55e', flex: 1, justifyContent: 'center', padding: '14px 24px', fontSize: '0.92rem' }}
                  >
                    <CheckCircle size={18} /> Aprobar Pago,{fmtCurrency(data.montoFinal)}
                  </button>
                  <button
                    className={styles.pdfDownloadButton}
                    onClick={() => setPagoAprobado(false)}
                    style={{ background: '#ef4444', flex: 'none', padding: '14px 24px', fontSize: '0.92rem' }}
                  >
                    <AlertTriangle size={18} /> Rechazar
                  </button>
                </div>
              </div>
            ) : pagoAprobado ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className={styles.pagoEstado}>
                  <CheckCircle size={18} />
                  <span>Pago Aprobado,{fmtCurrency(data.montoFinal)} autorizado para procesamiento</span>
                </div>
                <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: '#22c55e', textAlign: 'center' }}>
                  {data.estado}
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{ padding: '14px 16px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <AlertTriangle size={16} style={{ color: '#ef4444' }} />
                <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600 }}>Pago rechazado,derivado a revisión adicional del comité</span>
              </motion.div>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ================================================================ */}
        {/* Breadcrumb + Back link                                           */}
        {/* ================================================================ */}

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Breadcrumb items={[
            { label: 'Inicio', to: '/' },
            { label: domain.name, to: `/domain/${domain.id}` },
            { label: useCase.title },
          ]} />
        </motion.div>

        <Link to={`/domain/${domain.id}`} className={styles.backLink}>
          <ArrowLeft size={16} /> Volver a {domain.name}
        </Link>

        {/* ================================================================ */}
        {/* SECTION 1: PARRILLA,Cases Table (no case open)                 */}
        {/* ================================================================ */}

        {!selectedCaseId && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            {/* Hero + Timer Bar */}
            <div className={styles.heroBanner} style={{ marginBottom: 20 }}>
              <h1 className={styles.heroTitle}>Casos Asignados a {DICTAMINADOR_NAME}</h1>
              <p className={styles.heroSubtitle}>
                Seleccione un caso para iniciar el flujo de revisión.
                {!parrillaEntryTime && ' El timer de 2 horas iniciará al abrir el primer caso.'}
              </p>
            </div>
            <div className={styles.timerBar}>
              <div className={styles.timerBarLeft}>
                <h2 className={styles.parrillaActiveTitle}>
                  Parrilla de Trabajo
                </h2>
              </div>
              <div className={styles.timerBarRight}>
                <span className={styles.timerLabel}>Tiempo restante:</span>
                <span className={styles.timerValue} style={{ color: getTimerColor(timerRemaining) }}>
                  <Clock size={16} /> {formatTimer(timerRemaining)}
                </span>
                <span className={styles.timerProgress}>
                  {reviewedCases.size} de {parrillaCases.length} revisados
                </span>
              </div>
            </div>

            {/* Cases Table */}
            <div className={styles.casesTableWrapper}>
              <table className={styles.casesTable}>
                <thead>
                  <tr>
                    <th>Folio</th>
                    <th>Fecha Aviso</th>
                    <th>Asegurado</th>
                    <th>No. Póliza</th>
                    <th>Canal</th>
                    <th>Tipo de Siniestro</th>
                    <th>Monto Reservado</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {parrillaCases.map(c => {
                    const isReviewed = reviewedCases.has(c.id);
                    return (
                      <tr key={c.id} className={isReviewed ? styles.casesTableRowReviewed : ''}>
                        <td className={styles.casesTableFolio}>{c.folioId}</td>
                        <td>{c.fechaAviso}</td>
                        <td>{c.asegurado}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>{c.numPoliza}</td>
                        <td>{c.canal}</td>
                        <td>{c.tipoSiniestro}</td>
                        <td className={styles.casesTableMonto}>{fmtCurrency(c.montoReservado)}</td>
                        <td>
                          {isReviewed ? (
                            <span className={styles.casesTableReviewedBadge}><CheckCircle size={14} /> Revisado</span>
                          ) : (
                            <button className={styles.casesTableReviewBtn} onClick={() => handleSelectCase(c)}>
                              <Eye size={14} /> Revisar
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* ================================================================ */}
        {/* SECTION 3: CASE VIEW (case selected,pipeline + enhancements)   */}
        {/* ================================================================ */}

        {selectedCaseId && currentCase && claimConfig && (
          <>
            {/* Case Header Bar */}
            <div className={styles.caseHeaderBar}>
              <button className={styles.caseBackBtn} onClick={handleBackToParrilla}>
                <ArrowLeft size={14} /> Volver a Parrilla
              </button>
              <div className={styles.caseHeaderInfo}>
                <span className={styles.caseHeaderItem}><strong>Folio:</strong> {currentCase.folioId}</span>
                <span className={styles.caseHeaderItem}><strong>Asegurado:</strong> {currentCase.asegurado}</span>
                <span className={styles.caseHeaderItem}><strong>Póliza:</strong> {currentCase.numPoliza}</span>
                <span className={styles.caseHeaderItem}><strong>Reservado:</strong> <span style={{ color: '#0175D8', fontWeight: 700 }}>{fmtCurrency(currentCase.montoReservado)}</span></span>
              </div>
              <div className={styles.caseHeaderTimer} style={{ color: getTimerColor(timerRemaining) }}>
                <Clock size={14} /> {formatTimer(timerRemaining)}
              </div>
            </div>

            {/* Resumen appears only after all stages complete */}
          </>
        )}

        {/* ================================================================ */}
        {/* SECTION 4: PIPELINE VISUALIZATION (only when case is selected)   */}
        {/* ================================================================ */}

        <AnimatePresence>
          {selectedCaseId && claimConfig && (
            <motion.section
              className={styles.pipelineSection}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className={styles.pipelineHeader}>
                <h2 className={styles.pipelineTitle}>
                  <Zap size={18} /> Pipeline de Procesamiento
                </h2>
                <div className={styles.pipelineControls}>
                  {simulationState === 'complete' && (
                    <button className={styles.pipelineButton} onClick={handleRestart}>
                      <RotateCcw size={14} /> Reiniciar
                    </button>
                  )}
                  <button className={styles.pipelineButtonSecondary} onClick={handleBackToParrilla}>
                    <ArrowLeft size={14} /> Volver a Parrilla
                  </button>
                </div>
              </div>

              {/* Claim summary bar */}
              <div className={styles.claimSummaryBar}>
                <div className={styles.claimSummaryItem}>
                  <span className={styles.claimSummaryLabel}>Diagnostico</span>
                  <span className={styles.claimSummaryValue}>{claimConfig.diagnostico}</span>
                </div>
                <div className={styles.claimSummaryItem}>
                  <span className={styles.claimSummaryLabel}>Proveedor</span>
                  <span className={styles.claimSummaryValue}>{claimConfig.proveedor}</span>
                </div>
                <div className={styles.claimSummaryItem}>
                  <span className={styles.claimSummaryLabel}>Monto</span>
                  <span className={styles.claimSummaryValue} style={{ color: '#0175D8' }}>{fmtCurrency(claimConfig.monto)}</span>
                </div>
              </div>

              {/* Pipeline stepper */}
              <div className={styles.pipelineStepper}>
                {claimConfig.stages.map((stage, idx) => {
                  const status = stageStatuses[stage.id];
                  const isSkipped = false;
                  const isCurrent = status === 'active';
                  const isComplete = status === 'complete';
                  const modeColor = MODE_COLORS[stage.mode];

                  return (
                    <div key={stage.id} style={{ display: 'flex', alignItems: 'center' }}>
                      {idx > 0 && (
                        <div
                          className={styles.pipelineConnector}
                          style={{
                            background: isSkipped
                              ? 'repeating-linear-gradient(90deg, rgba(148,163,184,0.15), rgba(148,163,184,0.15) 4px, transparent 4px, transparent 8px)'
                              : isComplete || (stageStatuses[claimConfig.stages[idx - 1]?.id] === 'complete')
                                ? '#22c55e'
                                : 'rgba(148,163,184,0.15)',
                          }}
                        />
                      )}
                      <div
                        className={styles.pipelineStep}
                        onClick={() => {
                          if (!isSkipped && (isComplete || isCurrent)) setShowStageDetail(stage.id);
                        }}
                        style={{ opacity: isSkipped ? 0.35 : 1, cursor: isSkipped ? 'default' : (isComplete || isCurrent) ? 'pointer' : 'default' }}
                      >
                        <div
                          className={`${styles.pipelineStepCircle} ${isCurrent ? styles.pipelineStepCircleActive : ''} ${isComplete ? styles.pipelineStepCircleComplete : ''}`}
                          style={{
                            borderColor: isSkipped ? 'rgba(148,163,184,0.2)' : isComplete ? '#22c55e' : isCurrent ? '#0175D8' : modeColor,
                            background: isSkipped
                              ? 'transparent'
                              : isComplete
                                ? 'rgba(34,197,94,0.18)'
                                : isCurrent
                                  ? 'rgba(1,117,216,0.18)'
                                  : `${modeColor}15`,
                            borderStyle: isSkipped ? 'dashed' : 'solid',
                          }}
                        >
                          {isComplete ? (
                            <CheckCircle size={16} style={{ color: '#22c55e' }} />
                          ) : isSkipped ? (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>N/A</span>
                          ) : (
                            <span style={{ color: isCurrent ? '#0175D8' : modeColor }}>{stage.icon}</span>
                          )}
                        </div>
                        <span
                          className={styles.pipelineStepLabel}
                          style={{
                            color: isCurrent ? '#0175D8' : isComplete ? '#22c55e' : isSkipped ? 'var(--text-muted)' : 'var(--text-secondary)',
                            textDecoration: isSkipped ? 'line-through' : 'none',
                          }}
                        >
                          {stage.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Per-stage summaries, appear as each stage completes */}
              {Object.values(stageStatuses).some(s => s === 'complete') && (
                <div className={styles.stageSummarySection}>
                  {claimConfig.stages.map(stage => {
                    if (stageStatuses[stage.id] !== 'complete') return null;
                    const summary = generateStageSummary(stage.id, claimConfig);
                    return (
                      <motion.div
                        key={stage.id}
                        className={`${styles.stageSummaryInline} ${summary.needsInput ? styles.stageSummaryInlineAlert : ''}`}
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className={styles.stageSummaryInlineHeader}>
                          <span className={styles.stageSummaryCardIcon}>{stage.icon}</span>
                          <span className={styles.stageSummaryInlineLabel}>{stage.label}</span>
                          <span className={styles.stageSummaryCardBadge}><CheckCircle size={11} /> Completado</span>
                        </div>
                        <div className={styles.stageSummaryInlineBody}>
                          {summary.bullets.map((b, i) => <span key={i} className={styles.stageSummaryInlineBullet}>{b}</span>)}
                        </div>
                        {summary.needsInput && (
                          <button className={styles.stageSummaryInputBtn} onClick={() => { setShowStageDetail(stage.id); setShowSidePanel(true); }}>
                            <AlertTriangle size={12} /> {summary.inputReason}
                          </button>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Mode legend */}
              <div className={styles.modeLegend}>
                {(['manual', 'ia-asistido', 'automatizado'] as ProcessMode[]).map((mode) => (
                  <div key={mode} className={styles.modeLegendItem}>
                    <span className={styles.modeLegendDot} style={{ background: MODE_COLORS[mode] }} />
                    <span>{MODE_LABELS[mode]}</span>
                  </div>
                ))}
              </div>

              {/* Avanzar Button */}
              {simulationState !== 'complete' && (
                <motion.div
                  className={styles.avanzarContainer}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <button
                    className={styles.avanzarButton}
                    onClick={advanceStage}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <><Loader2 size={18} className={styles.spinner} /> Procesando Etapa...</>
                    ) : (
                      <><ChevronRight size={18} /> Avanzar al Siguiente Paso</>
                    )}
                  </button>
                </motion.div>
              )}

              {/* Status banner */}
              {isProcessing && (
                <div className={styles.statusBanner} style={{ borderColor: 'rgba(1,117,216,0.3)', background: 'rgba(1,117,216,0.06)' }}>
                  <Loader2 size={16} className={styles.spinner} style={{ color: '#0175D8' }} />
                  <span style={{ color: '#0175D8' }}>Procesando etapa...</span>
                </div>
              )}
              {simulationState === 'complete' && (
                <div className={styles.statusBanner} style={{ borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.06)' }}>
                  <CheckCircle size={16} style={{ color: '#22c55e' }} />
                  <span style={{ color: '#22c55e' }}>Simulación Completa,Todas las etapas ejecutadas exitosamente</span>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* ================================================================ */}
        {/* SECTION 4: STAGE DETAIL PANEL                                    */}
        {/* ================================================================ */}

        <AnimatePresence>
          {showStageDetail && claimConfig && (
            <motion.section
              key={showStageDetail}
              className={styles.stagePanel}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              <div className={styles.stagePanelHeader}>
                <h3 className={styles.stagePanelTitle}>
                  {claimConfig.stages.find((s) => s.id === showStageDetail)?.icon}
                  <span style={{ marginLeft: 8 }}>
                    {showStageDetail === 'validaciones' && 'Validaciones Iniciales'}
                    {showStageDetail === 'elegibilidad' && 'Evaluación de Elegibilidad'}
                    {showStageDetail === 'triaje' && 'Triaje Inteligente'}
                    {showStageDetail === 'dictamen-medico' && 'Dictamen Médico'}
                    {showStageDetail === 'pago' && 'Pago y Liquidación'}
                  </span>
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {renderModeBadge(claimConfig.stages.find((s) => s.id === showStageDetail)?.mode ?? 'manual')}
                  <span
                    className={styles.stagePanelBadge}
                    style={{
                      background: stageStatuses[showStageDetail] === 'complete' ? 'rgba(34,197,94,0.14)' : stageStatuses[showStageDetail] === 'active' ? 'rgba(1,117,216,0.14)' : 'rgba(148,163,184,0.14)',
                      color: stageStatuses[showStageDetail] === 'complete' ? '#22c55e' : stageStatuses[showStageDetail] === 'active' ? '#0175D8' : '#94a3b8',
                      border: `1px solid ${stageStatuses[showStageDetail] === 'complete' ? 'rgba(34,197,94,0.25)' : stageStatuses[showStageDetail] === 'active' ? 'rgba(1,117,216,0.25)' : 'rgba(148,163,184,0.25)'}`,
                    }}
                  >
                    {stageStatuses[showStageDetail] === 'complete' && 'Completado'}
                    {stageStatuses[showStageDetail] === 'active' && 'En Proceso'}
                    {stageStatuses[showStageDetail] === 'pending' && 'Pendiente'}
                    {stageStatuses[showStageDetail] === 'skipped' && 'Omitido'}
                  </span>
                </div>
              </div>
              <div className={styles.stageContent}>
                {renderStageDetailContent(showStageDetail)}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ================================================================ */}
        {/* SECTION 5: ANALYTICS OVERLAY                                     */}
        {/* ================================================================ */}

        <AnimatePresence>
          {claimConfig && (simulationState === 'running' || simulationState === 'complete') && (
            <motion.section
              className={styles.analyticsBar}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.4 }}
            >
              <h3 className={styles.analyticsTitle}>
                <BarChart3 size={16} /> Analitica del Reclamo
              </h3>
              <div className={styles.analyticsGrid}>
                <div className={styles.analyticsMetric}>
                  <div className={styles.analyticsMetricIcon}>
                    <Cpu size={18} style={{ color: '#0175D8' }} />
                  </div>
                  <div>
                    <span className={styles.analyticsMetricLabel}>Nivel de Automatizacion</span>
                    <span className={styles.analyticsMetricValue}>{fmtPercent(claimConfig.analitica.automatizacion)}</span>
                  </div>
                  <div className={styles.progressBar} style={{ marginTop: 4 }}>
                    <div className={styles.progressBarFill} style={{ width: `${claimConfig.analitica.automatizacion}%`, background: '#0175D8' }} />
                  </div>
                </div>
                <div className={styles.analyticsMetric}>
                  <div className={styles.analyticsMetricIcon}>
                    <Users size={18} style={{ color: '#3b82f6' }} />
                  </div>
                  <div>
                    <span className={styles.analyticsMetricLabel}>Intervencion Humana</span>
                    <span className={styles.analyticsMetricValue}>{claimConfig.analitica.tiempoHumano}</span>
                  </div>
                </div>
                <div className={styles.analyticsMetric}>
                  <div className={styles.analyticsMetricIcon}>
                    <AlertTriangle size={18} style={{ color: claimConfig.analitica.riesgoResidual > 50 ? '#ef4444' : claimConfig.analitica.riesgoResidual > 20 ? '#0175D8' : '#22c55e' }} />
                  </div>
                  <div>
                    <span className={styles.analyticsMetricLabel}>Riesgo Residual</span>
                    <span className={styles.analyticsMetricValue}>{fmtPercent(claimConfig.analitica.riesgoResidual)}</span>
                  </div>
                  <div className={styles.progressBar} style={{ marginTop: 4 }}>
                    <div
                      className={styles.progressBarFill}
                      style={{
                        width: `${claimConfig.analitica.riesgoResidual}%`,
                        background: claimConfig.analitica.riesgoResidual > 50 ? '#ef4444' : claimConfig.analitica.riesgoResidual > 20 ? '#0175D8' : '#22c55e',
                      }}
                    />
                  </div>
                </div>
                <div className={styles.analyticsMetric}>
                  <div className={styles.analyticsMetricIcon}>
                    <DollarSign size={18} style={{ color: '#22c55e' }} />
                  </div>
                  <div>
                    <span className={styles.analyticsMetricLabel}>Ahorro Generado</span>
                    <span className={styles.analyticsMetricValue} style={{ color: '#22c55e' }}>{fmtCurrency(claimConfig.analitica.ahorro)}</span>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ================================================================ */}
        {/* SECTION 6: COMPARE NOTE                                          */}
        {/* ================================================================ */}

        {/* ================================================================ */}
        {/* HOJA RESUMEN: appears only when all stages are complete          */}
        {/* ================================================================ */}

        {simulationState === 'complete' && claimConfig && selectedCaseId && currentCase && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className={styles.stageSummarySection}>
              <h3 className={styles.stageSummaryTitle}><FileText size={18} /> Hoja Resumen del Dictamen</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Resumen consolidado de todos los procesos ejecutados para el caso {currentCase.folioId}
              </p>

              {/* Summary cards for each stage */}
              <div className={styles.stageSummaryGrid}>
                {claimConfig.stages.map(stage => {
                  const summary = generateStageSummary(stage.id, claimConfig);
                  return (
                    <div
                      key={stage.id}
                      className={`${styles.stageSummaryCard} ${summary.needsInput ? styles.stageSummaryCardAlert : ''}`}
                    >
                      <div className={styles.stageSummaryCardHeader}>
                        <span className={styles.stageSummaryCardIcon}>{stage.icon}</span>
                        <span className={styles.stageSummaryCardLabel}>{stage.label}</span>
                        <span className={styles.stageSummaryCardBadge}><CheckCircle size={12} /> Completado</span>
                      </div>
                      <ul className={styles.stageSummaryBullets}>
                        {summary.bullets.map((b, i) => <li key={i}>{b}</li>)}
                      </ul>
                      <div className={styles.stageSummaryActions}>
                        <button className={styles.stageSummaryPdfBtn} onClick={() => setShowStageDetail(stage.id)}>
                          <FileText size={13} /> Ver Detalle
                        </button>
                        {summary.needsInput && (
                          <button className={styles.stageSummaryInputBtn} onClick={() => { setShowStageDetail(stage.id); setShowSidePanel(true); }}>
                            <AlertTriangle size={13} /> {summary.inputReason}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Financial summary */}
              <div className={styles.stageSummaryCard} style={{ marginTop: 16, borderColor: 'rgba(1,117,216,0.25)' }}>
                <div className={styles.stageSummaryCardHeader}>
                  <span className={styles.stageSummaryCardIcon}><DollarSign size={16} /></span>
                  <span className={styles.stageSummaryCardLabel}>Resumen Financiero</span>
                </div>
                <ul className={styles.stageSummaryBullets}>
                  <li>Monto reclamado: {fmtCurrency(claimConfig.dictamenMedico.resumenFinanciero.montoReclamado)}</li>
                  <li>Deducible aplicado: {fmtCurrency(claimConfig.dictamenMedico.resumenFinanciero.deducible)}</li>
                  <li>Coaseguro ({claimConfig.dictamenMedico.resumenFinanciero.coaseguroPct}%): {fmtCurrency(claimConfig.dictamenMedico.resumenFinanciero.totalCargoAsegurado - claimConfig.dictamenMedico.resumenFinanciero.deducible)}</li>
                  <li>Total cargo asegurado: {fmtCurrency(claimConfig.dictamenMedico.resumenFinanciero.totalCargoAsegurado)}</li>
                  <li><strong>Total a pagar por aseguradora: {fmtCurrency(claimConfig.dictamenMedico.resumenFinanciero.totalCargoAseguradora)}</strong></li>
                  <li>Suma asegurada remanente: {fmtCurrency(claimConfig.dictamenMedico.resumenFinanciero.sumaAseguradaRemanente)}</li>
                </ul>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button className={styles.stageSummaryPdfBtn} style={{ padding: '10px 20px', fontSize: '0.8rem' }} onClick={() => {
                  if (claimConfig) downloadMasterPDF(claimConfig);
                }}>
                  <FileText size={14} /> Descargar Expediente PDF
                </button>
                <button className={styles.parrillaEnterBtn} onClick={handleBackToParrilla}>
                  <ArrowLeft size={14} /> Volver a Parrilla
                </button>
              </div>
            </div>
          </motion.div>
        )}

      </div>

      {/* ================================================================ */}
      {/* SIDE PANEL,Dictaminador Input                                  */}
      {/* ================================================================ */}
      <AnimatePresence>
        {showSidePanel && claimConfig && showStageDetail && (
          <>
            <motion.div
              className={styles.sidePanelOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidePanel(false)}
            />
            <motion.div
              className={styles.sidePanel}
              initial={{ x: 380 }}
              animate={{ x: 0 }}
              exit={{ x: 380 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className={styles.sidePanelHeader}>
                <div>
                  <h3 className={styles.sidePanelTitle}><AlertTriangle size={16} /> Acción Requerida</h3>
                  <span className={styles.sidePanelStage}>{claimConfig.stages.find(s => s.id === showStageDetail)?.label}</span>
                </div>
                <button className={styles.sidePanelClose} onClick={() => setShowSidePanel(false)}>✕</button>
              </div>
              <div className={styles.sidePanelBody}>
                {/* Validaciones,low confidence fields */}
                {showStageDetail === 'validaciones' && (
                  <div>
                    <p className={styles.sidePanelDesc}>Los siguientes campos tienen confianza OCR baja. Verifique o corrija los valores extraídos:</p>
                    {claimConfig.validaciones.transcripcion.filter(t => t.confianza < 85).map((t, i) => (
                      <div key={i} className={styles.sidePanelField}>
                        <div className={styles.sidePanelFieldHeader}>
                          <span className={styles.sidePanelFieldLabel}>{t.campo}</span>
                          <span className={styles.sidePanelFieldConf} style={{ color: t.confianza < 60 ? '#ef4444' : '#f59e0b' }}>{t.confianza}% confianza</span>
                        </div>
                        <div className={styles.sidePanelFieldValue}>{t.valor}</div>
                        <div className={styles.sidePanelFieldActions}>
                          <button className={styles.sidePanelAccept}><CheckCircle size={14} /> Aceptar</button>
                          <button className={styles.sidePanelCorrect}><Scale size={14} /> Corregir</button>
                        </div>
                      </div>
                    ))}
                    {claimConfig.validaciones.transcripcion.filter(t => t.confianza < 85).length === 0 && (
                      <div className={styles.sidePanelNoAction}>
                        <CheckCircle size={18} style={{ color: '#22c55e' }} />
                        <span>Todos los campos tienen confianza aceptable. No se requiere acción.</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Elegibilidad,approve/reject */}
                {showStageDetail === 'elegibilidad' && (
                  <div>
                    <p className={styles.sidePanelDesc}>Dictamen preliminar de elegibilidad:</p>
                    <div className={styles.sidePanelDictamen}>{claimConfig.elegibilidad.dictamenPreliminar}</div>
                    <div className={styles.sidePanelFieldInfo}>
                      <div>Deducible: <strong>{fmtCurrency(claimConfig.elegibilidad.deducible)}</strong></div>
                      <div>Coaseguro: <strong>{claimConfig.elegibilidad.coaseguro}%</strong></div>
                    </div>
                    {dictamenAprobado === null ? (
                      <div className={styles.sidePanelActions}>
                        <button className={styles.sidePanelApprove} onClick={() => { setDictamenAprobado(true); setShowSidePanel(false); }}>
                          <CheckCircle size={16} /> Aprobar Dictamen
                        </button>
                        <button className={styles.sidePanelReject} onClick={() => { setDictamenAprobado(false); setShowSidePanel(false); }}>
                          <AlertTriangle size={16} /> Rechazar
                        </button>
                      </div>
                    ) : (
                      <div className={styles.sidePanelResult} style={{ borderColor: dictamenAprobado ? '#22c55e' : '#ef4444' }}>
                        {dictamenAprobado ? <><CheckCircle size={16} style={{ color: '#22c55e' }} /> Dictamen aprobado</> : <><AlertTriangle size={16} style={{ color: '#ef4444' }} /> Dictamen rechazado</>}
                      </div>
                    )}
                  </div>
                )}

                {/* Dictamen Médico,pertinence review */}
                {showStageDetail === 'dictamen-medico' && (
                  <div>
                    <p className={styles.sidePanelDesc}>Revisión de pertinencia clínica:</p>
                    <div className={styles.sidePanelChecks}>
                      {claimConfig.dictamenMedico.checksPertinencia.map((check, i) => (
                        <div key={i} className={styles.sidePanelCheckItem}>
                          <CheckCircle size={14} style={{ color: '#22c55e' }} />
                          <span>{check}</span>
                        </div>
                      ))}
                    </div>
                    <p className={styles.sidePanelDesc} style={{ marginTop: 16 }}>Insumos a aprobar:</p>
                    {claimConfig.dictamenMedico.insumos.map((ins, i) => (
                      <div key={i} className={styles.sidePanelField}>
                        <div className={styles.sidePanelFieldLabel}>{ins.nombre}</div>
                        {ins.checks.map((c, j) => (
                          <div key={j} className={styles.sidePanelCheckItem} style={{ fontSize: '0.75rem' }}>
                            <CheckCircle size={12} style={{ color: c.startsWith('FALLA') ? '#ef4444' : '#22c55e' }} />
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    <div className={styles.sidePanelActions} style={{ marginTop: 16 }}>
                      <button className={styles.sidePanelApprove} onClick={() => setShowSidePanel(false)}>
                        <CheckCircle size={16} /> Confirmar Pertinencia
                      </button>
                    </div>
                  </div>
                )}

                {/* Pago,final authorization */}
                {showStageDetail === 'pago' && (
                  <div>
                    <p className={styles.sidePanelDesc}>Autorización de pago final:</p>
                    <div className={styles.sidePanelFieldInfo}>
                      <div>Monto reclamado: <strong>{fmtCurrency(claimConfig.dictamenMedico.resumenFinanciero.montoReclamado)}</strong></div>
                      <div>Deducible: <strong>-{fmtCurrency(claimConfig.dictamenMedico.resumenFinanciero.deducible)}</strong></div>
                      <div>Coaseguro: <strong>-{fmtCurrency(claimConfig.dictamenMedico.resumenFinanciero.totalCargoAsegurado - claimConfig.dictamenMedico.resumenFinanciero.deducible)}</strong></div>
                      <div style={{ fontSize: '1.1rem', color: '#0175D8', fontWeight: 700, marginTop: 8 }}>Total a pagar: {fmtCurrency(claimConfig.pago.montoFinal)}</div>
                    </div>
                    {pagoAprobado === null ? (
                      <div className={styles.sidePanelActions}>
                        <button className={styles.sidePanelApprove} onClick={() => { setPagoAprobado(true); setShowSidePanel(false); }}>
                          <CheckCircle size={16} /> Aprobar Pago,{fmtCurrency(claimConfig.pago.montoFinal)}
                        </button>
                        <button className={styles.sidePanelReject} onClick={() => { setPagoAprobado(false); setShowSidePanel(false); }}>
                          <AlertTriangle size={16} /> Rechazar
                        </button>
                      </div>
                    ) : (
                      <div className={styles.sidePanelResult} style={{ borderColor: pagoAprobado ? '#22c55e' : '#ef4444' }}>
                        {pagoAprobado ? <><CheckCircle size={16} style={{ color: '#22c55e' }} /> Pago aprobado</> : <><AlertTriangle size={16} style={{ color: '#ef4444' }} /> Pago rechazado</>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default E2EClaimsWorkstation;
