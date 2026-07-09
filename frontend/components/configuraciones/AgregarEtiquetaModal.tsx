'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Etiqueta } from '@/lib/api';

interface AgregarEtiquetaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (etiqueta: Etiqueta | Omit<Etiqueta, 'id'>) => void;
  etiquetaToEdit?: Etiqueta | null;
  existingEtiquetas?: Etiqueta[];
}

const coloresDisponibles = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#6b7280',
];

export function AgregarEtiquetaModal({
  isOpen,
  onClose,
  onSave,
  etiquetaToEdit,
  existingEtiquetas = [],
}: AgregarEtiquetaModalProps) {
  const [formData, setFormData] = useState({ nombre: '', color: '#3b82f6' });
  const [errors, setErrors] = useState({ nombre: '', color: '' });

  useEffect(() => {
    if (etiquetaToEdit) {
      setFormData({ nombre: etiquetaToEdit.nombre, color: etiquetaToEdit.color || '#3b82f6' });
    } else {
      setFormData({ nombre: '', color: '#3b82f6' });
    }
    setErrors({ nombre: '', color: '' });
  }, [etiquetaToEdit, isOpen]);

  const isDuplicateName = (nombre: string) => {
    const normalized = nombre.trim().toLowerCase();
    return existingEtiquetas.some((etiqueta) => {
      if (etiquetaToEdit?.id != null && etiqueta.id === etiquetaToEdit.id) return false;
      return (etiqueta.nombre || '').trim().toLowerCase() === normalized;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nombre = formData.nombre.trim();
    const nextErrors = {
      nombre: !nombre ? 'El nombre es obligatorio.' : '',
      color: !formData.color ? 'El color es obligatorio.' : '',
    };

    if (!nextErrors.nombre && isDuplicateName(nombre)) {
      nextErrors.nombre = 'Ya existe una etiqueta con este nombre.';
    }

    setErrors(nextErrors);
    if (nextErrors.nombre || nextErrors.color) return;

    if (etiquetaToEdit) {
      onSave({ ...etiquetaToEdit, nombre, color: formData.color });
    } else {
      onSave({ nombre, color: formData.color });
    }
  };

  const handleClose = () => {
    setFormData({ nombre: '', color: '#3b82f6' });
    setErrors({ nombre: '', color: '' });
    onClose();
  };

  const handleColorChange = (color: string) => {
    setFormData({ ...formData, color });
    if (errors.color) setErrors((prev) => ({ ...prev, color: '' }));
  };

  const handleNombreChange = (valor: string) => {
    setFormData({ ...formData, nombre: valor });
    if (errors.nombre) setErrors((prev) => ({ ...prev, nombre: '' }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{etiquetaToEdit ? 'Editar Etiqueta' : 'Crear Nueva Etiqueta'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre" className={`text-sm font-medium ${errors.nombre ? 'text-red-600' : 'text-gray-700'}`}>
              Nombre
            </Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleNombreChange(e.target.value)}
              placeholder="Ingresar el nombre de la etiqueta"
              className={errors.nombre ? 'border-red-500 focus:border-red-500' : ''}
            />
            {errors.nombre ? <p className="text-xs text-red-600">{errors.nombre}</p> : null}
          </div>

          <div className="space-y-2">
            <Label className={`text-sm font-medium ${errors.color ? 'text-red-600' : 'text-gray-700'}`}>
              Color
            </Label>
            <div className="space-y-3">
              <div className="text-xs text-gray-600">
                Puedes reutilizar colores; solo el nombre debe ser único.
              </div>
              <div className="grid grid-cols-6 gap-2">
                {coloresDisponibles.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorChange(color)}
                    className={`w-8 h-8 rounded border-2 transition-all ${
                      formData.color === color
                        ? 'border-gray-800 scale-110'
                        : 'border-gray-300 hover:border-gray-500'
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="h-10 w-14 cursor-pointer p-1"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="#3b82f6"
                  className="font-mono text-sm"
                />
              </div>
            </div>
            {errors.color ? <p className="text-xs text-red-600">{errors.color}</p> : null}
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              {etiquetaToEdit ? 'Listo' : 'Crear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
