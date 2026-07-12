import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { transform } from 'lightningcss';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const banner = '/*! ZenStyle v1.0.0 | MIT License */';

await fs.mkdir(dist, { recursive: true });
const cssSource = await fs.readFile(path.join(root, 'zenstyle.css'));
const cssResult = transform({ filename: 'zenstyle.css', code: cssSource, minify: true });
await fs.writeFile(path.join(dist, 'zenstyle.min.css'), `${banner}\n${cssResult.code.toString()}\n`);

await build({ entryPoints: [path.join(root, 'zenstyle.js')], outfile: path.join(dist, 'zenstyle.min.js'), bundle: false, minify: true, legalComments: 'none', banner: { js: banner } });

const [cssStats, jsStats] = await Promise.all([fs.stat(path.join(dist, 'zenstyle.min.css')), fs.stat(path.join(dist, 'zenstyle.min.js'))]);
console.log(`Build ZenStyle 1.0.0 terminé : CSS ${cssStats.size} octets, JS ${jsStats.size} octets.`);
