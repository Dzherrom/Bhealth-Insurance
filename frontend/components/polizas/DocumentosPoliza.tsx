'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  FileText, 
  Upload, 
  Plus, 
  Search, 
  Download, 
  Eye, 
  Trash2,
  Filter,
  ArrowUpDown
} from 'lucide-react';
import { documentosApi } from '@/lib/api';

interface Documento {
  id: number;
  nombre: string;
  tipo: 'pdf' | 'jpg' | 'png' | 'doc';
  size: string;
  fechaCargado: string;
  perteneceA: string;
  vencimiento?: string;
  cargadoPor: string;
}

interface DocumentosPolizaProps {
  polizaId?: string;
}

/* Mock data comentada — reemplazada por datos reales del API
const mockDocumentos: Documento[] = [
  {
    id: 1,
    nombre: 'Cargado - CARTAS GEORGINA - NELSON VADO VARGAS.pdf',
    tipo: 'pdf',
    size: '1.2 MB',
    fechaCargado: 'Jul 19, 2024 6:47 AM',
    perteneceA: 'NELSON VADO QwR',
    cargadoPor: 'ISAAC TORRES'
  },
  {
    id: 2,
    nombre: 'STATEMENT NELSON VADO.pdf',
    tipo: 'pdf',
    size: '847 KB',
    fechaCargado: 'Jul 19, 2024 6:47 AM',
    perteneceA: 'NELSON VADO QwR',
    cargadoPor: 'Nelson Vasquez'
  },
  {
    id: 3,
    nombre: 'Nelson vado TARJETAS [NUEVO].pdf',
    tipo: 'pdf',
    size: '756 KB',
    fechaCargado: 'Jul 19, 2024 6:47 AM',
    perteneceA: 'NELSON VADO QwR',
    cargadoPor: 'Frank Mejlan'
  },
  {
    id: 4,
    nombre: 'DOC NELSON VADO [SOCIAL].jpeg',
    tipo: 'jpg',
    size: '245 KB',
    fechaCargado: 'Jul 19, 2024 6:47 AM',
    perteneceA: 'NELSON VADO QwR',
    cargadoPor: 'Nelson Vasquez'
  },
  {
    id: 5,
    nombre: 'DOC NELSON VADO [PREMIER].jpeg',
    tipo: 'jpg',
    size: '298 KB',
    fechaCargado: 'Jul 19, 2024 6:47 AM',
    perteneceA: 'NELSON VADO QwR',
    cargadoPor: 'Nelson Vasquez'
  },
  {
    id: 6,
    nombre: 'Cargado - CARTAS DE GEORGINA NELSON VADO.pdf',
    tipo: 'pdf',
    size: '1.1 MB',
    fechaCargado: 'Jul 19, 2024 6:47 AM',
    perteneceA: 'NELSON VADO QwR',
    cargadoPor: 'Nelson Vasquez'
  },
  {
    id: 7,
    nombre: 'CARTAS DE GEORGINA NELSON VADO.pdf',
    tipo: 'pdf',
    size: '934 KB',
    fechaCargado: 'Jul 19, 2024 6:47 AM',
    perteneceA: 'NELSON VADO QwR',
    cargadoPor: 'Nelson Vasquez'
  },
  {
    id: 8,
    nombre: 'NELSON VADO - ID CARD ACTUALIZADA.pdf',
    tipo: 'pdf',
    size: '687 KB',
    fechaCargado: 'Jul 19, 2024 6:47 AM',
    perteneceA: 'NELSON VADO QwR',
    cargadoPor: 'SAMUEL PORTOJA'
  },
  {
    id: 9,
    nombre: 'Summary.pdf',
    tipo: 'pdf',
    size: '512 KB',
    fechaCargado: 'Jul 19, 2024 6:47 AM',
    perteneceA: 'NELSON VADO QwR',
    cargadoPor: 'Nelson Vasquez'
  },
  {
    id: 10,
    nombre: 'CARTAS, GEORGINA.pdf',
    tipo: 'pdf',
    size: '456 KB',
    fechaCargado: 'Jul 19, 2024 6:47 AM',
    perteneceA: 'NELSON VADO QwR',
    cargadoPor: 'Nelson Vasquez'
  },
  {
    id: 11,
    nombre: 'Cita para NELSON VADO - Cardiologo.pdf',
    tipo: 'pdf',
    size: '789 KB',
    fechaCargado: 'Dec 18, 2025 4:23 PM',
    perteneceA: 'NELSON VADO QwR',
    cargadoPor: 'Samuel/ExcluSion Member'
  },
  {
    id: 12,
    nombre: 'REFERENCIA CARDIOLOGO NELSON VADO.jpeg',
    tipo: 'jpg',
    size: '234 KB',
    fechaCargado: 'Nov 14, 2025 7:31 PM',
    perteneceA: 'NELSON VADO QwR',
    cargadoPor: 'Nelson Vasquez'
  },
  {
    id: 13,
    nombre: 'REFERENCIA CARDIOLOGO NELSON VADO 2.jpeg',
    tipo: 'jpg',
    size: '267 KB',
    fechaCargado: 'Nov 14, 2025 7:31 PM',
    perteneceA: 'NELSON VADO QwR',
    cargadoPor: 'Nelson Vasquez'
  },
  {
    id: 14,
    nombre: 'Cita de Nelson vado 1.pdf',
    tipo: 'pdf',
    size: '345 KB',
    fechaCargado: 'May 05, 2025 1:23 PM',
    perteneceA: 'NELSON VADO QwR',
    cargadoPor: 'JUANL A. OSMART MIEMBRO'
  },
  {
    id: 15,
    nombre: 'Cita de Nelson vado.pdf',
    tipo: 'pdf',
    size: '423 KB',
    fechaCargado: 'May 05, 2025 1:23 PM',
    perteneceA: 'NELSON VADO QwR',
    cargadoPor: 'JUANL A. OSMART MIEMBRO'
  },
  {
    id: 16,
    nombre: 'NELSON VADO HOSPITALES.pdf',
    tipo: 'pdf',
    size: '612 KB',
    fechaCargado: 'Apr 04, 2025 2:56 PM',
    perteneceA: 'NELSON VADO QwR',
    cargadoPor: 'ADMINISTRACION ACTIVOS'
  }
];
*/

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
  const [mostrarCantidad, setMostrarCantidad] = useState('50');

  useEffect(() => {
    const loadDocumentos = async () => {
      setIsLoadingDocs(true);
      try {
        const todos = await documentosApi.list();
        const dePoliza = (todos as any[]).filter(
          d => polizaId ? String(d.poliza) === String(polizaId) : true
        );
        setDocumentos(dePoliza.map((d: any) => ({
          id: d.id ?? 0,
          nombre: d.nombre,
          tipo: (['pdf', 'jpg', 'png', 'doc'].includes(
            (d.tipo ?? '').toLowerCase()
          ) ? (d.tipo ?? '').toLowerCase() : 'pdf') as Documento['tipo'],
          size: 'N/A',
          fechaCargado: d.fecha_subida ?? 'Sin fecha',
          perteneceA: d.poliza ? `Póliza #${d.poliza}` : 'Sin asignar',
          cargadoPor: d.usuario ? `Usuario #${d.usuario}` : 'Desconocido',
          vencimiento: undefined,
        })));
      } catch (err) {
        console.error('Error al cargar documentos:', err);
      } finally {
        setIsLoadingDocs(false);
      }
    };
    loadDocumentos();
  }, [polizaId]);

  const documentosFiltrados = documentos.filter(doc =>
    doc.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.perteneceA.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.cargadoPor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDescargar = async (documento: Documento) => {
    try {
      const apiDoc = await documentosApi.get(documento.id) as any;
      if (apiDoc?.archivo) {
        const link = document.createElement('a');
        link.href = apiDoc.archivo;
        link.download = documento.nombre;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Error al descargar:', err);
    }
  };

  const handleVer = (documento: Documento) => {
    console.log(`Viendo: ${documento.nombre}`);
  };

  const handleEliminar = async (documento: Documento) => {
    try {
      await documentosApi.delete(documento.id);
      setDocumentos(prev => prev.filter(doc => doc.id !== documento.id));
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Documentos de Póliza</CardTitle>
        
        {/* Barra de herramientas */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          {/* Búsqueda */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Escribir aquí para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Filtros y acciones */}
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Mostrar:</span>
              <Select value={mostrarCantidad} onValueChange={setMostrarCantidad}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo
            </Button>
            
            <Button variant="default" size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Subir
            </Button>
          </div>
        </div>
        
        {/* Información de resultados */}
        <div className="text-sm text-gray-600">
          Mostrando 1 a {Math.min(parseInt(mostrarCantidad), documentosFiltrados.length)} de {documentosFiltrados.length} entradas
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Tabla de documentos */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">
                  <div className="flex items-center gap-2">
                    Nombre de archivo
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    Cargado
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    Pertenece a
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    Vencimiento
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="text-center">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documentosFiltrados.slice(0, parseInt(mostrarCantidad)).map((documento) => (
                <TableRow key={documento.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {getFileIcon(documento.tipo)}
                      <div>
                        <p className="font-medium text-sm">{documento.nombre}</p>
                        <p className="text-xs text-gray-500">{documento.size}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">{documento.cargadoPor}</p>
                      <p className="text-xs text-gray-500">{documento.fechaCargado}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {documento.perteneceA}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500">-</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVer(documento)}
                        className="h-8 w-8 p-0"
                        title="Ver documento"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDescargar(documento)}
                        className="h-8 w-8 p-0"
                        title="Descargar"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEliminar(documento)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {documentosFiltrados.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No se encontraron documentos</p>
            <p className="text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}