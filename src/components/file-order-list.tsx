'use client';

import { ArrowDown, ArrowUp, File as FileIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileOrderListProps {
  title: string;
  files: File[];
  onChange: (files: File[]) => void;
}

export function FileOrderList({ title, files, onChange }: FileOrderListProps) {
  const move = (index: number, offset: number) => {
    const next = [...files];
    [next[index], next[index + offset]] = [next[index + offset], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <h3 className="font-semibold">{title}</h3>
      {files.map((file, index) => (
        <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 p-2 border rounded-md bg-muted/50">
          <div className="flex items-center gap-2 overflow-hidden">
            <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <span className="text-sm truncate">{file.name}</span>
          </div>
          <div className="flex flex-shrink-0">
            <Button variant="ghost" size="icon" aria-label={`Move ${file.name} up`} disabled={index === 0} onClick={() => move(index, -1)}>
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label={`Move ${file.name} down`} disabled={index === files.length - 1} onClick={() => move(index, 1)}>
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" aria-label={`Remove ${file.name}`} onClick={() => onChange(files.filter((_, i) => i !== index))}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
