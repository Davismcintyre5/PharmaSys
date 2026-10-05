import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT       = path.resolve(__dirname, '..');
const INPUT_SVG  = path.join(ROOT, 'public', 'brand', 'logo.svg');
const OUTPUT_DIR = path.join(ROOT, 'assets');

const PNG_SIZES = [16, 32, 48, 64, 128, 256, 512, 1024];
const ICO_SIZES = [16, 32, 48, 64, 128, 256];

async function generateIcons() {
  try {
    console.log('Generating icons from public/brand/logo.svg...');

    if (!fs.existsSync(INPUT_SVG)) {
      throw new Error(`Source SVG not found: ${INPUT_SVG}`);
    }

    fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    // --- PNG sizes (icon-16.png ... icon-1024.png) ---
    for (const size of PNG_SIZES) {
      const out = path.join(OUTPUT_DIR, `icon-${size}.png`);
      await sharp(INPUT_SVG, { density: 384 })
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile(out);
      console.log(`  -> icon-${size}.png`);
    }

    // --- Main icon.png (256x256, used by tray / Linux / macOS) ---
    await sharp(INPUT_SVG, { density: 384 })
      .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(OUTPUT_DIR, 'icon.png'));
    console.log('  -> icon.png');

    // --- Windows .ico (multi-res PNG-in-ICO) ---
    const icoBuffers = await Promise.all(
      ICO_SIZES.map((size) =>
        sharp(INPUT_SVG, { density: 384 })
          .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer()
      )
    );

    const icoBuffer = await pngToIco(icoBuffers);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'icon.ico'), icoBuffer);
    console.log('  -> icon.ico');

    console.log(`\nDone. Output directory: ${OUTPUT_DIR}`);
  } catch (err) {
    console.error('Icon generation failed:', err.message);
    process.exit(1);
  }
}

generateIcons();