// Generates valid PNG icons for PWA compliance using pure Node.js (zlib)
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
}

const crcTable = createCRC32Table();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function writePNG(width, height, getPixel) {
  // raw scanlines: each line starts with filter byte 0
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowBytes);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crcBuf = Buffer.alloc(4 + len);
    buf.copy(crcBuf, 0, 4, 8 + len);
    buf.writeUInt32BE(crc32(crcBuf), 8 + len);
    return buf;
  }

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function renderPixel(x, y, width, height, isMaskable = false) {
  const cx = width / 2;
  const cy = height / 2;
  const radius = width / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Soft warm pastel cream background: #FBF8F3 -> RGB(251, 248, 243)
  // Corner rounded radius
  const cornerR = isMaskable ? 0 : width * 0.22;
  const inRoundedBox = isMaskable || (
    Math.abs(dx) <= cx - cornerR || Math.abs(dy) <= cy - cornerR ||
    Math.hypot(Math.abs(dx) - (cx - cornerR), Math.abs(dy) - (cy - cornerR)) <= cornerR
  );

  if (!inRoundedBox) {
    return [0, 0, 0, 0];
  }

  // Warm background gradient
  const t = (y / height);
  const bgR = Math.round(251 - t * 10);
  const bgG = Math.round(248 - t * 12);
  const bgB = Math.round(243 - t * 16);

  // Glowing center warm aura
  const auraDist = Math.hypot(x - cx, y - (cy - height * 0.05));
  if (auraDist < width * 0.35) {
    const auraFactor = (1 - auraDist / (width * 0.35)) * 0.3;
    const rA = Math.round(bgR * (1 - auraFactor) + 252 * auraFactor);
    const gA = Math.round(bgG * (1 - auraFactor) + 225 * auraFactor);
    const bA = Math.round(bgB * (1 - auraFactor) + 195 * auraFactor);

    // Nest twig curved band: center bottom
    // dy from nest baseline
    const nestBaseline = cy + height * 0.12;
    const nestXDist = Math.abs(dx) / (width * 0.32);
    const expectedNestY = nestBaseline + (nestXDist * nestXDist) * (height * 0.15);

    if (Math.abs(y - expectedNestY) < height * 0.07 && Math.abs(dx) < width * 0.32) {
      // Warm terracotta nest color
      return [184, 105, 72, 255];
    }

    // Memory egg in center
    const eggX = (x - cx) / (width * 0.14);
    const eggY = (y - (cy - height * 0.02)) / (height * 0.18);
    if (eggX * eggX + eggY * eggY <= 1.0) {
      // Inside memory egg (warm soft eggshell & terracotta heart)
      const heartX = Math.abs(x - cx) / (width * 0.04);
      const heartY = (y - cy) / (height * 0.04);
      if (heartX <= 1 && heartY >= -0.8 && heartY <= 0.8) {
        return [217, 119, 87, 255]; // Terracotta warm heart
      }
      return [255, 253, 249, 255]; // Crisp eggshell
    }

    // Little sprout above
    if (y < cy - height * 0.18 && y > cy - height * 0.28 && Math.abs(dx) < width * 0.08) {
      return [117, 154, 114, 255]; // Sage green sprout
    }

    return [rA, gA, bA, 255];
  }

  // Nest twigs outside aura
  const nestBaseline = cy + height * 0.12;
  const nestXDist = Math.abs(dx) / (width * 0.35);
  const expectedNestY = nestBaseline + (nestXDist * nestXDist) * (height * 0.15);
  if (Math.abs(y - expectedNestY) < height * 0.06 && Math.abs(dx) < width * 0.35) {
    return [156, 82, 55, 255];
  }

  return [bgR, bgG, bgB, 255];
}

const outDir = path.resolve('./public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log('Generating PWA icons...');
const png192 = writePNG(192, 192, (x, y, w, h) => renderPixel(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), png192);

const png512 = writePNG(512, 512, (x, y, w, h) => renderPixel(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), png512);

const pngMaskable = writePNG(512, 512, (x, y, w, h) => renderPixel(x, y, w, h, true));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), pngMaskable);

const appleTouch = writePNG(180, 180, (x, y, w, h) => renderPixel(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), appleTouch);

// Also generate a small favicon
const favicon32 = writePNG(32, 32, (x, y, w, h) => renderPixel(x, y, w, h, false));
fs.writeFileSync(path.join(outDir, 'favicon.ico'), favicon32);

console.log('Icons generated successfully!');
