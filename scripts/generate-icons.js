import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

function createPNG(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // 8-bit depth
  ihdr.writeUInt8(6, 9); // RGBA color type
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = createChunk("IHDR", ihdr);

  // Raw image data with filter byte (0) before each scanline
  const scanlineLength = width * 4 + 1;
  const rawData = Buffer.alloc(height * scanlineLength);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      // Violet to Blue gradient
      const factor = (x + y) / (width + height);
      const pr = Math.round(155 * (1 - factor) + 99 * factor);
      const pg = Math.round(89 * (1 - factor) + 102 * factor);
      const pb = Math.round(240 * (1 - factor) + 241 * factor);

      // Play button shape in center
      const cx = width / 2;
      const cy = height / 2;
      const radius = width * 0.42;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

      if (dist < radius) {
        // Rounded play icon center
        const dx = (x - cx) / radius;
        const dy = (y - cy) / radius;
        // Check if inside play triangle: x from -0.3 to 0.4, y bounded by slopes
        if (dx >= -0.25 && dx <= 0.35 && Math.abs(dy) <= (0.35 - dx) * 0.9 + 0.05) {
          rawData[pxOffset] = 255;
          rawData[pxOffset + 1] = 255;
          rawData[pxOffset + 2] = 255;
          rawData[pxOffset + 3] = 255;
          continue;
        }
      }

      rawData[pxOffset] = pr;
      rawData[pxOffset + 1] = pg;
      rawData[pxOffset + 2] = pb;
      rawData[pxOffset + 3] = 255;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk("IDAT", compressed);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, "ascii");
  const crcData = Buffer.concat([typeBuf, data]);
  const crc = crc32(crcData);

  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Standard CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

const dir = path.resolve("extension", "icons");
fs.mkdirSync(dir, { recursive: true });

for (const size of [16, 32, 48, 128]) {
  const png = createPNG(size, size);
  fs.writeFileSync(path.join(dir, `icon-${size}.png`), png);
  console.log(`Generated icon-${size}.png (${size}x${size})`);
}
