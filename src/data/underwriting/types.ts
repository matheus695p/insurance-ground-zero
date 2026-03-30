export interface Application {
  id: string;
  applicantName: string;
  age: number;
  gender: string;
  bmi: number;
  smoker: boolean;
  chronicConditions: string[];
  requestedPlan: string;
  requestedCoverage: number;
  documentStatus: string;
  riskScore: number;
  autoDecision: string;
  confidence: number;
  processingTime: number;
  referralReason: string;
}

export interface RatingFactor {
  id: string;
  factor: string;
  category: string;
  currentWeight: number;
  proposedWeight: number;
  impactOnLossRatio: number;
  sampleSize: number;
}

export interface ExperienceRecord {
  id: string;
  cohort: string;
  policyYear: number;
  earnedPremium: number;
  incurredClaims: number;
  lossRatio: number;
  claimsCount: number;
  avgClaimSize: number;
  memberMonths: number;
}

export interface PolicyCohort {
  id: string;
  cohortName: string;
  entryYear: number;
  initialMembers: number;
  currentMembers: number;
  persistencyYear1: number;
  persistencyYear2: number;
  persistencyYear3: number;
  persistencyYear5: number;
  avgPremiumYear1: number;
  avgClaimsYear1: number;
  lifetimeValue: number;
  breakEvenYear: number;
}

export interface CompetitorRate {
  id: string;
  competitor: string;
  segment: string;
  ageGroup: string;
  planType: string;
  monthlyRate: number;
  ourRate: number;
  priceDelta: number;
  marketShare: number;
  elasticity: number;
}

export interface LapseRiskPolicy {
  id: string;
  policyholderName: string;
  age: number;
  plan: string;
  currentPremium: number;
  renewalPremium: number;
  priceIncrease: number;
  priceSensitivity: number;
  tenure: number;
  claimsHistory: number;
  lapseRisk: number;
  suggestedDiscount: number;
  behavioralIndicator: string;
}
