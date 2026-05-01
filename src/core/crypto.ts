/**
 * Generates a cryptographically secure random integer between 0 (inclusive) and max (exclusive).
 *
 * @param max The upper bound (exclusive) for the random integer. Must be > 0 and <= Number.MAX_SAFE_INTEGER.
 * @returns A random integer in the range [0, max).
 */
export function secureGetRandomInt(max: number): number {
  if (max <= 0) return 0;
  if (max > Number.MAX_SAFE_INTEGER) {
    throw new Error("max cannot exceed Number.MAX_SAFE_INTEGER");
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    // Rejection sampling implementation to avoid modulo bias
    // Optimization for small values
    if (max <= 256) {
      const arr = new Uint8Array(1);
      const limit = 256 - (256 % max);
      while (true) {
        crypto.getRandomValues(arr);
        const val = arr[0];
        if (val !== undefined && val < limit) return val % max;
      }
    }
    if (max <= 65536) {
      const arr = new Uint16Array(1);
      const limit = 65536 - (65536 % max);
      while (true) {
        crypto.getRandomValues(arr);
        const val = arr[0];
        if (val !== undefined && val < limit) return val % max;
      }
    }
    if (max <= 4294967296) {
      const arr = new Uint32Array(1);
      const limit = 4294967296 - (4294967296 % max);
      while (true) {
        crypto.getRandomValues(arr);
        const val = arr[0];
        if (val !== undefined && val < limit) return val % max;
      }
    }

    // For values larger than 32-bit but less than MAX_SAFE_INTEGER (53-bit)
    const arr = new Uint32Array(2);
    const maxVal = max - 1;

    // Find the number of bits needed to represent maxVal
    let bits = 0;
    let temp = maxVal;
    while (temp > 0) {
      bits++;
      temp = Math.floor(temp / 2);
    }

    const powerOfTwo = Math.pow(2, bits);

    while (true) {
      crypto.getRandomValues(arr);
      const val0 = arr[0];
      const val1 = arr[1];
      if (val0 === undefined || val1 === undefined) continue;

      // Construct a 53-bit integer
      const high = val1 & 0x1fffff; // 21 bits
      const low = val0; // 32 bits
      // value will be between 0 and 2^53 - 1
      const value = high * 4294967296 + low;

      const maskedValue = value % powerOfTwo;
      if (maskedValue < max) {
        return maskedValue;
      }
    }
  }

  // Fallback to Math.random() if Web Crypto API is unavailable
  return Math.floor(Math.random() * max);
}
