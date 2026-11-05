# Architecture

Converter Tool is a Next.js App Router site. Every page is prerendered as static HTML, and all file processing happens in the browser, so there's no API or database.

## Project layout

```
src/
├── app/                 # One folder per page, plus the sitemap and robots.txt
├── components/
│   ├── converter.tsx    # The standard converter interface
│   ├── file-dropzone.tsx    # Shared upload area
│   ├── file-order-list.tsx  # Reorderable file list
│   ├── pdf-*.tsx, images-to-pdf.tsx, image-*.tsx  # Tools with their own interface
│   ├── layout/          # Header, footer, tool menus
│   └── ui/              # ShadCN components
├── lib/
│   ├── conversions/     # The conversion engines and their unit tests
│   ├── tools.tsx        # The list of tools, which drives every menu
│   └── site.ts          # Site address, name and page metadata helper
└── types/               # Types for libraries that ship without them
e2e/                     # Playwright browser tests and sample files
scripts/copy-ffmpeg.mjs  # Copies the video engine into public/
```

## Key decisions

### Everything runs in the browser

This is the core promise to users, and the privacy page depends on it. Don't add a tool that sends files to a server without also changing the [privacy page](../src/app/privacy/page.tsx), the [terms](../src/app/terms/page.tsx) and the homepage.

### Libraries load only when used

Conversion libraries are large, so [`runConversion`](../src/lib/conversions/index.ts) imports each engine when it's first needed. Other pages don't pay for them.

### One list of tools

[`tools.tsx`](../src/lib/tools.tsx) feeds the header, footer, homepage and sitemap, so a tool added there appears everywhere.

### FFmpeg isn't bundled

Turbopack can't bundle FFmpeg's dynamic worker URL. Instead:

1. `scripts/copy-ffmpeg.mjs` copies the engine to `public/ffmpeg/` before `dev` and `build`. Those files are about 31 MB, so they're generated rather than committed.
2. [`video.ts`](../src/lib/conversions/video.ts) imports it at runtime from this site, with no third-party CDN.

### The AVIF encoder is imported directly

[`avif.worker.ts`](../src/lib/conversions/avif.worker.ts) imports the single-threaded encoder rather than the package's main entry. The main entry also pulls in a multi-threaded build that refers to itself as a worker, which made `next build` hang with no error.

### PDF pages render with the `print` intent

[`pdf-compress.ts`](../src/lib/conversions/pdf-compress.ts) uses `intent: 'print'` so that rendering doesn't depend on `requestAnimationFrame`, which pauses in background tabs. Without it, compression stalled in a hidden tab.

### Check what the browser really produced

`canvas.toBlob` silently falls back to PNG for formats a browser can't write. [`converter.tsx`](../src/components/converter.tsx) rejects the result if its type is wrong, and the resizer names the file after the format it really got.

## Adding a tool

### A simple file conversion

1. Create `src/lib/conversions/your-tool.ts`, exporting an async function that takes a `File` and returns a `Blob`. Throw an `Error` with a helpful message when something goes wrong, because visitors see that message.
2. Add it to the `ConversionEngine` type and the switch in [`index.ts`](../src/lib/conversions/index.ts).
3. Create `src/app/your-tool/page.tsx`:

   ```tsx
   import { Converter } from '@/components/converter';
   import type { Metadata } from 'next';
   import { pageMetadata } from '@/lib/site';

   export const metadata: Metadata = pageMetadata(
     'Your Tool - Converter Tool',
     'What the tool does, for search results.',
     '/your-tool'
   );

   export default function YourToolPage() {
     return (
       <Converter
         title="Your Tool"
         description="What the tool does, for visitors."
         fromType="abc"
         toType="xyz"
         engine="your-tool"
       />
     );
   }
   ```

4. Add it to [`tools.tsx`](../src/lib/tools.tsx).
5. Add tests (see [Testing](testing.md)), and describe it in [Features](features.md).

### A tool with its own interface

Build a client component in `src/components/`, reusing `FileDropzone`. See [`pdf-split.tsx`](../src/components/pdf-split.tsx) for an example. Its page then renders that component instead of `Converter`, and steps 4 and 5 are the same.

## Tech stack

| Purpose | Library |
|---|---|
| Framework | Next.js 16 with Turbopack, React 18 |
| Styling | Tailwind CSS, ShadCN UI, Radix UI, Lucide icons |
| Contact form | React Hook Form, Zod |
| PDF editing | `pdf-lib` |
| Reading PDF text and rendering pages | `pdfjs-dist` |
| Word to PDF | `mammoth`, `pdfmake`, `html-to-pdfmake` |
| PDF to Word | `docx` |
| AVIF | `@jsquash/avif` |
| HEIC | `heic2any` |
| PNG to SVG | `imagetracerjs` |
| Video | `@ffmpeg/ffmpeg`, `@ffmpeg/core` |
| Zip files | `jszip` |
| Tests | Vitest, Playwright |
