/** Normalized Meta ad. */
export interface Ad {
  id: string;
  name: string;
  adsetId: string | null;
  campaignId: string | null;
  status: string;
  effectiveStatus: string | null;
  creativeId: string | null;
}
