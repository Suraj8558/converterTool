import { ArrowRightLeft, BookOpen, Clapperboard, Combine, Crop, FileAudio, FileImage, FileText, FileVideo, Hash, IdCard, ImageIcon, LayoutGrid, RotateCw, Scissors, Shrink, Stamp } from 'lucide-react';
import type { ReactNode } from 'react';

type Tool = {
  name: string;
  href: string;
  description: string;
  icon: ReactNode;
};

type ToolCategory = {
  name: string;
  icon: ReactNode;
  description: string;
  tools: Tool[];
};

export const toolCategories: ToolCategory[] = [
  {
    name: 'Image Tools',
    icon: <ImageIcon className="h-8 w-8 text-primary" />,
    description: 'Convert, edit, and manipulate your images with ease.',
    tools: [
      { name: 'JPG to PNG', href: '/jpg-to-png', description: 'Convert JPG images to the lossless PNG format.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'PNG to JPG', href: '/png-to-jpg', description: 'Convert PNG images to the universally compatible JPG format.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'SVG to PNG', href: '/svg-to-png', description: 'Convert scalable SVG vectors into high-quality PNG images.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'PNG to SVG', href: '/png-to-svg', description: 'Trace PNG logos and artwork into scalable SVG vectors.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'WebP to JPG', href: '/webp-to-jpg', description: 'Convert modern WebP images to standard JPG format.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'HEIC to JPG', href: '/heic-to-jpg', description: 'Convert iPhone HEIC photos to the universally compatible JPG format.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'JPG to AVIF', href: '/jpg-to-avif', description: 'Transform JPGs to the next-gen AVIF format for smaller files.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'PNG to AVIF', href: '/png-to-avif', description: 'Convert PNGs to efficient AVIF files, keeping transparency.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'Image Resizer', href: '/image-resizer', description: 'Resize images to your exact dimensions.', icon: <Scissors className="w-6 h-6"/> },
      { name: 'Passport Photo Maker', href: '/passport-photo', description: 'Make passport and visa photos: align your face, change the background, set a file size, print a sheet.', icon: <IdCard className="w-6 h-6"/> },
      { name: 'Image Compressor', href: '/image-compressor', description: 'Reduce image file sizes with smart, adjustable compression.', icon: <Shrink className="w-6 h-6"/> },
    ],
  },
  {
    name: 'PDF & Document Tools',
    icon: <FileText className="h-8 w-8 text-primary" />,
    description: 'Merge, split, and convert your PDFs, documents, and e-books.',
    tools: [
      { name: 'PDF Merge', href: '/pdf-merge', description: 'Combine multiple PDFs into one, in the order you choose.', icon: <Combine className="w-6 h-6"/> },
      { name: 'PDF Split', href: '/pdf-split', description: 'Extract page ranges or split a PDF into single pages.', icon: <Scissors className="w-6 h-6"/> },
      { name: 'PDF Compress', href: '/pdf-compress', description: 'Reduce the file size of a PDF.', icon: <Shrink className="w-6 h-6"/> },
      { name: 'Images to PDF', href: '/images-to-pdf', description: 'Combine JPG, PNG and WebP images into one PDF.', icon: <FileImage className="w-6 h-6"/> },
      { name: 'Organize PDF', href: '/organize-pdf', description: 'Reorder, remove or add pages in a PDF.', icon: <LayoutGrid className="w-6 h-6"/> },
      { name: 'Rotate PDF', href: '/rotate-pdf', description: 'Turn one page or the whole document.', icon: <RotateCw className="w-6 h-6"/> },
      { name: 'Crop PDF', href: '/crop-pdf', description: 'Keep just the part of a page you need.', icon: <Crop className="w-6 h-6"/> },
      { name: 'Add Page Numbers', href: '/pdf-page-numbers', description: 'Number every page of a PDF.', icon: <Hash className="w-6 h-6"/> },
      { name: 'Add Watermark', href: '/pdf-watermark', description: 'Stamp text or an image across every page.', icon: <Stamp className="w-6 h-6"/> },
      { name: 'PDF to JPG', href: '/pdf-to-jpg', description: 'Save each page of a PDF as a JPG image.', icon: <FileImage className="w-6 h-6"/> },
      { name: 'Word to PDF', href: '/word-to-pdf', description: 'Convert .docx documents to PDF.', icon: <FileText className="w-6 h-6"/> },
      { name: 'PDF to Word', href: '/pdf-to-word', description: 'Extract the text of a PDF into an editable .docx file.', icon: <FileText className="w-6 h-6"/> },
      { name: 'EPUB to MOBI', href: '/epub-to-mobi', description: 'Convert unprotected e-books for older e-readers.', icon: <BookOpen className="w-6 h-6"/> },
    ],
  },
  {
    name: 'Audio & Video Tools',
    icon: <Clapperboard className="h-8 w-8 text-primary" />,
    description: 'Convert audio, video, and animated GIFs without uploading them.',
    tools: [
      { name: 'MP3 to WAV', href: '/mp3-to-wav', description: 'Convert MP3 audio to uncompressed WAV files.', icon: <FileAudio className="w-6 h-6"/> },
      { name: 'GIF to MP4', href: '/gif-to-mp4', description: 'Turn animated GIFs into much smaller MP4 videos.', icon: <FileVideo className="w-6 h-6"/> },
      { name: 'MP4 to AVI', href: '/mp4-to-avi', description: 'Convert MP4 videos to the AVI format.', icon: <FileVideo className="w-6 h-6"/> },
    ],
  },
];
