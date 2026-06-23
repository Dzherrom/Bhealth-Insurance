'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { citasApi, type Cita } from '@/lib/api';

type EstadoCita = Cita['estado'];

type ClientePolizaMember = {
  id?: number;
  cliente: number;
  es_solicitante_principal?: boolean;
  relacion?: string;
  cliente_details?: {
    primer_nombre?: string;
    apellido_paterno?: string;
    apellido_materno?: string;
  };
};

interface EditCitaPolizaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  polizaId: number;
  clientesInfo: ClientePolizaMember[];
  cita?: Cita | null;
  onSaved: (savedCita?: Cita) => void | Promise<void>;
}

const ESTADO_OPTIONS: { value: EstadoCita; label: string }[] = [
  { value: 'PROGRAMADA', label: 'Programada' },
  { value: 'COMPLETADA', label: 'Completada' },
  { value: 'CANCELADA', label: 'Cancelada' },
  { value: 'NO_ASISTIO', label: 'No asistió' },
];

const formatMemberName = (member: ClientePolizaMember) => {
  const d = member.cliente_details;
  if (!d) return `Cliente #${member.cliente}`;
  return [d.primer_nombre, d.apellido_paterno, d.apellido_materno].filter(Boolean).join(' ');
};

const splitDateTime = (fechaHora?: string) => {
  if (!fechaHora) return { fecha: '', hora: '' };
  const date = new Date(fechaHora);
  if (Number.isNaN(date.getTime())) return { fecha: '', hora: '' };
  return {
    fecha: date.toISOString().split('T')[0],
    hora: date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
};

export function EditCitaPolizaModal({
  open,
  onOpenChange,
  polizaId,
  clientesInfo,
  cita,
  onSaved,
}: EditCitaPolizaModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [clienteId, setClienteId] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [lugar, setLugar] = useState('');
  const [estado, setEstado] = useState<EstadoCita>('PROGRAMADA');
  const [motivo, setMotivo] = useState('');
  const [notas, setNotas] = useState('');

  const isEditing = Boolean(cita?.id);
  const defaultClienteId = useMemo(() => {
    const principal = clientesInfo.find((m) => m.es_solicitante_principal);
    return String(principal?.cliente ?? clientesInfo[0]?.cliente ?? '');
  }, [clientesInfo]);

  useEffect(() => {
    if (!open) return;

    if (cita) {
      const { fecha: f, hora: h } = splitDateTime(cita.fecha_hora);
      setClienteId(cita.cliente ? String(cita.cliente) : defaultClienteId);
      setFecha(f);
      setHora(h);
      setProveedor(cita.proveedor ?? '');
      setLugar(cita.lugar ?? '');
      setEstado(cita.estado ?? 'PROGRAMADA');
      setMotivo(cita.motivo ?? '');
      setNotas(cita.notas ?? '');
      return;
    }

    setClienteId(defaultClienteId);
    setFecha('');
    setHora('');
    setProveedor('');
    setLugar('');
    setEstado('PROGRAMADA');
    setMotivo('');
    setNotas('');
  }, [open, cita, defaultClienteId]);

  const handleSave = async () => {
    if (!clienteId || !fecha || !hora || !proveedor.trim() || !lugar.trim()) {
      toast({
        title: 'Campos requeridos',
        description: 'Completa paciente, fecha, hora, proveedor y lugar.',
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      poliza: polizaId,
      cliente: Number(clienteId),
      fecha_hora: `${fecha}T${hora}:00`,
      proveedor: proveedor.trim(),
      lugar: lugar.trim(),
      estado,
      motivo: motivo.trim() || null,
      notas: notas.trim() || null,
    };

    setSaving(true);
    try {
      let savedCita: Cita;
      if (isEditing && cita?.id) {
        savedCita = await citasApi.patch(cita.id, payload);
        toast({ title: 'Éxito', description: 'Cita actualizada correctamente.' });
      } else {
        savedCita = await citasApi.create(payload);
        toast({ title: 'Éxito', description: 'Cita médica creada correctamente.' });
      }
      await onSaved(savedCita);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'No se pudo guardar la cita.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!cita?.id || !window.confirm('¿Eliminar esta cita médica?')) return;

    setDeleting(true);
    try {
      await citasApi.delete(cita.id);
      toast({ title: 'Cita eliminada' });
      await onSaved();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo eliminar la cita.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar cita médica' : 'Nueva cita médica'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Paciente *</Label>
            <Select value={clienteId} onValueChange={setClienteId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un miembro de la póliza" />
              </SelectTrigger>
              <SelectContent>
                {clientesInfo.map((member) => (
                  <SelectItem key={member.cliente} value={String(member.cliente)}>
                    {formatMemberName(member)}
                    {member.relacion ? ` (${member.relacion})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cita_fecha">Fecha *</Label>
              <Input id="cita_fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cita_hora">Hora *</Label>
              <Input id="cita_hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cita_proveedor">Proveedor / Doctor *</Label>
            <Input
              id="cita_proveedor"
              value={proveedor}
              onChange={(e) => setProveedor(e.target.value)}
              placeholder="Nombre del médico o proveedor"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cita_lugar">Lugar / Dirección *</Label>
            <Input
              id="cita_lugar"
              value={lugar}
              onChange={(e) => setLugar(e.target.value)}
              placeholder="Clínica, hospital o dirección"
            />
          </div>

          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={estado} onValueChange={(value) => setEstado(value as EstadoCita)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADO_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cita_motivo">Motivo</Label>
            <Textarea
              id="cita_motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="Motivo de la consulta"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cita_notas">Notas adicionales</Label>
            <Textarea
              id="cita_notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={2}
              placeholder="Instrucciones, preparación, etc."
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isEditing ? (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={saving || deleting}
              className="sm:mr-auto"
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving || deleting}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || deleting || clientesInfo.length === 0}>
            {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear cita'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
