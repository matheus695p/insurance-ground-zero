export interface Agent {
  id: string;
  name: string;
  territory: string;
  region: string;
  leadsAssigned: number;
  leadsContacted: number;
  quotesGenerated: number;
  policiesSold: number;
  conversionRate: number;
  revenue: number;
  avgPremium: number;
  tenure: number;
  rating: number;
}

export interface Prospect {
  id: string;
  name: string;
  age: number;
  gender: string;
  occupation: string;
  incomeRange: string;
  riskTier: string;
  propensityScore: number;
  estimatedLTV: number;
  expectedPremium: number;
  channel: string;
  status: string;
}

export interface Member {
  id: string;
  name: string;
  age: number;
  currentPlan: string;
  monthlyPremium: number;
  tenure: number;
  claimsCount: number;
  engagementScore: number;
  productHoldings: string[];
  crossSellOpportunity: string;
  propensity: number;
  expectedUplift: number;
}

export interface PolicyHolder {
  id: string;
  name: string;
  age: number;
  plan: string;
  monthlyPremium: number;
  tenure: number;
  claimsFrequency: number;
  satisfactionScore: number;
  churnRisk: number;
  lastInteraction: string;
  paymentHistory: string;
  riskSegment: string;
}
