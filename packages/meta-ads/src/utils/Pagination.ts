import type { GraphListResponse } from "../types/common.js";

/**
 * Walk every page of a Graph API edge by following `paging.next`,
 * accumulating all `data` items into a single array.
 *
 * @param fetchPage Fetches (and parses) one page given its full URL.
 * @param firstUrl  The fully-built URL of the first page.
 * @param maxPages  Safety limit to avoid runaway pagination. Defaults to 1000.
 */
export async function paginate<T>(
  fetchPage: (url: string) => Promise<GraphListResponse<T>>,
  firstUrl: string,
  maxPages = 1000,
): Promise<T[]> {
  const results: T[] = [];
  let url: string | undefined = firstUrl;
  let pages = 0;

  while (url && pages < maxPages) {
    const page = await fetchPage(url);
    if (Array.isArray(page.data)) {
      results.push(...page.data);
    }
    url = page.paging?.next;
    pages += 1;
  }

  return results;
}
