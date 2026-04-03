import { ImageIcon, FileText, Scissors, UserSquare, Shrink, Wand2, Edit, Text, Compass, Search, ArrowRightLeft } from 'lucide-react';
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
      { name: 'WebP to JPG', href: '/webp-to-jpg', description: 'Convert modern WebP images to standard JPG format.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'JPG to AVIF', href: '/jpg-to-avif', description: 'Transform JPGs to the next-gen AVIF format for superior quality.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'PNG to AVIF', href: '/png-to-avif', description: 'Convert PNGs to high-quality, efficient AVIF files.', icon: <ArrowRightLeft className="w-6 h-6"/> },
      { name: 'Image Resizer', href: '/image-resizer', description: 'Resize images to your exact dimensions without losing quality.', icon: <Scissors className="w-6 h-6"/> },
      { name: 'Image Compressor', href: '/image-compressor', description: 'Reduce image file sizes with smart, adjustable compression.', icon: <Shrink className="w-6 h-6"/> },
      { name: 'Passport Photo Maker', href: '/passport-photo-maker', description: 'Create official passport, visa, or ID photos from your pictures.', icon: <UserSquare className="w-6 h-6"/> },
      { name: 'Background Remover', href: '/background-remover', description: 'Automatically erase image backgrounds with a single click using AI.', icon: <Wand2 className="w-6 h-6"/> },
    ],
  },
  {
    name: 'PDF Tools',
    icon: <FileText className="h-8 w-8 text-primary" />,
    description: 'A complete suite of tools to manage and manipulate PDFs.',
    tools: [
      { name: 'PDF Editor', href: '/pdf-editor', description: 'Add text and pages to your PDF files directly in your browser.', icon: <Edit className="w-6 h-6"/> },
    ],
  },
    {
    name: 'SEO Tools',
    icon: <Compass className="h-8 w-8 text-primary" />,
    description: 'Analyze and optimize your website for search engines.',
    tools: [
        { name: 'Keyword Research', href: '/seo/keyword-research', description: 'Discover keyword ideas and search volume.', icon: <Search className="w-6 h-6"/> },
        { name: 'Meta Tag Generator', href: '/seo/meta-tag-generator', description: 'Generate SEO-friendly titles and descriptions.', icon: <Text className="w-6 h-6"/> },
    ],
  },
];
