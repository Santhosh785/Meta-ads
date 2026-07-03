import { describe, it, expect } from "vitest";
import {
  toMetaError,
  MetaRateLimitError,
  MetaAuthError,
  MetaPermissionError,
  MetaValidationError,
  MetaServerError,
} from "../src/utils/Errors.js";

describe("toMetaError classification", () => {
  it("maps HTTP 429 to a retryable rate-limit error", () => {
    const err = toMetaError(429, { error: { message: "slow down" } });
    expect(err).toBeInstanceOf(MetaRateLimitError);
    expect(err.retryable).toBe(true);
  });

  it("maps a throttling code (4) to a rate-limit error even on a 400", () => {
    expect(toMetaError(400, { error: { code: 4 } })).toBeInstanceOf(MetaRateLimitError);
  });

  it("maps token code 190 to a non-retryable auth error", () => {
    const err = toMetaError(400, { error: { code: 190, message: "bad token" } });
    expect(err).toBeInstanceOf(MetaAuthError);
    expect(err.retryable).toBe(false);
  });

  it("maps permission codes (10 and 200-299) to permission errors", () => {
    expect(toMetaError(403, { error: { code: 10 } })).toBeInstanceOf(MetaPermissionError);
    expect(toMetaError(403, { error: { code: 200 } })).toBeInstanceOf(MetaPermissionError);
    expect(toMetaError(403, { error: { code: 299 } })).toBeInstanceOf(MetaPermissionError);
  });

  it("maps 5xx to a retryable server error", () => {
    const err = toMetaError(503, {});
    expect(err).toBeInstanceOf(MetaServerError);
    expect(err.retryable).toBe(true);
  });

  it("maps other 4xx to a non-retryable validation error", () => {
    const err = toMetaError(400, { error: { code: 100, message: "invalid field" } });
    expect(err).toBeInstanceOf(MetaValidationError);
    expect(err.retryable).toBe(false);
  });

  it("prefers the user-facing message when present", () => {
    const err = toMetaError(400, {
      error: { code: 100, message: "raw", error_user_msg: "friendly" },
    });
    expect(err.message).toBe("friendly");
  });

  it("captures code, subcode, type, and fbtrace id", () => {
    const err = toMetaError(400, {
      error: { code: 100, error_subcode: 33, type: "OAuthException", fbtrace_id: "abc" },
    });
    expect(err.code).toBe(100);
    expect(err.subcode).toBe(33);
    expect(err.type).toBe("OAuthException");
    expect(err.fbtraceId).toBe("abc");
  });

  it("preserves the concrete class name on the error instance", () => {
    expect(toMetaError(429, {}).name).toBe("MetaRateLimitError");
  });
});
