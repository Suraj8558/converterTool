# Features

Converter Tool has 20 tools. They all run in the visitor's browser, so files are never uploaded.

**How every tool behaves:**

- **Choosing files:** click or drag and drop, or press Enter or Space on the upload area.
- **Wrong file types:** skipped, with a message listing the types the tool accepts.
- **Failures:** the tool shows an error that says what went wrong, and doesn't produce a file.
- **Size limits:** there's no fixed limit unless a tool lists one. The practical limit is the memory of the visitor's device.

## Image tools

Tools using the [standard converter](#standard-converter) accept several files at once.

| Tool | Address | Accepts | Produces |
|---|---|---|---|
| [JPG to PNG](#jpg-to-png) | `/jpg-to-png` | `.jpg`, `.jpeg` | `.png` |
| [PNG to JPG](#png-to-jpg) | `/png-to-jpg` | `.png` | `.jpg` |
| [WebP to JPG](#webp-to-jpg) | `/webp-to-jpg` | `.webp` | `.jpg` |
| [HEIC to JPG](#heic-to-jpg) | `/heic-to-jpg` | `.heic`, `.heif` | `.jpg` |
| [SVG to PNG](#svg-to-png) | `/svg-to-png` | `.svg` | `.png` |
| [PNG to SVG](#png-to-svg) | `/png-to-svg` | `.png` | `.svg` |
| [JPG to AVIF](#jpg-to-avif-and-png-to-avif) | `/jpg-to-avif` | `.jpg`, `.jpeg` | `.avif` |
| [PNG to AVIF](#jpg-to-avif-and-png-to-avif) | `/png-to-avif` | `.png` | `.avif` |
| [Image Resizer](#image-resizer) | `/image-resizer` | `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.bmp`, `.avif` | Same format where possible |
| [Image Compressor](#image-compressor) | `/image-compressor` | `.jpg`, `.jpeg`, `.png`, `.webp` | `.jpg` |

### JPG to PNG

Converts using the browser's canvas. PNG is lossless, so files usually get larger.

### PNG to JPG

Saves at 90% quality. JPG has no transparency, so transparent areas become white.

### WebP to JPG

Saves at 90% quality. Transparent areas become white, and an animated WebP may keep only its first frame.

### HEIC to JPG

Converts iPhone photos at 90% quality, using `heic2any`. A file holding several images, such as a burst, gives only the first.

**Known issue:** in testing, colours shifted slightly (red 225 became 240). Check the results against real iPhone photos.

### SVG to PNG

Draws the SVG at its own width and height.

- There's no scale setting, so a 24×24 icon gives a 24×24 PNG.
- An SVG with no width or height gets a size chosen by the browser.
- Transparency is kept.

### PNG to SVG

Traces the image into vector shapes, using `imagetracerjs` with up to 32 colours.

- Works best on logos, icons and flat artwork. Photos give large, blotchy files.
- Images over 4 megapixels are refused with a message asking the visitor to resize first.

### JPG to AVIF and PNG to AVIF

Browsers generally can't create AVIF files, so these tools use a WebAssembly encoder (`@jsquash/avif`) at quality 60. It runs in a background worker so the page stays responsive.

- PNG transparency is kept.
- Encoding is single-threaded. A 2000×1500 image took about 7 seconds in testing.

### Image Resizer

Handles one image at a time.

- **Aspect ratio:** kept by default, and can be switched off.
- **Output format:** keeps the original format if the browser can write it. Otherwise it saves as PNG and names the file `.png`. Browsers can't write GIF, for example, so a GIF becomes a single-frame PNG.
- **Enlarging:** allowed, but doesn't add detail.

### Image Compressor

Handles one image at a time, with a quality slider from 10% to 100% (default 80%). The preview updates shortly after the slider stops.

- Output is always JPG, so PNG transparency becomes white.
- It can't guarantee a smaller file. The percentage saved appears only when the file gets smaller.

## PDF and document tools

| Tool | Address | Accepts | Produces |
|---|---|---|---|
| [PDF Merge](#pdf-merge) | `/pdf-merge` | 2 or more `.pdf` | `merged.pdf` |
| [PDF Split](#pdf-split) | `/pdf-split` | 1 `.pdf` | `.pdf` or `.zip` |
| [PDF Compress](#pdf-compress) | `/pdf-compress` | 1 `.pdf` | `.pdf` |
| [Images to PDF](#images-to-pdf) | `/images-to-pdf` | `.jpg`, `.jpeg`, `.png`, `.webp` | `images.pdf` |
| [Word to PDF](#word-to-pdf) | `/word-to-pdf` | `.docx` | `.pdf` |
| [PDF to Word](#pdf-to-word) | `/pdf-to-word` | `.pdf` | `.docx` |
| [EPUB to MOBI](#epub-to-mobi) | `/epub-to-mobi` | `.epub` | `.mobi` |

### PDF Merge

Combines PDFs using `pdf-lib`. Files can be reordered or removed before merging. Password-protected PDFs are refused.

### PDF Split

Offers two modes:

- **Page ranges:** creates one PDF from a list such as `1-3, 5`. Pages appear in the order typed, so `3, 1` puts page 3 first, and a page can be repeated.
- **Every page:** saves each page as its own PDF, in a `.zip`.

Password-protected PDFs are refused.

### PDF Compress

Offers two modes:

| Mode | What it does | Text | Typical result |
|---|---|---|---|
| **Smallest file** (default) | Redraws each page as a JPEG image at about 108 pixels per inch and 60% quality | Can no longer be selected or searched | Large savings on scans and photos; a text-only file may not shrink |
| **Keep text and quality** | Only tidies the file's internal structure | Unchanged | Small savings at best |

If the result isn't smaller, the tool says so and offers no download, because the original is already the better file.

### Images to PDF

Creates a PDF with one image per page, in an order the visitor can change.

- Each page is sized to its image, not to A4.
- Phone photos stay upright, because rotation data is applied.
- JPGs are re-saved at 92% quality. Other formats are stored as PNG, keeping transparency.

### Word to PDF

Reads the document with `mammoth`, then builds the PDF with `pdfmake`. The text can be selected in the result.

- **Kept:** headings, paragraphs, bold and italic, lists, tables and images.
- **Not kept:** the exact page layout, including headers, footers, fonts and spacing.
- **Languages:** Latin, Greek and Cyrillic only, because that's what the bundled font covers. Files with other scripts, such as Hindi or Japanese, get an error rather than a PDF with blank boxes.
- **Older `.doc` files:** not supported. The visitor is asked to use Save As in Word to create a `.docx` first.

The old `/doc-to-pdf` address redirects here.

### PDF to Word

Extracts text with `pdfjs-dist` and writes a `.docx` with `docx`.

- **Kept:** text, in paragraphs. Each PDF page starts a new page.
- **Headings:** text at least 20% larger than the document's most common size becomes a heading.
- **Not kept:** images, tables, columns, fonts and exact layout.
- **Scanned PDFs:** contain no text, so the tool shows an error. Multi-column pages may come out in the wrong reading order.
- **Password-protected PDFs:** refused.

### EPUB to MOBI

Reads the EPUB and writes a MOBI file directly, using code in this project.

- **Kept:** chapters in order, title, author, and images.
- **Not kept:** links inside the book, styling from separate stylesheets, and images that aren't JPG, PNG or GIF or are over 127 KB.
- **Protected EPUBs:** refused.
- **Testing:** the output has been read by a separate MOBI unpacking tool, but not yet on a real e-reader.

## Audio and video tools

| Tool | Address | Accepts | Produces |
|---|---|---|---|
| [MP3 to WAV](#mp3-to-wav) | `/mp3-to-wav` | `.mp3` | `.wav` |
| [GIF to MP4](#gif-to-mp4) | `/gif-to-mp4` | `.gif` | `.mp4` |
| [MP4 to AVI](#mp4-to-avi) | `/mp4-to-avi` | `.mp4` | `.avi` |

The video tools use FFmpeg compiled to WebAssembly. The first use downloads a 31 MB engine from this site, and browsers usually cache it after that. Large videos take a while and can run out of memory, because the whole file is held in memory.

### MP3 to WAV

Decodes with the browser's own audio support and writes 16-bit PCM at 44.1 kHz, regardless of the source rate. Files get roughly 10 times larger.

### GIF to MP4

Encodes H.264, which plays almost everywhere. H.264 needs even dimensions, so an odd width or height loses one pixel.

### MP4 to AVI

Encodes MPEG-4 video and MP3 audio.

## Standard converter

Most conversions share one interface:

- Several files can be chosen, and removed before converting.
- Files convert one at a time, with a progress bar. For most tools it moves when each file finishes.
- If any file fails, the whole batch stops and shows the error.
- Each file downloads separately, or all together as `converted_files.zip`.

## Site features

| Feature | How it works |
|---|---|
| **Header menus** | One dropdown per tool category on desktop, and a slide-out menu on phones |
| **Footer** | Links to every tool, plus the privacy, terms and contact pages |
| **Homepage search** | Filters tools by name and description as you type |
| **Dark mode** | Light, dark or system, remembered in the browser |
| **Contact form** | Opens the visitor's own email app with the message filled in. Nothing is sent until they press send there. Disabled unless `NEXT_PUBLIC_CONTACT_EMAIL` is set |
| **Privacy and terms pages** | `/privacy` and `/terms`. Have these reviewed before launch |
| **Search engine support** | Sitemap, `robots.txt`, and a title, description and canonical link for each page. Needs `NEXT_PUBLIC_SITE_URL` |
| **Link previews** | Sharing tags and a preview image (`public/og.png`) on every page |
| **Analytics** | Google Tag Manager loads on every page. There's no consent banner |

## Browser support

See [browser test results](testing.md#browser-results). Video tools and AVIF need WebAssembly, which all current browsers support.
