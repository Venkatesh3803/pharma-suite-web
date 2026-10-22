// Generates the PWA icon set without any external image dependency.
// Run with: node scripts/generate-icons.mjs
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

/* ── Minimal PNG encoder (RGB + alpha, 8-bit) ─────────────────────────── */

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ── Drawing helpers ──────────────────────────────────────────────────── */

const TEAL = [14, 59, 54];
const CREAM = [247, 244, 236];

function insideRoundedRect(x, y, hx, hy, r) {
  const qx = Math.abs(x) - (hx - r);
  const qy = Math.abs(y) - (hy - r);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r <= 0;
}

// Cross built from two rounded bars.
function insideCross(x, y, scale) {
  const arm = 0.34 * scale; // half length of each arm
  const half = 0.095 * scale; // half thickness
  const r = 0.045 * scale;
  return (
    insideRoundedRect(x, y, half, arm, r) || insideRoundedRect(x, y, arm, half, r)
  );
}

function renderIcon(size, { maskable = false, fullBleed = false } = {}) {
  const SS = 4; // supersampling
  const px = Buffer.alloc(size * size * 4);
  const scale = maskable ? 0.76 : 1;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bgHits = 0;
      let fgHits = 0;

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const ux = (x + (sx + 0.5) / SS) / size - 0.5;
          const uy = (y + (sy + 0.5) / SS) / size - 0.5;

          if (fullBleed || insideRoundedRect(ux, uy, 0.5, 0.5, 0.225)) bgHits++;
          if (insideCross(ux, uy, scale)) fgHits++;
        }
      }

      const samples = SS * SS;
      const i = (y * size + x) * 4;
      const bgA = bgHits / samples;
      const fgA = fgHits / samples;

      // Composite cream cross over teal background.
      for (let c = 0; c < 3; c++) {
        px[i + c] = Math.round(TEAL[c] * (1 - fgA) + CREAM[c] * fgA);
      }
      px[i + 3] = Math.round(255 * Math.max(bgA, fgA));
    }
  }

  return encodePng(size, px);
}

/* ── Emit files ───────────────────────────────────────────────────────── */

const iconsDir = join(root, "public", "icons");
mkdirSync(iconsDir, { recursive: true });

const outputs = [
  [join(iconsDir, "icon-192.png"), renderIcon(192)],
  [join(iconsDir, "icon-512.png"), renderIcon(512)],
  [join(iconsDir, "icon-maskable-512.png"), renderIcon(512, { maskable: true, fullBleed: true })],
  [join(root, "app", "apple-icon.png"), renderIcon(180, { fullBleed: true })],
];

for (const [file, buffer] of outputs) {
  writeFileSync(file, buffer);
  console.log(`wrote ${file} (${buffer.length} bytes)`);
}
