import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { secureGetRandomInt } from "../core/crypto";

describe("crypto utils", () => {
  describe("secureGetRandomInt", () => {
    let _originalCrypto: any;

    beforeEach(() => {
      _originalCrypto = globalThis.crypto;
    });

    afterEach(() => {
      // globalThis.crypto = _originalCrypto;
      vi.restoreAllMocks();
    });

    it("returns 0 when max is <= 0", () => {
      expect(secureGetRandomInt(0)).toBe(0);
      expect(secureGetRandomInt(-5)).toBe(0);
    });

    it("throws error when max > Number.MAX_SAFE_INTEGER", () => {
      expect(() => secureGetRandomInt(Number.MAX_SAFE_INTEGER + 1)).toThrow(
        "max cannot exceed Number.MAX_SAFE_INTEGER"
      );
    });

    it("returns values within bounds for 8-bit limits", () => {
      for (let i = 0; i < 100; i++) {
        const val = secureGetRandomInt(10);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(10);
      }
    });

    it("returns values within bounds for 16-bit limits", () => {
      const limit = 30000;
      for (let i = 0; i < 50; i++) {
        const val = secureGetRandomInt(limit);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(limit);
      }
    });

    it("returns values within bounds for 32-bit limits", () => {
      const limit = 1000000000;
      for (let i = 0; i < 50; i++) {
        const val = secureGetRandomInt(limit);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(limit);
      }
    });

    it("returns values within bounds for 53-bit limits (MAX_SAFE_INTEGER)", () => {
      const limit = Number.MAX_SAFE_INTEGER;
      for (let i = 0; i < 50; i++) {
        const val = secureGetRandomInt(limit);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(limit);
      }
    });

    it("falls back to Math.random() if crypto is unavailable", () => {
      // Mock global crypto to be undefined
      Object.defineProperty(globalThis, "crypto", { value: undefined, writable: true });

      const mathRandomSpy = vi.spyOn(Math, "random").mockReturnValue(0.5);

      const val = secureGetRandomInt(10);

      expect(mathRandomSpy).toHaveBeenCalled();
      expect(val).toBe(5); // Math.floor(0.5 * 10)
    });
  });
});
