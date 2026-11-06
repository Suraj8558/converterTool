import { ArrowRightLeft, BookOpen, Clapperboard, Combine, Crop, FileAudio, FileImage, FileText, FileVideo, Hash, IdCard, ImageIcon, LayoutGrid, RotateCw, Scissors, Shrink, Stamp } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Tone, ToolVisualSpec } from '@/components/tool-visual';

type Tool = {
  name: string;
  href: string;
  description: string;
  icon: ReactNode;
  visual: ToolVisualSpec;
};

type ToolCategory = {
  /** Anchor on the home page, such as /#images. */
  id: string;
  name: string;
  tone: Tone;
  icon: ReactNode;
  description: string;
  tools: Tool[];
};

export const toolCategories: ToolCategory[] = [
  {
    id: 'images',
    name: 'Image Tools',
    tone: 'blue',
    icon: <ImageIcon className="h-8 w-8 text-primary" />,
    description: 'Convert, edit, and manipulate your images with ease.',
    tools: [
      { name: 'JPG to PNG', href: '/jpg-to-png', description: 'Convert JPG images to the lossless PNG format.', visual: { type: 'convert', from: 'jpg', to: 'png' }, icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'PNG to JPG', href: '/png-to-jpg', description: 'Convert PNG images to the universally compatible JPG format.', visual: { type: 'convert', from: 'png', to: 'jpg' }, icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'SVG to PNG', href: '/svg-to-png', description: 'Convert scalable SVG vectors into high-quality PNG images.', visual: { type: 'convert', from: 'svg', to: 'png' }, icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'PNG to SVG', href: '/png-to-svg', description: 'Trace PNG logos and artwork into scalable SVG vectors.', visual: { type: 'convert', from: 'png', to: 'svg' }, icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'WebP to JPG', href: '/webp-to-jpg', description: 'Convert modern WebP images to standard JPG format.', visual: { type: 'convert', from: 'webp', to: 'jpg' }, icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'HEIC to JPG', href: '/heic-to-jpg', description: 'Convert iPhone HEIC photos to the universally compatible JPG format.', visual: { type: 'convert', from: 'heic', to: 'jpg' }, icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'JPG to AVIF', href: '/jpg-to-avif', description: 'Transform JPGs to the next-gen AVIF format for smaller files.', visual: { type: 'convert', from: 'jpg', to: 'avif' }, icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'PNG to AVIF', href: '/png-to-avif', description: 'Convert PNGs to efficient AVIF files, keeping transparency.', visual: { type: 'convert', from: 'png', to: 'avif' }, icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'Image Resizer', href: '/image-resizer', description: 'Resize images to your exact dimensions.', visual: { type: 'scene', scene: 'resize' }, icon: <Scissors className="w-6 h-6"/> },
      { name: 'Passport Photo Maker', href: '/passport-photo', description: 'Make passport and visa photos: align your face, change the background, set a file size, print a sheet.', visual: { type: 'scene', scene: 'passport' }, icon: <IdCard className="w-6 h-6"/> },
      { name: 'Image Compressor', href: '/image-compressor', description: 'Reduce image file sizes with smart, adjustable compression.', visual: { type: 'scene', scene: 'compress-image' }, icon: <Shrink className="w-6 h-6"/> },
    ],
  },
  {
    id: 'documents',
    name: 'PDF & Document Tools',
    tone: 'rose',
    icon: <FileText className="h-8 w-8 text-primary" />,
    description: 'Merge, split, and convert your PDFs, documents, and e-books.',
    tools: [
      { name: 'PDF Merge', href: '/pdf-merge', description: 'Combine multiple PDFs into one, in the order you choose.', visual: { type: 'scene', scene: 'merge' }, icon: <Combine className="w-6 h-6"/> },
      { name: 'PDF Split', href: '/pdf-split', description: 'Extract page ranges or split a PDF into single pages.', visual: { type: 'scene', scene: 'split' }, icon: <Scissors className="w-6 h-6"/> },
      { name: 'PDF Compress', href: '/pdf-compress', description: 'Reduce the file size of a PDF.', visual: { type: 'scene', scene: 'compress-pdf' }, icon: <Shrink className="w-6 h-6"/> },
      { name: 'Images to PDF', href: '/images-to-pdf', description: 'Combine JPG, PNG and WebP images into one PDF.', visual: { type: 'scene', scene: 'images-to-pdf' }, icon: <FileImage className="w-6 h-6"/> },
      { name: 'Organize PDF', href: '/organize-pdf', description: 'Reorder, remove or add pages in a PDF.', visual: { type: 'scene', scene: 'organize' }, icon: <LayoutGrid className="w-6 h-6"/> },
      { name: 'Rotate PDF', href: '/rotate-pdf', description: 'Turn one page or the whole document.', visual: { type: 'scene', scene: 'rotate' }, icon: <RotateCw className="w-6 h-6"/> },
      { name: 'Crop PDF', href: '/crop-pdf', description: 'Keep just the part of a page you need.', visual: { type: 'scene', scene: 'crop' }, icon: <Crop className="w-6 h-6"/> },
      { name: 'Add Page Numbers', href: '/pdf-page-numbers', description: 'Number every page of a PDF.', visual: { type: 'scene', scene: 'page-numbers' }, icon: <Hash className="w-6 h-6"/> },
      { name: 'Add Watermark', href: '/pdf-watermark', description: 'Stamp text or an image across every page.', visual: { type: 'scene', scene: 'watermark' }, icon: <Stamp className="w-6 h-6"/> },
      { name: 'PDF to JPG', href: '/pdf-to-jpg', description: 'Save each page of a PDF as a JPG image.', visual: { type: 'convert', from: 'pdf', to: 'jpg' }, icon: <FileImage className="w-6 h-6"/> },
      { name: 'Word to PDF', href: '/word-to-pdf', description: 'Convert .docx documents to PDF.', visual: { type: 'convert', from: 'docx', to: 'pdf' }, icon: <FileText className="w-6 h-6"/> },
      { name: 'PDF to Word', href: '/pdf-to-word', description: 'Extract the text of a PDF into an editable .docx file.', visual: { type: 'convert', from: 'pdf', to: 'docx' }, icon: <FileText className="w-6 h-6"/> },
      { name: 'EPUB to MOBI', href: '/epub-to-mobi', description: 'Convert unprotected e-books for older e-readers.', visual: { type: 'convert', from: 'epub', to: 'mobi' }, icon: <BookOpen className="w-6 h-6"/> },
    ],
  },
  {
    id: 'media',
    name: 'Audio & Video Tools',
    tone: 'emerald',
    icon: <Clapperboard className="h-8 w-8 text-primary" />,
    description: 'Convert audio, video, and animated GIFs without uploading them.',
    tools: [
      { name: 'MP3 to WAV', href: '/mp3-to-wav', description: 'Convert MP3 audio to uncompressed WAV files.', visual: { type: 'convert', from: 'mp3', to: 'wav' }, icon: <FileAudio className="w-6 h-6"/> },
      { name: 'GIF to MP4', href: '/gif-to-mp4', description: 'Turn animated GIFs into much smaller MP4 videos.', visual: { type: 'convert', from: 'gif', to: 'mp4' }, icon: <FileVideo className="w-6 h-6"/> },
      { name: 'MP4 to AVI', href: '/mp4-to-avi', description: 'Convert MP4 videos to the AVI format.', visual: { type: 'convert', from: 'mp4', to: 'avi' }, icon: <FileVideo className="w-6 h-6"/> },
    ],
  },
];
