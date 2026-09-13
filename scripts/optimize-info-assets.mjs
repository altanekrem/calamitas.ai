import { readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const projectRoot = process.cwd();
const infoRoot = path.resolve(projectRoot, 'public', 'info');
const manifestPath = path.resolve(projectRoot, 'lib', 'information-center.json');

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(target) : [target];
  }));
  return nested.flat();
}

const originals = (await filesIn(infoRoot)).filter((file) => /\.(png|jpe?g)$/i.test(file));
let manifest = await readFile(manifestPath, 'utf8');
let beforeBytes = 0;
let afterBytes = 0;

for (const source of originals) {
  const resolved = path.resolve(source);
  if (!resolved.startsWith(`${infoRoot}${path.sep}`)) throw new Error(`Unsafe asset path: ${resolved}`);
  const destination = resolved.replace(/\.(png|jpe?g)$/i, '.webp');
  beforeBytes += (await stat(resolved)).size;
  await sharp(resolved).resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(destination);
  afterBytes += (await stat(destination)).size;
  const oldPublicPath = `/${path.relative(path.join(projectRoot, 'public'), resolved).split(path.sep).join('/')}`;
  const newPublicPath = oldPublicPath.replace(/\.(png|jpe?g)$/i, '.webp');
  manifest = manifest.replaceAll(oldPublicPath, newPublicPath);
  await rm(resolved);
}

await writeFile(manifestPath, manifest, 'utf8');
console.log(JSON.stringify({ files: originals.length, beforeMB: Math.round(beforeBytes / 10485.76) / 100, afterMB: Math.round(afterBytes / 10485.76) / 100 }));
