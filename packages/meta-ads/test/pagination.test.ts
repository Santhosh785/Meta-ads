import { describe, it, expect, vi } from "vitest";
import { paginate } from "../src/utils/Pagination.js";
import type { GraphListResponse } from "../src/types/common.js";

describe("paginate", () => {
  it("follows paging.next and concatenates every page's data", async () => {
    const pages: Record<string, GraphListResponse<number>> = {
      a: { data: [1, 2], paging: { next: "b" } },
      b: { data: [3], paging: { next: "c" } },
      c: { data: [4] },
    };
    const fetchPage = vi.fn(async (url: string) => pages[url]!);
    const all = await paginate(fetchPage, "a");
    expect(all).toEqual([1, 2, 3, 4]);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });

  it("tolerates pages with no data array", async () => {
    const all = await paginate(async () => ({}), "x");
    expect(all).toEqual([]);
  });

  it("stops at maxPages to avoid runaway loops", async () => {
    const fetchPage = vi.fn(async () => ({ data: [1], paging: { next: "loop" } }));
    const all = await paginate(fetchPage, "loop", 3);
    expect(all).toEqual([1, 1, 1]);
    expect(fetchPage).toHaveBeenCalledTimes(3);
  });
});
