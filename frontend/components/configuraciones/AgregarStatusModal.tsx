'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusPoliza } from './statusTypes';

interface AgregarStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (status: StatusPoliza | Omit<StatusPoliza, 'id'>) => void;
  statusToEdit?: StatusPoliza | null;
}

// Colores predefinidos para el selector
const coloresDisponibles = [
  '#ef4444', // rojo
  '#f97316', // naranja  
  '#eab308', // amarillo
  '#22c55e', // verde
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#3b82f6', // azul
  '#6366f1', // indigo
  '#8b5cf6', // violeta
  '#d946ef', // fuchsia
  '#ec4899', // rosa
  '#6b7280', // gris
];

export function AgregarStatusModal({ 
  isOpen, 
  onClose, 
  onSave,
  statusToEdit
}: AgregarStatusModalProps) {
  const [formData, setFormData] = useState({
    titulo: '',
    color: '#3b82f6',
    habilitadoParaAgentes: false
  });

  useEffect(() => {
    if (statusToEdit) {
      setFormData({
        titulo: statusToEdit.titulo,
        color: statusToEdit.color,
        habilitadoParaAgentes: statusToEdit.habilitadoParaAgentes
      });
    } else {
      setFormData({
        titulo: '',
        color: '#3b82f6',
        habilitadoParaAgentes: false
      });
    }
  }, [statusToEdit, isOpen]);

  const [errors, setErrors] = useState({
    titulo: false,
    color: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar campos obligatorios
    const newErrors = {
      titulo: !formData.titulo.trim(),
      color: !formData.color
    };
    
    setErrors(newErrors);
    
    // Si hay errores, no enviar
    if (newErrors.titulo || newErrors.color) {
      return;
    }

    // Crear o actualizar el status
    if (statusToEdit) {
      onSave({
        ...statusToEdit,
        ...formData
      });
    } else {
      onSave(formData);
    }

    // Limpiar formulario y cerrar
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      titulo: '',
      color: '#3b82f6',
      habilitadoParaAgentes: false
    });
    setErrors({
      titulo: false,
      color: false
    });
    onClose();
  };

  const handleColorChange = (color: string) => {
    setFormData({
      ...formData,
      color
    });
    if (errors.color) {
      setErrors({ ...errors, color: false });
    }
  };

  const handleTituloChange = (valor: string) => {
    setFormData({
      ...formData,
      titulo: valor
    });
    if (errors.titulo) {
      setErrors({ ...errors, titulo: false });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{statusToEdit ? 'Editar Estatus' : 'Crear Nuevo Estatus'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campo Título */}
          <div className="space-y-2">
            <Label htmlFor="titulo" className={`text-sm font-medium ${errors.titulo ? 'text-red-600' : 'text-gray-700'}`}>
              Título {errors.titulo && <span className="text-red-600">(obligatorio)</span>}
            </Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => handleTituloChange(e.target.value)}
              placeholder="Ingresar el título del estatus"
              className={`${errors.titulo ? 'border-red-500 focus:border-red-500' : ''}`}
            />
          </div>

          {/* Campo Color */}
          <div className="space-y-2">
            <Label className={`text-sm font-medium ${errors.color ? 'text-red-600' : 'text-gray-700'}`}>
              Color {errors.color && <span className="text-red-600">(obligatorio)</span>}
            </Label>
            
            {/* Selector de color visual */}
            <div className="space-y-3">
              <div className="text-xs text-gray-600">Selecciona el color del estatus:</div>
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
              
              {/* Campo de color personalizado */}
              {/* <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => handleColorChange(e.target.value)}
                  placeholder="#000000"
                  className="text-xs font-mono"
                />
              </div> */}
            </div>
          </div>

          {/* Checkbox para agentes */}
          <div className="space-y-2">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="habilitado"
                checked={formData.habilitadoParaAgentes}
                onCheckedChange={(checked) => 
                  setFormData({
                    ...formData,
                    habilitadoParaAgentes: checked === true
                  })
                }
                className="mt-1"
              />
              <div className="space-y-1">
                <Label htmlFor="habilitado" className="text-sm font-medium text-gray-700">
                  ¿Puede los agentes usar/seleccionar este estatus?
                </Label>
                <div className="text-xs text-gray-500">
                  Selecciona si los agentes pueden usar/seleccionar este estatus.
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Crear
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}