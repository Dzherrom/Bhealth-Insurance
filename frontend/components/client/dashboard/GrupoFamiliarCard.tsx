'use client';

import { useState } from 'react';
import { Users, FileEdit, Upload, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PortalClienteDashboard } from '@/lib/api';
import { MIEMBRO_CAMPOS, cardClass, clientLight, formatCurrency, formatDate } from './constants';

interface GrupoFamiliarCardProps {
  data: PortalClienteDashboard;
  onSolicitarCambioMiembro: (payload: {
    clienteId: number;
    miembroNombre: string;
    campo: string;
    campoLabel: string;
  }) => void;
  onSolicitarDocumentoMiembro: (clienteId: number, miembroNombre: string) => void;
}

export function GrupoFamiliarCard({
  data,
  onSolicitarCambioMiembro,
  onSolicitarDocumentoMiembro,
}: GrupoFamiliarCardProps) {
  const miembros = data.grupo_familiar ?? [];
  const [selectedId, setSelectedId] = useState<string>(
    miembros[0] ? String(miembros[0].cliente_id) : '',
  );

  const selected = miembros.find((m) => String(m.cliente_id) === selectedId) ?? miembros[0];

  return (
    <Card className={`lg:col-span-2 ${cardClass}`}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-[#0f172a]">
          <Users className="h-5 w-5 text-emerald-600" /> Grupo familiar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {miembros.length === 0 ? (
          <p className="text-sm text-[#64748b]">Sin miembros registrados.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {miembros.map((member) => (
                <button
                  key={member.cliente_id}
                  type="button"
                  onClick={() => setSelectedId(String(member.cliente_id))}
                  className={`text-left rounded-xl border px-3 py-3 transition-all ${
                    String(member.cliente_id) === selectedId
                      ? 'border-emerald-400 bg-emerald-50 shadow-sm'
                      : 'border-[#e2e8f0] bg-[#f8fafc] hover:border-emerald-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0f172a] truncate">{member.nombre}</p>
                      <p className="text-xs text-[#64748b] mt-0.5">
                        {member.relacion}
                        {member.es_solicitante_principal ? ' · Principal' : ''}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#94a3b8] shrink-0" />
                  </div>
                </button>
              ))}
            </div>

            {selected ? (
              <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-4 space-y-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Familiar seleccionado</p>
                  <p className="text-base font-semibold text-[#0f172a] mt-1">{selected.nombre}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 text-sm text-[#334155]">
                    <p><span className="text-[#64748b]">Nacimiento:</span> {formatDate(selected.fecha_nacimiento)}</p>
                    <p><span className="text-[#64748b]">Teléfono:</span> {selected.telefono || '—'}</p>
                    <p><span className="text-[#64748b]">Correo:</span> {selected.email || '—'}</p>
                    <p><span className="text-[#64748b]">Ingresos:</span> {formatCurrency(selected.ingresos)}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[#0f172a]">Solicitar cambio de información</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Select
                      onValueChange={(campo) => {
                        const meta = MIEMBRO_CAMPOS.find((item) => item.value === campo);
                        if (!meta) return;
                        onSolicitarCambioMiembro({
                          clienteId: selected.cliente_id,
                          miembroNombre: selected.nombre,
                          campo: meta.value,
                          campoLabel: meta.label,
                        });
                      }}
                    >
                      <SelectTrigger className={clientLight.selectTrigger}>
                        <SelectValue placeholder="Seleccionar dato a actualizar" />
                      </SelectTrigger>
                      <SelectContent className={clientLight.selectContent}>
                        {MIEMBRO_CAMPOS.map((campo) => (
                          <SelectItem key={campo.value} value={campo.value} className={clientLight.selectItem}>
                            {campo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      className="border-[#e2e8f0] bg-white text-[#334155] hover:bg-[#f8fafc] shrink-0"
                      onClick={() =>
                        onSolicitarCambioMiembro({
                          clienteId: selected.cliente_id,
                          miembroNombre: selected.nombre,
                          campo: 'otros',
                          campoLabel: 'Otros datos',
                        })
                      }
                    >
                      <FileEdit className="h-4 w-4 mr-2" />
                      Otro cambio
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => onSolicitarDocumentoMiembro(selected.cliente_id, selected.nombre)}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar documento de este familiar
                </Button>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
