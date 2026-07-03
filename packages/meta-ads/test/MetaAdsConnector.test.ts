import { describe, it, expect, vi, afterEach } from "vitest";
import { MetaAdsConnector } from "../src/index.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe("MetaAdsConnector", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("prepends act_ to a bare ad account id and hits the campaigns edge", async () => {
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        urls.push(url);
        return jsonResponse({ data: [] });
      }),
    );
    const meta = new MetaAdsConnector({ accessToken: "T", adAccountId: "12345" });
    await meta.getCampaigns();
    expect(urls[0]).toContain("/act_12345/campaigns");
  });

  it("keeps an existing act_ prefix", async () => {
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        urls.push(url);
        return jsonResponse({ data: [] });
      }),
    );
    const meta = new MetaAdsConnector({ accessToken: "T", adAccountId: "act_9" });
    await meta.getCampaigns();
    expect(urls[0]).toContain("/act_9/campaigns");
    expect(urls[0]).not.toContain("act_act_9");
  });

  it("passes a JSON time_range and default level to the insights edge", async () => {
    let captured = "";
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        captured = url;
        return jsonResponse({ data: [] });
      }),
    );
    const meta = new MetaAdsConnector({ accessToken: "T", adAccountId: "act_9" });
    await meta.getInsights({ from: "2026-07-01", to: "2026-07-03" });

    const url = new URL(captured);
    expect(url.pathname).toContain("/act_9/insights");
    expect(JSON.parse(url.searchParams.get("time_range")!)).toEqual({
      since: "2026-07-01",
      until: "2026-07-03",
    });
    expect(url.searchParams.get("level")).toBe("campaign");
  });

  it("validates required constructor config", () => {
    expect(() => new MetaAdsConnector({ accessToken: "", adAccountId: "1" })).toThrow(/accessToken/);
    expect(() => new MetaAdsConnector({ accessToken: "T", adAccountId: "" })).toThrow(/adAccountId/);
  });

  it("requires a formId for getLeads", async () => {
    const meta = new MetaAdsConnector({ accessToken: "T", adAccountId: "1" });
    await expect(meta.getLeads("")).rejects.toThrow(/formId/);
  });
});
