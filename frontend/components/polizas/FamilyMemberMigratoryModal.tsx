'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { ESTATUS_MIGRATORIOS, isCiudadanoStatus } from '@/lib/familyMemberOptions';

interface FamilyMemberMigratoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: any | null;
  onSaved: () => void;
}

export function FamilyMemberMigratoryModal({
  open,
  onOpenChange,
  member,
  onSaved,
}: FamilyMemberMigratoryModalProps) {
  const { toast } = useToast();
  const details = member?.cliente_details;
  const [estatus, setEstatus] = useState('');
  const [categoria, setCategoria] = useState('');
  const [numeroUscis, setNumeroUscis] = useState('');
  const [numeroNaturalizacion, setNumeroNaturalizacion] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !details) return;
    setEstatus(String(details.estado_inmigracion || ''));
    setCategoria(String(details.categoria_inmigracion || ''));
    setNumeroUscis(String(details.numero_uscis || ''));
    setNumeroNaturalizacion(String(details.numero_naturalizacion || ''));
  }, [open, details]);

  const showNaturalizacion = isCiudadanoStatus(estatus);

  const handleSave = async () => {
    if (!member?.cliente) return;
    if (!estatus) {
      toast({ title: 'Selecciona el estatus migratorio', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await api.clientes.patch(member.cliente, {
        estado_inmigracion: estatus as import('@/types/common').EstadoInmigracion,
        categoria_inmigracion: categoria || null,
        numero_uscis: numeroUscis || null,
        numero_naturalizacion: showNaturalizacion ? numeroNaturalizacion || null : null,
      });
      toast({ title: 'Estatus migratorio actualizado' });
      onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error al guardar estatus migratorio', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-slate-900 text-white border-slate-700">
        <DialogHeader>
          <DialogTitle>Estatus migratorio</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              Estatus migratorio <span className="text-red-400">(obligatorio)</span>
            </Label>
            <Select value={estatus} onValueChange={setEstatus}>
              <SelectTrigger className="bg-slate-800 border-slate-600">
                <SelectValue placeholder="Seleccionar estatus" />
              </SelectTrigger>
              <SelectContent>
                {ESTATUS_MIGRATORIOS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {showNaturalizacion ? (
            <div className="space-y-2">
              <Label>Número de naturalización</Label>
              <Input
                value={numeroNaturalizacion}
                onChange={(e) => setNumeroNaturalizacion(e.target.value)}
                className="bg-slate-800 border-slate-600"
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>Categoría de estatus migratorio</Label>
            <Input
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ej. En proceso"
              className="bg-slate-800 border-slate-600"
            />
          </div>
          <div className="space-y-2">
            <Label>Número de USCIS</Label>
            <Input
              value={numeroUscis}
              onChange={(e) => setNumeroUscis(e.target.value)}
              className="bg-slate-800 border-slate-600"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cerrar
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-violet-600 hover:bg-violet-700">
            {saving ? 'Guardando...' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
