import type JSZip from 'jszip';

const TEXT_RECORD_SIZE = 4096;
const NOT_SET = 0xffffffff;
const IMAGE_TYPES: Record<string, boolean> = { jpg: true, jpeg: true, png: true, gif: true };
const MAX_IMAGE_BYTES = 127 * 1024; // Larger image records are rejected by many readers.

export interface BookContent {
  title: string;
  author: string;
  html: string;
  images: Uint8Array[];
}

const encoder = new TextEncoder();

function resolvePath(baseFile: string, relative: string): string {
  const parts = baseFile.split('/').slice(0, -1);
  for (const part of decodeURIComponent(relative).split('/')) {
    if (part === '..') parts.pop();
    else if (part !== '.') parts.push(part);
  }
  return parts.join('/');
}

async function readZipText(zip: JSZip, path: string): Promise<string | undefined> {
  return zip.file(path)?.async('string');
}

async function readEpub(file: File): Promise<BookContent> {
  const { default: JSZipClass } = await import('jszip');
  let zip: JSZip;
  try {
    zip = await JSZipClass.loadAsync(await file.arrayBuffer());
  } catch {
    throw new Error(`"${file.name}" could not be read as an EPUB file.`);
  }

  const parser = new DOMParser();
  const containerXml = await readZipText(zip, 'META-INF/container.xml');
  const opfPath = containerXml
    && parser.parseFromString(containerXml, 'application/xml').querySelector('rootfile')?.getAttribute('full-path');
  const opfXml = opfPath && (await readZipText(zip, opfPath));
  if (!opfPath || !opfXml) throw new Error(`"${file.name}" is not a valid EPUB file.`);

  const opf = parser.parseFromString(opfXml, 'application/xml');
  if (opf.querySelector('encryption')) throw new Error(`"${file.name}" is protected and can't be converted.`);

  const metadataValue = (name: string) => opf.getElementsByTagNameNS('*', name)[0]?.textContent?.trim();
  const title = metadataValue('title') || file.name.replace(/\.[^.]+$/, '');
  const author = metadataValue('creator') || 'Unknown';

  const manifest = new Map<string, string>();
  opf.querySelectorAll('manifest > item').forEach((item) => {
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    if (id && href) manifest.set(id, resolvePath(opfPath, href));
  });

  const images: Uint8Array[] = [];
  const imageIndexes = new Map<string, number>();
  const chapters: string[] = [];

  for (const itemref of opf.querySelectorAll('spine > itemref')) {
    const chapterPath = manifest.get(itemref.getAttribute('idref') ?? '');
    const source = chapterPath && (await readZipText(zip, chapterPath));
    if (!chapterPath || !source) continue;

    const doc = parser.parseFromString(source, 'application/xhtml+xml');
    const body = doc.querySelector('body');
    if (!body || doc.querySelector('parsererror')) continue;

    body.querySelectorAll('script, style, svg, video, audio, iframe').forEach((node) => node.remove());
    // MOBI links use byte positions, so internal links can't be carried over.
    body.querySelectorAll('a').forEach((link) => link.removeAttribute('href'));

    for (const img of body.querySelectorAll('img')) {
      const src = img.getAttribute('src') ?? '';
      const imagePath = resolvePath(chapterPath, src);
      const extension = imagePath.split('.').pop()?.toLowerCase() ?? '';
      let index = imageIndexes.get(imagePath);

      if (index === undefined && IMAGE_TYPES[extension]) {
        const data = await zip.file(imagePath)?.async('uint8array');
        if (data && data.length <= MAX_IMAGE_BYTES) {
          images.push(data);
          index = images.length;
          imageIndexes.set(imagePath, index);
        }
      }

      if (index === undefined) {
        img.remove();
      } else {
        img.removeAttribute('src');
        img.setAttribute('recindex', String(index).padStart(5, '0'));
      }
    }

    chapters.push(body.innerHTML.replace(/\sxmlns(:\w+)?="[^"]*"/g, ''));
  }

  if (chapters.length === 0) throw new Error(`No readable chapters were found in "${file.name}".`);

  return {
    title,
    author,
    images,
    html: `<html><head><guide></guide></head><body>${chapters.join('<mbp:pagebreak/>')}</body></html>`,
  };
}

// Records are a fixed size, so a multi-byte character may straddle a boundary. As
// the format requires, the rest of it is repeated after the record and counted.
export function splitTextRecords(text: Uint8Array): Uint8Array[] {
  const records: Uint8Array[] = [];
  for (let start = 0; start < text.length; start += TEXT_RECORD_SIZE) {
    const end = Math.min(start + TEXT_RECORD_SIZE, text.length);
    let overlap = 0;
    while (end + overlap < text.length && (text[end + overlap] & 0xc0) === 0x80) overlap++;

    const record = new Uint8Array(end - start + overlap + 1);
    record.set(text.subarray(start, end + overlap));
    record[record.length - 1] = overlap;
    records.push(record);
  }
  return records;
}

function buildExth(title: string, author: string): Uint8Array {
  const entries: [number, Uint8Array][] = [
    [100, encoder.encode(author)],
    [503, encoder.encode(title)],
  ];
  const bodySize = entries.reduce((sum, [, data]) => sum + 8 + data.length, 0);
  const padding = (4 - ((12 + bodySize) % 4)) % 4;
  const exth = new Uint8Array(12 + bodySize + padding);
  const view = new DataView(exth.buffer);

  exth.set(encoder.encode('EXTH'));
  view.setUint32(4, 12 + bodySize);
  view.setUint32(8, entries.length);
  let offset = 12;
  for (const [type, data] of entries) {
    view.setUint32(offset, type);
    view.setUint32(offset + 4, 8 + data.length);
    exth.set(data, offset + 8);
    offset += 8 + data.length;
  }
  return exth;
}

function buildHeaderRecord(book: BookContent, textLength: number, textRecordCount: number): Uint8Array {
  const MOBI_HEADER_LENGTH = 232;
  const MOBI_START = 16; // Follows the 16-byte PalmDOC header.
  const name = encoder.encode(book.title);
  const exth = buildExth(book.title, book.author);
  const nameOffset = MOBI_START + MOBI_HEADER_LENGTH + exth.length;
  const record = new Uint8Array(nameOffset + name.length + 2 + 8192);
  const view = new DataView(record.buffer);

  // PalmDOC header
  view.setUint16(0, 1); // No compression
  view.setUint32(4, textLength);
  view.setUint16(8, textRecordCount);
  view.setUint16(10, TEXT_RECORD_SIZE);

  // MOBI header (offsets below are relative to its start)
  const set32 = (offset: number, value: number) => view.setUint32(MOBI_START + offset, value);
  const firstImageRecord = textRecordCount + 1;
  const firstNonBookRecord = textRecordCount + 1;

  record.set(encoder.encode('MOBI'), MOBI_START);
  set32(4, MOBI_HEADER_LENGTH);
  set32(8, 2); // Book
  set32(12, 65001); // UTF-8
  set32(16, Math.floor(Math.random() * 0xffffffff));
  set32(20, 6); // File version
  for (let offset = 24; offset < 64; offset += 4) set32(offset, NOT_SET);
  set32(64, firstNonBookRecord);
  set32(68, nameOffset);
  set32(72, name.length);
  set32(76, 9); // English
  set32(88, 6); // Minimum reader version
  set32(92, book.images.length > 0 ? firstImageRecord : NOT_SET);
  set32(112, 0x40); // Has EXTH
  set32(148, NOT_SET);
  set32(152, NOT_SET); // No DRM
  set32(156, NOT_SET);
  view.setUint16(MOBI_START + 176, 1); // First content record
  view.setUint16(MOBI_START + 178, textRecordCount + book.images.length);
  set32(180, 1);
  set32(184, NOT_SET);
  set32(192, NOT_SET);
  set32(208, NOT_SET);
  set32(220, NOT_SET);
  set32(224, 1); // Text records carry multi-byte overlap data
  set32(228, NOT_SET);

  record.set(exth, MOBI_START + MOBI_HEADER_LENGTH);
  record.set(name, nameOffset);
  return record;
}

function buildPalmDatabase(title: string, records: Uint8Array[]): Blob {
  const HEADER_SIZE = 78;
  const headerSize = HEADER_SIZE + records.length * 8 + 2;
  const header = new Uint8Array(headerSize);
  const view = new DataView(header.buffer);
  const now = Math.floor(Date.now() / 1000);

  const safeName = title.replace(/[^\x20-\x7e]/g, '_').slice(0, 31) || 'book';
  header.set(encoder.encode(safeName));
  view.setUint32(36, now);
  view.setUint32(40, now);
  header.set(encoder.encode('BOOKMOBI'), 60);
  view.setUint32(68, records.length * 2 - 1); // Unique ID seed
  view.setUint16(76, records.length);

  let offset = headerSize;
  records.forEach((record, index) => {
    const entry = HEADER_SIZE + index * 8;
    view.setUint32(entry, offset);
    view.setUint32(entry + 4, index * 2); // Attributes byte is zero, then 3-byte ID
    offset += record.length;
  });

  return new Blob([header, ...records] as BlobPart[], { type: 'application/x-mobipocket-ebook' });
}

export function buildMobi(book: BookContent): Blob {
  const text = encoder.encode(book.html);
  const textRecords = splitTextRecords(text);
  const endOfFile = new Uint8Array([0xe9, 0x8e, 0x0d, 0x0a]);

  return buildPalmDatabase(book.title, [
    buildHeaderRecord(book, text.length, textRecords.length),
    ...textRecords,
    ...book.images,
    endOfFile,
  ]);
}

export async function epubToMobi(file: File): Promise<Blob> {
  return buildMobi(await readEpub(file));
}
