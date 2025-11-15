import { ImageIcon, File, FileText, Scissors, UserSquare, Shrink, Wand2, Image, FileType, Video, AudioLines, Book, Trash, Split, Merge, Edit, Text, ArrowRightLeft, FileKey, Compass, Search } from 'lucide-react';
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
      { name: 'JPG to PNG', href: '/jpg-to-png', description: 'Convert JPG images to PNG with transparency support.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'PNG to JPG', href: '/png-to-jpg', description: 'Convert PNG images to the universally compatible JPG format.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'SVG to PNG', href: '/svg-to-png', description: 'Convert scalable SVG vectors into high-quality PNG images.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'PNG to SVG', href: '/png-to-svg', description: 'Convert PNG images into scalable SVG vector graphics.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'WebP to JPG', href: '/webp-to-jpg', description: 'Convert modern WebP images to standard JPG format.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'JPG to AVIF', href: '/jpg-to-avif', description: 'Transform JPGs to the next-gen AVIF format for superior quality.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'PNG to AVIF', href: '/png-to-avif', description: 'Convert PNGs to high-quality, efficient AVIF files.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'Image Resizer', href: '/image-resizer', description: 'Resize images to your exact dimensions without losing quality.', icon: <Scissors className="w-6 h-6"/> },
      { name: 'Image Compressor', href: '/image-compressor', description: 'Reduce image file sizes with smart, adjustable compression.', icon: <Shrink className="w-6 h-6"/> },
      { name: 'Passport Photo Maker', href: '/passport-photo-maker', description: 'Create official passport, visa, or ID photos from your pictures.', icon: <UserSquare className="w-6 h-6"/> },
      { name: 'Background Remover', href: '/background-remover', description: 'Automatically erase image backgrounds with a single click using AI.', icon: <Wand2 className="w-6 h-6"/> },
      { name: 'GIF to MP4', href: '/gif-to-mp4', description: 'Convert animated GIFs into lightweight, high-quality MP4 videos.', icon: <Video className="w-6 h-6"/> },
    ],
  },
  {
    name: 'File Converters',
    icon: <File className="h-8 w-8 text-primary" />,
    description: 'Switch between various document, audio, and video formats.',
    tools: [
      { name: 'MP4 to AVI', href: '/mp4-to-avi', description: 'Convert MP4 videos to AVI format for legacy media players.', icon: <Video className="w-6 h-6"/> },
      { name: 'MP3 to WAV', href: '/mp3-to-wav', description: 'Transform MP3s into uncompressed WAV for professional audio quality.', icon: <AudioLines className="w-6 h-6"/> },
      { name: 'DOC to PDF', href: '/doc-to-pdf', description: 'Convert Word documents to PDF for universal sharing and printing.', icon: <FileText className="w-6 h-6"/> },
      { name: 'EPUB to MOBI', href: '/epub-to-mobi', description: 'Convert EPUB e-books to MOBI format for your Kindle device.', icon: <Book className="w-6 h-6"/> },
    ],
  },
  {
    name: 'PDF Tools',
    icon: <FileText className="h-8 w-8 text-primary" />,
    description: 'A complete suite of tools to manage and manipulate PDFs.',
    tools: [
      { name: 'PDF Editor', href: '/pdf-editor', description: 'Add text and pages to your PDF files directly in your browser.', icon: <Edit className="w-6 h-6"/> },
      { name: 'PDF to Word', href: '/pdf-to-word', description: 'Turn static PDFs into fully editable Microsoft Word documents.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'Word to PDF', href: '/word-to-pdf', description: 'Create professional, secure PDF files from your Word documents.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'PDF Merge', href: '/pdf-merge', description: 'Combine multiple PDF files into one single, organized document.', icon: <Merge className="w-6 h-6"/> },
      { name: 'PDF Split', href: '/pdf-split', description: 'Extract pages or a large PDF into multiple smaller files.', icon: <Split className="w-6 h-6"/> },
    ],
  },
    {
    name: 'SEO Tools',
    icon: <Compass className="h-8 w-8 text-primary" />,
    description: 'Analyze and optimize your website for search engines.',
    tools: [
        { name: 'Backlink Checker', href: '/seo/backlink-checker', description: 'Analyze the backlink profile of any domain.', icon: <FileKey className="w-6 h-6"/> },
        { name: 'Keyword Research', href: '/seo/keyword-research', description: 'Discover keyword ideas and search volume.', icon: <Search className="w-6 h-6"/> },
        { name: 'Meta Tag Generator', href: '/seo/meta-tag-generator', description: 'Generate SEO-friendly titles and descriptions.', icon: <Text className="w-6 h-6"/> },
        { name: 'Plagiarism Checker', href: '/seo/plagiarism-checker', description: 'Check your content for uniqueness.', icon: <FileText className="w-6 h-6"/> },
    ],
  },
];
