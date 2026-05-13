"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";

interface Etiqueta {
  id: number;
  nombre: string;
  color: string;
}

export function EtiquetasConfig() {
  const [etiquetas, setEtiquetas] = useState<Etiqueta[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({ nombre: '', color: '#3b82f6' });

  useEffect(() => {
    fetchEtiquetas();
  }, []);

  const fetchEtiquetas = async () => {
    try {
      const res = await api.get('/etiquetas/');
      setEtiquetas(res.data);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar las etiquetas', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        const res = await api.put(/etiquetas/ + editingId + /, formData);
        setEtiquetas(prev => prev.map(e => e.id === editingId ? res.data : e));
        toast({ title: 'Éxito', description: 'Etiqueta actualizada' });
      } else {
        const res = await api.post('/etiquetas/', formData);
        setEtiquetas(prev => [...prev, res.data]);
        toast({ title: 'Éxito', description: 'Etiqueta creada' });
      }
      resetForm();
    } catch (error) {
      toast({ title: 'Error', description: 'Error al guardar la etiqueta', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que desea eliminar esta etiqueta?')) return;
    try {
      await api.delete(/etiquetas/ + id + /);
      setEtiquetas(prev => prev.filter(e => e.id !== id));
      toast({ title: 'Éxito', description: 'Etiqueta eliminada' });
    } catch (error) {
      toast({ title: 'Error', description: 'Error al eliminar', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({ nombre: '', color: '#3b82f6' });
    setIsAdding(false);
    setEditingId(null);
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Etiquetas (Tags)</CardTitle>
            <CardDescription>Administra las etiquetas para clasificar documentos y pólizas.</CardDescription>
          </div>
          <Button onClick={() => setIsAdding(true)} disabled={isAdding || editingId !== null}>
            <Plus className="w-4 h-4 mr-2" /> Nueva Etiqueta
          </Button>
        </CardHeader>
        <CardContent>
          {(isAdding || editingId !== null) && (
            <div className="flex items-center gap-4 mb-6 p-4 border rounded bg-slate-50">
              <div className="flex-1">
                <label className="text-sm font-medium">Nombre</label>
                <Input 
                  value={formData.nombre} 
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <Input 
                  type="color"
                  className="w-16 h-10 p-1"
                  value={formData.color} 
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                />
              </div>
              <div className="mt-5 flex gap-2">
                <Button onClick={handleSave}>Guardar</Button>
                <Button variant="outline" onClick={resetForm}>Cancelar</Button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {etiquetas.map(e => (
              <div key={e.id} className="flex items-center justify-between p-3 border rounded hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: e.color }} />
                  <span className="font-medium">{e.nombre}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => {
                    setEditingId(e.id);
                    setFormData({ nombre: e.nombre, color: e.color });
                    setIsAdding(false);
                  }}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-red-500" onClick={() => handleDelete(e.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
            {etiquetas.length === 0 && <p className="text-slate-500 text-sm">No hay etiquetas configuradas.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}