#!/usr/bin/env node
/**
 * Generate Expo assets from mobile/assets/logo.svg using sharp.
 *
 * Produces (all under mobile/assets/):
 *   icon.png                  1024x1024  iOS App Store icon
 *   adaptive-icon.png         1024x1024  Android foreground (safe-zone padded)
 *   adaptive-icon-bg.png      1024x1024  Android background (solid brand)
 *   splash-icon.png           1024x1024  Splash logo (transparent)
 *   favicon.png                196x196   Web favicon
 *   notification-icon.png       96x96    Android notification (white on transparent)
 *
 * Run:
 *   node scripts/generate-assets.js
 *   npm run generate-assets
 */

const { mkdir, access, writeFile } = require('node:fs/promises');
const { constants: FS } = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

/* ─────────── paths ─────────── */

const ROOT = path.resolve(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const SOURCE = path.join(ASSETS, 'logo.svg');

/* Brand colors — match app.json splash backgroundColor */
const BRAND_BG = { r: 15, g: 23, b: 42, alpha: 1 }; // #0F172A (from your logo)
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

/* ─────────── console helpers ─────────── */

const c = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};
const ok   = (m) => console.log(`${c.green}✓${c.reset} ${m}`);
const fail = (m) => console.log(`${c.red}✗${c.reset} ${m}`);
const info = (m) => console.log(`${c.dim}${m}${c.reset}`);

async function exists(p) {
  try { await access(p, FS.F_OK); return true; } catch { return false; }
}

/* ─────────── renderers ─────────── */

/**
 * Straight rasterization at a given size, transparent background.
 */
async function renderTransparent(source, size, outFile) {
  await source
    .clone()
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outFile);

  ok(`${path.basename(outFile)} ${c.dim}(${size}×${size}, transparent)${c.reset}`);
}

/**
 * Full-bleed square icon on a solid background.
 * Used for iOS icon + favicon where Apple/Chrome want an opaque square.
 */
async function renderSolid(source, size, bg, outFile) {
  const inner = Math.round(size * 0.78);
  const pad = Math.round((size - inner) / 2);

  const logoBuf = await source
    .clone()
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background: bg },
  })
    .composite([{ input: logoBuf, top: pad, left: pad }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outFile);

  ok(`${path.basename(outFile)} ${c.dim}(${size}×${size}, solid bg)${c.reset}`);
}

/**
 * Android adaptive icon foreground: logo scaled to ~60% of canvas,
 * centered on transparent. Android composites this over the bg layer
 * and applies a mask — so the logo must live inside the safe zone.
 */
async function renderAdaptiveForeground(source, canvas, outFile) {
  const inner = Math.round(canvas * 0.6);
  const pad = Math.round((canvas - inner) / 2);

  const logoBuf = await source
    .clone()
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: canvas,
      height: canvas,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: logoBuf, top: pad, left: pad }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outFile);

  ok(`${path.basename(outFile)} ${c.dim}(${canvas}×${canvas}, adaptive fg)${c.reset}`);
}

/**
 * Solid background PNG for Android adaptive icon.
 */
async function renderAdaptiveBackground(canvas, bg, outFile) {
  await sharp({
    create: { width: canvas, height: canvas, channels: 4, background: bg },
  })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outFile);

  ok(`${path.basename(outFile)} ${c.dim}(${canvas}×${canvas}, adaptive bg)${c.reset}`);
}

/**
 * Android notification icon: white silhouette on transparent.
 * We render the logo, then composite a white mask on top so any
 * color in the source SVG becomes white — required by Android.
 */
async function renderNotificationIcon(source, size, outFile) {
  // Render logo to a transparent buffer
  const logoBuf = await source
    .clone()
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha()
    .png()
    .toBuffer();

  // Composite white over the alpha channel
  const { data, info: meta } = await sharp(logoBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(data.length);
  for (let i = 0; i < data.length; i += 4) {
    out[i]     = WHITE.r;   // R
    out[i + 1] = WHITE.g;   // G
    out[i + 2] = WHITE.b;   // B
    out[i + 3] = data[i + 3]; // keep source alpha as the mask
  }

  await sharp(out, { raw: { width: meta.width, height: meta.height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toFile(outFile);

  ok(`${path.basename(outFile)} ${c.dim}(${size}×${size}, white silhouette)${c.reset}`);
}

/* ─────────── main ─────────── */

async function main() {
  console.log();
  console.log(`${c.bold}${c.cyan}Expo asset generator${c.reset}`);
  console.log(`${c.dim}source: ${path.relative(ROOT, SOURCE)}${c.reset}`);
  console.log();

  await mkdir(ASSETS, { recursive: true });

  if (!(await exists(SOURCE))) {
    fail(`Source SVG not found: ${path.relative(ROOT, SOURCE)}`);
    console.log();
    info('Place your PharmaSys logo at mobile/assets/logo.svg and re-run.');
    info('You can copy it from client/public/brand/logo.svg:');
    console.log();
    info('  copy ..\\client\\public\\brand\\logo.svg assets\\logo.svg');
    process.exit(1);
  }

  const source = sharp(SOURCE, { density: 384 }); // high density for crisp downscale
  const meta = await source.metadata();
  info(`detected: ${meta.format || 'svg'} · ${meta.width || '?'}×${meta.height || '?'}`);
  console.log();

  try {
    // iOS icon — opaque square on brand background
    await renderSolid(source, 1024, BRAND_BG, path.join(ASSETS, 'icon.png'));

    // Android adaptive icon — foreground (transparent, safe-zone) + bg (solid)
    await renderAdaptiveForeground(source, 1024, path.join(ASSETS, 'adaptive-icon.png'));
    await renderAdaptiveBackground(1024, BRAND_BG, path.join(ASSETS, 'adaptive-icon-bg.png'));

    // Splash — transparent logo, Expo paints the background color
    await renderTransparent(source, 1024, path.join(ASSETS, 'splash-icon.png'));

    // Web favicon
    await renderSolid(source, 196, BRAND_BG, path.join(ASSETS, 'favicon.png'));

    // Android notification icon — white silhouette
    await renderNotificationIcon(source, 96, path.join(ASSETS, 'notification-icon.png'));

    console.log();
    ok('Done. All Expo assets written.');
    console.log();
    info('Next: add these lines to mobile/app.json under "expo":');
    console.log(`
  "icon": "./assets/icon.png",
  "splash": {
    "image": "./assets/splash-icon.png",
    "resizeMode": "contain",
    "backgroundColor": "#0F172A"
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#0F172A"
    }
  },
  "web": {
    "favicon": "./assets/favicon.png"
  }
`);
  } catch (e) {
    console.log();
    fail(e.message);
    if (e.stack) info(e.stack.split('\n').slice(1, 4).join('\n'));
    process.exit(1);
  }
}

main();