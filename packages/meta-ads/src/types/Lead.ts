/** A single submitted field within a lead. */
export interface LeadFieldEntry {
  name: string;
  values: string[];
}

/** Normalized Meta lead (a form submission). */
export interface Lead {
  id: string;
  createdTime: string | null;
  adId: string | null;
  formId: string | null;
  campaignId: string | null;
  fieldData: LeadFieldEntry[];
}

/** Normalized Meta lead generation form. */
export interface LeadForm {
  id: string;
  name: string;
  status: string | null;
  leadsCount: number | null;
}
