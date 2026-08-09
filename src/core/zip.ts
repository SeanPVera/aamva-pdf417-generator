// A minimal, dependency-free ZIP writer used to hand back a batch run's PNGs as
// a single download.
//
// Entries are stored uncompressed (method 0). That is the right trade here: PNG
// payloads are already DEFLATE-compressed internally, so a second pass buys
// almost nothing, and storing lets the whole writer stay at ~100 lines instead
// of pulling a compression library into a bundle that has a size budget.

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    c = CRC_TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/** Packs a Date into the DOS time/date pair ZIP headers use. */
function dosDateTime(date: Date): { time: number; date: number } {
  const time =
    (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  return { time: time & 0xffff, date: day & 0xffff };
}

class ByteWriter {
  private chunks: Uint8Array[] = [];
  length = 0;

  bytes(data: Uint8Array): void {
    this.chunks.push(data);
    this.length += data.length;
  }

  u16(value: number): void {
    this.bytes(new Uint8Array([value & 0xff, (value >>> 8) & 0xff]));
  }

  u32(value: number): void {
    this.bytes(
      new Uint8Array([
        value & 0xff,
        (value >>> 8) & 0xff,
        (value >>> 16) & 0xff,
        (value >>> 24) & 0xff
      ])
    );
  }

  concat(): Uint8Array {
    const out = new Uint8Array(this.length);
    let offset = 0;
    for (const chunk of this.chunks) {
      out.set(chunk, offset);
      offset += chunk.length;
    }
    return out;
  }
}

/** Builds a ZIP archive containing `entries`, stored without compression. */
export function createZip(entries: ZipEntry[], now: Date = new Date()): Uint8Array {
  const encoder = new TextEncoder();
  const { time, date } = dosDateTime(now);
  const body = new ByteWriter();
  const central = new ByteWriter();

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name);
    const checksum = crc32(entry.data);
    const offset = body.length;

    // Local file header.
    body.u32(0x04034b50);
    body.u16(20); // version needed
    body.u16(0); // flags
    body.u16(0); // method: stored
    body.u16(time);
    body.u16(date);
    body.u32(checksum);
    body.u32(entry.data.length);
    body.u32(entry.data.length);
    body.u16(nameBytes.length);
    body.u16(0); // extra length
    body.bytes(nameBytes);
    body.bytes(entry.data);

    // Central directory header.
    central.u32(0x02014b50);
    central.u16(20); // version made by
    central.u16(20); // version needed
    central.u16(0); // flags
    central.u16(0); // method: stored
    central.u16(time);
    central.u16(date);
    central.u32(checksum);
    central.u32(entry.data.length);
    central.u32(entry.data.length);
    central.u16(nameBytes.length);
    central.u16(0); // extra length
    central.u16(0); // comment length
    central.u16(0); // disk number start
    central.u16(0); // internal attributes
    central.u32(0); // external attributes
    central.u32(offset);
    central.bytes(nameBytes);
  }

  const out = new ByteWriter();
  out.bytes(body.concat());
  const centralBytes = central.concat();
  out.bytes(centralBytes);

  // End of central directory record.
  out.u32(0x06054b50);
  out.u16(0); // this disk
  out.u16(0); // disk with central directory
  out.u16(entries.length);
  out.u16(entries.length);
  out.u32(centralBytes.length);
  out.u32(body.length);
  out.u16(0); // comment length

  return out.concat();
}

/** Converts a `data:` URL's base64 payload into bytes. */
export function dataUrlToBytes(dataUrl: string): Uint8Array {
  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const binary = atob(base64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
