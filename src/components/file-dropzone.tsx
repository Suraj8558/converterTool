'use client';

import { useRef } from 'react';
import { UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FileDropzoneProps {
  /** Comma-separated extensions without dots, such as "jpg,jpeg". */
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
}

export function FileDropzone({ accept, multiple = true, onFiles }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const extensions = accept.split(',').map((type) => `.${type.trim().toLowerCase()}`);

  const receive = (incoming: File[]) => {
    const accepted = incoming.filter((file) =>
      extensions.some((extension) => file.name.toLowerCase().endsWith(extension))
    );
    const rejectedCount = incoming.length - accepted.length;
    if (rejectedCount > 0) {
      toast({
        title: rejectedCount === 1 ? 'File skipped' : `${rejectedCount} files skipped`,
        description: `This tool only accepts ${extensions.join(', ')} files.`,
        variant: 'destructive',
      });
    }
    const usable = multiple ? accepted : accepted.slice(0, 1);
    if (usable.length > 0) onFiles(usable);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      className="group rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-b from-primary/5 to-transparent p-6 text-center cursor-pointer transition-all duration-200 hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background sm:p-10"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        receive(Array.from(event.dataTransfer.files));
      }}
    >
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-200 group-hover:-translate-y-1">
        <UploadCloud className="h-7 w-7" />
      </span>
      <p className="mt-4 font-medium text-foreground">Drag & drop your files here, or click to browse</p>
      <p className="text-xs text-muted-foreground mt-1">Supported format(s): {extensions.join(', ')}</p>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={extensions.join(',')}
        multiple={multiple}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          receive(Array.from(event.target.files ?? []));
          event.target.value = '';
        }}
      />
    </div>
  );
}
