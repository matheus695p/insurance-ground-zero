# Insurance AI Control Tower — Design Document

**Date:** 2026-03-02
**Status:** Approved
**Scope:** Refactor consumer industry app → Health Insurance AI Control Tower

---

## Overview

Refactor the existing QuantumBlack "Agentic AI Control Tower for Consumer Industry" into an **Insurance-focused** platform. The application will demonstrate AI-driven decision support across the insurance value chain, with a **health insurance** Line of Business focus and **generic/global** market context (USD, no specific country).

**App Title:** "AI / Agentic AI Control Tower for Insurance"

## Architecture

No changes to the technical architecture:
- React 19 + TypeScript + Vite
- Framer Motion animations
- Vercel serverless API (Anthropic Claude / OpenAI)
- Same routing pattern: Landing → Domain → Workstation
- Same workstation pattern: Data Panel → Agents → Simulation → Chat

## Domains (4) and Use Cases (14)

### Domain A: Distribution, Sales & Marketing
- **ID:** `distribution`
- **Color:** `#00d4aa` (teal)
- **Position:** 1
- **Description:** Optimize agent/broker channel performance, prospect targeting, cross-sell execution, and policyholder retention to maximize premium growth and reduce lapse rates.

| # | Use Case ID | Title | Primary KPI | Benchmark Impact |
|---|-------------|-------|-------------|-----------------|
| 1 | `distribution-productivity` | Distribution Productivity Management | New Business | 10-15% |
| 2 | `value-based-prospecting` | Value-Based Prospecting | New Business | 7-11% |
| 3 | `next-best-action` | Next Best Action & Product Propensity | New Business | 7-11% |
| 4 | `retention-management` | Retention Management | Lapses | 10-18% |

### Domain B: Underwriting & Pricing
- **ID:** `underwriting`
- **Color:** `#3b82f6` (blue)
- **Position:** 2
- **Description:** Automate risk assessment, calibrate actuarial models, and optimize market pricing to balance growth, profitability, and policyholder retention.

| # | Use Case ID | Title | Primary KPI | Benchmark Impact |
|---|-------------|-------|-------------|-----------------|
| 5 | `underwriting-automation` | Underwriting Automation | New Business | 4-6% |
| 6 | `technical-pricing` | Technical Pricing | Loss Ratio | 2-3pp |
| 7 | `lifetime-pricing` | Lifetime-Based Pricing | CoR / New Business | 2-3pp |
| 8 | `market-pricing-new` | Market Pricing — New Business | New Business | 10-14% |
| 9 | `market-pricing-lapses` | Market Pricing — Lapse Prevention | Lapses | 5-10% |

### Domain C: Claims Management
- **ID:** `claims`
- **Color:** `#f59e0b` (amber)
- **Position:** 3
- **Description:** Reduce claims costs through prevention, intelligent triage, settlement optimization, provider network management, and fraud detection.

| # | Use Case ID | Title | Primary KPI | Benchmark Impact |
|---|-------------|-------|-------------|-----------------|
| 10 | `claims-prevention` | Claims Prevention | Loss Ratio | 0-1% |
| 11 | `fnol-triage` | FNOL Triage & Best-Match Routing | Loss Ratio | 1-2pp |
| 12 | `claims-settlement` | Claims Handling & Settlement Optimization | Loss Ratio | 2-5% |
| 13 | `network-optimization` | Provider Network & Supplier Performance | Loss Ratio | ~1% |
| 14 | `fraud-detection` | Fraud Detection | Loss Ratio | 1-2% |

---

## Data Model Design

### Global Context
- **Currency:** USD
- **Market:** Generic/Global (no specific country)
- **LoB Focus:** Health Insurance
- **Product Lines:** Individual Health, Family Health, Group/Employer Health, Medicare Supplement, Dental/Vision

### Data Directory Structure
```
src/data/
├── domains.ts                    (4 domains, 14 use cases)
├── distribution/
│   ├── types.ts
│   ├── distribution-productivity-data.ts
│   ├── prospecting-data.ts
│   ├── next-best-action-data.ts
│   └── retention-data.ts
├── underwriting/
│   ├── types.ts
│   ├── underwriting-automation-data.ts
│   ├── technical-pricing-data.ts
│   ├── lifetime-pricing-data.ts
│   ├── market-pricing-new-data.ts
│   └── market-pricing-lapses-data.ts
└── claims/
    ├── types.ts
    ├── claims-prevention-data.ts
    ├── fnol-triage-data.ts
    ├── claims-settlement-data.ts
    ├── network-optimization-data.ts
    └── fraud-detection-data.ts
```

---

## Workstation Specifications

### 1. Distribution Productivity Management
- **Data:** 20 insurance agents/brokers with territory, conversion funnel, policies sold, revenue
- **Types:** `Agent`, `Territory`, `ConversionFunnel`
- **KPIs:** Policies sold/agent, Conversion rate %, Revenue/agent, Active lead pipeline
- **Simulation:** Reassign territories → model impact on conversion & workload balance
- **Agent:** Distribution Optimizer — recommends territory rebalancing and workload distribution

### 2. Value-Based Prospecting
- **Data:** 30 prospects with demographics, behavioral attributes, propensity scores, estimated LTV
- **Types:** `Prospect`, `PropensityScore`, `LifetimeValueEstimate`
- **KPIs:** Avg LTV, Conversion probability, Prospect pool size, Expected premium
- **Simulation:** Adjust targeting criteria (age, risk tier, LTV threshold) → model yield & acquisition cost
- **Agent:** Prospecting Engine — ranks prospects by expected value, suggests outreach strategy

### 3. Next Best Action & Product Propensity
- **Data:** 25 members with current policies, claims history, engagement events, product holdings
- **Types:** `Member`, `ActionRecommendation`, `ProductPropensity`
- **KPIs:** Cross-sell rate, Actions per member, Revenue uplift, Engagement score
- **Simulation:** Select member → view recommended actions (cross-sell dental, upgrade plan, schedule wellness) + predicted uptake probability
- **Agent:** NBA Engine — generates personalized action queue ranked by expected value

### 4. Retention Management
- **Data:** 30 policyholders with tenure, premium, claims frequency, satisfaction scores, churn risk
- **Types:** `PolicyHolder`, `ChurnRiskScore`, `RetentionIntervention`
- **KPIs:** Churn rate %, At-risk members count, Retention intervention ROI, Save rate %
- **Simulation:** Adjust intervention thresholds (discount %, outreach timing) → model retention impact & cost
- **Agent:** Retention Predictor — identifies at-risk members, recommends personalized retention strategy

### 5. Underwriting Automation
- **Data:** 20 applications with applicant info, medical history, risk factors, document status
- **Types:** `Application`, `RiskAssessment`, `UnderwritingDecision`
- **KPIs:** STP (Straight-Through Processing) rate %, Avg processing time (hours), Decline rate, Referral rate
- **Simulation:** Select application → AI performs risk assessment, generates auto-decision with confidence
- **Agent:** Underwriting Engine — processes applications, flags exceptions, explains risk factors

### 6. Technical Pricing
- **Data:** 15 rating factors (age, BMI, smoking, chronic conditions), 20 experience records by cohort, loss development triangles
- **Types:** `RatingFactor`, `ExperienceRecord`, `PricingModel`, `LossTriangle`
- **KPIs:** Loss ratio %, Combined ratio %, Rate adequacy %, Premium sufficiency index
- **Simulation:** Adjust rating factor weights → model impact on loss ratio & premium volume
- **Agent:** Actuarial Pricing Model — recalibrates rates based on emerging experience, recommends adjustments

### 7. Lifetime-Based Pricing
- **Data:** 12 policy cohorts with multi-year persistency curves, claims trajectories, lifetime P&L
- **Types:** `PolicyCohort`, `PersistencyCurve`, `LifetimeProjection`
- **KPIs:** Lifetime value ($), Persistency rate (Year 1-5), Claims trajectory trend, Break-even year
- **Simulation:** Adjust first-year acquisition discount → model LTV impact & break-even shift
- **Agent:** Lifetime Pricing Engine — optimizes entry pricing for long-term profitability

### 8. Market Pricing — New Business
- **Data:** 10 competitor rate benchmarks, elasticity curves by segment (age/plan type)
- **Types:** `CompetitorRate`, `ElasticityModel`, `PricePoint`
- **KPIs:** Market share %, Price competitiveness index, Win rate %, Price elasticity
- **Simulation:** Adjust price position relative to market → model volume/revenue tradeoff
- **Agent:** Market Pricing Optimizer — recommends competitive price points per segment

### 9. Market Pricing — Lapse Prevention
- **Data:** 25 policies approaching renewal with price sensitivity scores, behavioral indicators
- **Types:** `LapseRiskPolicy`, `PriceSensitivity`, `RenewalOffer`
- **KPIs:** Lapse rate %, Price sensitivity index, Renewal rate %, Premium retention $
- **Simulation:** Adjust renewal discount/benefit enhancement → model retention vs. margin tradeoff
- **Agent:** Lapse Prevention Engine — generates personalized renewal offers per policyholder

### 10. Claims Prevention
- **Data:** 20 member health profiles with chronic conditions, wellness program eligibility, risk scores
- **Types:** `MemberHealthProfile`, `PreventionProgram`, `RiskAlert`
- **KPIs:** Claims frequency (per 1000 members), Prevention enrollment %, Risk reduction %, Cost avoidance $
- **Simulation:** Select member → view health risk profile + prevention program recommendations
- **Agent:** Prevention Advisor — recommends wellness interventions (screenings, coaching, medication adherence)

### 11. FNOL Triage & Best-Match Routing
- **Data:** 25 incoming claims (mix of medical, dental, vision), 10 adjusters with specialization & workload
- **Types:** `Claim`, `TriageClassification`, `AdjusterProfile`
- **KPIs:** Avg triage time (minutes), Routing accuracy %, Handler utilization %, Severity distribution
- **Simulation:** Submit new claim → AI classifies severity (low/medium/high/catastrophic) + routes to optimal handler
- **Agent:** Triage Engine — auto-classifies claims, matches to best-fit adjuster

### 12. Claims Handling & Settlement Optimization
- **Data:** 20 open claims with itemized medical bills, reserve estimates, negotiation history, timelines
- **Types:** `OpenClaim`, `ReserveEstimate`, `SettlementOption`
- **KPIs:** Avg cycle time (days), Reserve accuracy %, Leakage %, Settlement efficiency ratio
- **Simulation:** Select claim → AI recommends reserve adjustment + settlement strategy + timing
- **Agent:** Settlement Optimizer — minimizes leakage, recommends optimal settlement approach

### 13. Provider Network & Supplier Performance
- **Data:** 30 healthcare providers (hospitals, specialists, labs) with cost, quality scores, patient volumes
- **Types:** `Provider`, `QualityScore`, `ContractTerms`, `PatientOutcome`
- **KPIs:** Avg cost per procedure $, Quality score (1-100), Network adequacy %, Savings potential $
- **Simulation:** Adjust network composition (add/remove providers) → model cost & quality impact
- **Agent:** Network Analyzer — identifies underperforming providers, suggests tier adjustments

### 14. Fraud Detection
- **Data:** 20 flagged claims with anomaly scores, pattern matches, provider/member linkage
- **Types:** `SuspiciousClaim`, `FraudIndicator`, `InvestigationCase`
- **KPIs:** Fraud detection rate %, False positive rate %, Recovery amount $, Investigation backlog count
- **Simulation:** Select flagged case → AI explains fraud signals with confidence breakdown
- **Agent:** Fraud Detection Engine — scores claims for fraud risk, explains anomaly patterns

---

## Files to Create (New)

### Data Files (19 files)
- `src/data/domains.ts` (rewrite)
- `src/data/distribution/types.ts`
- `src/data/distribution/distribution-productivity-data.ts`
- `src/data/distribution/prospecting-data.ts`
- `src/data/distribution/next-best-action-data.ts`
- `src/data/distribution/retention-data.ts`
- `src/data/underwriting/types.ts`
- `src/data/underwriting/underwriting-automation-data.ts`
- `src/data/underwriting/technical-pricing-data.ts`
- `src/data/underwriting/lifetime-pricing-data.ts`
- `src/data/underwriting/market-pricing-new-data.ts`
- `src/data/underwriting/market-pricing-lapses-data.ts`
- `src/data/claims/types.ts`
- `src/data/claims/claims-prevention-data.ts`
- `src/data/claims/fnol-triage-data.ts`
- `src/data/claims/claims-settlement-data.ts`
- `src/data/claims/network-optimization-data.ts`
- `src/data/claims/fraud-detection-data.ts`

### Workstation Files (14 workstations × 2 files = 28 files)
- `src/pages/DistributionProductivityWorkstation.tsx` + `.module.css`
- `src/pages/ValueBasedProspectingWorkstation.tsx` + `.module.css`
- `src/pages/NextBestActionWorkstation.tsx` + `.module.css`
- `src/pages/RetentionManagementWorkstation.tsx` + `.module.css`
- `src/pages/UnderwritingAutomationWorkstation.tsx` + `.module.css`
- `src/pages/TechnicalPricingWorkstation.tsx` + `.module.css`
- `src/pages/LifetimePricingWorkstation.tsx` + `.module.css`
- `src/pages/MarketPricingNewWorkstation.tsx` + `.module.css`
- `src/pages/MarketPricingLapsesWorkstation.tsx` + `.module.css`
- `src/pages/ClaimsPreventionWorkstation.tsx` + `.module.css`
- `src/pages/FnolTriageWorkstation.tsx` + `.module.css`
- `src/pages/ClaimsSettlementWorkstation.tsx` + `.module.css`
- `src/pages/NetworkOptimizationWorkstation.tsx` + `.module.css`
- `src/pages/FraudDetectionWorkstation.tsx` + `.module.css`

### Files to Modify
- `src/pages/WorkstationRouter.tsx` (new imports + routing map)
- `src/pages/Landing.tsx` (update subtitle, domain grid for 4 domains)
- `index.html` (update title to "Insurance")

### Files to Delete
All old consumer industry data and workstation files (20 workstations + 9 domain data directories).

---

## Landing Page Changes

- **Title:** "AI / Agentic AI Control Tower for Insurance"
- **Subtitle word cycle:** Claims, Underwriting, Distribution, Pricing, Fraud, Networks, Retention, Prospecting
- **Domain grid:** 4 domains (down from 9), adjust layout
- **Agent count:** Update total agent count to reflect 14 workstations
