"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { etiquetasApi, type Etiqueta } from "@/lib/api";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import { AgregarEtiquetaModal } from './AgregarEtiquetaModal';
import { Badge } from '@/components/ui/badge';

interface EtiquetasConfigProps {
  tipo: 'DOCUMENTO' | 'POLIZA';
  title: string;
  description: string;
}

export function EtiquetasConfig({ tipo, title, description }: EtiquetasConfigProps) {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEtiqueta, setEditingEtiqueta] = useState<Etiqueta | null>(null);

  useEffect(() => {
    fetchEtiquetas();
  }, [tipo]);

  const fetchEtiquetas = async () => {
    setLoading(true);
    try {
      const allEtiquetas = await etiquetasApi.list();
      console.log('Etiquetas recibidas de la API:', allEtiquetas);
      setEtiquetas(allEtiquetas.filter(e => e.tipo === tipo));
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar las etiquetas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (etiqueta: Etiqueta | Omit<Etiqueta, 'id'>) => {
    try {
      if ('id' in etiqueta && etiqueta.id != null) {
        const updated = await etiquetasApi.update(etiqueta.id, { ...etiqueta, tipo });
        setEtiquetas(prev => prev.map(e => e.id === etiqueta.id ? updated : e));
        toast({ title: 'Exito', description: 'Etiqueta actualizada' });
      } else {
        const newEtiqueta = await etiquetasApi.create({ ...etiqueta, tipo });
        setEtiquetas(prev => [...prev, newEtiqueta]);
        toast({ title: 'Exito', description: 'Etiqueta creada' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al guardar la etiqueta', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que desea eliminar esta etiqueta?')) return;
    try {
      await etiquetasApi.delete(id);
      setEtiquetas(prev => prev.filter(e => e.id !== id));
      toast({ title: 'Exito', description: 'Etiqueta eliminada' });
    } catch (error) {
      toast({ title: 'Error', description: 'Error al eliminar', variant: 'destructive' });
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button onClick={() => { setEditingEtiqueta(null); setIsModalOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Nueva Etiqueta
          </Button>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#0f172a]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Color
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#1e293b] divide-y divide-gray-200 dark:divide-[#334155]">
              {etiquetas.map(etiqueta => (
                <tr key={etiqueta.id} className="hover:bg-gray-50 dark:hover:bg-[#0f172a]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {etiqueta.nombre}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: etiqueta.color || '#6b7280' }}
                    />
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingEtiqueta(etiqueta); setIsModalOpen(true); }}>Editar</Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => etiqueta.id != null && handleDelete(etiqueta.id)}>Eliminar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      <AgregarEtiquetaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        etiquetaToEdit={editingEtiqueta}
      />
    </div>
  );
}