import { describe, it, expect, vi, afterEach } from "vitest";
import { MetaClient } from "../src/client/MetaClient.js";
import {
  MetaAuthError,
  MetaTransientError,
} from "../src/utils/Errors.js";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("MetaClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("builds URLs with version, params, and access token; drops undefined params", () => {
    const client = new MetaClient({ accessToken: "T", apiVersion: "v24.0" });
    const url = new URL(
      client.buildUrl("/act_1/campaigns", { fields: "id,name", limit: 5, skip: undefined }),
    );
    expect(url.origin + url.pathname).toBe("https://graph.facebook.com/v24.0/act_1/campaigns");
    expect(url.searchParams.get("fields")).toBe("id,name");
    expect(url.searchParams.get("limit")).toBe("5");
    expect(url.searchParams.has("skip")).toBe(false);
    expect(url.searchParams.get("access_token")).toBe("T");
  });

  it("get() returns the parsed node", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ id: "1", name: "me" }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new MetaClient({ accessToken: "T" });
    await expect(client.get("/me")).resolves.toEqual({ id: "1", name: "me" });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("getEdge() auto-paginates across pages", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: "1" }],
          paging: { next: "https://graph.facebook.com/v24.0/next" },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ data: [{ id: "2" }] }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new MetaClient({ accessToken: "T" });
    const all = await client.getEdge<{ id: string }>("/act_1/campaigns");
    expect(all.map((x) => x.id)).toEqual(["1", "2"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("retries on HTTP 429 then succeeds", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ error: { code: 4, message: "rate" } }, 429))
      .mockResolvedValueOnce(jsonResponse({ id: "1" }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new MetaClient({ accessToken: "T" });
    const assertion = expect(client.get("/me")).resolves.toEqual({ id: "1" });
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("does not retry auth errors (fails fast)", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({ error: { code: 190, message: "bad token" } }, 400),
    );
    vi.stubGlobal("fetch", fetchMock);
    const client = new MetaClient({ accessToken: "T" });
    await expect(client.get("/me")).rejects.toBeInstanceOf(MetaAuthError);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("wraps network failures as retryable transient errors", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async () => {
      throw new Error("ECONNRESET");
    });
    vi.stubGlobal("fetch", fetchMock);
    const client = new MetaClient({ accessToken: "T", maxRetries: 1 });
    const assertion = expect(client.get("/me")).rejects.toBeInstanceOf(MetaTransientError);
    await vi.runAllTimersAsync();
    await assertion;
    expect(fetchMock).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
  });

  it("throws when constructed without an access token", () => {
    expect(() => new MetaClient({ accessToken: "" })).toThrow(/accessToken/);
  });
});
