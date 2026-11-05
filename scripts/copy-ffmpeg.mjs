// Copies the FFmpeg engine into public/ so video tools run from this site, without
// a third-party CDN. The files total about 31 MB, so they are generated, not committed.
import { cpSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'public', 'ffmpeg');
const core = join(root, 'node_modules', '@ffmpeg', 'core', 'dist', 'esm');
const wrapper = join(root, 'node_modules', '@ffmpeg', 'ffmpeg', 'dist', 'esm');

mkdirSync(target, { recursive: true });
for (const file of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) {
  cpSync(join(core, file), join(target, file));
}
for (const file of readdirSync(wrapper).filter((name) => name.endsWith('.js'))) {
  cpSync(join(wrapper, file), join(target, file));
}
