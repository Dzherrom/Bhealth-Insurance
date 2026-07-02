'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { documentosApi, documentosLegalesApi, resolveApiMediaUrl } from '@/lib/api';
import {
  CATEGORIA_POR_TIPO_LEGAL,
  type LegalDocumentType,
} from '@/lib/familyMemberOptions';
import { formatIsoDateDisplay } from '@/lib/familyMemberUtils';

export interface DocumentoLegalLink {
  id?: number;
  tipo: LegalDocumentType;
  documento?: number | null;
  numero_documento?: string;
  fecha_emision?: string | null;
  fecha_vencimiento?: string | null;
  documento_details?: {
    id: number;
    titulo?: string;
    categoria?: string;
    fecha_subida?: string;
    fecha_vencimiento?: string | null;
    archivo?: string;
  } | null;
}

interface PolicyDocument {
  id: number;
  titulo: string;
  categoria: string;
  fecha_subida?: string;
  fecha_vencimiento?: string | null;
  archivo?: string;
}

interface SelectLegalDocumentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  polizaId: number;
  clienteId: number;
  tipo: LegalDocumentType;
  tipoLabel: string;
  existing?: DocumentoLegalLink | null;
  onSaved: () => void;
}

const CATEGORIA_LABELS: Record<string, string> = {
  IDENTIFICACION: 'Identificación',
  ESTATUS_MIGRATORIO: 'Estatus Migratorio',
  OTRO: 'Otro',
};

export function SelectLegalDocumentModal({
  open,
  onOpenChange,
  polizaId,
  clienteId,
  tipo,
  tipoLabel,
  existing,
  onSaved,
}: SelectLegalDocumentModalProps) {
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [search, setSearch] = useState('');

  const [policyDocs, setPolicyDocs] = useState<PolicyDocument[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [fechaEmision, setFechaEmision] = useState('');
  const [fechaVencimiento, setFechaVencimiento] = useState('');

  const [uploadTitulo, setUploadTitulo] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const docs = await documentosApi.listByPoliza(polizaId);
      setPolicyDocs(
        (docs as any[]).map((d) => ({
          id: d.id,
          titulo: d.titulo || d.archivo?.split('/').pop() || 'Documento',
          categoria: d.categoria || 'OTRO',
          fecha_subida: d.fecha_subida,
          fecha_vencimiento: d.fecha_vencimiento,
          archivo: resolveApiMediaUrl(d.archivo),
        })),
      );
    } catch (error) {
      console.error(error);
      toastRef.current({ title: 'Error al cargar documentos de la póliza', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [polizaId]);

  useEffect(() => {
    if (!open) return;
    setSelectedDocId(existing?.documento ?? existing?.documento_details?.id ?? null);
    setNumeroDocumento(existing?.numero_documento || '');
    setFechaEmision(
      existing?.fecha_emision
        ? existing.fecha_emision.slice(0, 10)
        : existing?.documento_details?.fecha_subida
          ? existing.documento_details.fecha_subida.slice(0, 10)
          : '',
    );
    setFechaVencimiento(
      existing?.fecha_vencimiento
        ? existing.fecha_vencimiento.slice(0, 10)
        : existing?.documento_details?.fecha_vencimiento
          ? existing.documento_details.fecha_vencimiento.slice(0, 10)
          : '',
    );
    setSearch('');
    setShowUpload(false);
    setUploadTitulo(tipoLabel);
    setUploadFile(null);
  }, [
    open,
    tipoLabel,
    existing?.documento,
    existing?.documento_details?.id,
    existing?.numero_documento,
    existing?.fecha_emision,
    existing?.fecha_vencimiento,
    existing?.documento_details?.fecha_subida,
    existing?.documento_details?.fecha_vencimiento,
  ]);

  useEffect(() => {
    if (!open || !polizaId) return;
    let cancelled = false;

    const fetchDocs = async () => {
      setLoading(true);
      try {
        const docs = await documentosApi.listByPoliza(polizaId);
        if (cancelled) return;
        setPolicyDocs(
          (docs as any[]).map((d) => ({
            id: d.id,
            titulo: d.titulo || d.archivo?.split('/').pop() || 'Documento',
            categoria: d.categoria || 'OTRO',
            fecha_subida: d.fecha_subida,
            fecha_vencimiento: d.fecha_vencimiento,
            archivo: resolveApiMediaUrl(d.archivo),
          })),
        );
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        toastRef.current({ title: 'Error al cargar documentos de la póliza', variant: 'destructive' });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void fetchDocs();
    return () => {
      cancelled = true;
    };
  }, [open, polizaId]);

  const filteredDocs = policyDocs.filter((doc) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return doc.titulo.toLowerCase().includes(q) || doc.categoria.toLowerCase().includes(q);
  });

  const handleUploadNew = async () => {
    if (!uploadFile) {
      toast({ title: 'Selecciona un archivo', variant: 'destructive' });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('archivo', uploadFile);
      formData.append('titulo', uploadTitulo.trim() || uploadFile.name);
      formData.append('poliza', String(polizaId));
      formData.append('cliente', String(clienteId));
      formData.append('categoria', CATEGORIA_POR_TIPO_LEGAL[tipo]);

      const created = (await documentosApi.createFormData(formData)) as any;
      setSelectedDocId(created.id);
      if (!fechaEmision && created.fecha_subida) {
        setFechaEmision(String(created.fecha_subida).slice(0, 10));
      }
      toast({ title: 'Documento subido' });
      setShowUpload(false);
      await loadDocuments();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error al subir documento', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDocId) {
      toast({ title: 'Selecciona un documento de la póliza', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await documentosLegalesApi.link({
        id: existing?.id,
        cliente: clienteId,
        tipo,
        documento: selectedDocId,
        numero_documento: numeroDocumento.trim(),
        fecha_emision: fechaEmision || null,
        fecha_vencimiento: fechaVencimiento || null,
      });
      toast({ title: 'Documento vinculado' });
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error al vincular documento', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0 bg-slate-900 text-white border-slate-700 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b border-slate-700 px-6 py-4">
          <DialogTitle>Vincular documento — {tipoLabel}</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <p className="text-sm text-slate-400">
            Selecciona un documento existente en esta póliza o sube uno nuevo.
          </p>

          <Input
            placeholder="Buscar documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-800 border-slate-600"
          />

          <div className="flex max-h-[min(280px,35vh)] min-h-[140px] flex-col overflow-hidden rounded-md border border-slate-700">
            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <p className="p-4 text-sm text-slate-400 text-center">Cargando documentos...</p>
              ) : filteredDocs.length === 0 ? (
                <p className="p-4 text-sm text-slate-400 text-center">
                  No hay documentos en la póliza. Sube uno nuevo abajo.
                </p>
              ) : (
                filteredDocs.map((doc) => {
                  const selected = selectedDocId === doc.id;
                  return (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => {
                        setSelectedDocId(doc.id);
                        if (!fechaEmision && doc.fecha_subida) {
                          setFechaEmision(doc.fecha_subida.slice(0, 10));
                        }
                        if (!fechaVencimiento && doc.fecha_vencimiento) {
                          setFechaVencimiento(String(doc.fecha_vencimiento).slice(0, 10));
                        }
                      }}
                      className={`w-full text-left px-3 py-2.5 border-b border-slate-700 last:border-b-0 transition-colors ${
                        selected ? 'bg-violet-600/20 border-l-2 border-l-violet-500' : 'hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-sm font-medium truncate" title={doc.titulo}>
                          {doc.titulo}
                        </span>
                        {selected ? <i className="fa-solid fa-circle-check text-violet-400 text-xs shrink-0" /> : null}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex gap-2 flex-wrap">
                        <span>{CATEGORIA_LABELS[doc.categoria] || doc.categoria}</span>
                        {doc.fecha_subida ? (
                          <span>Subido: {formatIsoDateDisplay(doc.fecha_subida)}</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full border-dashed border-slate-600 text-primary hover:bg-primary/10"
            onClick={() => setShowUpload((prev) => !prev)}
          >
            <i className="fa-solid fa-upload mr-2" />
            {showUpload ? 'Ocultar formulario de carga' : 'Subir documento nuevo'}
          </Button>

          {showUpload && (
            <div className="rounded-md border border-slate-700 p-4 space-y-3 bg-slate-800/40">
              <div className="space-y-1.5">
                <Label>Título del documento</Label>
                <Input
                  value={uploadTitulo}
                  onChange={(e) => setUploadTitulo(e.target.value)}
                  className="bg-slate-800 border-slate-600"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Archivo</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
                />
                <div className="flex items-center gap-2 min-w-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Elegir archivo
                  </Button>
                  <span className="text-xs text-slate-400 truncate min-w-0">
                    {uploadFile?.name || 'Ningún archivo seleccionado'}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="bg-violet-600 hover:bg-violet-700"
                disabled={uploading || !uploadFile}
                onClick={handleUploadNew}
              >
                {uploading ? 'Subiendo...' : 'Subir y seleccionar'}
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Número de documento</Label>
              <Input
                value={numeroDocumento}
                onChange={(e) => setNumeroDocumento(e.target.value)}
                placeholder="Ej. xxx444"
                className="bg-slate-800 border-slate-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha de emisión</Label>
              <Input
                type="date"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
                className="bg-slate-800 border-slate-600"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha de vencimiento</Label>
              <Input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="bg-slate-800 border-slate-600"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-slate-700 px-6 py-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !selectedDocId}
            className="bg-violet-600 hover:bg-violet-700"
          >
            {saving ? 'Guardando...' : 'Vincular documento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
