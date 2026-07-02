import { describe, it, expect } from "vitest";
import {
  getAPIKey,
  getBearerToken,
  makeJWT,
  makeRefreshToken,
  validateJWT,
} from "./src/auth.js";
import { UnauthorizedError } from "./src/api/errors.js";

const secret = "test-secret";
const userID = "user-123";

describe("JWT helpers", () => {
  it("creates and validates a token", () => {
    const token = makeJWT(userID, 60, secret);
    const result = validateJWT(token, secret);
    expect(result).toBe(userID);
  });

  it("rejects a token with the wrong secret", () => {
    const token = makeJWT(userID, 60, secret);
    expect(() => validateJWT(token, "wrong-secret")).toThrow();
  });

  it("rejects an expired token", () => {
    const token = makeJWT(userID, -10, secret);
    expect(() => validateJWT(token, secret)).toThrow();
  });
});

describe("Refresh token helpers", () => {
  it("creates a hex-encoded 256-bit refresh token", () => {
    const token = makeRefreshToken();

    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("Bearer token extraction", () => {
  it("extracts the token from an Authorization header", () => {
    const req = {
      get: (field: string) =>
        field === "Authorization" ? "Bearer my-token-value" : undefined,
    } as const;

    const token = getBearerToken(req as any);
    expect(token).toBe("my-token-value");
  });

  it("throws when Authorization header is missing", () => {
    const req = { get: () => undefined } as const;
    expect(() => getBearerToken(req as any)).toThrow(UnauthorizedError);
  });

  it("throws when Authorization header is invalid", () => {
    const req = { get: () => "Token bad-token" } as const;
    expect(() => getBearerToken(req as any)).toThrow(UnauthorizedError);
  });
});

describe("API key extraction", () => {
  it("extracts the key from an ApiKey authorization header", () => {
    const req = {
      get: (field: string) =>
        field === "Authorization" ? "ApiKey test-api-key" : undefined,
    } as const;

    const apiKey = getAPIKey(req as any);
    expect(apiKey).toBe("test-api-key");
  });

  it("throws when Authorization header is missing", () => {
    const req = { get: () => undefined } as const;
    expect(() => getAPIKey(req as any)).toThrow(UnauthorizedError);
  });

  it("throws when Authorization header is invalid", () => {
    const req = { get: () => "Bearer test-api-key" } as const;
    expect(() => getAPIKey(req as any)).toThrow(UnauthorizedError);
  });
});
