import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: ['.next/**', 'public/ffmpeg/**', 'public/mediapipe/**', 'next-env.d.ts', 'test-results/**', 'playwright-report/**'],
  },
];

export default config;
