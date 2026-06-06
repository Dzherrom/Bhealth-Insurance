"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { etiquetasApi } from "@/lib/api";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import { Etiqueta } from '@/types';
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
      if ('id' in etiqueta) {
        const updated = await etiquetasApi.update(etiqueta.id, { ...etiqueta, tipo });
        setEtiquetas(prev => prev.map(e => e.id === etiqueta.id ? updated : e));
        toast({ title: 'Éxito', description: 'Etiqueta actualizada' });
      } else {
        const newEtiqueta = await etiquetasApi.create({ ...etiqueta, tipo });
        setEtiquetas(prev => [...prev, newEtiqueta]);
        toast({ title: 'Éxito', description: 'Etiqueta creada' });
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
      toast({ title: 'Éxito', description: 'Etiqueta eliminada' });
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
            <thead>
              <tr className="text-left border-b">
                <th className="p-4 font-semibold">Nombre</th>
                <th className="p-4 font-semibold">Color</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {etiquetas.map(etiqueta => (
                <tr key={etiqueta.id} className="border-b">
                  <td className="p-4">
                    <Badge style={{ backgroundColor: etiqueta.color, color: 'white' }}>
                      {etiqueta.nombre}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {(() => {
                        const color = etiqueta.color || '#6b7280';
                        return (
                          <>
                            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                            <span className="font-mono text-sm">{color}</span>
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingEtiqueta(etiqueta); setIsModalOpen(true); }}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(etiqueta.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
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