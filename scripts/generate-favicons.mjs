import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const ROOT = process.cwd();
const inputPath = path.join(ROOT, "public", "logo.png");
const outDir = path.join(ROOT, "public", "favicons");

const paddingRatio = 0.12;

const pngOutputs = [
  { name: "favicon-16x16.png", size: 16 },
  { name: "favicon-32x32.png", size: 32 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "android-chrome-512x512.png", size: 512 },
  { name: "mstile-150x150.png", size: 150 }
];

const icoSizes = [16, 32, 48];

const ensureDir = async (dir) => {
  await fs.mkdir(dir, { recursive: true });
};

const buildPaddedPng = async (size) => {
  const contentSize = Math.max(1, Math.round(size * (1 - paddingRatio * 2)));
  const logo = await sharp(inputPath)
    .resize({ width: contentSize, height: contentSize, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();

  const canvas = sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  });

  return canvas
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();
};

const main = async () => {
  await ensureDir(outDir);

  const metadata = await sharp(inputPath).metadata();
  const maxSource = Math.max(metadata.width ?? 0, metadata.height ?? 0);
  const maxOutput = Math.max(...pngOutputs.map((output) => output.size), ...icoSizes);

  if (maxSource && maxSource < maxOutput) {
    console.warn(
      `Warning: source logo is ${metadata.width}x${metadata.height}, smaller than ${maxOutput}px. Icons will not be upscaled.`
    );
  }

  for (const output of pngOutputs) {
    const buffer = await buildPaddedPng(output.size);
    await fs.writeFile(path.join(outDir, output.name), buffer);
  }

  const icoBuffers = await Promise.all(icoSizes.map(buildPaddedPng));
  const ico = await pngToIco(icoBuffers);
  await fs.writeFile(path.join(outDir, "favicon.ico"), ico);

  console.log(`Favicons generated in ${path.relative(ROOT, outDir)}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
