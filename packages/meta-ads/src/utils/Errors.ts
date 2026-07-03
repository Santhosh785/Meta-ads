/** Raw error envelope returned by the Graph API. */
export interface MetaErrorBody {
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    error_user_title?: string;
    error_user_msg?: string;
    fbtrace_id?: string;
  };
}

export interface MetaErrorOptions {
  httpStatus: number;
  code?: number | null;
  subcode?: number | null;
  type?: string | null;
  fbtraceId?: string | null;
  /** Whether the caller may safely retry the request. */
  retryable?: boolean;
  cause?: unknown;
}

/** Base class for every error thrown by this package. */
export class MetaError extends Error {
  readonly httpStatus: number;
  readonly code: number | null;
  readonly subcode: number | null;
  readonly type: string | null;
  readonly fbtraceId: string | null;
  readonly retryable: boolean;

  constructor(message: string, options: MetaErrorOptions) {
    super(message, { cause: options.cause });
    this.name = new.target.name;
    this.httpStatus = options.httpStatus;
    this.code = options.code ?? null;
    this.subcode = options.subcode ?? null;
    this.type = options.type ?? null;
    this.fbtraceId = options.fbtraceId ?? null;
    this.retryable = options.retryable ?? false;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Invalid or expired access token — never retried. */
export class MetaAuthError extends MetaError {}

/** Missing permission / capability for the request — never retried. */
export class MetaPermissionError extends MetaError {}

/** Rate limited (HTTP 429 or a Meta throttling code) — retried. */
export class MetaRateLimitError extends MetaError {}

/** Malformed or rejected request — never retried. */
export class MetaValidationError extends MetaError {}

/** Temporary server-side (5xx) failure — retried. */
export class MetaServerError extends MetaError {}

/** Network failure or client-side timeout — retried. */
export class MetaTransientError extends MetaError {}

const RATE_LIMIT_CODES = new Set([
  4, 17, 32, 341, 613, 80000, 80001, 80002, 80003, 80004, 80005, 80006, 80008, 80014,
]);
const AUTH_CODES = new Set([102, 190]);

/**
 * Translate an HTTP status + Graph API error body into a typed error,
 * classifying it as retryable or not per the package retry strategy.
 */
export function toMetaError(status: number, body: MetaErrorBody): MetaError {
  const error = body.error ?? {};
  const code = typeof error.code === "number" ? error.code : null;
  const message =
    error.error_user_msg ||
    error.message ||
    `Meta API request failed with HTTP ${status}`;

  const base = {
    httpStatus: status,
    code,
    subcode: error.error_subcode ?? null,
    type: error.type ?? null,
    fbtraceId: error.fbtrace_id ?? null,
  };

  if (status === 429 || (code !== null && RATE_LIMIT_CODES.has(code))) {
    return new MetaRateLimitError(message, { ...base, retryable: true });
  }
  if (code !== null && AUTH_CODES.has(code)) {
    return new MetaAuthError(message, { ...base, retryable: false });
  }
  if (code === 10 || (code !== null && code >= 200 && code <= 299)) {
    return new MetaPermissionError(message, { ...base, retryable: false });
  }
  if (status >= 500) {
    return new MetaServerError(message, { ...base, retryable: true });
  }
  return new MetaValidationError(message, { ...base, retryable: false });
}
