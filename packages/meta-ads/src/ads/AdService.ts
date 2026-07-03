import type { MetaClient } from "../client/MetaClient.js";
import type { Ad } from "../types/Ad.js";

const AD_FIELDS = [
  "id",
  "name",
  "adset_id",
  "campaign_id",
  "status",
  "effective_status",
  "creative{id}",
] as const;

interface RawAd {
  id: string;
  name?: string;
  adset_id?: string;
  campaign_id?: string;
  status?: string;
  effective_status?: string;
  creative?: { id?: string };
}

export interface AdListOptions {
  /** Restrict to a single campaign's ads. */
  campaignId?: string;
  /** Restrict to a single ad set's ads. */
  adsetId?: string;
}

export function normalizeAd(raw: RawAd): Ad {
  return {
    id: raw.id,
    name: raw.name ?? "",
    adsetId: raw.adset_id ?? null,
    campaignId: raw.campaign_id ?? null,
    status: raw.status ?? "UNKNOWN",
    effectiveStatus: raw.effective_status ?? null,
    creativeId: raw.creative?.id ?? null,
  };
}

export class AdService {
  constructor(
    private readonly client: MetaClient,
    private readonly accountPath: string,
  ) {}

  /** Fetch ads for the account, or scoped to a campaign / ad set. */
  async list(options: AdListOptions = {}): Promise<Ad[]> {
    let path = `/${this.accountPath}/ads`;
    if (options.adsetId) path = `/${options.adsetId}/ads`;
    else if (options.campaignId) path = `/${options.campaignId}/ads`;

    const raw = await this.client.getEdge<RawAd>(path, {
      fields: AD_FIELDS.join(","),
      limit: 200,
    });
    return raw.map(normalizeAd);
  }
}
