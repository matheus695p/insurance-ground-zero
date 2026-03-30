# Consumer Control Tower Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Retail Banking Agentic AI Control Tower into a Consumer Industry Digital Control Tower with 9 domains, 20 custom workstations, and a value chain flow landing page.

**Architecture:** Full replacement of banking content. New `domains.ts` with 9 consumer domains (flat, no sub-domains). Value chain flow landing page with animated SVG connections. Each use case gets a custom workstation page following the spec's exact section structure (Page Objective, The Page Must, Analytical Requirements, Agent Responsibilities, Required Outputs). Data files organized by domain in `src/data/<domain>/`.

**Tech Stack:** React 19 + TypeScript + Vite, CSS Modules (QuantumBlack dark theme), Framer Motion, Lucide React icons.

---

## WAVE 0: INFRASTRUCTURE

### Task 1: Delete all banking content

**Files:**
- Delete: all files in `src/data/mortgage/`, `src/data/refinancing/`, `src/data/collections/`, `src/data/fraud-kyc/`, `src/data/back-office/`, `src/data/deposits/`, `src/data/wealth/`, `src/data/business-banking/`, `src/data/distribution-network/`, `src/data/customer-engagement/`, `src/data/marketing/`, `src/data/demos/`, `src/data/agent-flows/`, `src/data/control-tower/`
- Delete: all banking workstation pages in `src/pages/` (keep only `Landing.tsx`, `DomainPage.tsx`, `LoginPage.tsx`, `UseCaseDemoPage.tsx` and their `.module.css`)
- Delete: `src/components/mortgage/` directory
- Delete: `src/components/sections/` directory (banking-specific section components)

**Step 1: Remove banking data directories**

```bash
rm -rf src/data/mortgage src/data/refinancing src/data/collections src/data/fraud-kyc src/data/back-office src/data/deposits src/data/wealth src/data/business-banking src/data/distribution-network src/data/customer-engagement src/data/marketing src/data/demos src/data/agent-flows src/data/control-tower
```

**Step 2: Remove banking workstation pages**

Remove all `*Workstation.tsx` and their `.module.css` files from `src/pages/`. Keep: `Landing.tsx`, `Landing.module.css`, `DomainPage.tsx`, `DomainPage.module.css`, `UseCaseDemoPage.tsx`, `UseCaseDemoPage.module.css`, `LoginPage.tsx`, `LoginPage.module.css`.

```bash
rm src/pages/MortgageWorkstation.tsx src/pages/MortgageWorkstation.module.css
rm src/pages/CollectionsCopilotWorkstation.tsx src/pages/CollectionsCopilotWorkstation.module.css
rm src/pages/EarlyDetectionWorkstation.tsx src/pages/EarlyDetectionWorkstation.module.css
rm src/pages/CollectionsConsoleWorkstation.tsx src/pages/CollectionsConsoleWorkstation.module.css
rm src/pages/RefinancingWorkstation.tsx src/pages/RefinancingWorkstation.module.css
rm src/pages/KYCWorkstation.tsx src/pages/KYCWorkstation.module.css
rm src/pages/FraudDetectionWorkstation.tsx src/pages/FraudDetectionWorkstation.module.css
rm src/pages/DisputeWorkstation.tsx src/pages/DisputeWorkstation.module.css
rm src/pages/VoiceAgentWorkstation.tsx src/pages/VoiceAgentWorkstation.module.css
rm src/pages/CopilotCoachingWorkstation.tsx src/pages/CopilotCoachingWorkstation.module.css
rm src/pages/WorkforceOptimizationWorkstation.tsx src/pages/WorkforceOptimizationWorkstation.module.css
rm src/pages/ChatbotWorkstation.tsx src/pages/ChatbotWorkstation.module.css
rm src/pages/PersonalizedUXWorkstation.tsx src/pages/PersonalizedUXWorkstation.module.css
rm src/pages/AIRelationshipManagerWorkstation.tsx src/pages/AIRelationshipManagerWorkstation.module.css
rm src/pages/GeoSearchWorkstation.tsx src/pages/GeoSearchWorkstation.module.css
rm src/pages/CampaignManagementWorkstation.tsx src/pages/CampaignManagementWorkstation.module.css
rm src/pages/DigitalTwinsWorkstation.tsx src/pages/DigitalTwinsWorkstation.module.css
rm src/pages/RMCopilotWorkstation.tsx src/pages/RMCopilotWorkstation.module.css
rm src/pages/BranchDigitalTwinsWorkstation.tsx src/pages/BranchDigitalTwinsWorkstation.module.css
rm src/pages/RMSimulationsWorkstation.tsx src/pages/RMSimulationsWorkstation.module.css
rm src/pages/EnterpriseQCWorkstation.tsx src/pages/EnterpriseQCWorkstation.module.css
rm src/pages/PaymentAdjustmentsWorkstation.tsx src/pages/PaymentAdjustmentsWorkstation.module.css
rm src/pages/DecedentProcessingWorkstation.tsx src/pages/DecedentProcessingWorkstation.module.css
rm src/pages/OnboardingWorkstation.tsx src/pages/OnboardingWorkstation.module.css
rm src/pages/CashSweepingWorkstation.tsx src/pages/CashSweepingWorkstation.module.css
rm src/pages/VirtualAdvisorWorkstation.tsx src/pages/VirtualAdvisorWorkstation.module.css
rm src/pages/PortfolioRebalancingWorkstation.tsx src/pages/PortfolioRebalancingWorkstation.module.css
rm src/pages/BusinessProfilingWorkstation.tsx src/pages/BusinessProfilingWorkstation.module.css
rm src/pages/SMECreditWorkstation.tsx src/pages/SMECreditWorkstation.module.css
rm src/pages/FinancialAdvisoryWorkstation.tsx src/pages/FinancialAdvisoryWorkstation.module.css
rm src/pages/BusinessRMSimsWorkstation.tsx src/pages/BusinessRMSimsWorkstation.module.css
```

**Step 3: Remove banking-specific components**

```bash
rm -rf src/components/mortgage src/components/sections
```

**Step 4: Commit**

```bash
git add -A && git commit -m "chore: remove all banking content — preparing for consumer industry rebuild"
```

---

### Task 2: Rewrite domains.ts with consumer domains

**Files:**
- Modify: `src/data/domains.ts`

**Step 1: Rewrite domains.ts**

Replace the entire file with the new consumer domain structure. Key changes:
- Remove `row` and `rowLabel` from Domain interface
- Add `position` (number 1-9 for value chain ordering) and `accentColor` (CSS color string)
- Replace sub-domains with flat `useCases` array per domain
- Remove `demoType` from UseCase (not needed — all pages are custom workstations)
- Update `getDomain` and `getUseCase` helpers

```typescript
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
    id: 'rgm',
    name: 'Revenue Growth Management',
    position: 1,
    accentColor: '#00d4aa',
    description: 'Optimize pricing, promotions, and margins across SKUs, channels, and segments to maximize revenue and profitability.',
    useCases: [
      {
        id: 'pricing-optimization',
        title: 'Integrated Pricing Optimization',
        description: 'Design and continuously recalibrate an optimal price architecture across SKUs, channels, and customer segments, ensuring margin maximization without compromising competitiveness.',
      },
      {
        id: 'promotional-effectiveness',
        title: 'Promotional Effectiveness Optimization',
        description: 'Maximize return on promotional investments by selecting the correct SKUs, discount levels, and channels.',
      },
      {
        id: 'margin-leakage',
        title: 'Margin Leakage Management',
        description: 'Systematically identify and quantify sources of margin erosion across products, channels, and customers.',
      },
    ],
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain',
    position: 2,
    accentColor: '#3b82f6',
    description: 'Deliver integrated demand forecasts and optimize inventory levels to align supply with demand while minimizing working capital.',
    useCases: [
      {
        id: 'demand-planning',
        title: 'Integrated Demand Planning',
        description: 'Deliver an integrated, cross-functional demand forecast aligned with sales, promotions, and supply constraints.',
      },
      {
        id: 'inventory-optimization',
        title: 'Inventory and Strategic Stock Optimization',
        description: 'Optimize working capital by defining safe but efficient inventory levels across the entire SKU portfolio.',
      },
    ],
  },
  {
    id: 'manufacturing',
    name: 'Manufacturing',
    position: 3,
    accentColor: '#f59e0b',
    description: 'Maximize asset availability, reduce conversion costs, and enable production flexibility through predictive analytics and scenario simulation.',
    useCases: [
      {
        id: 'predictive-maintenance',
        title: 'Operational Reliability and Predictive Maintenance',
        description: 'Maximize asset availability through predictive failure detection across plants, lines, and individual machines.',
      },
      {
        id: 'conversion-cost',
        title: 'Conversion Cost Optimization',
        description: 'Reduce scrap, rework, and variability while improving financial performance across production lines.',
      },
      {
        id: 'production-flexibility',
        title: 'Production Flexibility Simulation',
        description: 'Enable operational scenario simulation under demand changes including mix shifts and workforce reallocation.',
      },
    ],
  },
  {
    id: 'rtm',
    name: 'Route to Market',
    position: 4,
    accentColor: '#8b5cf6',
    description: 'Optimize commercial coverage, route efficiency, and salesforce productivity to maximize market penetration.',
    useCases: [
      {
        id: 'coverage-optimization',
        title: 'Commercial Coverage Optimization',
        description: 'Prioritize customers using macro-segmentation and volume to optimize visit frequency and resource allocation.',
      },
      {
        id: 'route-optimization',
        title: 'Route Optimization',
        description: 'Maximize salesforce productivity through optimized routing, visit sequencing, and customer-specific commercial focus.',
      },
    ],
  },
  {
    id: 'procurement',
    name: 'Procurement',
    position: 5,
    accentColor: '#22c55e',
    description: 'Strengthen negotiation leverage, monitor commodity exposure, and optimize supplier portfolio for cost reduction.',
    useCases: [
      {
        id: 'strategic-sourcing',
        title: 'Strategic Sourcing',
        description: 'Strengthen negotiation leverage and supplier prioritization through spend analysis, benchmarking, and risk assessment.',
      },
      {
        id: 'commodity-forecast',
        title: 'Commodity Forecast and Risk Monitoring',
        description: 'Monitor commodity exposure and price volatility to protect margins and optimize hedging strategies.',
      },
    ],
  },
  {
    id: 'sales',
    name: 'Sales',
    position: 6,
    accentColor: '#f97316',
    description: 'Prioritize customer potential, improve commercial effectiveness, and increase forecast accuracy to drive revenue growth.',
    useCases: [
      {
        id: 'customer-potential',
        title: 'Customer Potential Prioritization',
        description: 'Rank customers by growth potential to identify unrealized revenue and underpenetration opportunities.',
      },
      {
        id: 'commercial-effectiveness',
        title: 'Commercial Effectiveness',
        description: 'Improve sales conversion using recommendation engines, suggested orders, and value-based sales narratives.',
      },
      {
        id: 'commercial-forecasting',
        title: 'Commercial Forecasting',
        description: 'Increase visibility into future sales with monthly channel-level forecasts and scenario comparison.',
      },
    ],
  },
  {
    id: 'innovation',
    name: 'Innovation',
    position: 7,
    accentColor: '#06b6d4',
    description: 'Accelerate time-to-market and validate concepts before launch using demand simulation and digital twin technology.',
    useCases: [
      {
        id: 'time-to-market',
        title: 'Time-to-Market Acceleration',
        description: 'Reduce concept-to-launch cycle through AI-generated product concepts, demand simulation, and financial feasibility analysis.',
      },
      {
        id: 'concept-validation',
        title: 'Early Concept Validation',
        description: 'Simulate product performance before launch using digital twins, adoption curves, and competitive reaction modeling.',
      },
    ],
  },
  {
    id: 'growth',
    name: 'Growth & Adjacencies',
    position: 8,
    accentColor: '#a78bfa',
    description: 'Identify geographic expansion opportunities and design customized go-to-market strategies for new markets.',
    useCases: [
      {
        id: 'expansion-mapping',
        title: 'Expansion Footprint Mapping',
        description: 'Identify geographic growth opportunities using city-level heatmaps and potential-vs-complexity scoring.',
      },
      {
        id: 'go-to-market',
        title: 'Go-to-Market Design',
        description: 'Define customized entry strategy by channel including pricing, promotional plans, and logistics setup.',
      },
    ],
  },
  {
    id: 'new-business',
    name: 'New Business Creation',
    position: 9,
    accentColor: '#f43f5e',
    description: 'Detect adjacency and new product opportunities from transactional data to create new revenue streams.',
    useCases: [
      {
        id: 'opportunity-identification',
        title: 'New Opportunity Identification',
        description: 'Detect adjacency and new product opportunities from transactional data using cross-product pattern analysis.',
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
```

**Step 2: Verify build compiles (it won't yet — that's expected, imports are broken)**

Run: `npx tsc --noEmit 2>&1 | head -20`

Expected: Type errors from files that import old banking modules. This is fine — we fix them in subsequent tasks.

**Step 3: Commit**

```bash
git add src/data/domains.ts && git commit -m "feat: rewrite domains.ts with 9 consumer industry domains and 20 use cases"
```

---

### Task 3: Update global.css with new accent colors

**Files:**
- Modify: `src/styles/global.css`

**Step 1: Add new accent color CSS variables**

Add these new CSS variables to the `:root` block in `global.css`, after the existing accent colors:

```css
/* Consumer domain accent colors */
--accent-orange: #f97316;
--accent-orange-dim: rgba(249, 115, 22, 0.15);
--accent-cyan: #06b6d4;
--accent-cyan-dim: rgba(6, 182, 212, 0.15);
--accent-violet: #a78bfa;
--accent-violet-dim: rgba(167, 139, 250, 0.15);
--accent-rose: #f43f5e;
--accent-rose-dim: rgba(244, 63, 94, 0.15);
--accent-green-dim: rgba(34, 197, 94, 0.15);
--accent-amber-dim: rgba(245, 158, 11, 0.15);
--accent-purple-dim: rgba(139, 92, 246, 0.15);
```

**Step 2: Commit**

```bash
git add src/styles/global.css && git commit -m "feat: add consumer domain accent colors to global CSS"
```

---

### Task 4: Update Header branding

**Files:**
- Modify: `src/components/Header.tsx`

**Step 1: Update subtitle text**

Change line 17 in `src/components/Header.tsx`:

From: `<span className={styles.subtitle}>Agentic AI Control Tower for Retail Banking</span>`
To: `<span className={styles.subtitle}>Agentic AI Control Tower for Consumer Industry</span>`

**Step 2: Commit**

```bash
git add src/components/Header.tsx && git commit -m "feat: update header branding to Consumer Industry"
```

---

### Task 5: Rewrite App.tsx with new routing

**Files:**
- Modify: `src/App.tsx`

**Step 1: Rewrite App.tsx**

Replace the entire file. New routing structure:
- `/` → Landing
- `/domain/:domainId` → DomainPage (no sub-domain level)
- `/domain/:domainId/workstation/:useCaseId` → WorkstationRouter
- `/login` → LoginPage

```typescript
import { Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth/AuthContext'
import Header from './components/Header'
import Landing from './pages/Landing'
import DomainPage from './pages/DomainPage'
import WorkstationRouter from './pages/WorkstationRouter'
import LoginPage from './pages/LoginPage'

function AuthenticatedApp() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/domain/:domainId" element={<DomainPage />} />
        <Route path="/domain/:domainId/workstation/:useCaseId" element={<WorkstationRouter />} />
      </Routes>
    </>
  )
}

function AppContent() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) {
    return <LoginPage />
  }
  return <AuthenticatedApp />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
```

**Step 2: Create placeholder WorkstationRouter**

Create `src/pages/WorkstationRouter.tsx` — a smart router that maps use case IDs to workstation components. Initially it shows a "Coming Soon" placeholder for all use cases:

```typescript
import type React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Construction } from 'lucide-react';
import { getUseCase } from '../data/domains';
import Breadcrumb from '../components/Breadcrumb';
import styles from './WorkstationRouter.module.css';

const WorkstationRouter: React.FC = () => {
  const { domainId, useCaseId } = useParams<{ domainId: string; useCaseId: string }>();
  const result = getUseCase(domainId ?? '', useCaseId ?? '');

  if (!result) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h2>Use case not found</h2>
          <Link to="/" className={styles.backLink}>
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const { domain, useCase } = result;

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
```

**Step 3: Create WorkstationRouter.module.css**

```css
.page {
  min-height: 100vh;
  padding-top: 80px;
}

.container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 32px;
}

.backLink {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-bottom: 32px;
  transition: color var(--transition-fast);
}

.backLink:hover {
  color: var(--text-primary);
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 32px;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}

.title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-top: 24px;
}

.description {
  font-size: 1rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin-top: 12px;
  line-height: 1.6;
}

.badge {
  margin-top: 24px;
  padding: 6px 16px;
  border: 1px solid;
  border-radius: var(--radius-xl);
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}
```

**Step 4: Commit**

```bash
git add src/App.tsx src/pages/WorkstationRouter.tsx src/pages/WorkstationRouter.module.css && git commit -m "feat: rewrite App.tsx routing and add WorkstationRouter placeholder"
```

---

### Task 6: Rewrite DomainPage for flat domain structure

**Files:**
- Modify: `src/pages/DomainPage.tsx`

**Step 1: Rewrite DomainPage.tsx**

The page now uses `:domainId` only (no sub-domain). It shows the domain's use cases as cards linking to `/domain/:domainId/workstation/:useCaseId`.

```typescript
import type React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getDomain } from '../data/domains';
import Breadcrumb from '../components/Breadcrumb';
import styles from './DomainPage.module.css';

const DomainPage: React.FC = () => {
  const { domainId } = useParams<{ domainId: string }>();
  const domain = getDomain(domainId ?? '');

  if (!domain) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.notFound}>
            <h2>Domain not found</h2>
            <Link to="/" className={styles.backLink}>
              <ArrowLeft size={16} /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Breadcrumb items={[
            { label: 'Home', to: '/' },
            { label: domain.name },
          ]} />
        </motion.div>

        <Link to="/" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to all domains
        </Link>

        <motion.header
          className={styles.header}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className={styles.domainBadge} style={{ borderColor: domain.accentColor, color: domain.accentColor }}>
            {domain.name}
          </div>
          <h1 className={styles.title}>{domain.name}</h1>
          <p className={styles.description}>{domain.description}</p>
        </motion.header>

        <div className={styles.grid}>
          {domain.useCases.map((useCase, index) => (
            <motion.div
              key={useCase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
            >
              <Link
                to={`/domain/${domainId}/workstation/${useCase.id}`}
                className={styles.card}
                style={{ '--card-accent': domain.accentColor } as React.CSSProperties}
              >
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{useCase.title}</h3>
                  <p className={styles.cardDescription}>{useCase.description}</p>
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.cardArrow}>
                    <ArrowRight size={14} />
                  </span>
                </div>
                <div className={styles.cardGlow} />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DomainPage;
```

**Step 2: Update DomainPage.module.css**

Add `.domainBadge` style and update `.card` to use `--card-accent` custom property for the accent bar/glow. Keep existing card styles and update the accent logic to use the custom property instead of hardcoded teal/purple/amber.

```css
.domainBadge {
  display: inline-block;
  padding: 6px 16px;
  border: 1px solid;
  border-radius: var(--radius-xl);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  margin-bottom: 16px;
}

.card {
  /* update hover glow to use --card-accent */
}

.card:hover {
  box-shadow: 0 0 30px rgba(var(--card-accent-rgb), 0.15);
}
```

Note: The CSS module file already has most card styles. We just need to replace the hardcoded accent class system (`.accentTeal`, `.accentPurple`, `.accentAmber`) with the dynamic `--card-accent` CSS custom property approach. Use `style` prop on the card to set `--card-accent` per domain.

**Step 3: Commit**

```bash
git add src/pages/DomainPage.tsx src/pages/DomainPage.module.css && git commit -m "feat: rewrite DomainPage for flat consumer domain structure"
```

---

### Task 7: Delete UseCaseDemoPage (replaced by WorkstationRouter)

**Files:**
- Delete: `src/pages/UseCaseDemoPage.tsx`
- Delete: `src/pages/UseCaseDemoPage.module.css`

**Step 1: Remove files**

```bash
rm src/pages/UseCaseDemoPage.tsx src/pages/UseCaseDemoPage.module.css
```

**Step 2: Commit**

```bash
git add -A && git commit -m "chore: remove UseCaseDemoPage — replaced by WorkstationRouter"
```

---

### Task 8: Rewrite Landing page with value chain flow

**Files:**
- Modify: `src/pages/Landing.tsx`
- Modify: `src/pages/Landing.module.css`

**Step 1: Rewrite Landing.tsx**

Full rewrite. Key sections:
1. Animated background orbs (kept, same style)
2. Geometric floating shapes (kept, same style)
3. Hero section: "Agentic AI Control Tower" / "Consumer Industry" / word cycler
4. Stats bar: 9 Domains, 20 Use Cases, 47 AI Agents
5. **Value Chain Flow** — the centerpiece, an SVG-based flow diagram with 9 domain cards connected by animated paths
6. Impact highlights section
7. Footer

The value chain flow layout:
```
Row 1 (top):    [Procurement] → [Supply Chain] → [Manufacturing] → [RTM] → [Sales]
Row 2 (bottom): [New Business] ← [Growth] ← [Innovation] ← [RGM]
```

Each domain card in the flow:
- Uses `<Link to={`/domain/${domain.id}`}>` for navigation
- Shows domain icon (from Lucide), name, use case count badge
- Accent color border/glow from `domain.accentColor`
- On hover: scale up slightly, show use case titles in a tooltip

SVG connections between cards use animated dashed stroke paths.

The Landing.tsx should import from the new `domains.ts` (which no longer has `row`/`rowLabel`/`subDomains`).

Update word cycler words to:
```typescript
const ROTATING_WORDS = [
  'Revenue Growth',
  'Supply Chain',
  'Manufacturing',
  'Route to Market',
  'Procurement',
  'Sales Excellence',
  'Innovation',
  'Growth Strategy',
];
```

Update stats:
- 9 Domains (not "Banking Domains")
- 20 Use Cases
- 47 AI Agents per Workflow

Update hero description:
```
A strategic, data-driven platform that turns agentic AI workflows
into business outcomes, enabling leaders in Consumer Industry to act
with precision, speed, and measurable impact.
```

Update footer:
```
Agentic AI Control Tower · Consumer Industry Platform
```

Domain icons mapping (Lucide):
- rgm → `DollarSign`
- supply-chain → `Truck`
- manufacturing → `Factory`
- rtm → `MapPin`
- procurement → `ShoppingCart`
- sales → `TrendingUp`
- innovation → `Lightbulb`
- growth → `Globe`
- new-business → `Sparkles`

**Step 2: Rewrite Landing.module.css**

Keep: `.page`, `.bgOrbs`, `.orb*`, `.geometricLayer`, `.shape`, `.hero*`, `.statsBar`, `.footer*` styles.

Replace: `.gridSection`, `.gridContainer`, `.rowBlock`, `.rowLabelBar`, `.rowCards`, `.card*` with new `.valueChainSection`, `.flowContainer`, `.flowRow`, `.flowCard`, `.flowConnection`, `.flowArrow` styles.

Add: `.impactSection`, `.impactScroll`, `.impactCard` for the impact highlights.

The flow cards are positioned using CSS Grid (2 rows) with SVG overlay for connection lines.

**Step 3: Verify the build**

Run: `npm run build 2>&1 | tail -20`
Expected: Build succeeds with the landing page rendering correctly.

**Step 4: Commit**

```bash
git add src/pages/Landing.tsx src/pages/Landing.module.css && git commit -m "feat: rewrite landing page with value chain flow layout for consumer industry"
```

---

### Task 9: Verify infrastructure build and fix any remaining issues

**Step 1: Run the dev server**

```bash
npm run dev
```

**Step 2: Verify all routes work**

- `/` → Landing page with value chain flow
- `/domain/rgm` → DomainPage showing 3 RGM use cases
- `/domain/rgm/workstation/pricing-optimization` → WorkstationRouter placeholder
- `/login` → LoginPage

**Step 3: Fix any TypeScript errors**

Run: `npx tsc --noEmit`

Fix all remaining errors from the banking code removal.

**Step 4: Commit fixes**

```bash
git add -A && git commit -m "fix: resolve all TypeScript errors after banking content removal"
```

---

## WAVE 1: HIGH-IMPACT WORKSTATIONS

### Task 10: UC1 — Pricing Optimization Workstation (RGM)

**Files:**
- Create: `src/data/rgm/types.ts`
- Create: `src/data/rgm/pricing-data.ts`
- Create: `src/pages/PricingOptimizationWorkstation.tsx`
- Create: `src/pages/PricingOptimizationWorkstation.module.css`
- Modify: `src/pages/WorkstationRouter.tsx` (add route)

**Spec-defined sections for this page:**

1. **Page Objective**: Design and continuously recalibrate an optimal price architecture across SKUs, channels, and customer segments, ensuring margin maximization without compromising competitiveness.

2. **The Page Must**:
   - Display consolidated transactional pricing data: list price, net realized price, discount depth, rebates and incentives, final consumer price, gross and net margin
   - Allow filtering by: channel, geography, customer segment, product category
   - Provide price waterfall visualization to detect margin leakage

3. **Analytical Requirements**:
   - Identify pricing inconsistencies across channels
   - Detect margin erosion caused by discount stacking
   - Calculate price elasticity by SKU and channel
   - Simulate price increases/reductions → volume/revenue/margin/EBITDA impact

4. **Agent Responsibilities**:
   - Continuously monitor deviations from price policy
   - Recommend revised pricing bands
   - Identify customers receiving out-of-policy conditions
   - Quantify recovery potential from corrective actions

5. **Required Outputs**:
   - Recommended price architecture table
   - Margin recovery estimate
   - Sensitivity simulation scenarios
   - Executive summary of pricing distortions

**Step 1: Create RGM types**

Create `src/data/rgm/types.ts` with interfaces for:
- `PricingRecord` (SKU, category, channel, geography, segment, listPrice, netRealized, discountDepth, rebates, consumerPrice, grossMargin, netMargin, policyCompliant)
- `PriceWaterfallStep` (label, value, type: 'positive'|'negative'|'subtotal')
- `PriceElasticity` (skuId, channel, elasticity, confidence)
- `PricingAgent` (id, name, role, status, findings, recommendations)
- `SimulationScenario` (id, name, priceChange, volumeImpact, revenueImpact, marginImpact, ebitdaImpact)
- `PricingOutput` (type, title, content, downloadUrl)

**Step 2: Create mock pricing data**

Create `src/data/rgm/pricing-data.ts` with realistic consumer industry data:
- 30+ SKUs across categories (Beverages, Snacks, Personal Care, Home Care)
- 4 channels (Modern Trade, Traditional, E-commerce, Wholesale)
- 6 geographies (SP, RJ, MG, BA, RS, PR)
- 3 customer segments (Key Account, Mid-Market, Small Retailer)
- Price waterfall data (List → Trade Discount → Volume Rebate → Promotional → Net Realized)
- Elasticity data per SKU/channel
- 4 agent definitions with findings
- 3 simulation scenarios

All financial figures in BRL (R$).

**Step 3: Build the workstation page**

Create `src/pages/PricingOptimizationWorkstation.tsx`:

The page uses a collapsible section pattern (like GeoSearchWorkstation). 5 sections matching the spec:

Section 1 — Page Objective: Hero banner with objective, key KPIs (Total SKUs, Avg Margin, Policy Compliance %, Recovery Potential)

Section 2 — Core Data Display:
- Filter bar: channel dropdown, geography dropdown, segment dropdown, category dropdown
- Transactional pricing table with all columns from spec
- Price waterfall chart (horizontal bar chart built with CSS, no chart library)
- Highlight rows where policyCompliant is false in red

Section 3 — Analytics Engine:
- Channel inconsistency panel: table showing same SKU different prices across channels
- Discount stacking detector: list of SKUs with >3 stacked discounts
- Price elasticity table: SKU × channel matrix with elasticity values
- Price change simulator: slider for +/- 20% price change, shows computed volume/revenue/margin/EBITDA impact

Section 4 — Agent Orchestration:
- 4 agent cards, each with name, role, status badge, findings list, recommendations

Section 5 — Required Outputs:
- Recommended price architecture table
- Margin recovery estimate card
- Sensitivity scenarios table
- "Generate Executive Summary" button (mock PDF download)

Follow the exact visual patterns from existing workstations: collapsible sections with chevron toggle, dark card backgrounds, teal/status color coding, Framer Motion animations.

**Step 4: Create CSS module**

Create `src/pages/PricingOptimizationWorkstation.module.css` following the patterns from `EarlyDetectionWorkstation.module.css` / `GeoSearchWorkstation.module.css`.

**Step 5: Register in WorkstationRouter**

Add the import and mapping in `src/pages/WorkstationRouter.tsx`:

```typescript
import PricingOptimizationWorkstation from './PricingOptimizationWorkstation';

const WORKSTATION_MAP: Record<string, React.FC> = {
  'pricing-optimization': PricingOptimizationWorkstation,
};
```

Update the component to check `WORKSTATION_MAP[useCaseId]` and render the specialized component if found, otherwise show the placeholder.

**Step 6: Verify**

Run: `npm run dev`
Navigate to `/domain/rgm/workstation/pricing-optimization`
Verify all 5 sections render correctly.

**Step 7: Commit**

```bash
git add src/data/rgm/ src/pages/PricingOptimizationWorkstation.tsx src/pages/PricingOptimizationWorkstation.module.css src/pages/WorkstationRouter.tsx && git commit -m "feat: add Pricing Optimization workstation (UC1 - RGM)"
```

---

### Task 11: UC4 — Demand Planning Workstation (Supply Chain)

**Files:**
- Create: `src/data/supply-chain/types.ts`
- Create: `src/data/supply-chain/demand-planning-data.ts`
- Create: `src/pages/DemandPlanningWorkstation.tsx`
- Create: `src/pages/DemandPlanningWorkstation.module.css`
- Modify: `src/pages/WorkstationRouter.tsx`

**Spec-defined sections:**

1. **Page Objective**: Deliver an integrated, cross-functional demand forecast aligned with sales, promotions, and supply constraints.

2. **The Page Must**:
   - Display SKU-level monthly forecasts
   - Compare forecast vs actual
   - Provide scenario simulations (base, optimistic, pessimistic)
   - Show raw material implications

3. **Analytical Requirements**:
   - Integrate historical sales, promotions, seasonality, and macro signals
   - Detect forecast bias
   - Estimate impact on procurement and production

4. **Agent Responsibilities**:
   - Auto-adjust forecasts based on signal deviations
   - Alert when demand exceeds supply capacity
   - Provide scenario-based material planning projections

5. **Required Outputs**:
   - Final forecast version
   - Commodity demand projections
   - Forecast accuracy metrics

**Step 1: Create types** — `ForecastRecord`, `ForecastScenario`, `MaterialImplication`, `DemandAgent`, `ForecastOutput`

**Step 2: Create mock data** — 20+ SKUs with 12-month forecast/actual data, 3 scenarios, material implications (sugar, packaging, flavoring), 3 agents, forecast accuracy metrics (MAPE, bias, WMAPE)

**Step 3: Build workstation** — 5 collapsible sections. Forecast table with monthly columns. Forecast vs actual sparkline bars (CSS-based). Scenario toggle (base/optimistic/pessimistic). Material implications table. Agent cards. Outputs panel.

**Step 4: Register in WorkstationRouter** — Add `'demand-planning': DemandPlanningWorkstation`

**Step 5: Commit**

```bash
git add src/data/supply-chain/ src/pages/DemandPlanningWorkstation.tsx src/pages/DemandPlanningWorkstation.module.css src/pages/WorkstationRouter.tsx && git commit -m "feat: add Demand Planning workstation (UC4 - Supply Chain)"
```

---

### Task 12: UC6 — Predictive Maintenance Workstation (Manufacturing)

**Files:**
- Create: `src/data/manufacturing/types.ts`
- Create: `src/data/manufacturing/maintenance-data.ts`
- Create: `src/pages/PredictiveMaintenanceWorkstation.tsx`
- Create: `src/pages/PredictiveMaintenanceWorkstation.module.css`
- Modify: `src/pages/WorkstationRouter.tsx`

**Spec-defined sections:**

1. **Page Objective**: Maximize asset availability through predictive failure detection.

2. **The Page Must**:
   - Multi-plant overview
   - Line-level performance comparison
   - Machine-level risk scoring
   - Remaining useful life estimation
   - KPIs: OEE, MTBF, MTTR, Availability, Scrap rate, Energy efficiency

3. **Analytical Requirements**:
   - Predict machine failure probability
   - Detect performance deterioration
   - Estimate financial impact of downtime

4. **Agent Responsibilities**:
   - Generate preventive maintenance schedules
   - Prioritize intervention based on financial impact
   - Simulate downtime risk scenarios

**Step 1: Create types** — `Plant`, `ProductionLine`, `Machine`, `MaintenanceKPI`, `FailurePrediction`, `MaintenanceAgent`, `MaintenanceSchedule`

**Step 2: Create mock data** — 3 plants (SP, RJ, MG), 4 lines per plant, 6 machines per line with OEE/MTBF/MTTR/availability/scrap/energy data, remaining useful life estimates, failure probabilities, 3 agents

**Step 3: Build workstation** — 4 sections. Plant overview cards with KPI gauges. Line comparison table. Machine risk scoring with color-coded risk bars. Agent cards with maintenance schedules.

**Step 4: Register in WorkstationRouter** — Add `'predictive-maintenance': PredictiveMaintenanceWorkstation`

**Step 5: Commit**

```bash
git add src/data/manufacturing/ src/pages/PredictiveMaintenanceWorkstation.tsx src/pages/PredictiveMaintenanceWorkstation.module.css src/pages/WorkstationRouter.tsx && git commit -m "feat: add Predictive Maintenance workstation (UC6 - Manufacturing)"
```

---

### Task 13: UC10 — Route Optimization Workstation (RTM)

**Files:**
- Create: `src/data/rtm/types.ts`
- Create: `src/data/rtm/route-data.ts`
- Create: `src/pages/RouteOptimizationWorkstation.tsx`
- Create: `src/pages/RouteOptimizationWorkstation.module.css`
- Modify: `src/pages/WorkstationRouter.tsx`

**Spec-defined sections:**

1. **Page Objective**: Maximize salesforce productivity.

2. **The Page Must**:
   - Display route-level optimization
   - Show visit sequencing
   - Provide customer-specific commercial focus

3. **Analytical Requirements**:
   - Optimize travel time
   - Estimate incremental revenue per visit
   - Integrate potential scoring

4. **Agent Responsibilities**:
   - Generate personalized sales scripts
   - Suggest product focus
   - Provide client-specific growth strategy

**Step 1: Create types** — `Route`, `Visit`, `Customer`, `RouteMetrics`, `SalesScript`, `RouteAgent`

**Step 2: Create mock data** — 5 routes across SP region, 8 customers per route with segmentation (Platinum/Gold/Silver/Bronze), visit sequences, revenue potential scores, 3 agents with script/product recommendations

**Step 3: Build workstation** — 4 sections. Route overview with optimized sequence. Customer visit table with potential scores. Travel time optimization display. Agent cards with personalized scripts.

**Step 4: Register in WorkstationRouter**

**Step 5: Commit**

```bash
git add src/data/rtm/ src/pages/RouteOptimizationWorkstation.tsx src/pages/RouteOptimizationWorkstation.module.css src/pages/WorkstationRouter.tsx && git commit -m "feat: add Route Optimization workstation (UC10 - RTM)"
```

---

### Task 14: UC11 — Strategic Sourcing Workstation (Procurement)

**Files:**
- Create: `src/data/procurement/types.ts`
- Create: `src/data/procurement/sourcing-data.ts`
- Create: `src/pages/StrategicSourcingWorkstation.tsx`
- Create: `src/pages/StrategicSourcingWorkstation.module.css`
- Modify: `src/pages/WorkstationRouter.tsx`

**Spec-defined sections:**

1. **Page Objective**: Strengthen negotiation leverage and supplier prioritization.

2. **The Page Must**:
   - Rank suppliers by spend and risk
   - Show benchmark pricing comparisons
   - Highlight concentration risk

3. **Analytical Requirements**:
   - Detect pricing above market benchmark
   - Simulate negotiation scenarios
   - Estimate cost reduction potential

4. **Agent Responsibilities**:
   - Generate negotiation arguments
   - Recommend anchor pricing strategy
   - Suggest supplier diversification

**Step 1: Create types** — `Supplier`, `BenchmarkComparison`, `ConcentrationRisk`, `NegotiationScenario`, `SourcingAgent`

**Step 2: Create mock data** — 15 suppliers across categories (raw materials, packaging, logistics), spend data, risk scores, benchmark pricing, concentration ratios, 3 agents with negotiation arguments

**Step 3: Build workstation** — 4 sections. Supplier ranking table (sortable by spend/risk). Benchmark comparison chart. Concentration risk heatmap. Agent cards with negotiation strategies.

**Step 4: Register in WorkstationRouter**

**Step 5: Commit**

```bash
git add src/data/procurement/ src/pages/StrategicSourcingWorkstation.tsx src/pages/StrategicSourcingWorkstation.module.css src/pages/WorkstationRouter.tsx && git commit -m "feat: add Strategic Sourcing workstation (UC11 - Procurement)"
```

---

## WAVE 2: MID-COMPLEXITY WORKSTATIONS

### Task 15: UC2 — Promotional Effectiveness Workstation (RGM)

Same pattern as Task 10. Create `src/data/rgm/promotions-data.ts`, `src/pages/PromotionalEffectivenessWorkstation.tsx` + `.module.css`. 5 sections per spec. Register in WorkstationRouter.

### Task 16: UC5 — Inventory Optimization Workstation (Supply Chain)

Create `src/data/supply-chain/inventory-data.ts`, `src/pages/InventoryOptimizationWorkstation.tsx` + `.module.css`. 4 sections per spec. Register in WorkstationRouter.

### Task 17: UC7 — Conversion Cost Workstation (Manufacturing)

Create `src/data/manufacturing/conversion-cost-data.ts`, `src/pages/ConversionCostWorkstation.tsx` + `.module.css`. 4 sections per spec. Register in WorkstationRouter.

### Task 18: UC9 — Coverage Optimization Workstation (RTM)

Create `src/data/rtm/coverage-data.ts`, `src/pages/CoverageOptimizationWorkstation.tsx` + `.module.css`. 4 sections per spec (Platinum/Gold/Silver/Bronze segmentation). Register in WorkstationRouter.

### Task 19: UC14 — Commercial Effectiveness Workstation (Sales)

Create `src/data/sales/types.ts`, `src/data/sales/commercial-effectiveness-data.ts`, `src/pages/CommercialEffectivenessWorkstation.tsx` + `.module.css`. 3 sections per spec. Register in WorkstationRouter.

---

## WAVE 3: REMAINING WORKSTATIONS

### Task 20: UC3 — Margin Leakage Workstation (RGM)

Create `src/data/rgm/margin-leakage-data.ts`, `src/pages/MarginLeakageWorkstation.tsx` + `.module.css`. 4 sections per spec (heatmaps, margin deviation ranking). Register in WorkstationRouter.

### Task 21: UC8 — Production Flexibility Workstation (Manufacturing)

Create `src/data/manufacturing/flexibility-data.ts`, `src/pages/ProductionFlexibilityWorkstation.tsx` + `.module.css`. 3 sections per spec (demand variation sliders, mix shift, shift reallocation). Register in WorkstationRouter.

### Task 22: UC12 — Commodity Forecast Workstation (Procurement)

Create `src/data/procurement/commodity-data.ts`, `src/pages/CommodityForecastWorkstation.tsx` + `.module.css`. 4 sections per spec (price trends, coverage ratios, EBITDA exposure). Register in WorkstationRouter.

### Task 23: UC13 — Customer Potential Workstation (Sales)

Create `src/data/sales/customer-potential-data.ts`, `src/pages/CustomerPotentialWorkstation.tsx` + `.module.css`. 4 sections per spec (growth gap, channel ranking). Register in WorkstationRouter.

### Task 24: UC15 — Commercial Forecasting Workstation (Sales)

Create `src/data/sales/forecasting-data.ts`, `src/pages/CommercialForecastingWorkstation.tsx` + `.module.css`. 3 sections per spec (monthly channel forecast, scenario comparison). Register in WorkstationRouter.

### Task 25: UC16 — Time-to-Market Workstation (Innovation)

Create `src/data/innovation/types.ts`, `src/data/innovation/time-to-market-data.ts`, `src/pages/TimeToMarketWorkstation.tsx` + `.module.css`. 2 sections per spec (objective + agents with concept generation, demand simulation, feasibility, roadmap). Register in WorkstationRouter.

### Task 26: UC17 — Concept Validation Workstation (Innovation)

Create `src/data/innovation/concept-validation-data.ts`, `src/pages/ConceptValidationWorkstation.tsx` + `.module.css`. 2 sections per spec (objective + agents with digital twin, adoption curve, competitive reaction). Register in WorkstationRouter.

### Task 27: UC18 — Expansion Mapping Workstation (Growth)

Create `src/data/growth/types.ts`, `src/data/growth/expansion-data.ts`, `src/pages/ExpansionMappingWorkstation.tsx` + `.module.css`. 3 sections per spec (city heatmap grid, potential vs complexity). Register in WorkstationRouter.

### Task 28: UC19 — Go-to-Market Workstation (Growth)

Create `src/data/growth/gtm-data.ts`, `src/pages/GoToMarketWorkstation.tsx` + `.module.css`. 2 sections per spec (objective + agents with pricing/promo/logistics). Register in WorkstationRouter.

### Task 29: UC20 — Opportunity Identification Workstation (New Business)

Create `src/data/new-business/types.ts`, `src/data/new-business/opportunity-data.ts`, `src/pages/OpportunityIdentificationWorkstation.tsx` + `.module.css`. 2 sections per spec (objective + agents with pattern detection, category suggestion, market sizing). Register in WorkstationRouter.

---

## WAVE 4: FINAL VERIFICATION

### Task 30: Final build verification and cleanup

**Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

**Step 2: Run build**

```bash
npm run build
```

Expected: Build succeeds.

**Step 3: Verify all 20 workstation routes**

Navigate to each of the 20 use case workstations and verify they render correctly:
1. `/domain/rgm/workstation/pricing-optimization`
2. `/domain/rgm/workstation/promotional-effectiveness`
3. `/domain/rgm/workstation/margin-leakage`
4. `/domain/supply-chain/workstation/demand-planning`
5. `/domain/supply-chain/workstation/inventory-optimization`
6. `/domain/manufacturing/workstation/predictive-maintenance`
7. `/domain/manufacturing/workstation/conversion-cost`
8. `/domain/manufacturing/workstation/production-flexibility`
9. `/domain/rtm/workstation/coverage-optimization`
10. `/domain/rtm/workstation/route-optimization`
11. `/domain/procurement/workstation/strategic-sourcing`
12. `/domain/procurement/workstation/commodity-forecast`
13. `/domain/sales/workstation/customer-potential`
14. `/domain/sales/workstation/commercial-effectiveness`
15. `/domain/sales/workstation/commercial-forecasting`
16. `/domain/innovation/workstation/time-to-market`
17. `/domain/innovation/workstation/concept-validation`
18. `/domain/growth/workstation/expansion-mapping`
19. `/domain/growth/workstation/go-to-market`
20. `/domain/new-business/workstation/opportunity-identification`

**Step 4: Remove any remaining banking references**

Search codebase for remaining banking terms:
```bash
grep -r "banking\|mortgage\|collections\|fraud\|kyc\|lending\|wealth\|deposits" src/ --include="*.ts" --include="*.tsx" --include="*.css"
```

Remove any found references.

**Step 5: Final commit**

```bash
git add -A && git commit -m "feat: complete consumer industry control tower — all 20 workstations implemented"
```
