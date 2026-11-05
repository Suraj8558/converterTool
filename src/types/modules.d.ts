declare module 'imagetracerjs' {
  const ImageTracer: {
    imagedataToSVG(imageData: ImageData, options?: Record<string, unknown>): string;
  };
  export default ImageTracer;
}

declare module 'html-to-pdfmake' {
  export default function htmlToPdfmake(
    html: string,
    options?: { window?: Window }
  ): import('pdfmake/interfaces').Content;
}

declare module 'pdfmake/build/vfs_fonts' {
  const fonts: Record<string, unknown>;
  export default fonts;
}

declare module 'pdfjs-dist/legacy/build/pdf.mjs' {
  export * from 'pdfjs-dist';
}
