# Converter Tool — All-in-One File Converter & Productivity Toolkit

**Converter Tool** is a fast, open-source web application built with Next.js that provides a comprehensive suite of tools for file conversion, image manipulation, and PDF management. All processing happens in your browser, so your files stay private.

**📖 [Read the documentation](docs/README.md)**, including [what every tool does and its limits](docs/features.md).

**📱 [Android app](mobile/README.md)** — an Expo app that shows this site in a WebView, built with EAS.

---

## ✨ Features

### 🖼️ Image Tools
- Convert between formats: **JPG ↔ PNG**, **PNG → SVG**, **SVG → PNG**, **JPG/PNG → AVIF**, **WebP → JPG**, **HEIC → JPG**
- **Image Compressor** — reduce file sizes with adjustable quality
- **Image Resizer** — resize images to custom dimensions

### 📄 PDF Toolkit
- **Merge PDFs** — combine multiple PDF files into one
- **Split PDFs** — extract specific pages from a PDF
- **Compress PDFs** — shrink a PDF, optionally rebuilding its pages as images
- **Images to PDF** — combine JPG, PNG and WebP images into one PDF, with page size and margin options
- **Organize PDFs** — reorder, remove or add pages
- **Rotate and Crop PDFs** — turn pages, or keep just the area you need
- **Page Numbers and Watermarks** — stamp numbers, text or images on every page
- **PDF to JPG** — save each page as an image
- **PDF to Word** — extract PDF text into an editable .docx (no images, tables or scanned PDFs)
- **Word to PDF** — convert .docx documents to PDF (Latin, Greek and Cyrillic text)
- **EPUB → MOBI** — convert unprotected e-books for older e-readers

### 🎵 Audio & Video Converters
- **MP3 → WAV** — audio format conversion
- **MP4 → AVI** — video format conversion
- **GIF → MP4** — animated GIF to video

### 🌐 Other
- **Dark Mode** — full light/dark theme support
- **Searchable Tools** — quickly find the exact tool you need
- **Fully Responsive** — works seamlessly on desktop and mobile

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) & [ShadCN UI](https://ui.shadcn.com/) |
| **UI Components** | [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/) |
| **Forms** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **File Processing** | pdf-lib, PDF.js, FFmpeg (WebAssembly), and [others](docs/architecture.md#tech-stack) |
| **Testing** | [Vitest](https://vitest.dev/), [Playwright](https://playwright.dev/) |
| **Fonts** | Inter & Lexend (Google Fonts via `next/font`) |
| **Analytics** | Google Tag Manager |
| **Deployment** | [Firebase App Hosting](https://firebase.google.com/docs/app-hosting) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v22.12 or higher
- **npm** (or yarn / pnpm)

### Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/Suraj8558/converterTool.git
   cd converterTool
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Start the development server:**
   ```sh
   npm run dev
   ```

4. Open [http://localhost:9002](http://localhost:9002) in your browser.

### Environment Variables

Set these at build time for production, such as in `apphosting.yaml` (see [Deployment](docs/deployment.md)):

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | The site's public address, used in the sitemap and sharing tags (e.g. `https://example.com`) |
| `NEXT_PUBLIC_CONTACT_EMAIL` | The address the contact form opens an email to; the form is disabled without it |

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 9002 (with Turbopack) |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run browser tests (see [Testing](docs/testing.md)) |
| `npm run typecheck` | Run TypeScript type checking |

---

## 📁 Project Structure

```
docs/                     # Project documentation
e2e/                      # Browser tests and sample files
scripts/                  # Build scripts
src/
├── app/                  # One folder per page
├── components/           # Tool interfaces and shared components
│   ├── layout/           # Header, footer and tool menus
│   └── ui/               # ShadCN UI components
├── hooks/                # Custom React hooks
└── lib/
    ├── conversions/      # Conversion engines and unit tests
    └── tools.tsx         # The list of tools, which drives every menu
```

---

## 🔒 Privacy

All file conversions happen **directly in your browser**. No files are uploaded to any server, ensuring complete privacy and fast processing without network delays.

---

## 📄 License

No license has been chosen yet. See [Licensing](docs/deployment.md#licensing).
