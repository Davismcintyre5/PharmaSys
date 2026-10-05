#!/usr/bin/env node
/**
 * Generate PWA assets from public/brand/logo.svg using sharp.
 *
 * Produces:
 *   public/brand/favicon-16.png
 *   public/brand/favicon-32.png
 *   public/brand/favicon-48.png
 *   public/brand/apple-touch-icon.png   (180×180)
 *   public/brand/pwa-192x192.png
 *   public/brand/pwa-512x512.png
 *   public/brand/pwa-maskable-512x512.png  (safe-zone padded)
 *   public/favicon.ico                     (multi-res 16/32/48)
 *
 * Run:
 *   node scripts/generate-pwa-assets.js
 *   npm run pwa:assets
 *
 * Assumes: public/brand/logo.svg exists
 */

import { mkdir, writeFile, access } from 'node:fs/promises';
import { constants as FS } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

/* ─────────── paths ─────────── */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const SOURCE = path.join(root, 'public', 'brand', 'logo.svg');
const OUT_DIR = path.join(root, 'public', 'brand');
const ICO_PATH = path.join(root, 'public', 'favicon.ico');

/* ─────────── helpers ─────────── */

const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(msg = '') { console.log(msg); }
function ok(msg) { log(`${c.green}✔${c.reset} ${msg}`); }
function skip(msg) { log(`${c.yellow}⚠${c.reset} ${msg}`); }
function fail(msg) { log(`${c.red}✖${c.reset} ${msg}`); }
function info(msg) { log(`${c.dim}${msg}${c.reset}`); }

async function exists(p) {
  try {
    await access(p, FS.F_OK);
    return true;
  } catch {
    return false;
  }
}

/* ─────────── dimensions ─────────── */

const SIZES = {
  favicon16: 16,
  favicon32: 32,
  favicon48: 48,
  appleTouch: 180,
  pwa192: 192,
  pwa512: 512,
  maskable: 512,
};

/**
 * Maskable icons need ~20% padding around the content so that
 * Android's adaptive mask (circle, squircle, rounded square) doesn't
 * clip the logo. We render the SVG at 60% of the canvas and center it.
 */
function maskableSafeZone(canvas) {
  const inner = Math.round(canvas * 0.6);
  const pad = Math.round((canvas - inner) / 2);
  return { inner, pad };
}

/* ─────────── renderers ─────────── */

/**
 * Read the SVG once, keep the buffer for all rasterizations.
 */
async function loadSource() {
  if (!(await exists(SOURCE))) {
    throw new Error(`Source SVG not found: ${path.relative(root, SOURCE)}`);
  }
  return sharp(SOURCE, { density: 384 }); // high density → crisp downscale
}

/**
 * Straight rasterization at a given size, transparent background.
 */
async function renderAt(source, size, outFile) {
  await source
    .clone()
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outFile);

  ok(`${path.relative(root, outFile)} ${c.dim}(${size}×${size})${c.reset}`);
}

/**
 * Maskable icon: full opaque background + logo scaled to ~60% centered.
 * Uses the SVG's first fill or falls back to brand primary.
 */
async function renderMaskable(source, canvas, outFile) {
  const { inner, pad } = maskableSafeZone(canvas);

  // Rasterize the logo at inner size on a transparent background
  const logoBuf = await source
    .clone()
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // Solid brand background — matches the logo's rect fill (#0F172A)
  const bg = { r: 15, g: 23, b: 42, alpha: 1 };

  await sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: logoBuf, top: pad, left: pad }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outFile);

  ok(`${path.relative(root, outFile)} ${c.dim}(${canvas}×${canvas}, maskable)${c.reset}`);
}

/**
 * Multi-resolution .ico containing 16, 32, and 48px PNG frames.
 *
 * We hand-roll the ICO container because sharp does not emit .ico files.
 * The ICO format tolerates PNG-encoded frames since Vista.
 */
async function renderIco(source, outFile) {
  const frames = [16, 32, 48];
  const pngBuffers = await Promise.all(
    frames.map((size) =>
      source
        .clone()
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer()
    )
  );

  const ico = buildIco(pngBuffers, frames);
  await writeFile(outFile, ico);

  ok(`${path.relative(root, outFile)} ${c.dim}(${frames.join('/')}px, ${ico.length} bytes)${c.reset}`);
}

/**
 * Build an ICO file buffer from a list of PNG buffers.
 *
 * ICO structure:
 *   6-byte header
 *   16 bytes per image entry
 *   then the image data blocks
 */
function buildIco(pngBuffers, sizes) {
  const count = pngBuffers.length;

  // ICONDIR (6 bytes)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 = icon
  header.writeUInt16LE(count, 4); // number of images

  // ICONDIRENTRY (16 bytes each)
  const entries = [];
  let offset = 6 + 16 * count;

  for (let i = 0; i < count; i++) {
    const size = sizes[i];
    const data = pngBuffers[i];

    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8); // size in bytes
    entry.writeUInt32LE(offset, 12); // offset in file

    entries.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

/* ─────────── main ─────────── */

async function main() {
  log();
  log(`${c.bold}${c.cyan}PWA asset generator${c.reset}`);
  log(`${c.dim}source: ${path.relative(root, SOURCE)}${c.reset}`);
  log();

  await mkdir(OUT_DIR, { recursive: true });

  let source;
  try {
    source = await loadSource();
  } catch (e) {
    fail(e.message);
    process.exit(1);
  }

  // Metadata sanity check
  const meta = await source.metadata();
  info(`detected: ${meta.format || 'svg'} · ${meta.width || '?'}×${meta.height || '?'}`);
  log();

  try {
    await renderAt(source, SIZES.favicon16, path.join(OUT_DIR, 'favicon-16.png'));
    await renderAt(source, SIZES.favicon32, path.join(OUT_DIR, 'favicon-32.png'));
    await renderAt(source, SIZES.favicon48, path.join(OUT_DIR, 'favicon-48.png'));
    await renderAt(source, SIZES.appleTouch, path.join(OUT_DIR, 'apple-touch-icon.png'));
    await renderAt(source, SIZES.pwa192, path.join(OUT_DIR, 'pwa-192x192.png'));
    await renderAt(source, SIZES.pwa512, path.join(OUT_DIR, 'pwa-512x512.png'));
    await renderMaskable(source, SIZES.maskable, path.join(OUT_DIR, 'pwa-maskable-512x512.png'));
    await renderIco(source, ICO_PATH);

    log();
    ok('Done. All PWA assets written.');
  } catch (e) {
    log();
    fail(e.message);
    if (e.stack) info(e.stack.split('\n').slice(1, 4).join('\n'));
    process.exit(1);
  }
}

main();