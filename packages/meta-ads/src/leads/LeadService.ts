import type { MetaClient } from "../client/MetaClient.js";
import type { Lead, LeadFieldEntry, LeadForm } from "../types/Lead.js";
import { toNumber } from "../utils/normalize.js";

const LEAD_FIELDS = [
  "id",
  "created_time",
  "ad_id",
  "form_id",
  "campaign_id",
  "field_data",
] as const;

const LEAD_FORM_FIELDS = ["id", "name", "status", "leads_count"] as const;

interface RawLeadField {
  name?: string;
  values?: string[];
}

interface RawLead {
  id: string;
  created_time?: string;
  ad_id?: string;
  form_id?: string;
  campaign_id?: string;
  field_data?: RawLeadField[];
}

interface RawLeadForm {
  id: string;
  name?: string;
  status?: string;
  leads_count?: number | string;
}

function normalizeFieldData(entries?: RawLeadField[]): LeadFieldEntry[] {
  if (!Array.isArray(entries)) return [];
  return entries.map((entry) => ({
    name: entry.name ?? "",
    values: Array.isArray(entry.values) ? entry.values : [],
  }));
}

export function normalizeLead(raw: RawLead): Lead {
  return {
    id: raw.id,
    createdTime: raw.created_time ?? null,
    adId: raw.ad_id ?? null,
    formId: raw.form_id ?? null,
    campaignId: raw.campaign_id ?? null,
    fieldData: normalizeFieldData(raw.field_data),
  };
}

export function normalizeLeadForm(raw: RawLeadForm): LeadForm {
  return {
    id: raw.id,
    name: raw.name ?? "",
    status: raw.status ?? null,
    leadsCount: toNumber(raw.leads_count),
  };
}

export class LeadService {
  constructor(private readonly client: MetaClient) {}

  /** Fetch all leads submitted against a specific lead form. */
  async getLeads(formId: string): Promise<Lead[]> {
    if (!formId) throw new Error("LeadService.getLeads requires a formId");
    const raw = await this.client.getEdge<RawLead>(`/${formId}/leads`, {
      fields: LEAD_FIELDS.join(","),
      limit: 200,
    });
    return raw.map(normalizeLead);
  }

  /** Fetch the lead generation forms belonging to a Facebook Page. */
  async getForms(pageId: string): Promise<LeadForm[]> {
    if (!pageId) throw new Error("LeadService.getForms requires a pageId");
    const raw = await this.client.getEdge<RawLeadForm>(`/${pageId}/leadgen_forms`, {
      fields: LEAD_FORM_FIELDS.join(","),
      limit: 100,
    });
    return raw.map(normalizeLeadForm);
  }
}
