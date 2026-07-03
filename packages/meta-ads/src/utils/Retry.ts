export interface RetryOptions {
  /** Maximum retry attempts after the first try. Defaults to `3`. */
  retries?: number;
  /** Base backoff delay in ms. Defaults to `500`. */
  baseDelayMs?: number;
  /** Upper bound on any single backoff delay in ms. Defaults to `15000`. */
  maxDelayMs?: number;
  /** Invoked before each retry sleep. Useful for logging/metrics. */
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

function isRetryable(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { retryable?: boolean }).retryable === true
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async operation with exponential backoff + jitter.
 * Only errors flagged `retryable` (429, 5xx, network/timeout) are retried;
 * auth, permission, and validation errors fail fast.
 */
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const retries = options.retries ?? 3;
  const baseDelay = options.baseDelayMs ?? 500;
  const maxDelay = options.maxDelayMs ?? 15000;

  let attempt = 0;
  for (;;) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= retries || !isRetryable(error)) {
        throw error;
      }
      const backoff = Math.min(maxDelay, baseDelay * 2 ** attempt);
      const jitter = Math.random() * backoff * 0.25;
      const delay = Math.round(backoff + jitter);
      options.onRetry?.(error, attempt + 1, delay);
      await sleep(delay);
      attempt += 1;
    }
  }
}
