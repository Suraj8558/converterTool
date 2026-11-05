// Puts the background-removal engine in public/ so the passport photo tool runs from
// this site. The engine is copied from node_modules; the 16 MB person-segmentation model
// is downloaded once from Google. Both are generated, not committed.
import { cpSync, existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, 'public', 'mediapipe');
const wasm = join(root, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');

mkdirSync(target, { recursive: true });
for (const file of [
  'vision_wasm_internal.js',
  'vision_wasm_internal.wasm',
  'vision_wasm_nosimd_internal.js',
  'vision_wasm_nosimd_internal.wasm',
]) {
  cpSync(join(wasm, file), join(target, file));
}

const MODEL = 'selfie_multiclass_256x256.tflite';
const MODEL_URL = `https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/${MODEL}`;
const modelPath = join(target, MODEL);

if (!existsSync(modelPath)) {
  try {
    const response = await fetch(MODEL_URL);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    // Write to a temporary name first so an interrupted download is never mistaken for the model.
    writeFileSync(`${modelPath}.part`, Buffer.from(await response.arrayBuffer()));
    renameSync(`${modelPath}.part`, modelPath);
  } catch (error) {
    // Not fatal: the page then loads the model from Google when it's first needed.
    console.warn(`Could not download ${MODEL} (${error.message}). The site will fetch it from Google instead.`);
  }
}
