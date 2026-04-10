# typingSnap Tools — All-in-One File Converter & Productivity Toolkit

**tools.typingSnap** is a fast, open-source web application built with Next.js that provides a comprehensive suite of tools for file conversion, image manipulation, and PDF management. Most processing happens entirely client-side, keeping your files private and secure.

---

## ✨ Features

### 🖼️ Image Tools
- Convert between formats: **JPG ↔ PNG**, **PNG → SVG**, **SVG → PNG**, **JPG/PNG → AVIF**, **WebP → JPG**
- **Image Compressor** — reduce file sizes without quality loss
- **Image Resizer** — resize images to custom dimensions

### 📄 PDF Toolkit
- **Merge PDFs** — combine multiple PDF files into one
- **Split PDFs** — extract specific pages from a PDF
- **PDF to Word** — convert PDF documents to editable format
- **Word to PDF** — convert Word documents to PDF

### 🎵 Audio & Video Converters
- **MP3 → WAV** — audio format conversion
- **MP4 → AVI** — video format conversion
- **GIF → MP4** — animated GIF to video

### 📚 Document Converters
- **DOC → PDF** — Word documents to PDF
- **EPUB → MOBI** — eBook format conversion

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
| **PDF Manipulation** | [pdf-lib](https://pdf-lib.js.org/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Fonts** | Inter & Lexend (Google Fonts via `next/font`) |
| **Analytics** | Google Tag Manager |
| **Deployment** | [Firebase App Hosting](https://firebase.google.com/docs/app-hosting) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
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

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 9002 (with Turbopack) |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |

---

## 📁 Project Structure

```
src/
├── app/                  # Next.js App Router pages & routes
│   ├── image-compressor/ # Image compression tool
│   ├── image-resizer/    # Image resize tool
│   ├── jpg-to-png/       # Format conversion pages
│   ├── pdf-merge/        # PDF merge tool
│   ├── pdf-split/        # PDF split tool
│   ├── word-to-pdf/      # Word → PDF converter
│   ├── mp3-to-wav/       # Audio converter
│   ├── mp4-to-avi/       # Video converter
│   └── ...               # Other converter routes
├── components/           # Reusable UI components
│   ├── layout/           # Header & Footer
│   └── ui/               # ShadCN UI components
├── hooks/                # Custom React hooks
└── lib/                  # Utility functions
```

---

## 🔒 Privacy

All file conversions happen **directly in your browser**. No files are uploaded to any server, ensuring complete privacy and fast processing without network delays.

---

## 📄 License

This project is open-source. See the repository for license details.

---

> Built with ❤️ by [typingSnap](https://typingsnap.com)
