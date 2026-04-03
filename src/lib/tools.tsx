import { ImageIcon, Scissors, Shrink, ArrowRightLeft } from 'lucide-react';
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
    ],
  },
];
