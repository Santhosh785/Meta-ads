import type { MetaClient } from "../client/MetaClient.js";
import type { Insight, InsightAction } from "../types/Insight.js";
import { numberOr, toNumber } from "../utils/normalize.js";

export type InsightLevel = "account" | "campaign" | "adset" | "ad";

export interface InsightQuery {
  /** Inclusive start date, `YYYY-MM-DD`. */
  from: string;
  /** Inclusive end date, `YYYY-MM-DD`. */
  to: string;
  /** Aggregation level. Defaults to `campaign`. */
  level?: InsightLevel;
  /** Override the default set of requested metric fields. */
  fields?: string[];
  /** Meta breakdowns (e.g. `["age", "gender"]`). */
  breakdowns?: string[];
}

const DEFAULT_INSIGHT_FIELDS = [
  "date_start",
  "date_stop",
  "campaign_id",
  "adset_id",
  "ad_id",
  "spend",
  "impressions",
  "reach",
  "clicks",
  "ctr",
  "cpc",
  "cpm",
  "frequency",
  "actions",
  "action_values",
  "purchase_roas",
] as const;

interface RawActionEntry {
  action_type?: string;
  value?: string;
}

interface RawInsight {
  date_start?: string;
  date_stop?: string;
  campaign_id?: string;
  adset_id?: string;
  ad_id?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  frequency?: string;
  actions?: RawActionEntry[];
  purchase_roas?: RawActionEntry[];
}

function normalizeActions(entries?: RawActionEntry[]): InsightAction[] {
  if (!Array.isArray(entries)) return [];
  return entries.map((entry) => ({
    type: entry.action_type ?? "unknown",
    value: numberOr(entry.value, 0),
  }));
}

function normalizeRoas(entries?: RawActionEntry[]): number | null {
  const first = Array.isArray(entries) ? entries[0] : undefined;
  return first ? toNumber(first.value) : null;
}

export function normalizeInsight(raw: RawInsight): Insight {
  return {
    dateStart: raw.date_start ?? null,
    dateStop: raw.date_stop ?? null,
    campaignId: raw.campaign_id ?? null,
    adsetId: raw.adset_id ?? null,
    adId: raw.ad_id ?? null,
    spend: numberOr(raw.spend, 0),
    impressions: numberOr(raw.impressions, 0),
    reach: numberOr(raw.reach, 0),
    clicks: numberOr(raw.clicks, 0),
    ctr: numberOr(raw.ctr, 0),
    cpc: numberOr(raw.cpc, 0),
    cpm: numberOr(raw.cpm, 0),
    frequency: numberOr(raw.frequency, 0),
    actions: normalizeActions(raw.actions),
    roas: normalizeRoas(raw.purchase_roas),
  };
}

export class InsightService {
  constructor(
    private readonly client: MetaClient,
    private readonly accountPath: string,
  ) {}

  /** Fetch reporting metrics for the configured account over a date range. */
  async query(query: InsightQuery): Promise<Insight[]> {
    const fields = (query.fields ?? DEFAULT_INSIGHT_FIELDS.slice()).join(",");
    const raw = await this.client.getEdge<RawInsight>(
      `/${this.accountPath}/insights`,
      {
        fields,
        level: query.level ?? "campaign",
        time_range: JSON.stringify({ since: query.from, until: query.to }),
        breakdowns: query.breakdowns?.length ? query.breakdowns.join(",") : undefined,
        limit: 500,
      },
    );
    return raw.map(normalizeInsight);
  }
}
