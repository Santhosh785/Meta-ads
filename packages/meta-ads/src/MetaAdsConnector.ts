import { MetaClient } from "./client/MetaClient.js";
import { TokenValidator, type TokenInfo } from "./auth/TokenValidator.js";
import { CampaignService } from "./campaigns/CampaignService.js";
import { AdsetService, type AdsetListOptions } from "./adsets/AdsetService.js";
import { AdService, type AdListOptions } from "./ads/AdService.js";
import { CreativeService } from "./creatives/CreativeService.js";
import { InsightService, type InsightQuery } from "./insights/InsightService.js";
import { LeadService } from "./leads/LeadService.js";
import type { MetaAdsConfig } from "./types/Config.js";
import type { Campaign } from "./types/Campaign.js";
import type { Adset } from "./types/Adset.js";
import type { Ad } from "./types/Ad.js";
import type { Creative } from "./types/Creative.js";
import type { Insight } from "./types/Insight.js";
import type { Lead, LeadForm } from "./types/Lead.js";

function normalizeAccountPath(adAccountId: string): string {
  const trimmed = adAccountId.trim();
  return trimmed.startsWith("act_") ? trimmed : `act_${trimmed}`;
}

/**
 * The public entry point of the package. Composes the low-level client and
 * per-resource services into a single, ergonomic, fetch-only facade.
 *
 * It does not touch a database, environment variables, or any CRM concept —
 * the caller supplies all configuration and decides what to do with the data.
 */
export class MetaAdsConnector {
  /** The underlying HTTP client, exposed for advanced/raw calls. */
  readonly client: MetaClient;

  private readonly accountPath: string;
  private readonly tokenValidator: TokenValidator;
  private readonly campaigns: CampaignService;
  private readonly adsets: AdsetService;
  private readonly ads: AdService;
  private readonly creatives: CreativeService;
  private readonly insights: InsightService;
  private readonly leads: LeadService;

  constructor(config: MetaAdsConfig) {
    if (!config.accessToken) {
      throw new Error("MetaAdsConnector requires an accessToken");
    }
    if (!config.adAccountId) {
      throw new Error("MetaAdsConnector requires an adAccountId");
    }

    this.client = new MetaClient({
      accessToken: config.accessToken,
      apiVersion: config.apiVersion,
      baseUrl: config.baseUrl,
      maxRetries: config.maxRetries,
      timeoutMs: config.timeoutMs,
    });
    this.accountPath = normalizeAccountPath(config.adAccountId);

    this.tokenValidator = new TokenValidator(this.client);
    this.campaigns = new CampaignService(this.client, this.accountPath);
    this.adsets = new AdsetService(this.client, this.accountPath);
    this.ads = new AdService(this.client, this.accountPath);
    this.creatives = new CreativeService(this.client, this.accountPath);
    this.insights = new InsightService(this.client, this.accountPath);
    this.leads = new LeadService(this.client);
  }

  /** Verify the access token and return the associated identity. */
  validateToken(): Promise<TokenInfo> {
    return this.tokenValidator.validate();
  }

  getCampaigns(): Promise<Campaign[]> {
    return this.campaigns.list();
  }

  getAdsets(options?: AdsetListOptions): Promise<Adset[]> {
    return this.adsets.list(options);
  }

  getAds(options?: AdListOptions): Promise<Ad[]> {
    return this.ads.list(options);
  }

  getCreatives(): Promise<Creative[]> {
    return this.creatives.list();
  }

  getInsights(query: InsightQuery): Promise<Insight[]> {
    return this.insights.query(query);
  }

  getLeads(formId: string): Promise<Lead[]> {
    return this.leads.getLeads(formId);
  }

  getLeadForms(pageId: string): Promise<LeadForm[]> {
    return this.leads.getForms(pageId);
  }
}
