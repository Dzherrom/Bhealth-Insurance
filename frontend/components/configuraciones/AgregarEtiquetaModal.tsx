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
  const [errors, setErrors] = useState({ nombre: false, color: false });

  useEffect(() => {
    if (etiquetaToEdit) {
      setFormData({ nombre: etiquetaToEdit.nombre, color: etiquetaToEdit.color || '#3b82f6' });
    } else {
      setFormData({ nombre: '', color: '#3b82f6' });
    }
  }, [etiquetaToEdit, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obligatorios
    const newErrors = {
      nombre: !formData.nombre.trim(),
      color: !formData.color
    };
    
    setErrors(newErrors);
    
    // Si hay errores, no enviar
    if (newErrors.nombre || newErrors.color) {
      return;
    }

    if (etiquetaToEdit) {
      onSave({ ...etiquetaToEdit, ...formData });
    } else {
      onSave(formData);
    }
    handleClose();
  };

  const handleClose = () => {
    setFormData({ nombre: '', color: '#3b82f6' });
    setErrors({ nombre: false, color: false });
    onClose();
  };

  const handleColorChange = (color: string) => {
    setFormData({ ...formData, color });
    if (errors.color) {
      setErrors({ ...errors, color: false });
    }
  };

  const handleNombreChange = (valor: string) => {
    setFormData({ ...formData, nombre: valor });
    if (errors.nombre) {
      setErrors({ ...errors, nombre: false });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{etiquetaToEdit ? 'Editar Etiqueta' : 'Crear Nueva Etiqueta'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo Título / Nombre */}
          <div className="space-y-2">
            <Label htmlFor="nombre" className={`text-sm font-medium ${errors.nombre ? 'text-red-600' : 'text-gray-700'}`}>
              Nombre {errors.nombre && <span className="text-red-600">(obligatorio)</span>}
            </Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => handleNombreChange(e.target.value)}
              placeholder="Ingresar el nombre de la etiqueta"
              className={`${errors.nombre ? 'border-red-500 focus:border-red-500' : ''}`}
            />
          </div>

          {/* Campo Color */}
          <div className="space-y-2">
            <Label className={`text-sm font-medium ${errors.color ? 'text-red-600' : 'text-gray-700'}`}>
              Color {errors.color && <span className="text-red-600">(obligatorio)</span>}
            </Label>
            
            {/* Selector de color visual */}
            <div className="space-y-3">
              <div className="text-xs text-gray-600">Selecciona el color de la etiqueta:</div>
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
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Botones */}
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
