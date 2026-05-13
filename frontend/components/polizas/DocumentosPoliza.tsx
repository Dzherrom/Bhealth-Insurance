'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Upload, 
  Search, 
  Download, 
  Eye, 
  Trash2,
  FolderOpen
} from 'lucide-react';
import { documentosApi } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';

interface Documento {
  id: number;
  nombre: string;
  tipo: 'pdf' | 'jpg' | 'png' | 'doc';
  categoria: string;
  fechaCargado: string;
  cargadoPor: string;
}

interface DocumentosPolizaProps {
  polizaId?: string;
}

const CATEGORIAS = [
  { id: 'CARTA_MERCADO', label: 'Carta de Mercado' },
  { id: 'ASEGURANZA', label: 'Aseguranza' },
  { id: 'CITAS_MEDICAS', label: 'Citas Médicas' },
  { id: 'BILLS', label: 'Bills' },
  { id: 'IDENTIFICACION', label: 'Identificación' },
  { id: 'ESTATUS_MIGRATORIO', label: 'Estatus Migratorio' },
  { id: 'CONSENTIMIENTO', label: 'Consentimiento' },
  { id: 'OTRO', label: 'Otro' },
];

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

export function DocumentosPoliza({ polizaId }: DocumentosPolizaProps) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuthStore();

  useEffect(() => {
    loadDocumentos();
  }, [polizaId]);

  const loadDocumentos = async () => {
    if (!polizaId) return;
    setIsLoadingDocs(true);
    try {
      const todos = await documentosApi.list();
      let docs = (todos as any[]);
      if ((todos as any).results) docs = (todos as any).results;

      const dePoliza = docs.filter(d => String(d.poliza) === String(polizaId));
      
      setDocumentos(dePoliza.map((d: any) => ({
        id: d.id ?? 0,
        nombre: d.titulo || d.archivo?.split('/').pop() || 'Documento',
        tipo: 'pdf', // mock logic
        categoria: d.categoria || 'OTRO',
        fechaCargado: new Date(d.fecha_subida).toLocaleString('es-ES') ?? 'Sin fecha',
        cargadoPor: d.subido_por_nombre || `Usuario #${d.subido_por}`,
      })));
    } catch (err) {
      console.error('Error al cargar documentos:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleDescargar = async (documento: Documento) => {
    try {
      const apiDoc = await documentosApi.get(documento.id) as any;
      if (apiDoc?.archivo) {
        window.open(apiDoc.archivo, '_blank');
      } else {
        toast({ title: 'Archivo no disponible', variant: 'destructive' });
      }
    } catch (err) {
      console.error('Error al descargar:', err);
    }
  };

  const handleEliminar = async (documento: Documento) => {
    if(!window.confirm('¿Seguro de eliminar este documento?')) return;
    try {
      await documentosApi.delete(documento.id);
      toast({ title: 'Documento eliminado' });
      setDocumentos(prev => prev.filter(doc => doc.id !== documento.id));
    } catch (err) {
      console.error('Error al eliminar:', err);
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !polizaId) return;

    if (!categoriaSeleccionada) {
      toast({ title: 'Selecciona una categoría (carpeta) primero', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('archivo', file);
      formData.append('titulo', file.name);
      formData.append('poliza', polizaId);
      formData.append('categoria', categoriaSeleccionada);
      if (user?.id) formData.append('subido_por', String(user.id));

      await (documentosApi as any).createRaw(formData);
      toast({ title: 'Documento subido' });
      loadDocumentos();
    } catch(err) {
      console.error('Error uploading:', err);
      toast({ title: 'Error al subir documento', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if(fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getDocCount = (catId: string) => documentos.filter(d => d.categoria === catId).length;

  const docsMostrados = documentos
    .filter(doc => categoriaSeleccionada ? doc.categoria === categoriaSeleccionada : true)
    .filter(doc => doc.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Directorios de Documentos</CardTitle>
        <p className="text-sm text-gray-500">Selecciona una carpeta para ver o subir documentos.</p>
        
        {/* Carpetas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {CATEGORIAS.map(cat => (
            <Button
              key={cat.id}
              variant={categoriaSeleccionada === cat.id ? 'default' : 'outline'}
              className="flex items-center justify-between h-auto py-3 px-4"
              onClick={() => setCategoriaSeleccionada(cat.id === categoriaSeleccionada ? null : cat.id)}
            >
              <div className="flex items-center space-x-2">
                <FolderOpen className="w-5 h-5 text-amber-500" />
                <span className="text-sm truncate w-24 text-left">{cat.label}</span>
              </div>
              <Badge variant="secondary">{getDocCount(cat.id)}</Badge>
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Barra de herramientas */}
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
          
          {categoriaSeleccionada && (
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
            {categoriaSeleccionada 
              ? 'La carpeta está vacía.' 
              : 'Selecciona una carpeta o no hay documentos.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Nombre de archivo</TableHead>
                  <TableHead>Etiqueta</TableHead>
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
                        Documento
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
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDescargar(documento)} title="Descargar">
                          <Eye className="w-4 h-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-700 text-red-500" onClick={() => handleEliminar(documento)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}