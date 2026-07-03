/** Normalized Meta ad set. */
export interface Adset {
  id: string;
  name: string;
  campaignId: string | null;
  status: string;
  effectiveStatus: string | null;
  dailyBudget: number | null;
  lifetimeBudget: number | null;
  optimizationGoal: string | null;
  billingEvent: string | null;
  startTime: string | null;
  endTime: string | null;
}
