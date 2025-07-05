
'use client';

import { useState, useRef } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UploadCloud, FilePlus, Trash2, Download, RotateCcw, Loader2, Type } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


// Use a CDN for the worker to avoid build configuration issues with Next.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type EditorMode = 'view' | 'addText';
type TextDialogState = {
    isOpen: boolean;
    pageIndex: number | null;
    x: number | null;
    y: number | null;
};

export function PdfEditor() {
    const [file, setFile] = useState<File | null>(null);
    const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
    const [pageImageUrls, setPageImageUrls] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [editorMode, setEditorMode] = useState<EditorMode>('view');
    const [textDialogState, setTextDialogState] = useState<TextDialogState>({ isOpen: false, pageIndex: null, x: null, y: null });
    const [textToAdd, setTextToAdd] = useState('');
    const [updatingPageIndex, setUpdatingPageIndex] = useState<number | null>(null);
    const pageContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
    const { toast } = useToast();

    const renderPage = async (pdf: PDFDocumentProxy, pageNumber: number): Promise<string> => {
        const page = await pdf.getPage(pageNumber);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };
            await page.render(renderContext).promise;
            return canvas.toDataURL('image/jpeg');
        }
        return '';
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];
        if (selectedFile && selectedFile.type === 'application/pdf') {
            resetState();
            setFile(selectedFile);
            setIsProcessing(true);

            try {
                const buffer = await selectedFile.arrayBuffer();
                
                const loadedPdfDoc = await PDFDocument.load(buffer);
                setPdfDoc(loadedPdfDoc);
                
                const pdfJsDoc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
                
                const urls: string[] = [];
                for (let i = 1; i <= pdfJsDoc.numPages; i++) {
                    const url = await renderPage(pdfJsDoc, i);
                    urls.push(url);
                }
                setPageImageUrls(urls);

            } catch (error) {
                console.error("Failed to load PDF:", error);
                toast({
                    title: 'Error Loading PDF',
                    description: 'Could not load the selected PDF file. It might be corrupted or protected.',
                    variant: 'destructive',
                });
                resetState();
            } finally {
                setIsProcessing(false);
            }
        } else if (selectedFile) {
            toast({
                title: 'Invalid File Type',
                description: 'Please select a valid PDF file.',
                variant: 'destructive',
            });
        }
    };

    const handleDeletePage = (indexToDelete: number) => {
        if (!pdfDoc) return;
        pdfDoc.removePage(indexToDelete);
        setPageImageUrls(currentUrls => currentUrls.filter((_, i) => i !== indexToDelete));
        toast({
            title: `Page ${indexToDelete + 1} Deleted`,
            description: 'The page has been removed. Download the file to save changes.',
        });
    };
    
    const generateBlankPageThumbnail = (): string => {
        const canvas = document.createElement('canvas');
        const a4_ratio = 1.414;
        canvas.width = 400;
        canvas.height = canvas.width * a4_ratio;
        const context = canvas.getContext('2d');
        if (context) {
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);
            context.strokeStyle = '#e0e0e0';
            context.lineWidth = 2;
            context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
            context.fillStyle = '#999999';
            context.font = '24px sans-serif';
            context.textAlign = 'center';
            context.fillText('Blank Page', canvas.width / 2, canvas.height / 2);
        }
        return canvas.toDataURL('image/jpeg');
    };

    const handleAddBlankPage = () => {
        if (!pdfDoc) return;
        const pages = pdfDoc.getPages();
        const a4_size = { width: 595.28, height: 841.89 };
        const size = pages.length > 0 ? pages[0].getSize() : a4_size;
        pdfDoc.addPage([size.width, size.height]);
        
        const blankPageImageUrl = generateBlankPageThumbnail();
        setPageImageUrls(urls => [...urls, blankPageImageUrl]);

        toast({
            title: 'Blank Page Added',
            description: 'A new blank page has been added to the end of the document.',
        });
    };
    
    const handlePageClick = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
        if (editorMode !== 'addText' || !pageContainerRefs.current[index]) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setTextDialogState({ isOpen: true, pageIndex: index, x, y });
    };

    const handleAddText = async () => {
        if (!pdfDoc || textDialogState.pageIndex === null || textDialogState.x === null || textDialogState.y === null || !textToAdd) {
            return;
        }

        const { pageIndex, x, y } = textDialogState;
        setUpdatingPageIndex(pageIndex);
        // Close dialog immediately
        setTextDialogState({ isOpen: false, pageIndex: null, x: null, y: null });
        setTextToAdd('');
        setEditorMode('view');

        try {
            const pages = pdfDoc.getPages();
            const page = pages[pageIndex];
            
            const containerRef = pageContainerRefs.current[pageIndex];
            if (!containerRef) throw new Error("Page container not found");
            
            const { width: displayWidth, height: displayHeight } = containerRef.getBoundingClientRect();
            const { width: pageWidth, height: pageHeight } = page.getSize();
            
            const pdfX = (x / displayWidth) * pageWidth;
            const pdfY = pageHeight - ((y / displayHeight) * pageHeight);

            const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            page.drawText(textToAdd, {
                x: pdfX,
                y: pdfY,
                font: helveticaFont,
                size: 12,
                color: rgb(0, 0, 0),
            });
            
            const pdfBytes = await pdfDoc.save();
            const loadedPdfDoc = await PDFDocument.load(pdfBytes);
            setPdfDoc(loadedPdfDoc);

            const pdfJsDoc = await pdfjs.getDocument({ data: pdfBytes }).promise;
            const newImageUrl = await renderPage(pdfJsDoc, pageIndex + 1);
            
            setPageImageUrls(currentUrls => {
                const newUrls = [...currentUrls];
                newUrls[pageIndex] = newImageUrl;
                return newUrls;
            });

            toast({
                title: 'Text Added',
                description: 'The text has been added to the page.',
            });

        } catch (error) {
            console.error("Failed to add text:", error);
            toast({
                title: 'Error Adding Text',
                description: 'Could not add text to the PDF.',
                variant: 'destructive',
            });
        } finally {
            setUpdatingPageIndex(null);
        }
    };

    const handleDownload = async () => {
        if (!pdfDoc || !file) return;
        try {
            const pdfBytes = await pdfDoc.save();
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            const originalName = file.name.substring(0, file.name.lastIndexOf('.'));
            link.download = `${originalName}_edited.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error("Failed to save PDF:", error);
            toast({
                title: 'Error Saving PDF',
                description: 'Could not save the modified PDF file.',
                variant: 'destructive',
            });
        }
    };

    const resetState = () => {
        setFile(null);
        setPdfDoc(null);
        setPageImageUrls([]);
        setIsProcessing(false);
        setEditorMode('view');
    };

    return (
        <Card className="rounded-xl shadow-lg w-full">
            <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline">PDF Editor</CardTitle>
                <CardDescription>A simple editor to add text or pages to your PDF files.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {!file ? (
                    <div 
                        className="border border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted transition-colors bg-muted/50"
                        onClick={() => document.getElementById('pdf-editor-upload')?.click()}
                    >
                        <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-4 text-muted-foreground">Drag & drop your PDF here, or click to browse</p>
                        <input id="pdf-editor-upload" type="file" className="hidden" onChange={handleFileChange} accept="application/pdf" />
                    </div>
                ) : isProcessing ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="h-12 w-12 text-primary animate-spin" />
                        <p className="mt-4 text-muted-foreground">Processing your PDF...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <Card className="p-4 bg-muted/50">
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button onClick={() => setEditorMode('addText')} variant={editorMode === 'addText' ? 'secondary' : 'outline'}>
                                    <Type className="mr-2 h-4 w-4" />
                                    Add Text
                                </Button>
                                <Button onClick={handleAddBlankPage} variant="outline">
                                    <FilePlus className="mr-2 h-4 w-4" />
                                    Add Blank Page
                                </Button>
                                <Button onClick={handleDownload} className="bg-gradient-to-r from-primary to-tertiary text-primary-foreground hover:saturate-150 transition-all duration-300">
                                    <Download className="mr-2 h-4 w-4" />
                                    Download Modified PDF
                                </Button>
                            </div>
                            {editorMode === 'addText' && <p className="text-center text-sm text-primary mt-2">Click on a page to add text.</p>}
                        </Card>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {pageImageUrls.map((url, index) => (
                                <div 
                                    key={index} 
                                    ref={el => pageContainerRefs.current[index] = el}
                                    className={`relative group border rounded-md overflow-hidden aspect-[7/9] bg-white ${editorMode === 'addText' ? 'cursor-text' : ''}`}
                                    onClick={(e) => handlePageClick(e, index)}
                                >
                                    <img src={url} alt={`Page ${index + 1}`} className="w-full h-full object-contain" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button variant="destructive" size="icon" onClick={(e) => { e.stopPropagation(); handleDeletePage(index); }}>
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete Page {index + 1}</span>
                                        </Button>
                                    </div>
                                    <div className="absolute bottom-1 right-1 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded">
                                        {index + 1}
                                    </div>
                                    {updatingPageIndex === index && (
                                        <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                         <Button onClick={resetState} variant="outline" className="w-full">
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Start Over with New File
                        </Button>
                    </div>
                )}
                 <AlertDialog open={textDialogState.isOpen} onOpenChange={(isOpen) => !isOpen && setTextDialogState({ isOpen: false, pageIndex: null, x: null, y: null })}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Add Text</AlertDialogTitle>
                        <AlertDialogDescription>
                            Enter the text you want to add to the page.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="text-to-add" className="text-right">Text</Label>
                                <Input
                                    id="text-to-add"
                                    value={textToAdd}
                                    onChange={(e) => setTextToAdd(e.target.value)}
                                    className="col-span-3"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setTextDialogState({ isOpen: false, pageIndex: null, x: null, y: null })}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleAddText}>Add Text</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}
