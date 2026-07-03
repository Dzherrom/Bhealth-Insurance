'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Upload,
  Search,
  Eye,
  Trash2,
  FolderOpen,
  Plus,
  Pencil,
} from 'lucide-react';
import { carpetasDocumentosApi, documentosApi, resolveApiMediaUrl, type CarpetaDocumento } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface Documento {
  id: number;
  nombre: string;
  tipo: 'pdf' | 'jpg' | 'png' | 'doc';
  categoria: string;
  carpeta?: number | null;
  fechaCargado: string;
  cargadoPor: string;
  archivoUrl?: string;
  descargaBloqueada?: boolean;
}

interface DocumentosPolizaProps {
  polizaId?: string;
  onDocumentsChange?: () => void;
}

const getFileIcon = (tipo: string) => {
  switch (tipo) {
    case 'pdf':
      return <FileText className="w-4 h-4 text-red-500" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
      return <FileText className="w-4 h-4 text-green-500" />;
    default:
      return <FileText className="w-4 h-4 text-gray-500" />;
  }
};

const inferFileType = (fileName: string): Documento['tipo'] => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'png') return 'png';
  if (['jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return 'jpg';
  return 'doc';
};

const DOCS_PER_PAGE = 20;

const mapApiDocumento = (d: any): Documento => {
  const nombre = d.titulo || d.archivo?.split('/').pop() || 'Documento';

  return {
    id: d.id ?? 0,
    nombre,
    tipo: inferFileType(nombre),
    categoria: d.categoria || 'OTRO',
    carpeta: d.carpeta ?? null,
    fechaCargado: d.fecha_subida
      ? new Date(d.fecha_subida).toLocaleString('es-ES')
      : 'Sin fecha',
    cargadoPor: d.subido_por_username || (d.subido_por ? `Usuario #${d.subido_por}` : 'Sistema'),
    archivoUrl: resolveApiMediaUrl(d.archivo),
    descargaBloqueada: Boolean(d.descarga_bloqueada),
  };
};

export function DocumentosPoliza({ polizaId, onDocumentsChange }: DocumentosPolizaProps) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [carpetas, setCarpetas] = useState<CarpetaDocumento[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [carpetaSeleccionada, setCarpetaSeleccionada] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<CarpetaDocumento | null>(null);
  const [folderName, setFolderName] = useState('');
  const [savingFolder, setSavingFolder] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Documento | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    if (!polizaId) return;
    setIsLoadingDocs(true);
    try {
      const [docs, folders] = await Promise.all([
        documentosApi.listByPoliza(polizaId),
        carpetasDocumentosApi.listByPoliza(polizaId),
      ]);
      setDocumentos(docs.map(mapApiDocumento));
      setCarpetas(folders);
    } catch (err) {
      console.error('Error al cargar documentos:', err);
      toast({
        title: 'Error al cargar documentos',
        description: 'No se pudieron obtener los documentos de esta póliza.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingDocs(false);
    }
  }, [polizaId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [carpetaSeleccionada, searchTerm]);

  const closePreview = () => {
    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }
    setPreviewBlobUrl(null);
    setPreviewDoc(null);
    setPreviewLoading(false);
  };

  const selectedFolder = carpetas.find((c) => c.id === carpetaSeleccionada) || null;

  const handlePreview = async (documento: Documento) => {
    if (documento.descargaBloqueada) {
      toast({
        title: 'Vista previa no permitida',
        description: 'No tienes permisos para ver este documento.',
        variant: 'destructive',
      });
      return;
    }

    if (previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
    }

    setPreviewDoc(documento);
    setPreviewBlobUrl(null);
    setPreviewLoading(true);

    try {
      const { blob } = await documentosApi.fetchPreviewBlob(documento.id);
      const objectUrl = URL.createObjectURL(blob);
      setPreviewBlobUrl(objectUrl);
    } catch (err) {
      console.error('Error al abrir vista previa:', err);
      toast({ title: 'Error al abrir el documento', variant: 'destructive' });
      setPreviewDoc(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleEliminar = async (documento: Documento) => {
    if (!window.confirm('¿Seguro de eliminar este documento?')) return;
    try {
      await documentosApi.delete(documento.id);
      toast({ title: 'Documento eliminado' });
      await loadData();
      onDocumentsChange?.();
    } catch (err) {
      console.error('Error al eliminar:', err);
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !polizaId || !carpetaSeleccionada || !selectedFolder) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('archivo', file);
      formData.append('titulo', file.name);
      formData.append('poliza', polizaId);
      formData.append('carpeta', String(carpetaSeleccionada));
      formData.append('categoria', selectedFolder.codigo || 'OTRO');

      await documentosApi.createFormData(formData);
      toast({ title: 'Documento subido' });
      await loadData();
      onDocumentsChange?.();
    } catch (err) {
      console.error('Error uploading:', err);
      toast({
        title: 'Error al subir documento',
        description: err instanceof Error ? err.message : 'No se pudo guardar el archivo.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const openCreateFolder = () => {
    setEditingFolder(null);
    setFolderName('');
    setFolderDialogOpen(true);
  };

  const openEditFolder = (folder: CarpetaDocumento) => {
    setEditingFolder(folder);
    setFolderName(folder.nombre);
    setFolderDialogOpen(true);
  };

  const handleSaveFolder = async () => {
    if (!polizaId || !folderName.trim()) return;
    setSavingFolder(true);
    try {
      if (editingFolder?.id) {
        await carpetasDocumentosApi.update(editingFolder.id, { nombre: folderName.trim() });
        toast({ title: 'Carpeta actualizada' });
      } else {
        await carpetasDocumentosApi.create({
          poliza: Number(polizaId),
          nombre: folderName.trim(),
        });
        toast({ title: 'Carpeta creada' });
      }
      setFolderDialogOpen(false);
      await loadData();
    } catch (err) {
      toast({
        title: 'Error al guardar carpeta',
        description: err instanceof Error ? err.message : 'No se pudo guardar la carpeta.',
        variant: 'destructive',
      });
    } finally {
      setSavingFolder(false);
    }
  };

  const handleDeleteFolder = async (folder: CarpetaDocumento) => {
    if (!folder.id) return;
    const count = getDocCount(folder.id);
    if (count > 0) {
      toast({
        title: 'Carpeta no vacía',
        description: 'Solo puedes eliminar carpetas sin documentos.',
        variant: 'destructive',
      });
      return;
    }
    if (!window.confirm(`¿Eliminar la carpeta "${folder.nombre}"?`)) return;
    try {
      await carpetasDocumentosApi.delete(folder.id);
      if (carpetaSeleccionada === folder.id) setCarpetaSeleccionada(null);
      toast({ title: 'Carpeta eliminada' });
      await loadData();
    } catch (err) {
      toast({
        title: 'Error al eliminar carpeta',
        description: err instanceof Error ? err.message : 'No se pudo eliminar la carpeta.',
        variant: 'destructive',
      });
    }
  };

  const getDocCount = (carpetaId: number) =>
    documentos.filter((d) => d.carpeta === carpetaId).length;

  const docsFiltrados = documentos
    .filter((doc) => (carpetaSeleccionada ? doc.carpeta === carpetaSeleccionada : true))
    .filter((doc) => doc.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalPages = Math.max(1, Math.ceil(docsFiltrados.length / DOCS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const docsMostrados = docsFiltrados.slice(
    (safePage - 1) * DOCS_PER_PAGE,
    safePage * DOCS_PER_PAGE,
  );

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold">Directorios de Documentos</CardTitle>
              <p className="text-sm text-gray-500">Selecciona una carpeta para ver o subir documentos.</p>
            </div>
            <Button variant="outline" size="sm" onClick={openCreateFolder}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva carpeta
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {carpetas.map((carpeta) => (
              <div key={carpeta.id} className="relative group">
                <Button
                  variant={carpetaSeleccionada === carpeta.id ? 'default' : 'outline'}
                  className="flex items-center justify-between h-auto py-3 px-4 w-full"
                  onClick={() =>
                    setCarpetaSeleccionada(carpeta.id === carpetaSeleccionada ? null : carpeta.id!)
                  }
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <FolderOpen className="w-5 h-5 text-amber-500 shrink-0" />
                    <span className="text-sm truncate text-left">{carpeta.nombre}</span>
                  </div>
                  <Badge variant="secondary">{getDocCount(carpeta.id!)}</Badge>
                </Button>
                <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                  <button
                    type="button"
                    className="rounded bg-white/90 p-1 shadow hover:bg-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditFolder(carpeta);
                    }}
                    title="Editar nombre"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  {getDocCount(carpeta.id!) === 0 && (
                    <button
                      type="button"
                      className="rounded bg-white/90 p-1 shadow hover:bg-white text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(carpeta);
                      }}
                      title="Eliminar carpeta vacía"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4 items-center justify-between">
            <div className="flex-1 relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Buscar documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {carpetaSeleccionada && (
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? 'Subiendo...' : 'Subir Documento'}
                </Button>
              </div>
            )}
          </div>

          {isLoadingDocs ? (
            <p className="text-center text-gray-500 py-8">Cargando documentos...</p>
          ) : docsMostrados.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              {carpetaSeleccionada
                ? 'La carpeta está vacía.'
                : documentos.length === 0
                  ? 'No hay documentos en esta póliza.'
                  : 'Selecciona una carpeta para ver los documentos.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50%]">Nombre de archivo</TableHead>
                    <TableHead>Carpeta</TableHead>
                    <TableHead>Cargado Por</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docsMostrados.map((documento) => (
                    <TableRow key={documento.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {getFileIcon(documento.tipo)}
                          <p className="font-medium text-sm truncate max-w-[200px]" title={documento.nombre}>
                            {documento.nombre}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {carpetas.find((c) => c.id === documento.carpeta)?.nombre || documento.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-700">{documento.cargadoPor}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-500">{documento.fechaCargado}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handlePreview(documento)}
                            title="Vista previa"
                            disabled={documento.descargaBloqueada}
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:text-red-700 text-red-500"
                            onClick={() => handleEliminar(documento)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {docsFiltrados.length > DOCS_PER_PAGE && (
                <div className="flex items-center justify-between gap-4 mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Mostrando {(safePage - 1) * DOCS_PER_PAGE + 1}–
                    {Math.min(safePage * DOCS_PER_PAGE, docsFiltrados.length)} de {docsFiltrados.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-gray-600">
                      Página {safePage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={safePage >= totalPages}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFolder ? 'Editar carpeta' : 'Nueva carpeta'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="folderName">Nombre</Label>
            <Input
              id="folderName"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Nombre de la carpeta"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveFolder} disabled={savingFolder || !folderName.trim()}>
              {savingFolder ? 'Guardando...' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DocumentPreviewModal
        open={Boolean(previewDoc)}
        onOpenChange={(open) => !open && closePreview()}
        title={previewDoc?.nombre || 'Documento'}
        url={previewBlobUrl}
        fileType={previewDoc?.tipo}
        loading={previewLoading}
      />
    </>
  );
}
