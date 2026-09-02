// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  assertSupabaseEnv,
  checkSupabaseEnv,
  formatSupabaseEnvError,
  missingSupabaseEnv,
} from "@/lib/env";

const VALID_URL = "https://project.supabase.co";
const VALID_KEY = "test-anon-key-never-log";
const SECRET_SENTINEL = "secret-value-must-not-appear";

let originalUrl: string | undefined;
let originalKey: string | undefined;

function setSupabaseEnv(url: string | undefined, key: string | undefined) {
  if (url === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL = url;

  if (key === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  else process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = key;
}

beforeEach(() => {
  originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
});

afterEach(() => {
  setSupabaseEnv(originalUrl, originalKey);
  vi.restoreAllMocks();
});

describe("Supabase environment validation", () => {
  it("lists both missing variables in declaration order", () => {
    setSupabaseEnv(undefined, undefined);

    expect(missingSupabaseEnv()).toEqual([
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    ]);
  });

  it.each([
    [undefined, VALID_KEY, ["NEXT_PUBLIC_SUPABASE_URL"]],
    [VALID_URL, undefined, ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]],
    ["", VALID_KEY, ["NEXT_PUBLIC_SUPABASE_URL"]],
    [VALID_URL, " \t\n ", ["NEXT_PUBLIC_SUPABASE_ANON_KEY"]],
  ] as const)("treats an absent, empty, or blank value as missing", (url, key, expected) => {
    setSupabaseEnv(url, key);

    expect(missingSupabaseEnv()).toEqual(expected);
  });

  it.each(["not-a-url", "ftp://project.supabase.co"])(
    "rejects a malformed or non-http(s) Supabase URL: %s",
    (url) => {
      setSupabaseEnv(url, VALID_KEY);

      const report = checkSupabaseEnv();
      expect(report.ok).toBe(false);
      expect(report.missing).toEqual([]);
      expect(report.invalid.map(({ name }) => name)).toEqual([
        "NEXT_PUBLIC_SUPABASE_URL",
      ]);
    },
  );

  it("throws in production and names only the problematic variable", () => {
    setSupabaseEnv(undefined, VALID_KEY);

    expect(() => assertSupabaseEnv({ nodeEnv: "production" })).toThrowError(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );

    try {
      assertSupabaseEnv({ nodeEnv: "production" });
    } catch (error) {
      const message = (error as Error).message;
      expect(message).toContain(".env.example");
      expect(message).not.toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
      expect(message).not.toContain(VALID_KEY);
    }
  });

  it("logs visibly and continues in development", () => {
    setSupabaseEnv(undefined, undefined);
    const logger = vi.fn();

    const report = assertSupabaseEnv({ nodeEnv: "development", logger });

    expect(report.ok).toBe(false);
    expect(logger).toHaveBeenCalledOnce();
    expect(logger.mock.calls[0][0]).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(logger.mock.calls[0][0]).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    expect(logger.mock.calls[0][0]).toContain(".env.example");
  });

  it("is silent when both variables are valid", () => {
    setSupabaseEnv(VALID_URL, VALID_KEY);
    const logger = vi.fn();

    const report = assertSupabaseEnv({ nodeEnv: "production", logger });

    expect(report.ok).toBe(true);
    expect(logger).not.toHaveBeenCalled();
  });

  it("never includes configured values in diagnostics", () => {
    setSupabaseEnv("not-a-url", SECRET_SENTINEL);

    const message = formatSupabaseEnvError(checkSupabaseEnv());

    expect(message).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(message).not.toContain("not-a-url");
    expect(message).not.toContain(SECRET_SENTINEL);
  });
});
