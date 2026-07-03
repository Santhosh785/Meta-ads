// Public entry point
export { MetaAdsConnector } from "./MetaAdsConnector.js";

// Low-level client (for advanced/raw usage)
export { MetaClient } from "./client/MetaClient.js";
export type {
  MetaClientOptions,
  QueryParams,
  QueryValue,
} from "./client/MetaClient.js";

// Services (exported so they can be composed independently)
export { CampaignService, normalizeCampaign } from "./campaigns/CampaignService.js";
export {
  AdsetService,
  normalizeAdset,
  type AdsetListOptions,
} from "./adsets/AdsetService.js";
export { AdService, normalizeAd, type AdListOptions } from "./ads/AdService.js";
export { CreativeService, normalizeCreative } from "./creatives/CreativeService.js";
export {
  InsightService,
  normalizeInsight,
  type InsightQuery,
  type InsightLevel,
} from "./insights/InsightService.js";
export {
  LeadService,
  normalizeLead,
  normalizeLeadForm,
} from "./leads/LeadService.js";
export { TokenValidator, type TokenInfo } from "./auth/TokenValidator.js";

// Utilities
export { retry, type RetryOptions } from "./utils/Retry.js";
export { paginate } from "./utils/Pagination.js";
export { toNumber, numberOr } from "./utils/normalize.js";

// Typed errors
export * from "./utils/Errors.js";

// Data + config types
export * from "./types/index.js";
