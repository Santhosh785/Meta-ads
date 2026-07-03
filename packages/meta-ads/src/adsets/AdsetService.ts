import type { MetaClient } from "../client/MetaClient.js";
import type { Adset } from "../types/Adset.js";
import { toNumber } from "../utils/normalize.js";

const ADSET_FIELDS = [
  "id",
  "name",
  "campaign_id",
  "status",
  "effective_status",
  "daily_budget",
  "lifetime_budget",
  "optimization_goal",
  "billing_event",
  "start_time",
  "end_time",
] as const;

interface RawAdset {
  id: string;
  name?: string;
  campaign_id?: string;
  status?: string;
  effective_status?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  optimization_goal?: string;
  billing_event?: string;
  start_time?: string;
  end_time?: string;
}

export interface AdsetListOptions {
  /** Restrict to a single campaign's ad sets. */
  campaignId?: string;
}

export function normalizeAdset(raw: RawAdset): Adset {
  return {
    id: raw.id,
    name: raw.name ?? "",
    campaignId: raw.campaign_id ?? null,
    status: raw.status ?? "UNKNOWN",
    effectiveStatus: raw.effective_status ?? null,
    dailyBudget: toNumber(raw.daily_budget),
    lifetimeBudget: toNumber(raw.lifetime_budget),
    optimizationGoal: raw.optimization_goal ?? null,
    billingEvent: raw.billing_event ?? null,
    startTime: raw.start_time ?? null,
    endTime: raw.end_time ?? null,
  };
}

export class AdsetService {
  constructor(
    private readonly client: MetaClient,
    private readonly accountPath: string,
  ) {}

  /** Fetch ad sets for the account, or for a single campaign when specified. */
  async list(options: AdsetListOptions = {}): Promise<Adset[]> {
    const path = options.campaignId
      ? `/${options.campaignId}/adsets`
      : `/${this.accountPath}/adsets`;
    const raw = await this.client.getEdge<RawAdset>(path, {
      fields: ADSET_FIELDS.join(","),
      limit: 200,
    });
    return raw.map(normalizeAdset);
  }
}
