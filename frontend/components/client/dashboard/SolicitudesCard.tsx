'use client';

import { useRef, useState } from 'react';
import {
  Upload,
  FileText,
  Clock3,
  ClipboardList,
  Eye,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DocumentPreviewModal } from '@/components/polizas/DocumentPreviewModal';
import { portalClienteApi, type PortalClienteDashboard } from '@/lib/api';
import { DOCUMENTO_CATEGORIAS, cardClass, clientLight, previewFileType } from './constants';
import { StatusPill } from './shared';

interface SolicitudesCardProps {
  data: PortalClienteDashboard;
  polizaId: number;
  miembroDocumento?: { clienteId: number; nombre: string } | null;
  onClearMiembroDocumento: () => void;
  onRefresh: () => Promise<void>;
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

export function SolicitudesCard({
  data,
  polizaId,
  miembroDocumento,
  onClearMiembroDocumento,
  onRefresh,
  onError,
  onSuccess,
}: SolicitudesCardProps) {
  const [docTitulo, setDocTitulo] = useState('');
  const [docCategoria, setDocCategoria] = useState('IDENTIFICACION');
  const [docComentario, setDocComentario] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewTitle, setPreviewTitle] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<'pdf' | 'jpg' | 'png' | 'doc'>('pdf');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [editDoc, setEditDoc] = useState<NonNullable<PortalClienteDashboard['documentos_solicitados']>[number] | null>(null);
  const [editTitulo, setEditTitulo] = useState('');
  const [editCategoria, setEditCategoria] = useState('IDENTIFICACION');
  const [editComentario, setEditComentario] = useState('');
  const [editFile, setEditFile] = useState<File | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const documentos = data.documentos_solicitados ?? [];
  const cambiosPendientes = data.cambios_pendientes ?? [];

  const handleSubmitDocumento = async () => {
    if (!docTitulo.trim() || !docFile) return;
    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('poliza_id', String(polizaId));
      formData.append('titulo', docTitulo.trim());
      formData.append('categoria', docCategoria);
      formData.append('archivo', docFile);
      if (docComentario.trim()) formData.append('comentario', docComentario.trim());
      if (miembroDocumento?.clienteId) {
        formData.append('miembro_cliente_id', String(miembroDocumento.clienteId));
      }

      const result = await portalClienteApi.solicitarDocumento(formData);
      onSuccess(result.mensaje || 'Documento enviado para revisión.');
      setDocTitulo('');
      setDocComentario('');
      setDocFile(null);
      onClearMiembroDocumento();
      if (fileInputRef.current) fileInputRef.current.value = '';
      await onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'No se pudo enviar el documento');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const openPreview = async (documentoId: number, titulo: string) => {
    setPreviewTitle(titulo);
    setPreviewOpen(true);
    setPreviewLoading(true);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    try {
      const { blob, contentType } = await portalClienteApi.fetchDocumentoPreview(documentoId);
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewType(previewFileType(contentType));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'No se pudo cargar la vista previa');
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDeleteDocumento = async (documentoId: number) => {
    if (!confirm('¿Eliminar este documento y su solicitud asociada?')) return;
    try {
      await portalClienteApi.eliminarDocumento(documentoId);
      onSuccess('Documento eliminado correctamente.');
      await onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'No se pudo eliminar el documento');
    }
  };

  const handleCancelarCambio = async (cambioId: number) => {
    if (!confirm('¿Cancelar esta solicitud?')) return;
    try {
      await portalClienteApi.cancelarSolicitud(cambioId);
      onSuccess('Solicitud cancelada correctamente.');
      await onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'No se pudo cancelar la solicitud');
    }
  };

  const openEditDocumento = (doc: NonNullable<PortalClienteDashboard['documentos_solicitados']>[number]) => {
    setEditDoc(doc);
    setEditTitulo(doc.titulo);
    setEditCategoria(doc.categoria);
    setEditComentario('');
    setEditFile(null);
  };

  const handleSaveEditDocumento = async () => {
    if (!editDoc) return;
    setIsSavingEdit(true);
    try {
      const formData = new FormData();
      if (editTitulo.trim()) formData.append('titulo', editTitulo.trim());
      if (editCategoria) formData.append('categoria', editCategoria);
      if (editComentario.trim()) formData.append('comentario', editComentario.trim());
      if (editFile) formData.append('archivo', editFile);
      await portalClienteApi.actualizarDocumento(editDoc.id, formData);
      onSuccess('Documento actualizado correctamente.');
      setEditDoc(null);
      await onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'No se pudo actualizar el documento');
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <>
      <Card className={`lg:col-span-3 ${cardClass}`}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-[#0f172a]">
            <ClipboardList className="h-5 w-5 text-emerald-600" /> Solicitudes y documentos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
                <Upload className="h-4 w-4 text-emerald-600" /> Enviar documento para revisión
              </p>
              {miembroDocumento ? (
                <span className="text-xs rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 font-medium">
                  Para: {miembroDocumento.nombre}
                </span>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="docTitulo" className={clientLight.label}>Nombre del documento</Label>
                <Input
                  id="docTitulo"
                  value={docTitulo}
                  onChange={(e) => setDocTitulo(e.target.value)}
                  placeholder="Ej. INE actualizada"
                  className={clientLight.input}
                />
              </div>
              <div className="space-y-2">
                <Label className={clientLight.label}>Categoría</Label>
                <Select value={docCategoria} onValueChange={setDocCategoria}>
                  <SelectTrigger className={clientLight.selectTrigger}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={clientLight.selectContent}>
                    {DOCUMENTO_CATEGORIAS.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value} className={clientLight.selectItem}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="docComentario" className={clientLight.label}>Comentario (opcional)</Label>
              <Textarea
                id="docComentario"
                value={docComentario}
                onChange={(e) => setDocComentario(e.target.value)}
                rows={2}
                className={clientLight.textarea}
              />
            </div>

            <div
              className="rounded-xl border-2 border-dashed border-[#cbd5e1] bg-white p-5 text-center cursor-pointer hover:border-emerald-400"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-7 w-7 text-emerald-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-[#0f172a]">
                {docFile ? docFile.name : 'Seleccionar archivo (PDF, JPG, PNG)'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => setDocFile(e.target.files?.[0] || null)}
              />
            </div>

            <Button
              className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto"
              disabled={isUploadingDoc || !docTitulo.trim() || !docFile}
              onClick={handleSubmitDocumento}
            >
              {isUploadingDoc ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" /> Enviar documento
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Documentos enviados</p>
              {documentos.length === 0 ? (
                <p className="text-sm text-[#64748b] rounded-lg border border-dashed border-[#e2e8f0] px-3 py-4 text-center">
                  Aún no ha enviado documentos.
                </p>
              ) : (
                documentos.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5"
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <FileText className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0f172a] break-words">{doc.titulo}</p>
                        <p className="text-xs text-[#64748b] flex items-center gap-1">
                          <Clock3 className="h-3 w-3" />
                          {doc.fecha_subida ? new Date(doc.fecha_subida).toLocaleDateString('es-MX') : 'Reciente'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill label={doc.estado_display || doc.estado_documento} />
                      {doc.tiene_archivo ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-8 ${clientLight.outlineButton}`}
                          onClick={() => openPreview(doc.id, doc.titulo)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> Ver
                        </Button>
                      ) : null}
                      {doc.puede_modificar ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-8 ${clientLight.outlineButton}`}
                          onClick={() => openEditDocumento(doc)}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                        </Button>
                      ) : null}
                      {doc.puede_eliminar ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-8 ${clientLight.outlineButtonDanger}`}
                          onClick={() => handleDeleteDocumento(doc.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Cambios de vida pendientes</p>
              {cambiosPendientes.length === 0 ? (
                <p className="text-sm text-[#64748b] rounded-lg border border-dashed border-[#e2e8f0] px-3 py-4 text-center">
                  No tiene solicitudes pendientes.
                </p>
              ) : (
                cambiosPendientes.map((cambio) => (
                  <div
                    key={cambio.id}
                    className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5"
                  >
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <ClipboardList className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#0f172a] break-words">{cambio.resumen}</p>
                        <p className="text-xs text-[#64748b] mt-0.5">{cambio.tipo_display}</p>
                        {cambio.descripcion ? (
                          <p className="text-xs text-[#94a3b8] mt-1 line-clamp-2">{cambio.descripcion}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill label={cambio.estado_display || cambio.estado} />
                      {cambio.documento_id && cambio.tipo_solicitud === 'DOCUMENTO' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-8 ${clientLight.outlineButton}`}
                          onClick={() => openPreview(cambio.documento_id!, cambio.resumen)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> Ver doc.
                        </Button>
                      ) : null}
                      {cambio.puede_eliminar ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className={`h-8 ${clientLight.outlineButtonDanger}`}
                          onClick={() => handleCancelarCambio(cambio.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" /> Cancelar
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <DocumentPreviewModal
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open && previewUrl) {
            URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }
        }}
        title={previewTitle}
        url={previewUrl}
        fileType={previewType}
        loading={previewLoading}
      />

      <Dialog open={Boolean(editDoc)} onOpenChange={(open) => !open && setEditDoc(null)}>
        <DialogContent className={`sm:max-w-md max-h-[90vh] overflow-y-auto ${clientLight.dialog}`}>
          <DialogHeader>
            <DialogTitle className={clientLight.dialogTitle}>Editar documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className={clientLight.label}>Título</Label>
              <Input value={editTitulo} onChange={(e) => setEditTitulo(e.target.value)} className={clientLight.input} />
            </div>
            <div className="space-y-2">
              <Label className={clientLight.label}>Categoría</Label>
              <Select value={editCategoria} onValueChange={setEditCategoria}>
                <SelectTrigger className={clientLight.selectTrigger}><SelectValue /></SelectTrigger>
                <SelectContent className={clientLight.selectContent}>
                  {DOCUMENTO_CATEGORIAS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className={clientLight.selectItem}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className={clientLight.label}>Comentario</Label>
              <Textarea value={editComentario} onChange={(e) => setEditComentario(e.target.value)} rows={2} className={clientLight.textarea} />
            </div>
            <div className="space-y-2">
              <Label className={clientLight.label}>Reemplazar archivo (opcional)</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => setEditFile(e.target.files?.[0] || null)} className={clientLight.input} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditDoc(null)} className={clientLight.outlineButton}>
              Cancelar
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={isSavingEdit} onClick={handleSaveEditDocumento}>
              {isSavingEdit ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
