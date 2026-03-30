# Consumer Industry — Agentic AI Control Tower Design

## Overview

Transform the existing Retail Banking Agentic AI Control Tower into a Consumer Industry Digital Control Tower. Full replacement of all banking content with 9 consumer domains and 20 use cases, each with a custom workstation page.

## Decisions Made

- **9 domains displayed individually** on landing page (no A/B/C row grouping)
- **20 custom workstations** — every use case gets a unique page
- **Full replacement** — remove all banking content entirely
- **Value chain flow layout** on landing page with animated SVG connections
- **Branding:** "Agentic AI Control Tower for Consumer Industry"
- **Approach:** Parallel rebuild in priority waves with shared building blocks
- **Page structure:** Follows the spec exactly — each page renders only the sections defined in the Enterprise Digital Control Tower document

## Tech Stack (unchanged)

- React 19 + TypeScript + Vite
- CSS Modules with QuantumBlack dark theme
- Framer Motion for animations
- Lucide React for icons

---

## 1. Domain Architecture

9 domains, flat structure (no sub-domains), value chain ordered:

| # | Domain ID | Domain Name | Use Cases | Accent Color |
|---|-----------|-------------|-----------|--------------|
| 1 | rgm | Revenue Growth Management | 3 | Teal (#00d4aa) |
| 2 | supply-chain | Supply Chain | 2 | Blue (#3b82f6) |
| 3 | manufacturing | Manufacturing | 3 | Amber (#f59e0b) |
| 4 | rtm | Route to Market | 2 | Purple (#8b5cf6) |
| 5 | procurement | Procurement | 2 | Green (#22c55e) |
| 6 | sales | Sales | 3 | Orange (#f97316) |
| 7 | innovation | Innovation | 2 | Cyan (#06b6d4) |
| 8 | growth | Growth & Adjacencies | 2 | Violet (#a78bfa) |
| 9 | new-business | New Business Creation | 1 | Rose (#f43f5e) |

### Domain → Use Case Mapping

```
rgm/
  pricing-optimization          (Integrated Pricing Optimization)
  promotional-effectiveness     (Promotional Effectiveness Optimization)
  margin-leakage                (Margin Leakage Management)

supply-chain/
  demand-planning               (Integrated Demand Planning)
  inventory-optimization        (Inventory and Strategic Stock Optimization)

manufacturing/
  predictive-maintenance        (Operational Reliability and Predictive Maintenance)
  conversion-cost               (Conversion Cost Optimization)
  production-flexibility        (Production Flexibility Simulation)

rtm/
  coverage-optimization         (Commercial Coverage Optimization)
  route-optimization            (Route Optimization)

procurement/
  strategic-sourcing            (Strategic Sourcing)
  commodity-forecast            (Commodity Forecast and Risk Monitoring)

sales/
  customer-potential            (Customer Potential Prioritization)
  commercial-effectiveness      (Commercial Effectiveness)
  commercial-forecasting        (Commercial Forecasting)

innovation/
  time-to-market                (Time-to-Market Acceleration)
  concept-validation            (Early Concept Validation)

growth/
  expansion-mapping             (Expansion Footprint Mapping)
  go-to-market                  (Go-to-Market Design)

new-business/
  opportunity-identification    (New Opportunity Identification)
```

---

## 2. Landing Page — Value Chain Flow

### Hero Section
- Title: "Agentic AI Control Tower"
- Subtitle: "Consumer Industry"
- Word cycler: Pricing → Demand → Manufacturing → Routes → Sourcing → Sales → Innovation → Growth
- Animated background orbs (kept from banking version)
- Stats bar: "9 Domains · 20 Use Cases · 47 AI Agents · $2.3B+ Impact Potential"

### Value Chain Flow (centerpiece)
Visual layout showing domain interconnections:

```
[Procurement] → [Supply Chain] → [Manufacturing] → [RTM] → [Sales]
                                                              ↓
[New Business] ← [Growth] ← [Innovation] ←←←←←←← [RGM] ←←←←
```

Each domain is a card with:
- Domain icon (Lucide)
- Domain name
- Use case count badge
- Accent color border/glow
- Hover: expands to show use case titles
- Click: navigates to domain page

Connections are animated SVG paths with dashed stroke animation.

### Impact Highlights
Horizontal scrollable section below the flow — one stat card per domain showing top metric.

---

## 3. Routing Structure

```
/                                          → Landing (value chain flow)
/domain/:domainId                          → DomainPage (use case list)
/domain/:domainId/workstation/:useCaseId   → Workstation (custom page per use case)
/login                                     → LoginPage
```

No sub-domain level needed — domains link directly to their use case list.

---

## 4. Workstation Page Architecture

Each workstation follows the exact structure from the spec document. Sections render ONLY when the spec defines them for that use case.

### Possible Sections (per use case):

1. **Page Objective** — Hero banner with objective statement and decision context
2. **The Page Must** — Core data display: tables, filters, visualizations, KPIs
3. **Analytical Requirements** — Computation engine: detection, elasticity, simulation, estimation
4. **Agent Responsibilities** — Multi-agent panel: roles, recommendations, actions
5. **Required Outputs** — Structured deliverables: tables, summaries, alerts, exports

### Per-Use-Case Section Mapping:

#### DOMAIN 1: RGM

**UC1 — Pricing Optimization** (5 sections):
- Objective: Optimal price architecture across SKUs, channels, segments
- Page Must: Transactional pricing table (list price, net realized, discount depth, rebates, consumer price, gross/net margin). Filters: channel, geography, segment, category. Price waterfall chart.
- Analytics: Channel inconsistency detection. Discount stacking margin erosion. Price elasticity by SKU/channel. Price change simulator (volume/revenue/margin/EBITDA).
- Agents: Policy Deviation Monitor. Pricing Band Recommender. Out-of-Policy Identifier. Recovery Quantifier.
- Outputs: Price architecture table. Margin recovery estimate. Sensitivity scenarios. Executive distortion summary.

**UC2 — Promotional Effectiveness** (5 sections):
- Objective: Maximize promotional ROI
- Page Must: Historical promo performance (baseline, uplift, cannibalization, post-promo margin, ROI). Event comparison.
- Analytics: Promotional elasticity identification. Margin destruction detection. Incremental vs cannibalized volume. Future promo simulation.
- Agents: SKU Promo Ranker. Discount Depth Optimizer. Calendar Optimizer. ROI Projector.
- Outputs: Promotional ranking table. Scenario simulation. Margin preservation alerts.

**UC3 — Margin Leakage** (4 sections — no Required Outputs):
- Objective: Identify and quantify margin erosion sources
- Page Must: Product ranking by net margin deviation. Channel abnormal discount highlights. Margin loss heatmaps.
- Analytics: Cumulative margin leakage. Rebate anomaly detection. Out-of-policy customer identification.
- Agents: Intervention Prioritizer. Margin Recovery Estimator. Negotiation Prep Agent.

#### DOMAIN 2: SUPPLY CHAIN

**UC4 — Demand Planning** (5 sections):
- Objective: Integrated cross-functional demand forecast
- Page Must: SKU-level monthly forecasts. Forecast vs actual. Scenario simulations (base/optimistic/pessimistic). Raw material implications.
- Analytics: Historical + promotions + seasonality + macro signal integration. Forecast bias detection. Procurement/production impact estimation.
- Agents: Forecast Auto-Adjuster. Supply Capacity Alert Agent. Material Planning Projector.
- Outputs: Final forecast version. Commodity demand projections. Forecast accuracy metrics.

**UC5 — Inventory Optimization** (4 sections — no Required Outputs):
- Objective: Optimize working capital via efficient inventory levels
- Page Must: EOQ, safety stock, reorder point, days of inventory. Overstock/understock SKU identification.
- Analytics: Classical inventory models. Reduction simulation. Capital release estimation.
- Agents: Stock Adjustment Recommender. Financial Impact Quantifier. Service Level Monitor.

#### DOMAIN 3: MANUFACTURING

**UC6 — Predictive Maintenance** (4 sections — no Required Outputs):
- Objective: Maximize asset availability via predictive failure detection
- Page Must: Multi-plant overview. Line-level comparison. Machine-level risk scoring. Remaining useful life. KPIs: OEE, MTBF, MTTR, Availability, Scrap rate, Energy efficiency.
- Analytics: Failure probability prediction. Performance deterioration detection. Downtime financial impact.
- Agents: Maintenance Schedule Generator. Financial Impact Prioritizer. Downtime Risk Simulator.

**UC7 — Conversion Cost** (4 sections — no Required Outputs):
- Objective: Reduce scrap, rework, variability; improve financial performance
- Page Must: Line-level scrap trends. Cost per unit variance. Financial impact of inefficiencies.
- Analytics: Variability driver detection. Scrap reduction simulation. EBITDA improvement estimation.
- Agents: Initiative Ranker. Cost Savings Quantifier. Corrective Action Recommender.

**UC8 — Production Flexibility** (3 sections — no Analytics/Outputs as separate):
- Objective: Operational scenario simulation under demand changes
- Page Must: Demand variation simulation (+/- %). Mix shift simulation. Shift reallocation.
- Analytics: Capacity modeling. Labor estimation. Cost impact analysis.
- Agents: Workforce Reconfiguration Optimizer. Cost vs Revenue Estimator.

#### DOMAIN 4: RTM

**UC9 — Coverage Optimization** (4 sections):
- Objective: Prioritize customers via macro-segmentation and volume
- Page Must: Segmentation display (Platinum/Gold/Silver/Bronze/Inactive). Visit frequency recommendations. Client drill-down.
- Analytics: Volume × profitability cross-analysis. Over-serviced account detection. Underpenetrated client identification.
- Agents: Visit Frequency Recommender. Resource Allocation Optimizer.

**UC10 — Route Optimization** (4 sections):
- Objective: Maximize salesforce productivity
- Page Must: Route-level optimization. Visit sequencing. Customer-specific commercial focus.
- Analytics: Travel time optimization. Incremental revenue per visit. Potential scoring integration.
- Agents: Sales Script Generator. Product Focus Advisor. Client Growth Strategist.

#### DOMAIN 5: PROCUREMENT

**UC11 — Strategic Sourcing** (4 sections):
- Objective: Strengthen negotiation leverage and supplier prioritization
- Page Must: Supplier ranking (spend + risk). Benchmark pricing comparisons. Concentration risk highlights.
- Analytics: Above-market-benchmark detection. Negotiation scenario simulation. Cost reduction estimation.
- Agents: Negotiation Argument Generator. Anchor Pricing Strategist. Diversification Advisor.

**UC12 — Commodity Forecast** (4 sections):
- Objective: Monitor commodity exposure and price volatility
- Page Must: Price trend forecasts. Contract coverage ratio. Margin impact estimation.
- Analytics: Commodity price increase simulation. EBITDA exposure estimation.
- Agents: Hedging Strategy Recommender. Uncovered Exposure Alert Agent.

#### DOMAIN 6: SALES

**UC13 — Customer Potential** (4 sections):
- Objective: Rank customers by growth potential
- Page Must: Growth gap vs benchmark. Channel-level ranking.
- Analytics: Unrealized revenue estimation. Underpenetration detection.
- Agents: Dynamic Ranking Generator. Expansion Plan Proposer.

**UC14 — Commercial Effectiveness** (3 sections):
- Objective: Improve sales conversion via recommendation engines
- Page Must: Suggested order system. Recommended products display. Value-based sales narrative.
- Agents: Pitch Script Builder. Data-Driven Justification Agent. Margin Impact Connector.

**UC15 — Commercial Forecasting** (3 sections):
- Objective: Increase visibility into future sales
- Page Must: Monthly channel-level forecast. Scenario comparison.
- Agents: Projection Updater. Forecast Volatility Detector.

#### DOMAIN 7: INNOVATION

**UC16 — Time-to-Market** (2 sections):
- Objective: Reduce concept-to-launch cycle
- Agents: Concept Generator. Demand Simulator. Financial Feasibility Estimator. Launch Roadmap Creator.

**UC17 — Concept Validation** (2 sections):
- Objective: Simulate product performance before launch
- Agents: Digital Twin Simulator. Adoption Curve Estimator. Competitive Reaction Simulator.

#### DOMAIN 8: GROWTH & ADJACENCIES

**UC18 — Expansion Mapping** (3 sections):
- Objective: Identify geographic growth opportunities
- Page Must: City-level heatmap. Potential vs complexity score.
- Agents: Expansion Zone Ranker. Geographic ROI Estimator.

**UC19 — Go-to-Market Design** (2 sections):
- Objective: Define customized entry strategy by channel
- Agents: Pricing Strategy Generator. Promotional Plan Designer. Logistics Setup Proposer.

#### DOMAIN 9: NEW BUSINESS CREATION

**UC20 — Opportunity Identification** (2 sections):
- Objective: Detect adjacency and new product opportunities from transactional data
- Agents: Cross-Product Pattern Identifier. Category Suggester. Market Size Estimator. Strategic Justification Agent.

---

## 5. Data Architecture

### File Structure

```
src/data/
├── domains.ts                    (9 domains, 20 use cases)
├── rgm/
│   ├── types.ts
│   ├── pricing-data.ts           (mock transactional pricing, waterfall data)
│   ├── promotions-data.ts        (mock promo history, uplift, cannibalization)
│   └── margin-leakage-data.ts    (mock margin deviation, heatmap data)
├── supply-chain/
│   ├── types.ts
│   ├── demand-planning-data.ts   (mock forecasts, actuals, scenarios)
│   └── inventory-data.ts         (mock EOQ, safety stock, overstock)
├── manufacturing/
│   ├── types.ts
│   ├── maintenance-data.ts       (mock plant/line/machine data, RUL)
│   ├── conversion-cost-data.ts   (mock scrap trends, cost variance)
│   └── flexibility-data.ts       (mock capacity, shift models)
├── rtm/
│   ├── types.ts
│   ├── coverage-data.ts          (mock segmentation, visit frequency)
│   └── route-data.ts             (mock routes, visit sequences)
├── procurement/
│   ├── types.ts
│   ├── sourcing-data.ts          (mock suppliers, benchmarks)
│   └── commodity-data.ts         (mock price trends, coverage ratios)
├── sales/
│   ├── types.ts
│   ├── customer-potential-data.ts
│   ├── commercial-effectiveness-data.ts
│   └── forecasting-data.ts
├── innovation/
│   ├── types.ts
│   ├── time-to-market-data.ts
│   └── concept-validation-data.ts
├── growth/
│   ├── types.ts
│   ├── expansion-data.ts         (mock city heatmap, complexity scores)
│   └── gtm-data.ts
└── new-business/
    ├── types.ts
    └── opportunity-data.ts
```

### Mock Data Approach

Each data file contains realistic consumer industry mock data:
- SKU-level pricing with multiple channels (Modern Trade, Traditional, E-commerce, Wholesale)
- Brazilian geography (SP, RJ, MG, BA, RS, PR states)
- Consumer product categories (Beverages, Snacks, Personal Care, Home Care, etc.)
- Real-world-plausible financial figures (BRL)
- Agent definitions with roles, inputs, outputs, confidence levels

---

## 6. Reusable Building Block Components

While each workstation is unique, they share common visualization primitives:

| Component | Used By |
|-----------|---------|
| `DataTable` | Pricing tables, supplier rankings, forecast tables, SKU lists |
| `WaterfallChart` | Price waterfall (RGM), margin waterfall |
| `HeatmapGrid` | Margin leakage heatmap, expansion footprint |
| `ScenarioSlider` | Price simulation, demand simulation, scrap reduction |
| `AgentPanel` | All 20 use cases — shows agent cards with roles and actions |
| `KPIBar` | OEE/MTBF/MTTR (Manufacturing), forecast accuracy, margin KPIs |
| `SegmentationChart` | Customer segments (Platinum/Gold/Silver/Bronze) |
| `ForecastChart` | Demand planning, commercial forecasting, commodity trends |
| `RouteMap` | Route optimization, expansion mapping |
| `ExportPanel` | All use cases — PDF, Excel, CSV generation |

---

## 7. Execution Plan — Priority Waves

### Wave 0: Infrastructure (must complete first)
- Rewrite `domains.ts` with 9 consumer domains
- Build value chain flow landing page
- Update routing structure
- Update Header branding
- Build reusable building block components
- Remove all banking data files and workstation pages

### Wave 1: High-Impact Workstations (5 use cases)
- UC1: Pricing Optimization (most data-intensive, RGM flagship)
- UC4: Demand Planning (cross-functional, Supply Chain flagship)
- UC6: Predictive Maintenance (Manufacturing flagship, rich KPIs)
- UC10: Route Optimization (RTM flagship, visual/geographic)
- UC11: Strategic Sourcing (Procurement flagship, negotiation)

### Wave 2: Mid-Complexity Workstations (5 use cases)
- UC2: Promotional Effectiveness
- UC5: Inventory Optimization
- UC7: Conversion Cost
- UC9: Coverage Optimization
- UC14: Commercial Effectiveness

### Wave 3: Remaining 10 Workstations
- UC3: Margin Leakage
- UC8: Production Flexibility
- UC12: Commodity Forecast
- UC13: Customer Potential
- UC15: Commercial Forecasting
- UC16: Time-to-Market
- UC17: Concept Validation
- UC18: Expansion Mapping
- UC19: Go-to-Market Design
- UC20: Opportunity Identification

---

## 8. Files to Delete (Banking Content)

All files in these directories will be removed:
- `src/data/mortgage/`
- `src/data/refinancing/`
- `src/data/collections/`
- `src/data/fraud-kyc/`
- `src/data/back-office/`
- `src/data/deposits/`
- `src/data/wealth/`
- `src/data/business-banking/`
- `src/data/distribution-network/`
- `src/data/customer-engagement/`
- `src/data/marketing/`
- `src/data/demos/`
- `src/data/agent-flows/`
- `src/data/control-tower/`
- All 35+ banking workstation pages in `src/pages/`
- Banking-specific components in `src/components/mortgage/`
- Banking-specific components in `src/components/sections/`

Files to keep and modify:
- `src/App.tsx` (update routes)
- `src/main.tsx` (unchanged)
- `src/styles/global.css` (add new accent colors)
- `src/auth/AuthContext.tsx` (unchanged)
- `src/components/Header.tsx` (update branding text)
- `src/components/AIChatPanel.tsx` (keep, reusable)
- `src/components/ui/` (keep, reusable)
