import type { MetaClient } from "../client/MetaClient.js";
import type { Campaign } from "../types/Campaign.js";
import { toNumber } from "../utils/normalize.js";

const CAMPAIGN_FIELDS = [
  "id",
  "name",
  "objective",
  "status",
  "effective_status",
  "daily_budget",
  "lifetime_budget",
  "created_time",
  "updated_time",
] as const;

interface RawCampaign {
  id: string;
  name?: string;
  objective?: string;
  status?: string;
  effective_status?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  created_time?: string;
  updated_time?: string;
}

export function normalizeCampaign(raw: RawCampaign): Campaign {
  return {
    id: raw.id,
    name: raw.name ?? "",
    objective: raw.objective ?? null,
    status: raw.status ?? "UNKNOWN",
    effectiveStatus: raw.effective_status ?? null,
    dailyBudget: toNumber(raw.daily_budget),
    lifetimeBudget: toNumber(raw.lifetime_budget),
    createdTime: raw.created_time ?? null,
    updatedTime: raw.updated_time ?? null,
  };
}

export class CampaignService {
  constructor(
    private readonly client: MetaClient,
    private readonly accountPath: string,
  ) {}

  /** Fetch all campaigns for the configured ad account. */
  async list(): Promise<Campaign[]> {
    const raw = await this.client.getEdge<RawCampaign>(
      `/${this.accountPath}/campaigns`,
      { fields: CAMPAIGN_FIELDS.join(","), limit: 200 },
    );
    return raw.map(normalizeCampaign);
  }
}
