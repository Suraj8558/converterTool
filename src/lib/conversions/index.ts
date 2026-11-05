// Every engine runs entirely in the browser and is loaded only when first used,
// so heavy libraries never slow down the rest of the site.

export type ConversionEngine =
  | 'avif'
  | 'heic-to-jpg'
  | 'png-to-svg'
  | 'mp3-to-wav'
  | 'gif-to-mp4'
  | 'mp4-to-avi'
  | 'docx-to-pdf'
  | 'pdf-to-docx'
  | 'epub-to-mobi';

export type ProgressCallback = (fraction: number) => void;

export async function runConversion(
  engine: ConversionEngine,
  file: File,
  onProgress: ProgressCallback
): Promise<Blob> {
  switch (engine) {
    case 'avif':
      return (await import('./avif')).imageToAvif(file);
    case 'heic-to-jpg':
      return (await import('./heic-to-jpg')).heicToJpg(file);
    case 'png-to-svg':
      return (await import('./png-to-svg')).pngToSvg(file);
    case 'mp3-to-wav':
      return (await import('./mp3-to-wav')).mp3ToWav(file);
    case 'gif-to-mp4':
      return (await import('./video')).gifToMp4(file, onProgress);
    case 'mp4-to-avi':
      return (await import('./video')).mp4ToAvi(file, onProgress);
    case 'docx-to-pdf':
      return (await import('./docx-to-pdf')).docxToPdf(file);
    case 'pdf-to-docx':
      return (await import('./pdf-to-docx')).pdfToDocx(file, onProgress);
    case 'epub-to-mobi':
      return (await import('./epub-to-mobi')).epubToMobi(file);
  }
}
