/** A single action metric (e.g. `lead`, `link_click`, `purchase`). */
export interface InsightAction {
  type: string;
  value: number;
}

/** Normalized Meta insights (reporting) row. */
export interface Insight {
  dateStart: string | null;
  dateStop: string | null;
  campaignId: string | null;
  adsetId: string | null;
  adId: string | null;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
  actions: InsightAction[];
  /** Return on ad spend from `purchase_roas`, when available. */
  roas: number | null;
}
