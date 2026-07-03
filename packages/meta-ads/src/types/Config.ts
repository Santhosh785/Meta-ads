/** Configuration accepted by {@link MetaAdsConnector}. */
export interface MetaAdsConfig {
  /** A valid Meta access token (user, page, or system-user token). */
  accessToken: string;
  /** Ad account id, with or without the `act_` prefix (e.g. `1234567890`). */
  adAccountId: string;
  /** Graph API version. Defaults to `v24.0`. */
  apiVersion?: string;
  /** Base URL override (useful for testing). Defaults to `https://graph.facebook.com`. */
  baseUrl?: string;
  /** Maximum number of retry attempts for transient failures. Defaults to `3`. */
  maxRetries?: number;
  /** Per-request timeout in milliseconds. Defaults to `30000`. */
  timeoutMs?: number;
}
