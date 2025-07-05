import { ImageIcon, File, FileText, Search, Scissors, UserSquare, Shrink, Wand2 } from 'lucide-react';
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
      { name: 'JPG to PNG', href: '/jpg-to-png', description: 'Convert JPG to PNG format.' },
      { name: 'PNG to JPG', href: '/png-to-jpg', description: 'Convert PNG to JPG format.' },
      { name: 'WebP to JPG', href: '/webp-to-jpg', description: 'Convert WebP to JPG format.' },
      { name: 'JPG to AVIF', href: '/jpg-to-avif', description: 'Convert JPG images to the next-gen AVIF format.' },
      { name: 'PNG to AVIF', href: '/png-to-avif', description: 'Convert PNG images to the next-gen AVIF format.' },
      { name: 'Image Resizer', href: '/image-resizer', description: 'Resize images to your desired dimensions.' },
      { name: 'Image Compressor', href: '/image-compressor', description: 'Reduce image file sizes with adjustable quality.' },
      { name: 'Passport Photo Maker', href: '/passport-photo-maker', description: 'Create standards-compliant passport photos.' },
      { name: 'Background Remover', href: '/background-remover', description: 'Automatically remove image backgrounds using AI.' },
      { name: 'GIF to MP4', href: '/gif-to-mp4', description: 'Convert animated GIF to MP4 video.' },
    ],
  },
  {
    name: 'File Converters',
    icon: <File className="h-10 w-10 text-primary" />,
    description: 'Convert various file formats for documents, audio, and video.',
    tools: [
      { name: 'MP4 to AVI', href: '/mp4-to-avi', description: 'Convert MP4 video to AVI format.' },
      { name: 'MP3 to WAV', href: '/mp3-to-wav', description: 'Convert MP3 audio to WAV format.' },
      { name: 'DOC to PDF', href: '/doc-to-pdf', description: 'Convert Word documents to PDF.' },
      { name: 'EPUB to MOBI', href: '/epub-to-mobi', description: 'Convert e-book formats.' },
    ],
  },
  {
    name: 'PDF Tools',
    icon: <FileText className="h-10 w-10 text-primary" />,
    description: 'A suite of tools to manage and manipulate PDF files.',
    tools: [
      { name: 'PDF to Word', href: '/pdf-to-word', description: 'Convert PDF files back to Word documents.' },
      { name: 'Word to PDF', href: '/word-to-pdf', description: 'Create PDF files from Word documents.' },
      { name: 'PDF Merge', href: '/pdf-merge', description: 'Combine multiple PDF files into one.' },
      { name: 'PDF Split', href: '/pdf-split', description: 'Split a single PDF into multiple files.' },
    ],
  },
  {
    name: 'SEO Tools',
    icon: <Search className="h-10 w-10 text-primary" />,
    description: 'Optimize your website for better search engine rankings.',
    tools: [
      { name: 'Meta Tag Generator', href: '/seo/meta-tag-generator', description: 'Generate SEO-friendly meta tags.' },
      { name: 'Keyword Research', href: '/seo/keyword-research', description: 'Find keywords for your content strategy.' },
      { name: 'Plagiarism Checker', href: '/seo/plagiarism-checker', description: 'Check for duplicate content.' },
      { name: 'Backlink Checker', href: '/seo/backlink-checker', description: 'Analyze your website\'s backlink profile.' },
    ],
  },
];
