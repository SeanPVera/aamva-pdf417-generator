import { describe, it, expect } from "vitest";
import { createZip, crc32, dataUrlToBytes } from "../core/zip";

const te = new TextEncoder();

/** Reads a little-endian u32 at `offset`. */
function u32(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset]! | (bytes[offset + 1]! << 8) | (bytes[offset + 2]! << 16)) +
    bytes[offset + 3]! * 0x1000000
  );
}

function u16(bytes: Uint8Array, offset: number): number {
  return bytes[offset]! | (bytes[offset + 1]! << 8);
}

describe("crc32", () => {
  it("matches the known CRC-32 of a reference string", () => {
    // "The quick brown fox jumps over the lazy dog" → 0x414FA339
    expect(crc32(te.encode("The quick brown fox jumps over the lazy dog"))).toBe(0x414fa339);
  });

  it("returns 0 for empty input", () => {
    expect(crc32(new Uint8Array())).toBe(0);
  });

  it("is stable across calls", () => {
    const data = te.encode("aamva");
    expect(crc32(data)).toBe(crc32(data));
  });
});

describe("createZip", () => {
  it("starts with the local file header signature", () => {
    const zip = createZip([{ name: "a.txt", data: te.encode("hello") }]);
    expect(u32(zip, 0)).toBe(0x04034b50);
  });

  it("ends with the end-of-central-directory record", () => {
    const zip = createZip([{ name: "a.txt", data: te.encode("hello") }]);
    // EOCD is the last 22 bytes when there is no archive comment.
    const eocd = zip.length - 22;
    expect(u32(zip, eocd)).toBe(0x06054b50);
    expect(u16(zip, eocd + 8)).toBe(1); // entries on this disk
    expect(u16(zip, eocd + 10)).toBe(1); // total entries
  });

  it("records every entry in the central directory", () => {
    const zip = createZip([
      { name: "one.png", data: te.encode("1") },
      { name: "two.png", data: te.encode("22") },
      { name: "three.png", data: te.encode("333") }
    ]);
    const eocd = zip.length - 22;
    expect(u16(zip, eocd + 10)).toBe(3);
  });

  it("stores entries uncompressed with a correct CRC and size", () => {
    const payload = te.encode("payload bytes");
    const zip = createZip([{ name: "a.bin", data: payload }]);
    expect(u16(zip, 8)).toBe(0); // method 0 = stored
    expect(u32(zip, 14)).toBe(crc32(payload));
    expect(u32(zip, 18)).toBe(payload.length); // compressed size
    expect(u32(zip, 22)).toBe(payload.length); // uncompressed size
  });

  it("writes the filename verbatim after the header", () => {
    const zip = createZip([{ name: "barcode_0001_CA.png", data: te.encode("x") }]);
    const nameLength = u16(zip, 26);
    const name = new TextDecoder().decode(zip.subarray(30, 30 + nameLength));
    expect(name).toBe("barcode_0001_CA.png");
  });

  it("produces a valid empty archive", () => {
    const zip = createZip([]);
    expect(zip.length).toBe(22);
    expect(u32(zip, 0)).toBe(0x06054b50);
  });

  it("points the central directory at the right offset", () => {
    const zip = createZip([{ name: "a", data: te.encode("hi") }]);
    const eocd = zip.length - 22;
    const cdOffset = u32(zip, eocd + 16);
    expect(u32(zip, cdOffset)).toBe(0x02014b50);
  });
});

describe("dataUrlToBytes", () => {
  it("decodes the base64 payload of a data URL", () => {
    // "hi" base64-encoded is "aGk="
    expect(Array.from(dataUrlToBytes("data:image/png;base64,aGk="))).toEqual([104, 105]);
  });

  it("accepts a bare base64 string", () => {
    expect(Array.from(dataUrlToBytes("aGk="))).toEqual([104, 105]);
  });
});
