import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { retry } from "../src/utils/Retry.js";

const retryable = (msg = "transient") => Object.assign(new Error(msg), { retryable: true });
const fatal = (msg = "fatal") => Object.assign(new Error(msg), { retryable: false });

describe("retry", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("retries retryable failures then resolves", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(retryable())
      .mockRejectedValueOnce(retryable())
      .mockResolvedValue("ok");
    const assertion = expect(retry(fn, { retries: 3 })).resolves.toBe("ok");
    await vi.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("fails fast on non-retryable errors", async () => {
    const fn = vi.fn().mockRejectedValue(fatal("nope"));
    const assertion = expect(retry(fn, { retries: 3 })).rejects.toThrow("nope");
    await vi.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives up after the configured number of retries", async () => {
    const fn = vi.fn().mockRejectedValue(retryable("always"));
    const assertion = expect(retry(fn, { retries: 2 })).rejects.toThrow("always");
    await vi.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it("invokes onRetry with the attempt number and delay", async () => {
    const onRetry = vi.fn();
    const fn = vi.fn().mockRejectedValueOnce(retryable()).mockResolvedValue("ok");
    const assertion = expect(retry(fn, { retries: 3, onRetry })).resolves.toBe("ok");
    await vi.runAllTimersAsync();
    await assertion;
    expect(onRetry).toHaveBeenCalledTimes(1);
    const [, attempt, delay] = onRetry.mock.calls[0]!;
    expect(attempt).toBe(1);
    expect(delay).toBeGreaterThan(0);
  });
});
