import { ImageIcon, File, FileText, Scissors, UserSquare, Shrink, Wand2 } from 'lucide-react';
import type { ReactNode } from 'react';

type Tool = {
  name: string;
  href: string;
  description: string;
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
    icon: <ImageIcon className="h-10 w-10 text-primary" />,
    description: 'Tools to convert, edit, and manipulate images.',
    tools: [
      { name: 'JPG to PNG', href: '/jpg-to-png', description: 'Easily convert your JPG images to high-quality PNG format, which supports transparency.' },
      { name: 'PNG to JPG', href: '/png-to-jpg', description: 'Quickly convert your PNG images to the universally compatible JPG format, perfect for web use.' },
      { name: 'WebP to JPG', href: '/webp-to-jpg', description: 'Convert modern WebP images to the standard JPG format for wider compatibility across devices.' },
      { name: 'JPG to AVIF', href: '/jpg-to-avif', description: 'Transform your JPG images into the next-generation AVIF format for superior compression and quality.' },
      { name: 'PNG to AVIF', href: '/png-to-avif', description: 'Convert your PNG images to high-quality, efficient AVIF files, ideal for modern web applications.' },
      { name: 'Image Resizer', href: '/image-resizer', description: 'Resize your JPG, PNG, WebP, or GIF images to any dimensions you need without losing quality.' },
      { name: 'Image Compressor', href: '/image-compressor', description: 'Drastically reduce the file size of your JPG, PNG, and WebP images with our smart compression tool.' },
      { name: 'Passport Photo Maker', href: '/passport-photo-maker', description: 'Create official passport, visa, or ID photos from your own pictures, formatted to the correct size.' },
      { name: 'Background Remover', href: '/background-remover', description: 'Automatically erase the background from any photo with a single click using advanced AI technology.' },
      { name: 'GIF to MP4', href: '/gif-to-mp4', description: 'Convert animated GIF files into lightweight, high-quality MP4 videos that are easy to share.' },
    ],
  },
  {
    name: 'File Converters',
    icon: <File className="h-10 w-10 text-primary" />,
    description: 'Convert various file formats for documents, audio, and video.',
    tools: [
      { name: 'MP4 to AVI', href: '/mp4-to-avi', description: 'Convert your MP4 video files to the classic AVI format for compatibility with various media players.' },
      { name: 'MP3 to WAV', href: '/mp3-to-wav', description: 'Transform your MP3 audio files into uncompressed WAV format for professional-quality sound.' },
      { name: 'DOC to PDF', href: '/doc-to-pdf', description: 'Convert Microsoft Word documents (DOC, DOCX) to PDF format for easy sharing and printing.' },
      { name: 'EPUB to MOBI', href: '/epub-to-mobi', description: 'Convert your EPUB e-books to the MOBI format, perfect for reading on your Kindle device.' },
    ],
  },
  {
    name: 'PDF Tools',
    icon: <FileText className="h-10 w-10 text-primary" />,
    description: 'A suite of tools to manage and manipulate PDF files.',
    tools: [
      { name: 'PDF to Word', href: '/pdf-to-word', description: 'Turn your static PDF files into fully editable Microsoft Word documents with preserved formatting.' },
      { name: 'Word to PDF', href: '/word-to-pdf', description: 'Create professional, secure PDF files from your Word documents in just a few clicks.' },
      { name: 'PDF Merge', href: '/pdf-merge', description: 'Combine multiple PDF files into a single, organized document for easy management and sharing.' },
      { name: 'PDF Split', href: '/pdf-split', description: 'Extract specific pages or split a large PDF into multiple smaller files by page range or size.' },
    ],
  },
];
