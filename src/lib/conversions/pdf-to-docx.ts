import type { ProgressCallback } from './index';
import { openWithPdfjs } from './pdfjs';

interface TextLine {
  text: string;
  y: number;
  fontSize: number;
}

export interface PositionedText {
  str: string;
  x: number;
  y: number;
  width: number;
  fontSize: number;
}

export function groupIntoLines(items: PositionedText[]): TextLine[] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: { y: number; fontSize: number; items: PositionedText[] }[] = [];

  for (const item of sorted) {
    const current = lines.at(-1);
    if (current && Math.abs(current.y - item.y) < Math.max(current.fontSize, item.fontSize) * 0.5) {
      current.items.push(item);
      current.fontSize = Math.max(current.fontSize, item.fontSize);
    } else {
      lines.push({ y: item.y, fontSize: item.fontSize, items: [item] });
    }
  }

  return lines.map((line) => {
    const parts = [...line.items].sort((a, b) => a.x - b.x);
    let text = '';
    let end = parts[0].x;
    for (const part of parts) {
      const hasGap = part.x - end > part.fontSize * 0.15;
      if (hasGap && text && !text.endsWith(' ') && !part.str.startsWith(' ')) text += ' ';
      text += part.str;
      end = part.x + part.width;
    }
    return { text: text.trim(), y: line.y, fontSize: line.fontSize };
  }).filter((line) => line.text);
}

export function mostCommonFontSize(lines: TextLine[]): number {
  const counts = new Map<number, number>();
  for (const line of lines) {
    const size = Math.round(line.fontSize);
    counts.set(size, (counts.get(size) ?? 0) + line.text.length);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 12;
}

export async function pdfToDocx(file: File, onProgress: ProgressCallback): Promise<Blob> {
  const pdf = await openWithPdfjs(file);

  const pages: TextLine[][] = [];
  for (let number = 1; number <= pdf.numPages; number++) {
    const page = await pdf.getPage(number);
    const { items } = await page.getTextContent();
    const positioned: PositionedText[] = [];
    for (const item of items) {
      if (!('str' in item) || !item.str.trim()) continue;
      positioned.push({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        fontSize: Math.hypot(item.transform[2], item.transform[3]) || item.height,
      });
    }
    pages.push(groupIntoLines(positioned));
    page.cleanup();
    onProgress(number / pdf.numPages);
  }
  await pdf.loadingTask.destroy();

  const allLines = pages.flat();
  if (allLines.length === 0) {
    throw new Error(
      `No text was found in "${file.name}". It may be a scanned document, which this tool can't read yet.`
    );
  }

  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import('docx');
  const bodySize = mostCommonFontSize(allLines);
  const paragraphs: InstanceType<typeof Paragraph>[] = [];

  pages.forEach((lines, pageIndex) => {
    let buffer: string[] = [];
    let isFirstOnPage = pageIndex > 0;

    const flush = (heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel]) => {
      if (buffer.length === 0) return;
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(buffer.join(' '))],
          heading,
          pageBreakBefore: isFirstOnPage,
          spacing: { after: 160 },
        })
      );
      buffer = [];
      isFirstOnPage = false;
    };

    lines.forEach((line, index) => {
      const isHeading = Math.round(line.fontSize) >= bodySize * 1.2;
      const previous = lines[index - 1];
      const gap = previous ? previous.y - line.y : 0;
      const startsParagraph = previous && gap > Math.max(previous.fontSize, line.fontSize) * 1.6;

      if (isHeading) {
        flush();
        buffer.push(line.text);
        flush(HeadingLevel.HEADING_2);
      } else {
        if (startsParagraph) flush();
        buffer.push(line.text);
      }
    });
    flush();
  });

  return Packer.toBlob(new Document({ sections: [{ children: paragraphs }] }));
}
