# Testing

| Check | Command | What it covers |
|---|---|---|
| Lint | `npm run lint` | Code problems, using ESLint |
| Types | `npm run typecheck` | TypeScript errors, including in tests |
| Unit tests | `npm test` | Conversion logic and the tool list, without a browser |
| Browser tests | `npm run test:e2e` | Every tool and site feature, in real browsers |

Unit tests and browser tests need Node.js 22.12 or newer.

## Browser tests

The first time, install the browsers:

```bash
npx playwright install
```

Then run everything, or narrow it down:

```bash
npm run test:e2e
```

```bash
npx playwright test --project=chromium
```

```bash
npx playwright test -g "PDF Merge"
```

The tests build the site and start it on port 9130, with placeholder values for the site address and contact email. If a server is already running on that port, they reuse it, so stop any old one after changing code.

| File | Covers |
|---|---|
| `e2e/converters.spec.ts` | Standard converters, zip downloads, drag and drop, wrong file types, error messages |
| `e2e/tools.spec.ts` | PDF Merge, Split and Compress, Images to PDF, Image Compressor and Resizer |
| `e2e/pdf-edit.spec.ts` | Organize, Rotate, Crop, Page Numbers, Watermark, PDF to JPG and the Images to PDF page options, including sideways pages |
| `e2e/site.spec.ts` | Menus, search, keyboard access, dark mode, contact form, SEO tags, and that files aren't uploaded |

Tests download each result and check its contents, such as page counts, file signatures and image sizes, rather than only checking for a success message.

### Sample files

`e2e/fixtures/` holds small files generated for testing, with no real content. They total about 380 KB.

## Unit tests

Test files sit beside the code they cover, such as `src/lib/conversions/pdf-tools.test.ts`. Use them for logic that doesn't need a browser, such as parsing and file formats. Anything that needs canvas, audio decoding or workers belongs in a browser test.

## Continuous integration

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) runs lint, types, unit tests and browser tests on every pull request and every push to `main`. Browser test reports are saved as a build artifact for 14 days.

## Browser results

Results from Windows, using Playwright's browser builds:

| Browser | Result | Notes |
|---|---|---|
| **Chromium** | All pass | Also represents Chrome and Edge |
| **WebKit** | All pass except skips | Close to Safari, but not the same as Safari on a Mac or iPhone |
| **Firefox** | Not yet run | It won't start on the development PC because of a missing Windows component, so CI will be its first run |

Tests skipped on WebKit, and why:

| Test | Reason |
|---|---|
| MP3 to WAV | The Windows WebKit build has no Web Audio |
| Displaying AVIF results (the file itself is still checked) | WebKit test builds can't display AVIF |
| Contact form handoff | WebKit test builds treat `mailto:` as a web address |

## Not covered

- Real Safari on a Mac or iPhone
- Very large files
- Real-world documents (the sample files are simple)
- Opening a MOBI on a real e-reader
- The compressor's and resizer's image quality, beyond size and format
