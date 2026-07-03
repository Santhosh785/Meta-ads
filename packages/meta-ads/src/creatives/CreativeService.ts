import type { MetaClient } from "../client/MetaClient.js";
import type { Creative } from "../types/Creative.js";

const CREATIVE_FIELDS = [
  "id",
  "name",
  "title",
  "body",
  "image_url",
  "video_id",
  "call_to_action_type",
  "url_tags",
  "object_story_spec",
] as const;

interface RawCreative {
  id: string;
  name?: string;
  title?: string;
  body?: string;
  image_url?: string;
  video_id?: string;
  call_to_action_type?: string;
  url_tags?: string;
  object_story_spec?: {
    link_data?: { link?: string; call_to_action?: { type?: string } };
    video_data?: { call_to_action?: { type?: string } };
  };
}

export function normalizeCreative(raw: RawCreative): Creative {
  const spec = raw.object_story_spec;
  const ctaFromSpec =
    spec?.link_data?.call_to_action?.type ??
    spec?.video_data?.call_to_action?.type ??
    null;
  return {
    id: raw.id,
    name: raw.name ?? null,
    title: raw.title ?? null,
    body: raw.body ?? null,
    imageUrl: raw.image_url ?? null,
    videoId: raw.video_id ?? null,
    callToActionType: raw.call_to_action_type ?? ctaFromSpec,
    linkUrl: spec?.link_data?.link ?? null,
    urlTags: raw.url_tags ?? null,
  };
}

export class CreativeService {
  constructor(
    private readonly client: MetaClient,
    private readonly accountPath: string,
  ) {}

  /** Fetch all ad creatives for the configured ad account. */
  async list(): Promise<Creative[]> {
    const raw = await this.client.getEdge<RawCreative>(
      `/${this.accountPath}/adcreatives`,
      { fields: CREATIVE_FIELDS.join(","), limit: 100 },
    );
    return raw.map(normalizeCreative);
  }
}
