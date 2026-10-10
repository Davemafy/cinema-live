import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const files = [];
async function add(path) { files.push({ file: path, data: (await readFile(path)).toString('base64'), encoding: 'base64' }); }
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path); else await add(path);
  }
}
for (const path of ['package.json', 'package-lock.json', 'next.config.ts', 'next-env.d.ts', 'tsconfig.json', 'vercel.json']) await add(path);
await walk('src'); await walk('public');
// Only an explicit runtime allowlist is packaged. Secrets, docs, browser traces,
// artifacts and Git metadata are never included.
const json = JSON.stringify(files);
await writeFile('/tmp/cinema-deployment-files.json', json);
console.log(JSON.stringify({ fileCount: files.length, bytes: Buffer.byteLength(json), chunkSize: 32_000, chunks: Math.ceil(Buffer.byteLength(json) / 32_000) }));
