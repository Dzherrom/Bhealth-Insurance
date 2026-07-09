'use client';

import { Shield, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { PortalClienteDashboard } from '@/lib/api';
import { POLIZA_DETAIL_FIELDS, cardClass, clientLight, formatCurrency, formatDate } from './constants';
import { InfoRow } from './shared';

interface MisPolizasCardProps {
  data: PortalClienteDashboard;
  selectedPolizaId: number | null;
  onSelectPoliza: (polizaId: number) => void;
}

function polizaLabel(poliza: NonNullable<PortalClienteDashboard['poliza']>) {
  const parts = [poliza.tipo_producto, poliza.plan].filter(Boolean);
  return parts.length ? parts.join(' — ') : `Póliza #${poliza.id}`;
}

export function MisPolizasCard({ data, selectedPolizaId, onSelectPoliza }: MisPolizasCardProps) {
  const polizas = data.polizas ?? (data.poliza ? [data.poliza] : []);
  const poliza = data.poliza;

  if (!poliza || polizas.length === 0) return null;

  const formatValue = (key: string, format?: string) => {
    const value = poliza[key as keyof typeof poliza];
    if (value == null || value === '') return null;
    if (format === 'currency') return formatCurrency(String(value));
    if (format === 'date') return formatDate(String(value));
    return String(value);
  };

  return (
    <Card className={`${cardClass} ${clientLight.cardOverflow}`}>
      <CardHeader className="space-y-3 min-w-0">
        <CardTitle className="text-lg flex items-center gap-2 text-[#0f172a]">
          <Shield className="h-5 w-5 text-emerald-600 shrink-0" /> Mis pólizas
        </CardTitle>
        {polizas.length > 1 ? (
          <div className="min-w-0 w-full">
            <Select
              value={String(selectedPolizaId ?? poliza.id)}
              onValueChange={(value) => onSelectPoliza(Number(value))}
            >
              <SelectTrigger className={clientLight.selectTrigger}>
                <SelectValue placeholder="Seleccionar póliza" />
              </SelectTrigger>
              <SelectContent className={clientLight.selectContent}>
                {polizas.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)} className={clientLight.selectItem}>
                    <span className="truncate">
                      {polizaLabel(item)}
                      {item.es_principal ? ' (Principal)' : ''}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <p className="text-sm text-[#64748b] break-words">{polizaLabel(poliza)}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-1 min-w-0">
        <InfoRow icon={User} label="Agente" value={data.agente?.nombre} />
        <InfoRow icon={Shield} label="NPN agente" value={data.agente?.npn} />
        {POLIZA_DETAIL_FIELDS.map((field) => (
          <InfoRow
            key={field.key}
            icon={Shield}
            label={field.label}
            value={formatValue(field.key, 'format' in field ? field.format : undefined)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
