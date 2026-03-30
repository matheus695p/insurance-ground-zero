// ============================================================================
// ProviderRankingWorkstation V2 — Gestión de Proveedores Hospitalarios (GNP-GMM)
// Claims Management domain accent: #f59e0b (amber)
// 7-Category Analysis + Negotiation Coach + Cost Evolution + Agentic Flows
// ============================================================================

import { useState, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Bot, TrendingUp, TrendingDown, Minus, DollarSign, Activity,
  BarChart3, Send, Loader2, AlertTriangle, Shield, Search, MapPin,
  Building2, FileText, Zap, Download, X, CheckCircle2,
  Target, Clock, Package, Stethoscope, FileCheck, MessageSquare,
  Cpu, ChevronDown, ChevronUp,
} from 'lucide-react';
import { getUseCase } from '../data/domains';
import Breadcrumb from '../components/Breadcrumb';
import AgentProcessFlow from '../components/AgentProcessFlow';
import { useAIChat } from '../hooks/useAIChat';
import styles from './ProviderRankingWorkstation.module.css';

// Import from V2 data
import {
  hospitals, negotiationOpportunities,
  CATEGORY_DEFINITIONS, costEvolution, statesDataV2, hospitalCategoryAnalyses, negotiationArguments,
} from '../data/providers/provider-ranking-data-v2';
import { mexicoStates, MEXICO_VIEWBOX } from '../data/mexico-map-data';
import type {
  Hospital,
  AnalysisCategory, NegotiationArgument,
} from '../data/providers/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number, decimals = 0): string =>
  n.toLocaleString('es-MX', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

const fmtMXN = (n: number): string => {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
};

const getScoreClass = (score: number): string => {
  if (score >= 4) return styles.scoreExcellent;
  if (score >= 3) return styles.scoreGood;
  if (score >= 2.5) return styles.scoreAverage;
  if (score >= 2) return styles.scorePoor;
  return styles.scoreCritical;
};

const getLevelClass = (level: string) =>
  level === 'P100' ? styles.levelP100 : level === 'P200' ? styles.levelP200 : styles.levelP300;

const getSegmentClass = (segment: string) =>
  segment === 'Premier' ? styles.segmentPremier : styles.segmentFlexibles;

const getTrendIcon = (trend: string) => {
  if (trend === 'up') return <TrendingUp size={12} className={styles.trendUp} />;
  if (trend === 'down') return <TrendingDown size={12} className={styles.trendDown} />;
  return <Minus size={12} className={styles.trendStable} />;
};

const getMapColor = (score: number): string => {
  if (score >= 3.5) return '#22c55e';
  if (score >= 3.0) return '#84cc16';
  if (score >= 2.5) return '#f59e0b';
  if (score >= 2.0) return '#f97316';
  return '#ef4444';
};

const getSavingsColor = (savings: number): string => {
  if (savings >= 100_000_000) return '#ef4444';
  if (savings >= 50_000_000) return '#f97316';
  if (savings >= 20_000_000) return '#f59e0b';
  return '#84cc16';
};

const getPriorityClass = (p: string) => {
  const m: Record<string, string> = { critical: styles.priorityCritical, high: styles.priorityHigh, medium: styles.priorityMedium, low: styles.priorityLow };
  return m[p] ?? '';
};
const getComplexityClass = (c: string) => {
  const m: Record<string, string> = { high: styles.complexityHigh, medium: styles.complexityMedium, low: styles.complexityLow };
  return m[c] ?? '';
};
const getStatusClass = (s: string) => {
  const m: Record<string, string> = { identified: styles.statusIdentified, 'in-analysis': styles.statusInAnalysis, 'proposal-ready': styles.statusProposalReady, negotiating: styles.statusNegotiating, agreed: styles.statusAgreed, implemented: styles.statusImplemented, closed: styles.statusClosed };
  return m[s] ?? '';
};
const getStatusLabel = (s: string) => {
  const m: Record<string, string> = { identified: 'Identificada', 'in-analysis': 'En Analisis', 'proposal-ready': 'Propuesta Lista', negotiating: 'Negociando', agreed: 'Acordada', implemented: 'Implementada', closed: 'Cerrada' };
  return m[s] ?? s;
};

const categoryLabelMap: Record<string, string> = {
  'pricing-deviation': 'Desviacion de Precios',
  'procedure-cost': 'Costo de Procedimientos',
  'supply-pricing': 'Precios de Insumos',
  utilization: 'Utilizacion',
  overutilization: 'Sobreutilizacion',
  'los-optimization': 'Optimizacion Estancia',
  'los-readmission': 'Estancia y Reingresos',
  'readmission-reduction': 'Reduccion Reingreso',
  'sla-breach': 'Incumplimiento SLA',
  'sla-compliance': 'Cumplimiento SLAs',
  'fraud-indicator': 'Indicador Fraude',
  bundling: 'Bundle Pricing',
  'pgnp-forfait': 'PGNP/Forfait',
  'supervision-dependency': 'Dep. Supervision',
  'supervision-corrections': 'Correcciones Supervision',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'procedure-cost': <Stethoscope size={14} />,
  'supply-pricing': <Package size={14} />,
  overutilization: <TrendingUp size={14} />,
  'los-readmission': <Clock size={14} />,
  'sla-compliance': <FileCheck size={14} />,
  'pgnp-forfait': <Target size={14} />,
  'supervision-corrections': <Shield size={14} />,
};

// Radar helper -- polar to cartesian
const polarToCart = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = (angleDeg - 90) * Math.PI / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

// ---------------------------------------------------------------------------
// Agentic Flow Definitions per Category (like E2E Claims dictaminación)
// ---------------------------------------------------------------------------

const CATEGORY_AGENT_FLOWS: Record<AnalysisCategory, { nodes: { id: string; type: 'data-source' | 'model' | 'agent' | 'action' | 'output'; label: string; description: string; details?: string[] }[]; connections: { from: string; to: string; label?: string }[] }> = {
  'procedure-cost': {
    nodes: [
      { id: 'data-ingest', type: 'data-source', label: 'Ingesta de Datos de Facturación', description: 'Extracción de costos por procedimiento CPT/ICD del hospital', details: ['Facturas U12M', 'Catálogo CPT/ICD', 'Volúmenes por procedimiento'] },
      { id: 'benchmark-engine', type: 'model', label: 'Motor de Benchmark', description: 'Comparación contra peers del mismo nivel y región', details: ['Peers P100/P200/P300', 'Ajuste por case-mix', 'Percentil 50 y 75'] },
      { id: 'gap-agent', type: 'agent', label: 'Agente de Detección de Brechas', description: 'Identifica procedimientos con desviación significativa', details: ['Umbral >10% sobre benchmark', 'Priorización por impacto $', 'Análisis de tendencia'] },
      { id: 'impact-calc', type: 'action', label: 'Cálculo de Impacto Financiero', description: 'Cuantifica potencial de contención por procedimiento', details: ['Gap × Volumen = Impacto', 'Escenarios conservador/agresivo'] },
      { id: 'script-gen', type: 'agent', label: 'Generador de Script de Negociación', description: 'Construye argumentario con datos de soporte', details: ['Argumentos basados en evidencia', 'Propuesta de tarifa objetivo', 'Datos comparativos'] },
      { id: 'output', type: 'output', label: 'Fact Pack + Script Listo', description: 'Documento de negociación generado', details: ['PDF descargable', 'Script de apertura', 'Datos de respaldo'] },
    ],
    connections: [
      { from: 'data-ingest', to: 'benchmark-engine', label: 'Costos extraídos' },
      { from: 'benchmark-engine', to: 'gap-agent', label: 'Benchmarks calculados' },
      { from: 'gap-agent', to: 'impact-calc', label: 'Brechas detectadas' },
      { from: 'impact-calc', to: 'script-gen', label: 'Impacto cuantificado' },
      { from: 'script-gen', to: 'output', label: 'Script generado' },
    ],
  },
  'supply-pricing': {
    nodes: [
      { id: 'supply-data', type: 'data-source', label: 'Base de Precios de Insumos', description: 'Catálogo de insumos médicos con precios del hospital', details: ['Prótesis', 'Material quirúrgico', 'Medicamentos especializados'] },
      { id: 'market-bench', type: 'model', label: 'Benchmark de Mercado', description: 'Precios de referencia por tipo de insumo', details: ['Precios IMSS/ISSSTE', 'Precios de compra consolidada', 'Tendencia de precios'] },
      { id: 'anomaly-agent', type: 'agent', label: 'Agente de Anomalías de Precio', description: 'Detecta insumos con sobreprecios vs mercado', details: ['Detección de outliers', 'Análisis por categoría', 'Historial de precios'] },
      { id: 'negotiation-agent', type: 'agent', label: 'Agente de Estrategia de Negociación', description: 'Define palancas y argumentos por insumo', details: ['Alternativas genéricas', 'Compra consolidada', 'Contratos marco'] },
      { id: 'output', type: 'output', label: 'Propuesta de Renegociación', description: 'Documento con precios objetivo por insumo' },
    ],
    connections: [
      { from: 'supply-data', to: 'market-bench', label: 'Precios actuales' },
      { from: 'market-bench', to: 'anomaly-agent', label: 'Gaps identificados' },
      { from: 'anomaly-agent', to: 'negotiation-agent', label: 'Insumos priorizados' },
      { from: 'negotiation-agent', to: 'output', label: 'Estrategia lista' },
    ],
  },
  'overutilization': {
    nodes: [
      { id: 'claims-data', type: 'data-source', label: 'Datos de Utilización por Caso', description: 'Frecuencia de actos médicos por caso clínico', details: ['Laboratorios', 'Imagen', 'Procedimientos', 'Consultas'] },
      { id: 'pattern-model', type: 'model', label: 'Modelo de Patrones Clínicos', description: 'Frecuencia esperada por diagnóstico y procedimiento', details: ['Guías clínicas GPC', 'Patrones de peers', 'Ajuste por severidad'] },
      { id: 'overuse-agent', type: 'agent', label: 'Agente de Detección de Sobreuso', description: 'Identifica actos con frecuencia anómala', details: ['Sobre-uso >15%', 'Patrones repetitivos', 'Correlación con médicos'] },
      { id: 'root-cause', type: 'agent', label: 'Agente de Causa Raíz', description: 'Analiza drivers del sobreuso', details: ['Medicina defensiva', 'Incentivos perversos', 'Protocolos desactualizados'] },
      { id: 'output', type: 'output', label: 'Plan de Contención + Script', description: 'Propuesta de protocolos y argumentos' },
    ],
    connections: [
      { from: 'claims-data', to: 'pattern-model', label: 'Datos de frecuencia' },
      { from: 'pattern-model', to: 'overuse-agent', label: 'Desviaciones' },
      { from: 'overuse-agent', to: 'root-cause', label: 'Actos priorizados' },
      { from: 'root-cause', to: 'output', label: 'Análisis completo' },
    ],
  },
  'los-readmission': {
    nodes: [
      { id: 'admission-data', type: 'data-source', label: 'Datos de Estancia y Reingresos', description: 'ALOS por procedimiento y tasas de reingreso', details: ['Días de estancia', 'Reingresos <30 días', 'Complicaciones'] },
      { id: 'clinical-model', type: 'model', label: 'Modelo Clínico de Estancia Esperada', description: 'ALOS esperado por diagnóstico y severidad', details: ['Benchmarks internacionales', 'Ajuste por comorbilidades'] },
      { id: 'efficiency-agent', type: 'agent', label: 'Agente de Eficiencia Hospitalaria', description: 'Detecta estancias prolongadas y reingresos evitables', details: ['Exceso de días', 'Reingresos prevenibles', 'Costo por día extra'] },
      { id: 'output', type: 'output', label: 'Propuesta de Optimización de Estancia', description: 'Metas de ALOS y plan de reducción de reingresos' },
    ],
    connections: [
      { from: 'admission-data', to: 'clinical-model', label: 'Datos de estancia' },
      { from: 'clinical-model', to: 'efficiency-agent', label: 'Brechas detectadas' },
      { from: 'efficiency-agent', to: 'output', label: 'Propuesta generada' },
    ],
  },
  'sla-compliance': {
    nodes: [
      { id: 'contract-data', type: 'data-source', label: 'Datos Contractuales y KPIs', description: 'SLAs pactados y métricas de cumplimiento', details: ['Tiempos de respuesta', 'Tasas de rechazo', 'Calidad documental'] },
      { id: 'compliance-engine', type: 'model', label: 'Motor de Cumplimiento', description: 'Evaluación automática de cada SLA', details: ['Cumple/Incumple', 'Tendencia 6 meses', 'Penalizaciones aplicables'] },
      { id: 'penalty-agent', type: 'agent', label: 'Agente de Penalizaciones', description: 'Calcula penalizaciones y genera evidencia', details: ['Monto de penalización', 'Evidencia documental', 'Historial de incumplimientos'] },
      { id: 'output', type: 'output', label: 'Reporte de Incumplimientos + Script', description: 'Documento para mesa de negociación con penalizaciones' },
    ],
    connections: [
      { from: 'contract-data', to: 'compliance-engine', label: 'KPIs evaluados' },
      { from: 'compliance-engine', to: 'penalty-agent', label: 'Incumplimientos' },
      { from: 'penalty-agent', to: 'output', label: 'Reporte listo' },
    ],
  },
  'pgnp-forfait': {
    nodes: [
      { id: 'pathology-data', type: 'data-source', label: 'Datos de Patologías y Costos', description: 'Volumen, costo promedio y variabilidad por patología', details: ['Código CIE', 'Volumen anual', 'CV% de costos'] },
      { id: 'clustering-model', type: 'model', label: 'Modelo de Clustering de Patologías', description: 'Agrupa patologías candidatas a forfait', details: ['Alto volumen + baja variabilidad', 'Costo predecible', 'Benchmark de forfait'] },
      { id: 'forfait-agent', type: 'agent', label: 'Agente de Diseño de Forfait', description: 'Calcula tarifa forfait y contención esperada', details: ['Tarifa propuesta', 'Contención vs fee-for-service', 'Riesgo para hospital'] },
      { id: 'output', type: 'output', label: 'Propuesta de Paquetes PGNP/Forfait', description: 'Tarifas por patología con business case' },
    ],
    connections: [
      { from: 'pathology-data', to: 'clustering-model', label: 'Datos de patologías' },
      { from: 'clustering-model', to: 'forfait-agent', label: 'Candidatos identificados' },
      { from: 'forfait-agent', to: 'output', label: 'Propuesta lista' },
    ],
  },
  'supervision-corrections': {
    nodes: [
      { id: 'supervision-data', type: 'data-source', label: 'Datos de Supervisión Hospitalaria', description: 'Correcciones aplicadas por supervisores GNP', details: ['Tipo de corrección', 'Frecuencia', 'Monto corregido'] },
      { id: 'pattern-model', type: 'model', label: 'Modelo de Patrones Estructurales', description: 'Distingue correcciones puntuales de estructurales', details: ['Recurrencia', 'Tendencia temporal', 'Correlación con médicos'] },
      { id: 'risk-agent', type: 'agent', label: 'Agente de Riesgo de Facturación', description: 'Evalúa riesgo de facturación indebida', details: ['Score de riesgo', 'Evidencia acumulada', 'Recomendación de acción'] },
      { id: 'output', type: 'output', label: 'Reporte de Correcciones + Plan de Acción', description: 'Documento con evidencia y propuesta de mejora' },
    ],
    connections: [
      { from: 'supervision-data', to: 'pattern-model', label: 'Correcciones analizadas' },
      { from: 'pattern-model', to: 'risk-agent', label: 'Patrones detectados' },
      { from: 'risk-agent', to: 'output', label: 'Reporte generado' },
    ],
  },
};

// Full argumentative negotiation text builder per category
const buildFullArgumentText = (category: AnalysisCategory, hospitalName: string, args: NegotiationArgument[]): { title: string; sections: { heading: string; body: string }[] }[] => {
  const results: { title: string; sections: { heading: string; body: string }[] }[] = [];

  if (args.length === 0) {
    const catDef = CATEGORY_DEFINITIONS.find(c => c.id === category);
    results.push({
      title: `Argumento de Negociación — ${catDef?.name ?? category}`,
      sections: [
        { heading: 'Contexto', body: `No se han identificado desviaciones significativas en la categoría de ${catDef?.name?.toLowerCase() ?? category} para ${hospitalName}. Se recomienda monitoreo continuo y revisión en el próximo ciclo de evaluación.` },
      ],
    });
    return results;
  }

  for (const arg of args) {
    const supportLines = arg.supportData.map(d => `${d.label}: Hospital ${d.hospitalValue} vs Benchmark ${d.peerValue} (${d.gap})`).join('; ');

    results.push({
      title: `${arg.lever}`,
      sections: [
        {
          heading: 'Contexto y Hallazgo',
          body: `${arg.context}. Este hallazgo se basa en un análisis exhaustivo de los últimos 12 meses de facturación de ${hospitalName}, comparado contra el panel de hospitales del mismo nivel y región geográfica. La desviación identificada no es un evento aislado sino un patrón consistente que se ha mantenido durante al menos 3 trimestres consecutivos, lo que indica una oportunidad estructural de mejora.`,
        },
        {
          heading: 'Argumentos de Valor',
          body: arg.arguments.map((a, i) => `${i + 1}. ${a}`).join('\n\n') + `\n\nEn conjunto, estos factores representan una oportunidad concreta y cuantificable de optimización que beneficia a ambas partes: al hospital le permite alinearse con las mejores prácticas del mercado, y a GNP le permite mantener la sostenibilidad de la red de proveedores y ofrecer mejores condiciones a sus asegurados.`,
        },
        {
          heading: 'Evidencia Cuantitativa',
          body: `Los datos respaldan de manera contundente esta negociación. ${supportLines}. Esta información proviene de nuestro sistema de analytics que procesa más de 2 millones de registros de facturación anuales, garantizando la robustez estadística del benchmark. Los datos han sido validados por el equipo de supervisión hospitalaria y el área actuarial de GNP.`,
        },
        {
          heading: 'Propuesta Concreta',
          body: `${arg.proposal}\n\nEsta propuesta ha sido diseñada para ser implementable de forma gradual, minimizando el impacto operativo para ${hospitalName}. Proponemos un periodo de transición de 90 días con revisiones mensuales de avance, y un mecanismo de ajuste que considere factores como inflación médica, cambios en el case-mix y mejoras en calidad documentadas.`,
        },
        {
          heading: 'Beneficio Mutuo y Cierre',
          body: `Reconocemos que ${hospitalName} es un socio estratégico para GNP y esta negociación busca fortalecer la relación a largo plazo. A cambio de la alineación tarifaria propuesta, GNP está dispuesto a ofrecer: (1) incremento en el volumen de derivación de pacientes, (2) tiempos de pago preferentes a 15 días, (3) inclusión en programas de referencia prioritaria, y (4) acceso a herramientas de analytics compartidas para monitoreo conjunto de KPIs. Nuestra meta es construir un acuerdo ganar-ganar que sea sostenible en el tiempo.`,
        },
      ],
    });
  }

  return results;
};

// Negotiation script templates per category
const NEGOTIATION_SCRIPTS: Record<AnalysisCategory, (hospitalName: string, args: NegotiationArgument[]) => string[]> = {
  'procedure-cost': (hospitalName, args) => {
    const topArg = args[0];
    return [
      `APERTURA: "Estimado equipo de ${hospitalName}, agradecemos profundamente la relación de confianza que hemos construido a lo largo de los años. Hoy queremos revisar juntos las tarifas de procedimientos clave donde nuestro análisis de más de 20 hospitales del mismo nivel ha identificado oportunidades claras de alineación con el mercado. Nuestro objetivo no es reducir costos de forma unilateral, sino encontrar un punto de equilibrio que sea justo para ambas partes y que nos permita seguir creciendo juntos."`,
      `EVIDENCIA: "Nuestro equipo de analytics ha procesado la facturación completa de los últimos 12 meses y la ha comparado contra el panel de peers. ${topArg?.context ?? 'Los resultados muestran brechas significativas en procedimientos de alto volumen'}. Estos datos han sido validados por nuestro equipo actuarial y de supervisión hospitalaria, y estamos preparados para compartir el detalle completo con ustedes para total transparencia."`,
      `PROPUESTA: "${topArg?.proposal ?? 'Proponemos un ajuste gradual de tarifas hacia el percentil 75 del mercado, con revisión trimestral y mecanismos de ajuste por inflación médica'}. Adicionalmente, estamos dispuestos a ofrecer un incremento del 15% en derivación de pacientes y tiempos de pago preferentes a 15 días como contrapartida."`,
      `CIERRE: "Creemos firmemente que esta alineación beneficia a ambas partes. Para ${hospitalName} significa mayor volumen y predictibilidad de ingresos; para GNP significa sostenibilidad de la red. ¿Podemos trabajar juntos en un calendario de implementación con hitos trimestrales y una primera revisión a los 90 días?"`,
    ];
  },
  'supply-pricing': (hospitalName, args) => {
    const topArg = args[0];
    return [
      `APERTURA: "Equipo de ${hospitalName}, hemos realizado un benchmark exhaustivo de precios de insumos médicos comparando contra más de 15 proveedores del mismo nivel y queremos compartir los hallazgos de manera transparente. Entendemos que los costos de insumos están sujetos a múltiples factores, y por eso queremos trabajar juntos en soluciones que beneficien a ambas partes."`,
      `EVIDENCIA: "${topArg?.context ?? 'Nuestro análisis identifica insumos específicos con precios significativamente por encima del benchmark de mercado'}. Hemos documentado cada caso con datos de volumen, precio unitario y comparativa contra al menos 5 proveedores de referencia. Los datos están disponibles para revisión conjunta."`,
      `PROPUESTA: "${topArg?.proposal ?? 'Proponemos adoptar precios de referencia alineados al mercado para los insumos de mayor impacto, con posibilidad de acceder a contratos marco de compra consolidada de GNP que les permitirían obtener mejores condiciones con sus propios proveedores'}."`,
      `CIERRE: "Podemos facilitar el acceso a nuestros contratos marco con proveedores de insumos, lo que les permitiría reducir sus propios costos de adquisición. Esto es un beneficio directo para ${hospitalName}. ¿Acordamos una revisión conjunta del catálogo de insumos prioritarios en las próximas 2 semanas?"`,
    ];
  },
  'overutilization': (hospitalName, args) => {
    const topArg = args[0];
    return [
      `APERTURA: "Estimados colegas de ${hospitalName}, queremos abordar un tema de eficiencia clínica que es fundamental tanto para la calidad de atención al paciente como para la sostenibilidad de nuestro convenio. Hemos identificado patrones de utilización que difieren de las guías de práctica clínica y de los patrones observados en hospitales comparables."`,
      `EVIDENCIA: "${topArg?.context ?? 'Nuestro análisis detecta patrones de utilización de actos médicos por encima de las guías clínicas GPC y de peers comparables'}. Queremos enfatizar que no cuestionamos la práctica médica individual, sino que buscamos entender los drivers sistémicos detrás de estas desviaciones y trabajar juntos en protocolos que optimicen la atención."`,
      `PROPUESTA: "${topArg?.proposal ?? 'Proponemos implementar protocolos de práctica basados en evidencia con monitoreo conjunto trimestral, incluyendo un comité médico mixto que revise los casos de mayor desviación'}. GNP está dispuesto a invertir en herramientas de decision support y capacitación conjunta."`,
      `CIERRE: "La eficiencia clínica es un objetivo compartido. Proponemos iniciar con un comité médico conjunto que se reúna mensualmente para revisar los protocolos de los 5 actos médicos de mayor desviación. ¿Podemos agendar la primera sesión para las próximas 3 semanas?"`,
    ];
  },
  'los-readmission': (hospitalName, args) => {
    const topArg = args[0];
    return [
      `APERTURA: "Equipo de ${hospitalName}, la optimización de la estancia hospitalaria y la reducción de reingresos son prioridades compartidas que impactan directamente en la calidad de atención y en la eficiencia operativa de ambas organizaciones. Hemos preparado un análisis detallado que queremos revisar juntos."`,
      `EVIDENCIA: "${topArg?.context ?? 'Nuestros datos muestran estancias prolongadas y tasas de reingreso por encima del benchmark en procedimientos clave'}. El análisis cubre los 10 procedimientos de mayor volumen y compara contra el percentil 50 de hospitales del mismo nivel. Los días de estancia excedentes representan un costo significativo que podría reinvertirse en mejoras de calidad."`,
      `PROPUESTA: "${topArg?.proposal ?? 'Proponemos establecer metas de ALOS por procedimiento con incentivos por cumplimiento y un programa estructurado de seguimiento post-alta para reducir reingresos evitables'}. Incluimos un bono de desempeño del 3% sobre el monto facturado para los procedimientos que alcancen las metas de ALOS."`,
      `CIERRE: "Podemos compartir nuestros datos de benchmark detallados y co-diseñar un programa de alta temprana segura con seguimiento telefónico post-alta financiado por GNP. ¿Iniciamos con un piloto en los 3 procedimientos de mayor volumen durante el próximo trimestre?"`,
    ];
  },
  'sla-compliance': (hospitalName, args) => {
    const topArg = args[0];
    return [
      `APERTURA: "Equipo de ${hospitalName}, la revisión periódica del cumplimiento de SLAs contractuales es fundamental para mantener la calidad y transparencia de nuestra relación comercial. Hemos preparado un reporte detallado del último semestre que queremos revisar juntos en un espíritu constructivo."`,
      `EVIDENCIA: "${topArg?.context ?? 'Hemos documentado incumplimientos en KPIs contractuales específicos con las penalizaciones correspondientes según contrato'}. Queremos ser transparentes: nuestro objetivo no es aplicar penalizaciones sino trabajar juntos en un plan de mejora que lleve todos los indicadores a niveles de cumplimiento."`,
      `PROPUESTA: "${topArg?.proposal ?? 'Solicitamos un plan de remediación con hitos mensuales verificables, y proponemos una moratoria de 60 días en penalizaciones mientras se implementa el plan de mejora'}. A cambio, esperamos ver una tendencia positiva sostenida en los KPIs incumplidos."`,
      `CIERRE: "Preferimos invertir en la mejora conjunta antes que aplicar penalizaciones. Proponemos un comité de seguimiento quincenal durante los primeros 90 días del plan de remediación. ¿Podemos definir juntos las fechas compromiso esta semana?"`,
    ];
  },
  'pgnp-forfait': (hospitalName, args) => {
    const topArg = args[0];
    return [
      `APERTURA: "Estimado equipo de ${hospitalName}, queremos explorar un modelo innovador de pago por paquete (forfait/PGNP) que brinde predictibilidad financiera a ambas partes y simplifique significativamente los procesos administrativos. Este modelo ha demostrado resultados exitosos en otros hospitales de nuestra red."`,
      `EVIDENCIA: "${topArg?.context ?? 'Nuestro análisis identifica patologías de alto volumen con variabilidad de costos controlable que son candidatas ideales para paquetes forfait'}. Las patologías seleccionadas tienen un coeficiente de variación que permite establecer tarifas predecibles con un margen de seguridad adecuado para el hospital."`,
      `PROPUESTA: "${topArg?.proposal ?? 'Proponemos tarifas forfait para las patologías de mayor volumen, calculadas sobre el percentil 60 de costos históricos, lo que garantiza un margen razonable para el hospital'}. El modelo incluye cláusulas de revisión semestral y mecanismos de ajuste por complejidad excepcional."`,
      `CIERRE: "El modelo forfait les da certeza de ingreso y elimina la incertidumbre de auditorías caso por caso; a GNP le da predictibilidad de costos. Los hospitales que ya operan bajo este modelo reportan una reducción del 40% en tiempos administrativos. ¿Podemos iniciar con un piloto de 3 patologías durante 6 meses?"`,
    ];
  },
  'supervision-corrections': (hospitalName, args) => {
    const topArg = args[0];
    return [
      `APERTURA: "Equipo de ${hospitalName}, queremos abordar de manera constructiva las correcciones recurrentes que nuestro equipo de supervisión hospitalaria ha identificado en los últimos meses. Entendemos que muchas de estas correcciones pueden deberse a diferencias en la interpretación de criterios de facturación, y por eso queremos trabajar juntos en la solución."`,
      `EVIDENCIA: "${topArg?.context ?? 'Hemos identificado patrones estructurales de correcciones que se repiten de manera consistente, lo que sugiere oportunidades de mejora en procesos de facturación más que errores puntuales'}. El monto acumulado de correcciones es significativo y representa un desgaste administrativo para ambas partes."`,
      `PROPUESTA: "${topArg?.proposal ?? 'Proponemos un programa integral que incluye: (1) capacitación conjunta en criterios de facturación, (2) un comité mensual de revisión de casos, y (3) una guía de facturación compartida que elimine ambigüedades'}. GNP financiará las sesiones de capacitación y proporcionará las herramientas tecnológicas necesarias."`,
      `CIERRE: "Nuestro objetivo es llevar las correcciones a cero, lo que beneficia directamente a ${hospitalName} al reducir rechazos y acelerar los pagos. ¿Podemos iniciar con una auditoría conjunta de los 10 tipos de corrección más frecuentes y programar la primera sesión de capacitación para el próximo mes?"`,
    ];
  },
};

// PDF generation helper
const generatePDF = (hospitalName: string, content: string, filename: string) => {
  const htmlContent = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${filename}</title>
<style>
  body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #1a1a2e; line-height: 1.6; }
  h1 { color: #f59e0b; border-bottom: 3px solid #f59e0b; padding-bottom: 8px; }
  h2 { color: #1a1a2e; margin-top: 24px; }
  h3 { color: #f59e0b; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
  .badge { background: #f59e0b; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: bold; }
  .section { margin: 16px 0; padding: 16px; background: #f8f9fa; border-left: 4px solid #f59e0b; border-radius: 4px; }
  .metric { font-family: monospace; font-weight: bold; color: #f59e0b; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  th { background: #f59e0b; color: white; padding: 8px 12px; text-align: left; font-size: 12px; }
  td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 13px; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #666; }
  .script-line { padding: 8px 12px; margin: 4px 0; background: #fff3cd; border-radius: 4px; font-style: italic; }
</style></head><body>
<div class="header"><h1>GNP Seguros — ${hospitalName}</h1><span class="badge">CONFIDENCIAL</span></div>
${content}
<div class="footer">Generado por Plataforma de Gestión de Proveedores GNP — ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}</div>
</body></html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ProviderRankingWorkstation: React.FC = () => {
  const { domainId, useCaseId } = useParams<{ domainId: string; useCaseId: string }>();
  const result = getUseCase(domainId ?? '', useCaseId ?? '');
  const domain = result?.domain ?? { id: 'claims', name: 'Claims Management', accentColor: '#f59e0b', description: '', position: 3, useCases: [] };
  const useCase = result?.useCase ?? { id: 'provider-ranking', title: 'Gestion de Proveedores Hospitalarios', description: '' };

  // State
  const [activeTab, setActiveTab] = useState<'evolution' | 'detail'>('evolution');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [selectedStateCode, setSelectedStateCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<AnalysisCategory>('procedure-cost');
  const [showCoach, setShowCoach] = useState<string | null>(null);
  const [showFactPack, setShowFactPack] = useState(false);
  const [mapTooltip, setMapTooltip] = useState<{ x: number; y: number; state: any } | null>(null);
  const [showAgentFlow, setShowAgentFlow] = useState<AnalysisCategory | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [expandedOpportunityId, setExpandedOpportunityId] = useState<string | null>(null);

  // AI Chat
  const { messages, isLoading: chatLoading, error: chatError, send: sendMessage } = useAIChat({
    systemPrompt: `Eres un analista experto en gestion de proveedores hospitalarios para GNP Seguros. Tienes acceso al ranking de ${hospitals.length} hospitales con analisis de 7 categorias (Costo por Procedimiento, Precios de Insumos, Sobreutilizacion, Estancia y Reingresos, Cumplimiento de SLAs, Potencial PGNP/Forfait, Correcciones por Supervision). Responde en espanol con insights accionables y basados en datos.`,
  });
  const [chatInput, setChatInput] = useState('');

  // Computed
  const selectedHospital = useMemo(() => hospitals.find(h => h.id === selectedHospitalId) ?? null, [selectedHospitalId]);
  const selectedAnalysis = useMemo(() => selectedHospitalId ? hospitalCategoryAnalyses[selectedHospitalId] ?? null : null, [selectedHospitalId]);

  const filteredHospitals = useMemo(() => {
    let list = [...hospitals];
    if (selectedStateCode) list = list.filter(h => h.stateCode === selectedStateCode);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(h => h.name.toLowerCase().includes(q) || h.city.toLowerCase().includes(q) || h.state.toLowerCase().includes(q));
    }
    // Compute benchmark and gap, sort by gap descending
    return list.map(h => {
      const benchmarkFactor = h.score05 >= 4 ? 0.95 : h.score05 >= 3 ? 0.92 : h.score05 >= 2.5 ? 0.89 : h.score05 >= 2 ? 0.87 : 0.85;
      const benchmark = h.paidU12M * benchmarkFactor;
      const gap = ((h.paidU12M - benchmark) / benchmark) * 100;
      const savingsPotential = h.paidU12M - benchmark;
      const analysis = hospitalCategoryAnalyses[h.id];
      const oppCount = negotiationOpportunities.filter(o => o.hospitalId === h.id).length;
      return { ...h, benchmark, gap, savingsPotential, oppCount, analysis };
    }).sort((a, b) => b.gap - a.gap);
  }, [selectedStateCode, searchQuery]);

  const hospitalOpportunities = useMemo(() => {
    if (!selectedHospitalId) return [];
    return negotiationOpportunities.filter(o => o.hospitalId === selectedHospitalId).sort((a, b) => b.estimatedImpactMXN - a.estimatedImpactMXN);
  }, [selectedHospitalId]);

  const nationalScore = useMemo(() => +(hospitals.reduce((s, h) => s + h.score05, 0) / hospitals.length).toFixed(2), []);
  const totalPaid = useMemo(() => hospitals.reduce((s, h) => s + h.paidU12M, 0), []);
  const totalSavingsCaptured = useMemo(() => costEvolution.reduce((s, c) => s + c.savingsCaptured, 0), []);
  const totalBenchmark = useMemo(() => statesDataV2.reduce((s, st) => s + st.benchmarkU12M, 0), []);
  const totalSavingsPotential = useMemo(() => statesDataV2.reduce((s, st) => s + st.savingsPotentialMXN, 0), []);
  const totalSavingsCapturedStates = useMemo(() => statesDataV2.reduce((s, st) => s + st.savingsCapturedMXN, 0), []);
  const savingsCaptureRate = useMemo(() => totalSavingsPotential > 0 ? (totalSavingsCapturedStates / totalSavingsPotential * 100) : 0, [totalSavingsCapturedStates, totalSavingsPotential]);
  const costContainmentPct = useMemo(() => totalPaid > 0 ? ((totalPaid - totalBenchmark) / totalBenchmark * 100) : 0, [totalPaid, totalBenchmark]);
  const prevMonthPaid = useMemo(() => costEvolution.length >= 2 ? costEvolution[costEvolution.length - 2].totalPaid : 0, []);
  const currMonthPaid = useMemo(() => costEvolution.length >= 1 ? costEvolution[costEvolution.length - 1].totalPaid : 0, []);
  const momChange = useMemo(() => prevMonthPaid > 0 ? ((currMonthPaid - prevMonthPaid) / prevMonthPaid * 100) : 0, [currMonthPaid, prevMonthPaid]);

  // Top 5 hospitals by savings opportunity
  const topHospitalsByOpportunity = useMemo(() => {
    return [...hospitals].map(h => {
      const benchmarkFactor = h.score05 >= 4 ? 0.95 : h.score05 >= 3 ? 0.92 : h.score05 >= 2.5 ? 0.89 : h.score05 >= 2 ? 0.87 : 0.85;
      const benchmark = h.paidU12M * benchmarkFactor;
      const savingsPotential = h.paidU12M - benchmark;
      const gapPct = ((h.paidU12M - benchmark) / benchmark) * 100;
      return { ...h, benchmark, savingsPotential, gapPct };
    }).sort((a, b) => b.savingsPotential - a.savingsPotential).slice(0, 10);
  }, []);

  // Top regions by savings opportunity
  const topRegionsByOpportunity = useMemo(() => {
    return [...statesDataV2].sort((a, b) => b.savingsPotentialMXN - a.savingsPotentialMXN);
  }, []);

  const categoryOpportunities = useMemo(() => {
    if (!selectedHospitalId) return [];
    return negotiationOpportunities.filter(o => o.hospitalId === selectedHospitalId && o.category === activeCategory)
      .sort((a, b) => b.estimatedImpactMXN - a.estimatedImpactMXN);
  }, [selectedHospitalId, activeCategory]);

  const hospitalArguments = useMemo(() => {
    if (!selectedHospitalId) return [];
    return negotiationArguments.filter(a => a.hospitalId === selectedHospitalId);
  }, [selectedHospitalId]);

  const activeCategoryArgs = useMemo(() => {
    return hospitalArguments.filter(a => a.category === activeCategory);
  }, [hospitalArguments, activeCategory]);

  // Handlers
  const handleSelectHospital = useCallback((id: string) => {
    setSelectedHospitalId(id);
    setActiveTab('detail');
    setShowFactPack(false);
    setShowCoach(null);
    setActiveCategory('procedure-cost');
    setShowAgentFlow(null);
    setExpandedOpportunityId(null);
  }, []);

  const handleGenerateFactPackPDF = useCallback(() => {
    if (!selectedHospital || !selectedAnalysis) return;
    setGeneratingPDF(true);
    setTimeout(() => {
      const catSummaries = selectedAnalysis.categorySummary.map(cs => {
        const catDef = CATEGORY_DEFINITIONS.find(c => c.id === cs.category);
        return `<tr><td>${catDef?.name ?? cs.category}</td><td class="metric">${cs.score}/100</td><td class="metric">${fmtMXN(cs.impactMXN)}</td></tr>`;
      }).join('');

      const leverSections = CATEGORY_DEFINITIONS.map((catDef, ci) => {
        const leverArgs = negotiationArguments.filter(a => a.hospitalId === selectedHospital.id && a.category === catDef.id);
        const leverOpps = negotiationOpportunities.filter(o => o.hospitalId === selectedHospital.id && o.category === catDef.id);
        const scripts = NEGOTIATION_SCRIPTS[catDef.id](selectedHospital.name, leverArgs);
        const fullTexts = buildFullArgumentText(catDef.id, selectedHospital.name, leverArgs);
        const cs = selectedAnalysis.categorySummary.find(s => s.category === catDef.id);

        const argHtml = fullTexts.map(ft => ft.sections.map(s => `<p><strong>${s.heading}:</strong> ${s.body}</p>`).join('')).join('');
        const scriptHtml = scripts.map((s, i) => {
          const phases = ['Apertura', 'Evidencia', 'Propuesta', 'Cierre'];
          return `<p><strong>${phases[i]}:</strong> <em>${s}</em></p>`;
        }).join('');
        const recommendation = leverArgs.length > 0 ? leverArgs[0].proposal : leverOpps.length > 0 ? leverOpps[0].negotiationProposal : `Mantener monitoreo trimestral. No se requiere acción inmediata.`;

        return `
<h3 style="color: ${catDef.color}; border-left: 4px solid ${catDef.color}; padding-left: 12px;">${ci + 1}. ${catDef.name} — Score: ${cs?.score ?? 0}/100 | Impacto: ${fmtMXN(cs?.impactMXN ?? 0)}</h3>
<h4>Argumento de Valor</h4>
${argHtml || '<p><em>Sin desviaciones significativas. Monitoreo continuo recomendado.</em></p>'}
<h4>Script de Negociación</h4>
${scriptHtml}
<div class="section"><h4>Recomendación</h4><p><strong>${recommendation}</strong></p></div>`;
      }).join('<hr>');

      const content = `
<h2>Fact Pack Integral — ${selectedHospital.name}</h2>
<div class="section">
  <strong>Score General:</strong> <span class="metric">${selectedHospital.score05.toFixed(1)}/5.0 (${selectedHospital.score100}/100)</span><br>
  <strong>Ubicación:</strong> ${selectedHospital.city}, ${selectedHospital.state}<br>
  <strong>Nivel:</strong> ${selectedHospital.level} | <strong>Segmento:</strong> ${selectedHospital.segment}<br>
  <strong>Pagado U12M:</strong> <span class="metric">${fmtMXN(selectedHospital.paidU12M)}</span> | <strong>Casos:</strong> <span class="metric">${fmt(selectedHospital.casesU12M)}</span>
</div>
<h3>Radar de 7 Categorías</h3>
<table><th>Categoría</th><th>Score</th><th>Impacto</th>${catSummaries}</table>
<h3>Alertas de Riesgo</h3>
<div class="section">${selectedHospital.riskFlags.map(f => `<strong>${f.label}</strong> (${f.severity}): ${f.description}`).join('<br>')}</div>
<hr>
<h2>Análisis por Palanca</h2>
${leverSections}`;

      generatePDF(selectedHospital.name, content, `FactPack_Integral_${selectedHospital.name.replace(/\s+/g, '_')}`);
      setGeneratingPDF(false);
    }, 800);
  }, [selectedHospital, selectedAnalysis]);


  const handleSendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    sendMessage(chatInput.trim());
    setChatInput('');
  }, [chatInput, sendMessage]);

  // ---------------------------------------------------------------------------
  // Render Helpers
  // ---------------------------------------------------------------------------

  const renderFlags = (h: Hospital) => (
    <div className={styles.flagIcons}>
      {h.highReadmissions && <span className={`${styles.flagIcon} ${styles.flagRed}`} title="Alto Reingreso">R</span>}
      {h.highALOS && <span className={`${styles.flagIcon} ${styles.flagOrange}`} title="Alta Estancia">E</span>}
      {h.highEmergencyPct && <span className={`${styles.flagIcon} ${styles.flagYellow}`} title="Alto % Urgencias">U</span>}
      {h.highCostPct && <span className={`${styles.flagIcon} ${styles.flagRed}`} title="Alto Costo">$</span>}
      {h.fraudAlerts && <span className={`${styles.flagIcon} ${styles.flagPurple}`} title="Alerta Fraude">F</span>}
      {h.supervisionDependency && <span className={`${styles.flagIcon} ${styles.flagOrange}`} title="Dep. Supervision">S</span>}
    </div>
  );

  const renderHBarChart = (items: { label: string; hospital: number; peer: number; unit?: string }[], maxVal?: number) => {
    const max = maxVal || Math.max(...items.map(i => Math.max(i.hospital, i.peer))) * 1.1;
    return (
      <div className={styles.hBarChart}>
        {items.map((item, i) => {
          const gapPct = ((item.hospital - item.peer) / item.peer * 100);
          return (
            <div key={i} className={styles.hBarRow}>
              <span className={styles.hBarLabel}>{item.label}</span>
              <div className={styles.hBarTrack}>
                <div className={styles.hBarFillPeer} style={{ width: `${(item.peer / max) * 100}%`, background: '#3b82f6' }} />
                <div className={styles.hBarFillHospital} style={{ width: `${(item.hospital / max) * 100}%`, background: gapPct > 10 ? '#ef4444' : gapPct > 0 ? '#f59e0b' : '#22c55e' }} />
              </div>
              <span className={styles.hBarValue}>{item.unit === '%' ? `${item.hospital.toFixed(1)}%` : fmtMXN(item.hospital)}</span>
              <span className={`${styles.hBarGap} ${gapPct > 0 ? styles.hBarGapPositive : styles.hBarGapNegative}`}>
                {gapPct > 0 ? '+' : ''}{gapPct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // 7-Category Radar — with peer cost polygon
  const renderSevenRadar = (categorySummary: { category: AnalysisCategory; score: number; impactMXN: number }[], size = 280) => {
    const cx = size / 2, cy = size / 2, maxR = size / 2 - 40;
    const n = categorySummary.length;
    const angleStep = 360 / n;
    const levels = [20, 40, 60, 80, 100];

    const dataPoints = categorySummary.map((d, i) => polarToCart(cx, cy, (d.score / 100) * maxR, i * angleStep));
    const benchPoints = categorySummary.map((_, i) => polarToCart(cx, cy, (30 / 100) * maxR, i * angleStep));
    const peerPoints = categorySummary.map((d, i) => {
      const peerScore = Math.max(10, d.score * 0.55 + 8);
      return polarToCart(cx, cy, (peerScore / 100) * maxR, i * angleStep);
    });

    return (
      <svg viewBox={`0 0 ${size} ${size}`} className={styles.radarSvg}>
        {levels.map(l => (
          <circle key={l} cx={cx} cy={cy} r={(l / 100) * maxR} className={styles.radarGrid} />
        ))}
        {categorySummary.map((_, i) => {
          const p = polarToCart(cx, cy, maxR, i * angleStep);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} className={styles.radarAxis} />;
        })}
        <polygon points={benchPoints.map(p => `${p.x},${p.y}`).join(' ')} className={styles.radarBenchmark} />
        <polygon points={peerPoints.map(p => `${p.x},${p.y}`).join(' ')} fill="rgba(59,130,246,0.12)" stroke="#3b82f6" strokeWidth={1.2} strokeDasharray="3 2" />
        <polygon points={dataPoints.map(p => `${p.x},${p.y}`).join(' ')} className={styles.radarPolygon} />
        {peerPoints.map((p, i) => (
          <circle key={`peer-${i}`} cx={p.x} cy={p.y} r={2.5} fill="#3b82f6" stroke="var(--bg-card)" strokeWidth={1.5} />
        ))}
        {dataPoints.map((p, i) => {
          const catDef = CATEGORY_DEFINITIONS.find(c => c.id === categorySummary[i].category);
          return <circle key={i} cx={p.x} cy={p.y} r={3.5} fill={catDef?.color ?? '#f59e0b'} stroke="var(--bg-card)" strokeWidth={2} />;
        })}
        {categorySummary.map((d, i) => {
          const catDef = CATEGORY_DEFINITIONS.find(c => c.id === d.category);
          const labelP = polarToCart(cx, cy, maxR + 22, i * angleStep);
          return (
            <text key={i} x={labelP.x} y={labelP.y} textAnchor="middle" dominantBaseline="central" className={styles.radarLabel} fill={catDef?.color}>
              {catDef?.shortName ?? d.category}
            </text>
          );
        })}
      </svg>
    );
  };

  // Chat section
  const renderChatSection = () => (
    <div className={styles.chatSection}>
      <h3 className={styles.sectionTitle}><Bot size={16} /> Asistente IA — Proveedores</h3>
      <div className={styles.chatMessages}>
        {messages.length === 0 && (
          <div className={styles.chatPlaceholder}>
            <Bot size={32} style={{ opacity: 0.3 }} />
            <p>Pregunta sobre el rendimiento de hospitales, oportunidades de negociacion o argumentos de valor.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? styles.chatMessageUser : styles.chatMessageAssistant}>
            <div className={styles.chatMessageContent}>{msg.content}</div>
          </div>
        ))}
        {chatLoading && (
          <div className={styles.chatMessageAssistant}>
            <div className={styles.typingIndicator}><span /><span /><span /></div>
          </div>
        )}
      </div>
      {chatError && <p className={styles.chatError}>{chatError}</p>}
      <div className={styles.chatInputRow}>
        <input
          className={styles.chatInput}
          placeholder="Escribe tu pregunta..."
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSendChat()}
        />
        <button className={styles.chatSendButton} onClick={handleSendChat} disabled={chatLoading || !chatInput.trim()}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );

  // Cost Evolution Chart SVG
  const renderCostEvolutionChart = () => {
    const width = 800;
    const height = 200;
    const padL = 60, padR = 20, padT = 20, padB = 40;
    const chartW = width - padL - padR;
    const chartH = height - padT - padB;
    const n = costEvolution.length;

    const allValues = costEvolution.flatMap(c => [c.totalPaid, c.benchmarkExpected]);
    const maxVal = Math.max(...allValues) * 1.05;
    const minVal = Math.min(...allValues) * 0.92;

    const xScale = (i: number) => padL + (i / (n - 1)) * chartW;
    const yScale = (v: number) => padT + chartH - ((v - minVal) / (maxVal - minVal)) * chartH;

    const paidLine = costEvolution.map((c, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(c.totalPaid).toFixed(1)}`).join(' ');
    const benchLine = costEvolution.map((c, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(c.benchmarkExpected).toFixed(1)}`).join(' ');

    // Area between paid and benchmark
    const areaPath = [
      ...costEvolution.map((c, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(c.totalPaid).toFixed(1)}`),
      ...costEvolution.slice().reverse().map((c, i) => `L${xScale(n - 1 - i).toFixed(1)},${yScale(c.benchmarkExpected).toFixed(1)}`),
      'Z',
    ].join(' ');

    return (
      <div className={styles.costEvolutionSection}>
        <h3 className={styles.sectionTitle}><TrendingUp size={16} /> Evolucion de Costos vs Benchmark (U12M)</h3>
        <div className={styles.costEvolutionChart}>
          <svg viewBox={`0 0 ${width} ${height}`} className={styles.costEvolutionSvg} preserveAspectRatio="xMidYMid meet">
            {/* Grid lines */}
            {[0.25, 0.5, 0.75, 1.0].map(frac => {
              const y = padT + chartH * (1 - frac);
              const val = minVal + (maxVal - minVal) * frac;
              return (
                <g key={frac}>
                  <line x1={padL} y1={y} x2={padL + chartW} y2={y} stroke="rgba(148,163,184,0.06)" strokeWidth={0.5} />
                  <text x={padL - 8} y={y + 3} textAnchor="end" fontSize={7} fill="var(--text-muted)" fontFamily="var(--font-mono)">{fmtMXN(val)}</text>
                </g>
              );
            })}
            {/* Savings area */}
            <path d={areaPath} className={styles.chartAreaSavings} />
            {/* Benchmark line */}
            <path d={benchLine} className={`${styles.chartLine} ${styles.chartLineBenchmark}`} />
            {/* Paid line */}
            <path d={paidLine} className={`${styles.chartLine} ${styles.chartLinePaid}`} />
            {/* Dots */}
            {costEvolution.map((c, i) => (
              <g key={i}>
                <circle cx={xScale(i)} cy={yScale(c.totalPaid)} r={3} fill="#f59e0b" stroke="var(--bg-card)" strokeWidth={2} />
                <circle cx={xScale(i)} cy={yScale(c.benchmarkExpected)} r={2.5} fill="#3b82f6" stroke="var(--bg-card)" strokeWidth={1.5} />
              </g>
            ))}
            {/* X-axis labels */}
            {costEvolution.map((c, i) => (
              <text key={i} x={xScale(i)} y={height - 8} textAnchor="middle" fontSize={7} fill="var(--text-muted)" fontFamily="var(--font-mono)">
                {c.month.slice(5)}
              </text>
            ))}
          </svg>
          <div className={styles.chartLegend}>
            <span className={styles.chartLegendItem}><span className={styles.chartLegendLine} style={{ background: '#f59e0b' }} /> Monto Pagado</span>
            <span className={styles.chartLegendItem}><span className={styles.chartLegendLine} style={{ background: '#3b82f6', borderStyle: 'dashed' }} /> Benchmark Esperado</span>
            <span className={styles.chartLegendItem}><span className={styles.chartLegendLine} style={{ background: 'rgba(34,197,94,0.3)', height: 8, borderRadius: 2 }} /> Area de Contencion</span>
          </div>
        </div>
      </div>
    );
  };

  // Category detail rendering
  const renderCategoryDetail = () => {
    if (!selectedAnalysis) return null;
    const catDef = CATEGORY_DEFINITIONS.find(c => c.id === activeCategory);

    switch (activeCategory) {
      case 'procedure-cost': {
        const items = selectedAnalysis.procedureCosts;
        const top8 = [...items].sort((a, b) => b.impactMXN - a.impactMXN).slice(0, 8);
        const totalImpact = items.reduce((s, i) => s + i.impactMXN, 0);
        return (
          <div className={styles.categoryDetailCard}>
            <div className={styles.categoryDetailHeader}>
              <span className={styles.categoryDetailTitle}>
                <Stethoscope size={16} style={{ color: catDef?.color }} /> Costo por Procedimiento
              </span>
              <span className={styles.categoryImpactBadge}>
                <DollarSign size={12} /> Impacto: {fmtMXN(totalImpact)}
              </span>
            </div>
            {renderHBarChart(top8.map(p => ({ label: `${p.procedureName} (${p.procedureCode})`, hospital: p.costHospital, peer: p.costPeers })))}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Procedimiento</th><th>CPT</th><th>Volumen</th><th>Costo Hospital</th><th>Costo Peers</th><th>Gap %</th><th>Impacto</th></tr>
                </thead>
                <tbody>
                  {items.sort((a, b) => b.impactMXN - a.impactMXN).map((p, i) => (
                    <tr key={i} className={styles.tableRow}>
                      <td className={styles.nameCell}>{p.procedureName}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{p.procedureCode}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{p.volume}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{fmtMXN(p.costHospital)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{fmtMXN(p.costPeers)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: p.gapPct > 10 ? '#ef4444' : p.gapPct > 0 ? '#f59e0b' : '#22c55e' }}>
                        {p.gapPct > 0 ? '+' : ''}{p.gapPct.toFixed(1)}%
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmtMXN(p.impactMXN)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'supply-pricing': {
        const items = selectedAnalysis.supplyPricing;
        const top8 = [...items].sort((a, b) => b.impactMXN - a.impactMXN).slice(0, 8);
        const totalImpact = items.reduce((s, i) => s + i.impactMXN, 0);
        const avgGap = items.length > 0 ? items.reduce((s, i) => s + i.gapPct, 0) / items.length : 0;
        return (
          <div className={styles.categoryDetailCard}>
            <div className={styles.categoryDetailHeader}>
              <span className={styles.categoryDetailTitle}>
                <Package size={16} style={{ color: catDef?.color }} /> Precios Unitarios de Insumos
              </span>
              <span className={styles.categoryImpactBadge}>
                <DollarSign size={12} /> Impacto: {fmtMXN(totalImpact)} | Gap Promedio: +{avgGap.toFixed(1)}%
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
              <div className={styles.savingsCard} style={{ flex: 1, borderLeftColor: '#f97316' }}>
                <span className={styles.kpiLabel}>Precio Unitario Promedio Hospital</span>
                <span className={styles.kpiValue} style={{ color: '#ef4444', fontSize: '1.2rem' }}>
                  {fmtMXN(items.reduce((s, i) => s + i.priceHospital, 0) / items.length)}
                </span>
              </div>
              <div className={styles.savingsCard} style={{ flex: 1, borderLeftColor: '#3b82f6' }}>
                <span className={styles.kpiLabel}>Precio Unitario Promedio Benchmark</span>
                <span className={styles.kpiValue} style={{ color: '#3b82f6', fontSize: '1.2rem' }}>
                  {fmtMXN(items.reduce((s, i) => s + i.priceBenchmark, 0) / items.length)}
                </span>
              </div>
              <div className={styles.savingsCard} style={{ flex: 1, borderLeftColor: '#ef4444' }}>
                <span className={styles.kpiLabel}>Sobreprecio Unitario Promedio</span>
                <span className={styles.kpiValue} style={{ color: '#ef4444', fontSize: '1.2rem' }}>
                  +{avgGap.toFixed(1)}%
                </span>
              </div>
            </div>
            {renderHBarChart(top8.map(s => ({ label: `${s.supplyName} (${s.category})`, hospital: s.priceHospital, peer: s.priceBenchmark })))}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Insumo</th><th>Categoria</th><th>Precio Unitario Hospital</th><th>Precio Unitario Benchmark</th><th>Gap Unitario %</th><th>Vol. U12M</th><th>Impacto Total</th></tr>
                </thead>
                <tbody>
                  {items.sort((a, b) => b.impactMXN - a.impactMXN).map((s, i) => (
                    <tr key={i} className={styles.tableRow}>
                      <td className={styles.nameCell}>{s.supplyName}</td>
                      <td>{s.category}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmtMXN(s.priceHospital)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{fmtMXN(s.priceBenchmark)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: s.gapPct > 10 ? '#ef4444' : s.gapPct > 0 ? '#f59e0b' : '#22c55e', fontWeight: 700 }}>
                        {s.gapPct > 0 ? '+' : ''}{s.gapPct.toFixed(1)}%
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{s.volumeU12M} uds</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmtMXN(s.impactMXN)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'overutilization': {
        const items = selectedAnalysis.overutilization;
        const totalImpact = items.reduce((s, i) => s + i.impactMXN, 0);
        return (
          <div className={styles.categoryDetailCard}>
            <div className={styles.categoryDetailHeader}>
              <span className={styles.categoryDetailTitle}>
                <TrendingUp size={16} style={{ color: catDef?.color }} /> Sobreutilizacion de Actos Medicos
              </span>
              <span className={styles.categoryImpactBadge}>
                <DollarSign size={12} /> Impacto: {fmtMXN(totalImpact)}
              </span>
            </div>
            {renderHBarChart(items.sort((a, b) => b.impactMXN - a.impactMXN).map(o => ({
              label: `${o.actName} (${o.actType})`,
              hospital: o.freqPerCaseHospital,
              peer: o.freqPerCasePeers,
              unit: '%',
            })))}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Acto Medico</th><th>Tipo</th><th>Freq/Caso Hospital</th><th>Freq/Caso Peers</th><th>Sobre-uso %</th><th>Impacto</th></tr>
                </thead>
                <tbody>
                  {items.sort((a, b) => b.impactMXN - a.impactMXN).map((o, i) => (
                    <tr key={i} className={styles.tableRow}>
                      <td className={styles.nameCell}>{o.actName}</td>
                      <td>{o.actType}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{o.freqPerCaseHospital.toFixed(2)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{o.freqPerCasePeers.toFixed(2)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: o.overusePct > 15 ? '#ef4444' : o.overusePct > 0 ? '#f59e0b' : '#22c55e' }}>
                        {o.overusePct > 0 ? '+' : ''}{o.overusePct.toFixed(1)}%
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmtMXN(o.impactMXN)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'los-readmission': {
        const items = selectedAnalysis.losReadmission;
        const totalImpact = items.reduce((s, i) => s + i.costExtraMXN, 0);
        const avgReadmitHospital = items.filter(i => i.readmissionRateHospital).reduce((s, i) => s + (i.readmissionRateHospital ?? 0), 0) / items.filter(i => i.readmissionRateHospital).length;
        const avgReadmitPeers = items.filter(i => i.readmissionRatePeers).reduce((s, i) => s + (i.readmissionRatePeers ?? 0), 0) / items.filter(i => i.readmissionRatePeers).length;
        return (
          <div className={styles.categoryDetailCard}>
            <div className={styles.categoryDetailHeader}>
              <span className={styles.categoryDetailTitle}>
                <Clock size={16} style={{ color: catDef?.color }} /> Estancia Hospitalaria y Reingresos
              </span>
              <span className={styles.categoryImpactBadge}>
                <DollarSign size={12} /> Impacto: {fmtMXN(totalImpact)}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <div className={styles.savingsCard} style={{ flex: 1 }}>
                <span className={styles.kpiLabel}>Tasa Reingreso Hospital</span>
                <span className={styles.kpiValue} style={{ color: avgReadmitHospital > 5 ? '#ef4444' : '#22c55e', fontSize: '1.2rem' }}>
                  {avgReadmitHospital.toFixed(1)}%
                </span>
              </div>
              <div className={styles.savingsCard} style={{ flex: 1 }}>
                <span className={styles.kpiLabel}>Tasa Reingreso Peers</span>
                <span className={styles.kpiValue} style={{ color: '#3b82f6', fontSize: '1.2rem' }}>
                  {avgReadmitPeers.toFixed(1)}%
                </span>
              </div>
            </div>
            {renderHBarChart(items.sort((a, b) => b.costExtraMXN - a.costExtraMXN).map(l => ({
              label: l.procedureName,
              hospital: l.alosHospital,
              peer: l.alosPeers,
              unit: '%',
            })))}
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Procedimiento</th><th>ALOS Hospital</th><th>ALOS Peers</th><th>Exceso Dias</th><th>Costo Extra</th><th>Reingreso Hosp.</th><th>Reingreso Peers</th></tr>
                </thead>
                <tbody>
                  {items.sort((a, b) => b.costExtraMXN - a.costExtraMXN).map((l, i) => (
                    <tr key={i} className={styles.tableRow}>
                      <td className={styles.nameCell}>{l.procedureName}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{l.alosHospital} dias</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{l.alosPeers} dias</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: l.excessDays > 0.5 ? '#ef4444' : '#22c55e' }}>+{l.excessDays} dias</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmtMXN(l.costExtraMXN)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{l.readmissionRateHospital?.toFixed(1) ?? '-'}%</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{l.readmissionRatePeers?.toFixed(1) ?? '-'}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'sla-compliance': {
        const items = selectedAnalysis.slaCompliance;
        const totalPenalty = items.reduce((s, i) => s + i.penaltyApplicable, 0);
        const failedCount = items.filter(i => !i.compliant).length;
        return (
          <div className={styles.categoryDetailCard}>
            <div className={styles.categoryDetailHeader}>
              <span className={styles.categoryDetailTitle}>
                <FileCheck size={16} style={{ color: catDef?.color }} /> Cumplimiento de SLAs
              </span>
              <span className={styles.categoryImpactBadge}>
                <AlertTriangle size={12} /> {failedCount} Incumplidos | Penalizacion: {fmtMXN(totalPenalty)}
              </span>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr><th>KPI</th><th>Meta</th><th>Actual</th><th>Cumple</th><th>Penalizacion</th><th>Tendencia 6M</th></tr>
                </thead>
                <tbody>
                  {items.map((sla, i) => (
                    <tr key={i} className={styles.tableRow}>
                      <td className={styles.nameCell}>{sla.kpiName}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{sla.contractualTarget}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: sla.compliant ? '#22c55e' : '#ef4444' }}>{sla.currentValue}</td>
                      <td>
                        <span className={`${styles.complianceBadge} ${sla.compliant ? styles.complianceOk : styles.complianceFail}`}>
                          {sla.compliant ? 'Cumple' : 'Incumple'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: sla.penaltyApplicable > 0 ? '#ef4444' : 'var(--text-muted)' }}>
                        {sla.penaltyApplicable > 0 ? fmtMXN(sla.penaltyApplicable) : '-'}
                      </td>
                      <td>
                        <div className={styles.slaTrendCell}>
                          <div className={styles.slaSpark}>
                            {sla.trend6m.map((v, j) => {
                              const maxT = Math.max(...sla.trend6m);
                              const minT = Math.min(...sla.trend6m);
                              const range = maxT - minT || 1;
                              const h = 4 + ((v - minT) / range) * 16;
                              return (
                                <div
                                  key={j}
                                  className={styles.slaSparkBar}
                                  style={{ height: `${h}px`, background: sla.compliant ? '#22c55e' : '#ef4444', opacity: 0.4 + (j / 6) * 0.6 }}
                                />
                              );
                            })}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'pgnp-forfait': {
        const items = selectedAnalysis.pgnpForfait;
        const totalSavings = items.reduce((s, i) => s + i.potentialSavingsMXN, 0);
        const forfaitCount = items.filter(i => i.forfaitRecommended).length;

        // Scatter plot
        const svgW = 600, svgH = 250, padLeft = 60, padRight = 20, padTop = 20, padBottom = 40;
        const plotW = svgW - padLeft - padRight;
        const plotH = svgH - padTop - padBottom;
        const maxVol = Math.max(...items.map(i => i.volume)) * 1.1;
        const maxCV = Math.max(...items.map(i => i.cvPct)) * 1.1;
        const maxSavings = Math.max(...items.map(i => i.potentialSavingsMXN));

        return (
          <div className={styles.categoryDetailCard}>
            <div className={styles.categoryDetailHeader}>
              <span className={styles.categoryDetailTitle}>
                <Target size={16} style={{ color: catDef?.color }} /> Potencial PGNP/Forfait
              </span>
              <span className={`${styles.categoryImpactBadge} ${styles.categoryImpactBadgeGreen}`}>
                <CheckCircle2 size={12} /> {forfaitCount} Candidatos | Contencion: {fmtMXN(totalSavings)}
              </span>
            </div>

            <div className={styles.scatterContainer}>
              <svg viewBox={`0 0 ${svgW} ${svgH}`} className={styles.scatterSvg}>
                {/* Grid */}
                {[0.25, 0.5, 0.75, 1.0].map(f => (
                  <line key={f} x1={padLeft} y1={padTop + plotH * (1 - f)} x2={padLeft + plotW} y2={padTop + plotH * (1 - f)} className={styles.scatterGridLine} />
                ))}
                {/* Threshold line at CV=30% */}
                {(() => {
                  const y30 = padTop + plotH - (30 / maxCV) * plotH;
                  return (
                    <g>
                      <line x1={padLeft} y1={y30} x2={padLeft + plotW} y2={y30} stroke="rgba(245,158,11,0.3)" strokeWidth={1} strokeDasharray="4 3" />
                      <text x={padLeft + plotW + 4} y={y30 + 3} fontSize={7} fill="#f59e0b">CV=30%</text>
                    </g>
                  );
                })()}
                {/* Bubbles */}
                {items.map((p, i) => {
                  const x = padLeft + (p.volume / maxVol) * plotW;
                  const y = padTop + plotH - (p.cvPct / maxCV) * plotH;
                  const r = 6 + (p.potentialSavingsMXN / maxSavings) * 18;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={r}
                      className={styles.scatterBubble}
                      fill={p.forfaitRecommended ? 'rgba(34,197,94,0.5)' : 'rgba(148,163,184,0.3)'}
                      stroke={p.forfaitRecommended ? '#22c55e' : '#64748b'}
                      strokeWidth={1.5}
                    >
                      <title>{`${p.pathologyName}: Vol=${p.volume}, CV=${p.cvPct}%, Contencion=${fmtMXN(p.potentialSavingsMXN)}`}</title>
                    </circle>
                  );
                })}
                {/* Labels on bubbles */}
                {items.map((p, i) => {
                  const x = padLeft + (p.volume / maxVol) * plotW;
                  const y = padTop + plotH - (p.cvPct / maxCV) * plotH;
                  return <text key={i} x={x} y={y - 14} textAnchor="middle" fontSize={6.5} fill="var(--text-secondary)">{p.pathologyName}</text>;
                })}
                {/* Axis labels */}
                <text x={padLeft + plotW / 2} y={svgH - 4} textAnchor="middle" className={styles.scatterAxisLabel}>Volumen (casos/ano)</text>
                <text x={14} y={padTop + plotH / 2} textAnchor="middle" transform={`rotate(-90, 14, ${padTop + plotH / 2})`} className={styles.scatterAxisLabel}>CV% (variabilidad)</text>
              </svg>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Patologia</th><th>CIE</th><th>Volumen</th><th>Costo Promedio</th><th>CV%</th><th>Contencion Potencial</th><th>Forfait?</th></tr>
                </thead>
                <tbody>
                  {items.sort((a, b) => b.potentialSavingsMXN - a.potentialSavingsMXN).map((p, i) => (
                    <tr key={i} className={styles.tableRow}>
                      <td className={styles.nameCell}>{p.pathologyName}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{p.icdCode}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{p.volume}</td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>{fmtMXN(p.avgCost)}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', color: p.cvPct > 30 ? '#ef4444' : '#22c55e' }}>{p.cvPct.toFixed(1)}%</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmtMXN(p.potentialSavingsMXN)}</td>
                      <td>
                        <span className={`${styles.complianceBadge} ${p.forfaitRecommended ? styles.complianceOk : styles.complianceFail}`}>
                          {p.forfaitRecommended ? 'Recomendado' : 'No viable'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case 'supervision-corrections': {
        const items = selectedAnalysis.supervisionCorrections;
        const totalCorrected = items.reduce((s, i) => s + i.amountCorrectedMXN, 0);
        const structuralCount = items.filter(i => i.isStructural).length;
        return (
          <div className={styles.categoryDetailCard}>
            <div className={styles.categoryDetailHeader}>
              <span className={styles.categoryDetailTitle}>
                <Shield size={16} style={{ color: catDef?.color }} /> Correcciones por Supervision
              </span>
              <span className={styles.categoryImpactBadge}>
                <AlertTriangle size={12} /> {structuralCount} Estructurales | Total: {fmtMXN(totalCorrected)}
              </span>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr><th>Tipo de Correccion</th><th>Frecuencia</th><th>Monto Corregido</th><th>Tendencia</th><th>Estructural</th></tr>
                </thead>
                <tbody>
                  {items.sort((a, b) => b.amountCorrectedMXN - a.amountCorrectedMXN).map((c, i) => (
                    <tr key={i} className={styles.tableRow}>
                      <td className={styles.nameCell}>{c.correctionType}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{c.frequency}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmtMXN(c.amountCorrectedMXN)}</td>
                      <td>{getTrendIcon(c.trend)} <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{c.trend === 'up' ? 'Al alza' : c.trend === 'down' ? 'A la baja' : 'Estable'}</span></td>
                      <td>
                        {c.isStructural ? (
                          <span className={styles.structuralFlag}><AlertTriangle size={10} /> Estructural</span>
                        ) : (
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Puntual</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // Negotiation Coach panel
  const renderNegotiationCoach = (arg: NegotiationArgument) => {
    const fullArgs = buildFullArgumentText(activeCategory, selectedHospital?.name ?? '', [arg]);
    const fullArg = fullArgs[0];

    return (
      <motion.div
        className={styles.negotiationCoach}
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h4 className={styles.coachTitle}><MessageSquare size={16} /> Texto Argumentativo de Negociacion</h4>
        <p className={styles.coachLever}>{arg.lever}</p>

        {fullArg && fullArg.sections.map((section, i) => (
          <div key={i} style={{ marginBottom: 20 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
            }}>
              <span style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: i === 0 ? 'rgba(59,130,246,0.15)' : i === 1 ? 'rgba(245,158,11,0.15)' : i === 2 ? 'rgba(139,92,246,0.15)' : i === 3 ? 'rgba(34,197,94,0.15)' : 'rgba(236,72,153,0.15)',
                color: i === 0 ? '#3b82f6' : i === 1 ? '#f59e0b' : i === 2 ? '#8b5cf6' : i === 3 ? '#22c55e' : '#ec4899',
                fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                {section.heading}
              </span>
            </div>
            <div style={{
              padding: '14px 18px', marginLeft: 38,
              background: 'rgba(148,163,184,0.04)',
              border: '1px solid rgba(148,163,184,0.08)',
              borderLeft: `3px solid ${i === 0 ? '#3b82f6' : i === 1 ? '#f59e0b' : i === 2 ? '#8b5cf6' : i === 3 ? '#22c55e' : '#ec4899'}`,
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.65, whiteSpace: 'pre-line',
            }}>
              {section.body}
            </div>
          </div>
        ))}

        <span className={styles.resultLabel} style={{ marginTop: 8 }}>Datos de Soporte</span>
        <table className={styles.coachSupportTable}>
          <thead>
            <tr><th>Concepto</th><th>Hospital</th><th>Peer/Benchmark</th><th>Gap</th></tr>
          </thead>
          <tbody>
            {arg.supportData.map((row, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>{row.label}</td>
                <td>{row.hospitalValue}</td>
                <td>{row.peerValue}</td>
                <td style={{ color: row.gap.startsWith('+') ? '#ef4444' : 'var(--text-secondary)' }}>{row.gap}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    );
  };

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Breadcrumb items={[
          { label: 'Home', to: '/' },
          { label: domain.name, to: `/domain/${domain.id}` },
          { label: useCase.title },
        ]} />
        <Link to={`/domain/${domain.id}`} className={styles.backLink}>
          <ArrowLeft size={16} /> Volver a {domain.name}
        </Link>

        {/* Hero */}
        <motion.div className={styles.heroBanner} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className={styles.heroTitle}>Gestion de Proveedores Hospitalarios</h1>
          <p className={styles.heroSubtitle}>
            Plataforma integral de gestion de proveedores hospitalarios GNP. Analisis de 7 categorias: Costo por Procedimiento, Precios de Insumos, Sobreutilizacion, Estancia y Reingresos, Cumplimiento de SLAs, Potencial PGNP/Forfait y Correcciones por Supervision. Motor de argumentos de negociacion pre-generados.
          </p>
        </motion.div>

        {/* Tab Bar */}
        <div className={styles.tabBar}>
          <button className={`${styles.tabButton} ${activeTab === 'evolution' ? styles.tabButtonActive : ''}`} onClick={() => setActiveTab('evolution')}>
            <BarChart3 size={14} style={{ marginRight: 6 }} /> Resumen Ejecutivo
          </button>
          <button className={`${styles.tabButton} ${activeTab === 'detail' ? styles.tabButtonActive : ''}`} onClick={() => setActiveTab('detail')}>
            <Building2 size={14} style={{ marginRight: 6 }} /> Detalle Hospital{selectedHospital ? ` — ${selectedHospital.name}` : ''}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* ============================================================= */}
          {/* TAB 1: RESUMEN EJECUTIVO                                      */}
          {/* ============================================================= */}
          {activeTab === 'evolution' && (
            <motion.div key="evolution" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>

              {/* Executive KPI Strip — the 1-minute glance */}
              <div className={styles.kpiRow}>
                <div className={styles.kpiCard}>
                  <DollarSign size={18} className={styles.kpiIcon} style={{ color: '#f59e0b' }} />
                  <span className={styles.kpiValue} style={{ color: '#f59e0b' }}>{fmtMXN(totalPaid)}</span>
                  <span className={styles.kpiLabel}>Gasto Total U12M</span>
                  <span className={`${styles.kpiDelta} ${momChange > 0 ? styles.kpiDeltaDown : styles.kpiDeltaUp}`}>{momChange > 0 ? '+' : ''}{momChange.toFixed(1)}% MoM</span>
                </div>
                <div className={styles.kpiCard}>
                  <Target size={18} className={styles.kpiIcon} style={{ color: '#3b82f6' }} />
                  <span className={styles.kpiValue} style={{ color: '#3b82f6' }}>{fmtMXN(totalBenchmark)}</span>
                  <span className={styles.kpiLabel}>Benchmark U12M</span>
                </div>
                <div className={styles.kpiCard}>
                  <AlertTriangle size={18} className={styles.kpiIcon} style={{ color: '#ef4444' }} />
                  <span className={styles.kpiValue} style={{ color: '#ef4444' }}>{fmtMXN(totalSavingsPotential)}</span>
                  <span className={styles.kpiLabel}>Brecha vs Benchmark</span>
                  <span className={`${styles.kpiDelta} ${styles.kpiDeltaDown}`}>+{costContainmentPct.toFixed(1)}% sobre benchmark</span>
                </div>
                <div className={styles.kpiCard}>
                  <CheckCircle2 size={18} className={styles.kpiIcon} style={{ color: '#22c55e' }} />
                  <span className={styles.kpiValue} style={{ color: '#22c55e' }}>{fmtMXN(totalSavingsCapturedStates)}</span>
                  <span className={styles.kpiLabel}>Contencion Capturada</span>
                  <span className={`${styles.kpiDelta} ${styles.kpiDeltaUp}`}>+12.3% vs periodo anterior</span>
                </div>
                <div className={styles.kpiCard}>
                  <Activity size={18} className={styles.kpiIcon} style={{ color: '#8b5cf6' }} />
                  <span className={styles.kpiValue} style={{ color: '#8b5cf6' }}>{savingsCaptureRate.toFixed(1)}%</span>
                  <span className={styles.kpiLabel}>Tasa de Captura</span>
                  <span className={styles.kpiDelta}>{fmtMXN(totalSavingsCapturedStates)} de {fmtMXN(totalSavingsPotential)}</span>
                </div>
                <div className={styles.kpiCard}>
                  <Zap size={18} className={styles.kpiIcon} style={{ color: '#f97316' }} />
                  <span className={styles.kpiValue} style={{ color: '#f97316' }}>{negotiationOpportunities.length}</span>
                  <span className={styles.kpiLabel}>Oportunidades Activas</span>
                  <span className={styles.kpiDelta}>{hospitals.length} hospitales monitoreados</span>
                </div>
              </div>

              {/* Cost Evolution Chart */}
              {renderCostEvolutionChart()}

              {/* Dual panel: Region ranking + Map */}
              <div style={{ display: 'flex', gap: 20, marginBottom: 28, flexWrap: 'wrap' }}>

                {/* Region Ranking with visual bars */}
                <div style={{ flex: '1 1 520px', minWidth: 340 }}>
                  <h2 className={styles.sectionTitle}><MapPin size={16} /> Ranking por Region — Oportunidad de Contencion</h2>
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr><th>#</th><th>Region</th><th>Hosp.</th><th>Pagado</th><th>Contencion Potencial</th><th>Capturado</th><th style={{ minWidth: 130 }}>Captura</th><th>Tend.</th></tr>
                      </thead>
                      <tbody>
                        {topRegionsByOpportunity.map((s, i) => {
                          const captureRate = s.savingsPotentialMXN > 0 ? (s.savingsCapturedMXN / s.savingsPotentialMXN * 100) : 0;
                          const maxSavings = topRegionsByOpportunity[0]?.savingsPotentialMXN || 1;
                          const barPct = (s.savingsPotentialMXN / maxSavings) * 100;
                          return (
                            <tr key={s.stateCode} className={`${styles.tableRow} ${selectedStateCode === s.stateCode ? styles.selectedRow : ''}`}
                              onClick={() => setSelectedStateCode(prev => prev === s.stateCode ? null : s.stateCode)}>
                              <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontWeight: 700, width: 30 }}>{i + 1}</td>
                              <td className={styles.nameCell} style={{ fontWeight: 600 }}>{s.stateName}</td>
                              <td style={{ fontFamily: 'var(--font-mono)', textAlign: 'center' }}>{s.hospitalCount}</td>
                              <td style={{ fontFamily: 'var(--font-mono)' }}>{fmtMXN(s.paidU12M)}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ flex: 1, height: 8, background: 'rgba(148,163,184,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{ width: `${barPct}%`, height: '100%', background: barPct > 70 ? '#ef4444' : barPct > 40 ? '#f59e0b' : '#22c55e', borderRadius: 4, transition: 'width 0.5s' }} />
                                  </div>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 600, color: '#f59e0b', minWidth: 50, textAlign: 'right' }}>{fmtMXN(s.savingsPotentialMXN)}</span>
                                </div>
                              </td>
                              <td style={{ fontFamily: 'var(--font-mono)', color: '#22c55e', fontSize: '0.72rem' }}>{fmtMXN(s.savingsCapturedMXN)}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <div style={{ flex: 1, height: 6, background: 'rgba(148,163,184,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ width: `${captureRate}%`, height: '100%', background: captureRate > 40 ? '#22c55e' : captureRate > 25 ? '#f59e0b' : '#ef4444', borderRadius: 3 }} />
                                  </div>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', minWidth: 35, color: 'var(--text-secondary)' }}>{captureRate.toFixed(0)}%</span>
                                </div>
                              </td>
                              <td>{getTrendIcon(s.trend)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Mexico Map */}
                <div style={{ flex: '1 1 360px', minWidth: 300 }}>
                  <h2 className={styles.sectionTitle}><MapPin size={16} /> Vision Geografica</h2>
                  <div className={styles.mapContainer}>
                    <svg viewBox={MEXICO_VIEWBOX} className={styles.mexicoMap} onMouseLeave={() => setMapTooltip(null)}>
                      <defs>
                        <filter id="mapGlow">
                          <feGaussianBlur stdDeviation="2" result="blur" />
                          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                        <linearGradient id="mapBg" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(15,23,42,0.3)" />
                          <stop offset="100%" stopColor="rgba(15,23,42,0)" />
                        </linearGradient>
                      </defs>
                      {Object.entries(mexicoStates).map(([code, state]) => {
                        const sd = statesDataV2.find(s => s.stateCode === code);
                        const fill = sd ? getSavingsColor(sd.savingsPotentialMXN) : '#1e293b';
                        return (
                          <path
                            key={code}
                            d={state.d}
                            fill={fill}
                            className={`${styles.statePath} ${selectedStateCode === code ? styles.statePathSelected : ''}`}
                            onClick={() => setSelectedStateCode(prev => prev === code ? null : code)}
                            onMouseEnter={e => { if (sd) setMapTooltip({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, state: sd }); }}
                            onMouseMove={e => { if (sd) setMapTooltip({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, state: sd }); }}
                            onMouseLeave={() => setMapTooltip(null)}
                          />
                        );
                      })}
                    </svg>
                    {mapTooltip && (
                      <div className={styles.mapTooltip} style={{ left: mapTooltip.x + 12, top: mapTooltip.y - 10 }}>
                        <div className={styles.mapTooltipName}>{mapTooltip.state.stateName}</div>
                        <div>Score: <span className={styles.mapTooltipScore}>{mapTooltip.state.score05.toFixed(2)}</span></div>
                        <div>Pagado: {fmtMXN(mapTooltip.state.paidU12M)}</div>
                        <div>Benchmark: {fmtMXN(mapTooltip.state.benchmarkU12M)}</div>
                        <div>Contencion Potencial: <span style={{ color: '#22c55e', fontWeight: 600 }}>{fmtMXN(mapTooltip.state.savingsPotentialMXN)}</span></div>
                      </div>
                    )}
                    <div className={styles.mapLegend}>
                      <span className={styles.mapLegendLabel}>Bajo</span>
                      <div className={styles.mapLegendGradient} />
                      <span className={styles.mapLegendLabel}>Alto</span>
                    </div>
                    {selectedStateCode && (
                      <div className={styles.mapFilterInfo}>
                        Filtrando por: {statesDataV2.find(s => s.stateCode === selectedStateCode)?.stateName ?? selectedStateCode}
                        <button className={styles.mapClearFilter} onClick={() => setSelectedStateCode(null)}>Limpiar filtro</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Hospital Ranking — top opportunity */}
              <section className={styles.tableSection}>
                <h2 className={styles.sectionTitle}><Building2 size={16} /> Ranking de Hospitales — Mayor Oportunidad de Contencion de Costos</h2>
                <div className={styles.searchBar}>
                  <Search size={16} className={styles.searchIcon} />
                  <input className={styles.searchInput} placeholder="Buscar hospital, ciudad o estado..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  {searchQuery && <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setSearchQuery('')}><X size={14} /></button>}
                </div>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>#</th><th>Hospital</th><th>Region</th><th>Nivel</th>
                        <th>Pagado U12M</th><th>Benchmark</th><th style={{ minWidth: 140 }}>Contencion Potencial</th><th>Gap</th>
                        <th>Alertas</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHospitals.map((h, i) => {
                        const maxSav = filteredHospitals[0]?.savingsPotential || 1;
                        const barW = (h.savingsPotential / maxSav) * 100;
                        return (
                          <tr key={h.id} className={`${styles.tableRow} ${selectedHospitalId === h.id ? styles.selectedRow : ''}`} onClick={() => handleSelectHospital(h.id)}>
                            <td style={{ fontFamily: 'var(--font-mono)', color: i < 3 ? '#ef4444' : i < 6 ? '#f59e0b' : 'var(--text-muted)', fontWeight: 700 }}>{i + 1}</td>
                            <td className={styles.nameCell} style={{ fontWeight: 600 }}>{h.name}</td>
                            <td style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{h.state}</td>
                            <td><span className={`${styles.levelBadge} ${getLevelClass(h.level)}`}>{h.level}</span></td>
                            <td style={{ fontFamily: 'var(--font-mono)' }}>{fmtMXN(h.paidU12M)}</td>
                            <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{fmtMXN(h.benchmark)}</td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ flex: 1, height: 8, background: 'rgba(148,163,184,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                                  <div style={{ width: `${barW}%`, height: '100%', background: h.gap > 10 ? '#ef4444' : h.gap > 5 ? '#f59e0b' : '#22c55e', borderRadius: 4, transition: 'width 0.5s' }} />
                                </div>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: '#f59e0b', minWidth: 50, textAlign: 'right' }}>{fmtMXN(h.savingsPotential)}</span>
                              </div>
                            </td>
                            <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: h.gap > 10 ? '#ef4444' : h.gap > 5 ? '#f59e0b' : '#22c55e', fontSize: '0.75rem' }}>
                              +{h.gap.toFixed(1)}%
                            </td>
                            <td>{renderFlags(h)}</td>
                            <td>
                              <button
                                style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '4px 10px', color: '#f59e0b', fontSize: '0.68rem', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}
                                onClick={(e) => { e.stopPropagation(); handleSelectHospital(h.id); }}
                              >
                                Ver Detalle
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {renderChatSection()}
            </motion.div>
          )}

          {/* ============================================================= */}
          {/* TAB 2: VISION DETALLADA DE HOSPITAL                           */}
          {/* ============================================================= */}
          {activeTab === 'detail' && (
            <motion.div key="detail" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35 }}>
              {!selectedHospital || !selectedAnalysis ? (
                <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
                  <Building2 size={48} style={{ opacity: 0.3, marginBottom: 16 }} />
                  <p style={{ fontSize: '0.92rem' }}>Selecciona un hospital del ranking para ver su detalle.</p>
                  <button className={styles.backToRanking} onClick={() => setActiveTab('evolution')} style={{ margin: '16px auto' }}>
                    <ArrowLeft size={14} /> Ir al Ranking
                  </button>
                </div>
              ) : (
                <>
                  <button className={styles.backToRanking} onClick={() => setActiveTab('evolution')}>
                    <ArrowLeft size={14} /> Volver al Ranking
                  </button>

                  {/* Executive Header */}
                  <div className={styles.detailHeader}>
                    <div className={styles.detailScoreSection}>
                      <div className={`${styles.scoreBadge} ${styles.scoreBadgeLarge} ${getScoreClass(selectedHospital.score05)}`}>
                        {selectedHospital.score05.toFixed(1)}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ejecutivo</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{selectedHospital.score100}/100</div>
                      </div>
                    </div>
                    <div className={styles.detailInfoSection}>
                      <h2 className={styles.detailHospitalName}>{selectedHospital.name}</h2>
                      <div className={styles.detailHospitalMeta}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{selectedHospital.city}, {selectedHospital.state}</span>
                        <span className={`${styles.levelBadge} ${getLevelClass(selectedHospital.level)}`}>{selectedHospital.level}</span>
                        <span className={`${styles.segmentBadge} ${getSegmentClass(selectedHospital.segment)}`}>{selectedHospital.segment}</span>
                        {selectedHospital.atcFlag && <span className={`${styles.alertBadge} ${styles.alertBadgeYellow}`}>ATC</span>}
                      </div>
                      <div className={styles.detailMetrics}>
                        <div className={styles.detailMetric}>
                          <span className={styles.detailMetricValue}>{fmtMXN(selectedHospital.paidU12M)}</span>
                          <span className={styles.detailMetricLabel}>Pagado U12M</span>
                        </div>
                        <div className={styles.detailMetric}>
                          <span className={styles.detailMetricValue}>{fmt(selectedHospital.casesU12M)}</span>
                          <span className={styles.detailMetricLabel}>Casos U12M</span>
                        </div>
                        <div className={styles.detailMetric}>
                          <span className={styles.detailMetricValue}>{selectedHospital.infrastructureRating}/5</span>
                          <span className={styles.detailMetricLabel}>Infraestructura</span>
                        </div>
                        <div className={styles.detailMetric}>
                          <span className={styles.detailMetricValue} style={{ color: selectedHospital.supervisionIndex > 0.15 ? '#ef4444' : '#22c55e' }}>
                            {(selectedHospital.supervisionIndex * 100).toFixed(0)}%
                          </span>
                          <span className={styles.detailMetricLabel}>Supervision</span>
                        </div>
                      </div>
                    </div>
                    {selectedHospital.riskFlags.length > 0 && (
                      <div className={styles.detailAlerts}>
                        {selectedHospital.riskFlags.map(f => (
                          <span key={f.id} className={`${styles.alertBadge} ${f.severity === 'critical' || f.severity === 'high' ? styles.alertBadgeRed : f.severity === 'medium' ? styles.alertBadgeOrange : styles.alertBadgeYellow}`}>
                            <AlertTriangle size={10} /> {f.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 7-Category Radar */}
                  <section className={styles.sevenRadarSection}>
                    <h3 className={styles.sectionTitle}><Target size={16} /> Radar de 7 Categorias de Analisis</h3>
                    <div className={styles.sevenRadarCard}>
                      {renderSevenRadar(selectedAnalysis.categorySummary, 300)}
                    </div>
                    <div className={styles.radarLegend} style={{ marginTop: 12 }}>
                      <span className={styles.radarLegendItem}><span className={styles.radarLegendDot} style={{ background: '#f59e0b' }} /> Hospital</span>
                      <span className={styles.radarLegendItem}><span className={styles.radarLegendDot} style={{ background: '#3b82f6' }} /> Costo Peers (benchmark)</span>
                      <span className={styles.radarLegendItem}><span className={styles.radarLegendDot} style={{ background: 'rgba(148,163,184,0.35)', border: '1px dashed #94a3b8' }} /> Umbral aceptable</span>
                    </div>
                  </section>

                  {/* Category Navigation — single selector (no duplicate) */}
                  <div className={styles.categoryNav}>
                    {CATEGORY_DEFINITIONS.map(catDef => {
                      const cs = selectedAnalysis.categorySummary.find(s => s.category === catDef.id);
                      return (
                        <button
                          key={catDef.id}
                          className={`${styles.categoryNavItem} ${activeCategory === catDef.id ? styles.categoryNavItemActive : ''}`}
                          onClick={() => { setActiveCategory(catDef.id); setShowAgentFlow(null); setShowCoach(null); }}
                        >
                          <span className={styles.categoryNavDot} style={{ background: catDef.color }} />
                          {catDef.shortName}
                          <span className={styles.categoryNavScore}>{cs?.score ?? 0}</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)' }}>{fmtMXN(cs?.impactMXN ?? 0)}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Category Detail Card */}
                  {renderCategoryDetail()}

                  {/* === AGENTIC FLOW for this category === */}
                  <div style={{ marginBottom: 24 }}>
                    <button
                      className={styles.coachButton}
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', marginRight: 12 }}
                      onClick={() => setShowAgentFlow(prev => prev === activeCategory ? null : activeCategory)}
                    >
                      <Cpu size={14} />
                      {showAgentFlow === activeCategory ? 'Ocultar Flujo Agentico' : `Ver Flujo Agentico — ${CATEGORY_DEFINITIONS.find(c => c.id === activeCategory)?.shortName}`}
                    </button>
                  </div>

                  <AnimatePresence>
                    {showAgentFlow === activeCategory && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{ marginBottom: 24 }}
                      >
                        <AgentProcessFlow
                          nodes={CATEGORY_AGENT_FLOWS[activeCategory].nodes}
                          connections={CATEGORY_AGENT_FLOWS[activeCategory].connections}
                          title={`Flujo Agentico — ${CATEGORY_DEFINITIONS.find(c => c.id === activeCategory)?.name}`}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* === NEGOTIATION COACH + SCRIPT === */}
                  {activeCategoryArgs.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      {activeCategoryArgs.map(arg => (
                        <div key={arg.id}>
                          <button
                            className={styles.coachButton}
                            onClick={() => setShowCoach(prev => prev === arg.id ? null : arg.id)}
                          >
                            <MessageSquare size={14} />
                            {showCoach === arg.id ? 'Ocultar Argumentos' : `Generar Argumentos de Negociacion — ${arg.lever}`}
                          </button>
                          <AnimatePresence>
                            {showCoach === arg.id && renderNegotiationCoach(arg)}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeCategoryArgs.length === 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <button className={styles.coachButton} style={{ opacity: 0.5, cursor: 'not-allowed' }} disabled>
                        <MessageSquare size={14} /> Sin argumentos pre-generados para esta categoria
                      </button>
                    </div>
                  )}

                  {/* Negotiation script removed — content moved to Fact Pack */}

                  {/* === OPPORTUNITIES for this hospital (merged from old tab) === */}
                  {hospitalOpportunities.length > 0 && (
                    <section className={styles.tableSection} style={{ marginTop: 8 }}>
                      <h3 className={styles.sectionTitle}><Zap size={16} /> Oportunidades de Negociacion — {selectedHospital.name}</h3>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                        <div className={styles.kpiCard} style={{ flex: '1 1 180px' }}>
                          <Zap size={16} className={styles.kpiIcon} />
                          <span className={styles.kpiValue} style={{ fontSize: '1.1rem' }}>{hospitalOpportunities.length}</span>
                          <span className={styles.kpiLabel}>Oportunidades</span>
                        </div>
                        <div className={styles.kpiCard} style={{ flex: '1 1 180px' }}>
                          <DollarSign size={16} className={styles.kpiIcon} />
                          <span className={styles.kpiValue} style={{ fontSize: '1.1rem', color: '#22c55e' }}>{fmtMXN(hospitalOpportunities.reduce((s, o) => s + o.estimatedImpactMXN, 0))}</span>
                          <span className={styles.kpiLabel}>Impacto Total Estimado</span>
                        </div>
                        <div className={styles.kpiCard} style={{ flex: '1 1 180px' }}>
                          <AlertTriangle size={16} className={styles.kpiIcon} />
                          <span className={styles.kpiValue} style={{ fontSize: '1.1rem', color: '#ef4444' }}>{hospitalOpportunities.filter(o => o.priority === 'critical' || o.priority === 'high').length}</span>
                          <span className={styles.kpiLabel}>Alta/Critica Prioridad</span>
                        </div>
                      </div>
                      <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                          <thead>
                            <tr><th>Categoria</th><th>Descripcion</th><th>Impacto Est.</th><th>Prioridad</th><th>Estado</th><th></th></tr>
                          </thead>
                          <tbody>
                            {hospitalOpportunities.map(opp => (
                              <tr key={opp.id} className={`${styles.tableRow} ${expandedOpportunityId === opp.id ? styles.selectedRow : ''}`}>
                                <td><span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#f59e0b' }}>{opp.categoryLabel}</span></td>
                                <td style={{ maxWidth: 280, fontSize: '0.75rem' }}>{opp.description}</td>
                                <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{fmtMXN(opp.estimatedImpactMXN)}</td>
                                <td><span className={`${styles.priorityBadge} ${getPriorityClass(opp.priority)}`}>{opp.priority === 'critical' ? 'Critica' : opp.priority === 'high' ? 'Alta' : opp.priority === 'medium' ? 'Media' : 'Baja'}</span></td>
                                <td><span className={`${styles.statusBadge} ${getStatusClass(opp.status)}`}>{getStatusLabel(opp.status)}</span></td>
                                <td>
                                  <button
                                    style={{ background: 'none', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '3px 8px', color: '#f59e0b', fontSize: '0.65rem', cursor: 'pointer' }}
                                    onClick={() => setExpandedOpportunityId(prev => prev === opp.id ? null : opp.id)}
                                  >
                                    {expandedOpportunityId === opp.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Expanded opportunity detail */}
                      <AnimatePresence>
                        {expandedOpportunityId && (() => {
                          const opp = hospitalOpportunities.find(o => o.id === expandedOpportunityId);
                          if (!opp) return null;
                          return (
                            <motion.div
                              key={opp.id}
                              className={styles.detailPanel}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <div className={styles.detailPanelHeader}>
                                <div className={styles.detailPanelTitle}>
                                  <Zap size={18} /> {opp.categoryLabel}
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <span className={`${styles.priorityBadge} ${getPriorityClass(opp.priority)}`}>
                                    {opp.priority === 'critical' ? 'Critica' : opp.priority === 'high' ? 'Alta' : opp.priority === 'medium' ? 'Media' : 'Baja'}
                                  </span>
                                  <span className={`${styles.statusBadge} ${getStatusClass(opp.status)}`}>
                                    {getStatusLabel(opp.status)}
                                  </span>
                                  <button onClick={() => setExpandedOpportunityId(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={16} /></button>
                                </div>
                              </div>
                              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>{opp.executiveSummary}</p>
                              <div className={styles.detailGrid}>
                                <div className={styles.detailCard}>
                                  <h4 className={styles.detailCardTitle}>Evidencia Cuantitativa</h4>
                                  <ul className={styles.evidenceList}>
                                    {opp.quantitativeEvidence.map((ev, i) => <li key={i} className={styles.evidenceItem}>{ev}</li>)}
                                  </ul>
                                </div>
                                <div className={styles.detailCard}>
                                  <h4 className={styles.detailCardTitle}>Drivers</h4>
                                  <ul className={styles.evidenceList}>
                                    {opp.drivers.map((d, i) => <li key={i} className={styles.evidenceItem}>{d}</li>)}
                                  </ul>
                                </div>
                                <div className={styles.detailCard}>
                                  <h4 className={styles.detailCardTitle}>Propuesta</h4>
                                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{opp.negotiationProposal}</p>
                                </div>
                              </div>
                              {opp.actionPlan.length > 0 && (
                                <div style={{ marginTop: 16 }}>
                                  <span className={styles.resultLabel}>Plan de Accion</span>
                                  {opp.actionPlan.map((step, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '6px 0' }}>
                                      <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontSize: '0.6rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{step}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </motion.div>
                          );
                        })()}
                      </AnimatePresence>
                    </section>
                  )}

                  {/* Action Row */}
                  <div className={styles.actionRow}>
                    <button className={`${styles.actionButton} ${styles.actionButtonPrimary}`} onClick={() => setShowFactPack(p => !p)}>
                      <FileText size={14} /> {showFactPack ? 'Ocultar Fact Pack' : 'Generar Fact Pack Integral'}
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
                      onClick={handleGenerateFactPackPDF}
                      disabled={generatingPDF}
                    >
                      {generatingPDF ? <Loader2 size={14} className={styles.spinner} /> : <Download size={14} />}
                      {generatingPDF ? 'Generando...' : 'Descargar Fact Pack PDF'}
                    </button>
                  </div>

                  {/* Fact Pack Panel — comprehensive per-lever */}
                  <AnimatePresence>
                    {showFactPack && (
                      <motion.div className={styles.factPackPanel} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                        <h4 className={styles.factPackTitle}><CheckCircle2 size={16} /> Fact Pack Integral — {selectedHospital.name}</h4>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
                          Documento completo para la mesa de negociacion. Incluye argumento de valor y recomendacion por cada una de las 7 palancas de analisis, con evidencia cuantitativa, scripts y propuestas concretas.
                        </p>

                        {/* Per-lever sections */}
                        {CATEGORY_DEFINITIONS.map((catDef, ci) => {
                          const cs = selectedAnalysis.categorySummary.find(s => s.category === catDef.id);
                          const leverArgs = negotiationArguments.filter(a => a.hospitalId === selectedHospital.id && a.category === catDef.id);
                          const leverOpps = negotiationOpportunities.filter(o => o.hospitalId === selectedHospital.id && o.category === catDef.id);
                          const scripts = NEGOTIATION_SCRIPTS[catDef.id](selectedHospital.name, leverArgs);
                          const fullTexts = buildFullArgumentText(catDef.id, selectedHospital.name, leverArgs);

                          return (
                            <div key={catDef.id} style={{
                              marginBottom: 24, padding: '20px 24px',
                              background: 'rgba(148,163,184,0.03)',
                              border: `1px solid rgba(148,163,184,0.08)`,
                              borderLeft: `4px solid ${catDef.color}`,
                              borderRadius: 'var(--radius-md)',
                            }}>
                              {/* Lever header */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{
                                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                                    background: `${catDef.color}20`, color: catDef.color,
                                    fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  }}>{ci + 1}</span>
                                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)' }}>{catDef.name}</span>
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: (cs?.score ?? 0) > 50 ? '#ef4444' : (cs?.score ?? 0) > 30 ? '#f59e0b' : '#22c55e' }}>
                                    Score: {cs?.score ?? 0}/100
                                  </span>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', fontWeight: 700, color: '#ef4444' }}>
                                    Impacto: {fmtMXN(cs?.impactMXN ?? 0)}
                                  </span>
                                </div>
                              </div>

                              {/* Argumento de Valor */}
                              <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: catDef.color, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                                  Argumento de Valor
                                </div>
                                {fullTexts.length > 0 ? fullTexts.map((ft, fi) => (
                                  <div key={fi} style={{ marginBottom: 10 }}>
                                    {fi > 0 && <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f59e0b', marginBottom: 4 }}>{ft.title}</div>}
                                    {ft.sections.map((sec, si) => (
                                      <div key={si} style={{ marginBottom: 8 }}>
                                        <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{sec.heading}: </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{sec.body}</span>
                                      </div>
                                    ))}
                                  </div>
                                )) : (
                                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                                    No se identificaron desviaciones significativas en esta palanca. Se recomienda monitoreo continuo.
                                  </p>
                                )}
                              </div>

                              {/* Script de Negociacion */}
                              <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: catDef.color, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
                                  Script de Negociacion
                                </div>
                                {scripts.map((line, li) => {
                                  const phases = ['Apertura', 'Evidencia', 'Propuesta', 'Cierre'];
                                  return (
                                    <div key={li} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                                      <span style={{ fontSize: '0.62rem', fontWeight: 700, color: catDef.color, minWidth: 60, flexShrink: 0, paddingTop: 2 }}>{phases[li]}:</span>
                                      <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.55, fontStyle: 'italic' }}>{line}</span>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Recomendacion */}
                              <div style={{
                                padding: '12px 16px',
                                background: `${catDef.color}08`,
                                border: `1px solid ${catDef.color}20`,
                                borderRadius: 'var(--radius-sm)',
                              }}>
                                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: catDef.color, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>
                                  Recomendacion
                                </div>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                  {leverArgs.length > 0
                                    ? leverArgs[0].proposal
                                    : leverOpps.length > 0
                                      ? leverOpps[0].negotiationProposal
                                      : `Mantener monitoreo trimestral de ${catDef.name.toLowerCase()}. No se requiere accion inmediata en esta palanca.`
                                  }
                                </p>
                              </div>
                            </div>
                          );
                        })}

                        <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
                          <button
                            className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
                            style={{ borderColor: 'rgba(34,197,94,0.3)', color: '#22c55e', background: 'rgba(34,197,94,0.08)' }}
                            onClick={handleGenerateFactPackPDF}
                            disabled={generatingPDF}
                          >
                            {generatingPDF ? <Loader2 size={14} className={styles.spinner} /> : <Download size={14} />}
                            {generatingPDF ? 'Generando...' : 'Descargar Fact Pack PDF'}
                          </button>
                          <button
                            className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
                            style={{ borderColor: 'rgba(34,197,94,0.3)', color: '#22c55e', background: 'rgba(34,197,94,0.08)' }}
                            onClick={() => {
                              const mailto = `mailto:?subject=Fact Pack Integral - ${selectedHospital.name}&body=Se adjunta el Fact Pack Integral de ${selectedHospital.name} para revision.`;
                              window.open(mailto);
                            }}
                          >
                            <Send size={14} /> Enviar a Stakeholders
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {renderChatSection()}
                </>
              )}
            </motion.div>
          )}

          {/* Opportunities tab removed — content merged into detail view */}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProviderRankingWorkstation;
