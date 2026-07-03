import { describe, it, expect } from "vitest";
import { normalizeCampaign } from "../src/campaigns/CampaignService.js";
import { normalizeAdset } from "../src/adsets/AdsetService.js";
import { normalizeAd } from "../src/ads/AdService.js";
import { normalizeCreative } from "../src/creatives/CreativeService.js";
import { normalizeInsight } from "../src/insights/InsightService.js";
import { normalizeLead, normalizeLeadForm } from "../src/leads/LeadService.js";

describe("normalizeCampaign", () => {
  it("parses budgets to numbers and maps fields", () => {
    const c = normalizeCampaign({
      id: "1",
      name: "CA Foundation",
      objective: "OUTCOME_LEADS",
      status: "ACTIVE",
      daily_budget: "5000",
      created_time: "2026-07-01T00:00:00+0000",
    });
    expect(c).toMatchObject({
      id: "1",
      name: "CA Foundation",
      objective: "OUTCOME_LEADS",
      status: "ACTIVE",
      dailyBudget: 5000,
      lifetimeBudget: null,
    });
  });

  it("defaults missing name/status and nulls absent fields", () => {
    const c = normalizeCampaign({ id: "1" });
    expect(c.name).toBe("");
    expect(c.status).toBe("UNKNOWN");
    expect(c.objective).toBeNull();
    expect(c.dailyBudget).toBeNull();
  });
});

describe("normalizeAdset", () => {
  it("maps snake_case to camelCase and campaign id", () => {
    const a = normalizeAdset({
      id: "2",
      name: "Set A",
      campaign_id: "1",
      status: "PAUSED",
      optimization_goal: "LEAD_GENERATION",
      billing_event: "IMPRESSIONS",
      lifetime_budget: "20000",
    });
    expect(a).toMatchObject({
      id: "2",
      campaignId: "1",
      status: "PAUSED",
      optimizationGoal: "LEAD_GENERATION",
      billingEvent: "IMPRESSIONS",
      lifetimeBudget: 20000,
    });
  });
});

describe("normalizeAd", () => {
  it("extracts the creative id from the nested creative object", () => {
    const ad = normalizeAd({
      id: "3",
      name: "Ad 1",
      adset_id: "2",
      campaign_id: "1",
      creative: { id: "cr1" },
    });
    expect(ad.creativeId).toBe("cr1");
    expect(ad.adsetId).toBe("2");
  });

  it("nulls the creative id when absent", () => {
    expect(normalizeAd({ id: "3" }).creativeId).toBeNull();
  });
});

describe("normalizeCreative", () => {
  it("derives link url and CTA from object_story_spec", () => {
    const cr = normalizeCreative({
      id: "cr1",
      name: "Creative",
      image_url: "https://img",
      object_story_spec: {
        link_data: { link: "https://landing", call_to_action: { type: "SIGN_UP" } },
      },
    });
    expect(cr.linkUrl).toBe("https://landing");
    expect(cr.callToActionType).toBe("SIGN_UP");
    expect(cr.imageUrl).toBe("https://img");
  });

  it("prefers a top-level call_to_action_type over the spec", () => {
    const cr = normalizeCreative({
      id: "cr1",
      call_to_action_type: "LEARN_MORE",
      object_story_spec: { link_data: { call_to_action: { type: "SIGN_UP" } } },
    });
    expect(cr.callToActionType).toBe("LEARN_MORE");
  });
});

describe("normalizeInsight", () => {
  it("coerces metrics to numbers, maps actions, and reads roas", () => {
    const i = normalizeInsight({
      date_start: "2026-07-01",
      date_stop: "2026-07-03",
      campaign_id: "1",
      spend: "1234.56",
      impressions: "10000",
      clicks: "250",
      ctr: "2.5",
      actions: [
        { action_type: "lead", value: "12" },
        { action_type: "link_click", value: "250" },
      ],
      purchase_roas: [{ action_type: "omni_purchase", value: "3.2" }],
    });
    expect(i.spend).toBe(1234.56);
    expect(i.impressions).toBe(10000);
    expect(i.actions).toEqual([
      { type: "lead", value: 12 },
      { type: "link_click", value: 250 },
    ]);
    expect(i.roas).toBe(3.2);
  });

  it("defaults absent metrics to 0 and roas to null", () => {
    const i = normalizeInsight({});
    expect(i.spend).toBe(0);
    expect(i.clicks).toBe(0);
    expect(i.actions).toEqual([]);
    expect(i.roas).toBeNull();
  });
});

describe("normalizeLead / normalizeLeadForm", () => {
  it("maps field_data entries", () => {
    const lead = normalizeLead({
      id: "l1",
      created_time: "2026-07-02T10:00:00+0000",
      ad_id: "3",
      field_data: [
        { name: "full_name", values: ["Asha"] },
        { name: "email", values: ["asha@example.com"] },
      ],
    });
    expect(lead.adId).toBe("3");
    expect(lead.fieldData).toEqual([
      { name: "full_name", values: ["Asha"] },
      { name: "email", values: ["asha@example.com"] },
    ]);
  });

  it("parses leads_count on lead forms", () => {
    const form = normalizeLeadForm({ id: "f1", name: "CA Form", status: "ACTIVE", leads_count: "42" });
    expect(form.leadsCount).toBe(42);
    expect(form.status).toBe("ACTIVE");
  });
});
