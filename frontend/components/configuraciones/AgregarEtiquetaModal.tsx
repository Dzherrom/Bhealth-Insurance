'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Etiqueta } from '@/types';

interface AgregarEtiquetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (etiqueta: Etiqueta | Omit<Etiqueta, 'id'>) => void;
  etiquetaToEdit?: Etiqueta | null;
}

const coloresDisponibles = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#6b7280',
];

export function AgregarEtiquetaModal({ isOpen, onClose, onSave, etiquetaToEdit }: AgregarEtiquetaModalProps) {
  const [formData, setFormData] = useState({ nombre: '', color: '#3b82f6' });

  useEffect(() => {
    if (etiquetaToEdit) {
      setFormData({ nombre: etiquetaToEdit.nombre, color: etiquetaToEdit.color });
    } else {
      setFormData({ nombre: '', color: '#3b82f6' });
    }
  }, [etiquetaToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (etiquetaToEdit) {
      onSave({ ...etiquetaToEdit, ...formData });
    } else {
      onSave(formData);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{etiquetaToEdit ? 'Editar Etiqueta' : 'Crear Nueva Etiqueta'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
          </div>
          <div>
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {coloresDisponibles.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full border-2 ${formData.color === color ? 'border-blue-500 ring-2 ring-blue-500' : 'border-transparent'}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit">Guardar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
