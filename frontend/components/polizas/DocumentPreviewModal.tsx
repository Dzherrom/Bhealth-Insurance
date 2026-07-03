'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface DocumentPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url?: string | null;
  fileType?: 'pdf' | 'jpg' | 'png' | 'doc';
  loading?: boolean;
}

export function DocumentPreviewModal({
  open,
  onOpenChange,
  title,
  url,
  fileType = 'pdf',
  loading = false,
}: DocumentPreviewModalProps) {
  const isImage = fileType === 'jpg' || fileType === 'png';
  const isPdf = fileType === 'pdf';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="truncate pr-8">{title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 bg-slate-100 dark:bg-slate-900">
          {loading ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Cargando vista previa...
            </div>
          ) : !url ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Vista previa no disponible.
            </div>
          ) : isImage ? (
            <div className="flex h-full items-center justify-center overflow-auto p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={title} className="max-h-full max-w-full object-contain rounded-md shadow" />
            </div>
          ) : isPdf ? (
            <iframe
              src={url}
              title={title}
              className="h-full w-full border-0 bg-white"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Este tipo de archivo no se puede previsualizar aquí.
              </p>
              <Button asChild variant="outline">
                <a href={url} download={title}>
                  Descargar archivo
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
