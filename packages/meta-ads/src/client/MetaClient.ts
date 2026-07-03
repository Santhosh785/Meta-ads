import { retry } from "../utils/Retry.js";
import { paginate } from "../utils/Pagination.js";
import { MetaError, MetaTransientError, toMetaError } from "../utils/Errors.js";
import type { MetaErrorBody } from "../utils/Errors.js";
import type { GraphListResponse } from "../types/index.js";

export interface MetaClientOptions {
  accessToken: string;
  apiVersion?: string;
  baseUrl?: string;
  maxRetries?: number;
  timeoutMs?: number;
}

export type QueryValue = string | number | boolean | undefined | null;
export type QueryParams = Record<string, QueryValue>;

const DEFAULT_API_VERSION = "v24.0";
const DEFAULT_BASE_URL = "https://graph.facebook.com";

/**
 * Low-level Graph API HTTP client. Handles URL building, the access token,
 * API versioning, timeouts, retries, typed error conversion, and pagination.
 * It knows nothing about campaigns, ads, or CRM concepts.
 */
export class MetaClient {
  readonly apiVersion: string;
  private readonly accessToken: string;
  private readonly baseUrl: string;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;

  constructor(options: MetaClientOptions) {
    if (!options.accessToken) {
      throw new Error("MetaClient requires an accessToken");
    }
    this.accessToken = options.accessToken;
    this.apiVersion = options.apiVersion ?? DEFAULT_API_VERSION;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.maxRetries = options.maxRetries ?? 3;
    this.timeoutMs = options.timeoutMs ?? 30000;
  }

  /** Build a fully-qualified Graph API URL, including the access token. */
  buildUrl(path: string, params: QueryParams = {}): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const url = new URL(`${this.baseUrl}/${this.apiVersion}${normalizedPath}`);
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) continue;
      url.searchParams.set(key, String(value));
    }
    url.searchParams.set("access_token", this.accessToken);
    return url.toString();
  }

  /** Fetch a single object (node) from the Graph API. */
  async get<T>(path: string, params?: QueryParams): Promise<T> {
    return this.run<T>(this.buildUrl(path, params));
  }

  /** Fetch an edge (list), automatically following pagination to completion. */
  async getEdge<T>(path: string, params?: QueryParams): Promise<T[]> {
    const firstUrl = this.buildUrl(path, params);
    return paginate<T>((url) => this.run<GraphListResponse<T>>(url), firstUrl);
  }

  private run<T>(url: string): Promise<T> {
    return retry(() => this.fetchJson<T>(url), { retries: this.maxRetries });
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "AbortError";
      throw new MetaTransientError(
        timedOut
          ? `Meta API request timed out after ${this.timeoutMs}ms`
          : `Meta API network error: ${(error as Error)?.message ?? "unknown"}`,
        { httpStatus: 0, retryable: true, cause: error },
      );
    } finally {
      clearTimeout(timer);
    }

    const text = await response.text();
    let body: unknown = {};
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        if (!response.ok) {
          throw new MetaError(
            `Meta API returned a non-JSON error response (HTTP ${response.status})`,
            { httpStatus: response.status, retryable: response.status >= 500 },
          );
        }
      }
    }

    const hasErrorEnvelope =
      typeof body === "object" && body !== null && "error" in body;
    if (!response.ok || hasErrorEnvelope) {
      throw toMetaError(response.status, body as MetaErrorBody);
    }

    return body as T;
  }
}
