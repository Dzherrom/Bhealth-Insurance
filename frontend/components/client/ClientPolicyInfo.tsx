'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Calendar, CreditCard, User, Clock, FileText, Loader2 } from 'lucide-react';
import { usePolizaStore } from '@/store';

interface ClientPolicyInfoProps {
  clientId: string;
}

export default function ClientPolicyInfo({ clientId }: ClientPolicyInfoProps) {
  const { polizas, isLoading, error, fetchPolizas } = usePolizaStore();
  const [policy, setPolicy] = useState<any>(null);

  useEffect(() => {
    if (clientId) {
      fetchPolizas({ cliente_id: clientId });
    }
  }, [clientId, fetchPolizas]);

  useEffect(() => {
    // Obtener la primera póliza activa del cliente
    const activePolicy = polizas.find(p => p.estado_nombre?.toLowerCase().includes('activ'));
    if (activePolicy) {
      setPolicy(activePolicy);
    } else if (polizas.length > 0) {
      setPolicy(polizas[0]);
    }
  }, [polizas]);

  if (isLoading) {
    return (
      <Card className="md:col-span-2">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (error || !policy) {
    return null;
  }
  const getPolicyStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('activ') || statusLower === 'vigente') {
      return 'bg-green-100 text-green-800';
    } else if (statusLower.includes('pendiente') || statusLower.includes('en_proceso')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (statusLower.includes('expirad') || statusLower.includes('vencid')) {
      return 'bg-red-100 text-red-800';
    } else if (statusLower.includes('cancel')) {
      return 'bg-gray-100 text-gray-800';
    }
    return 'bg-blue-100 text-blue-800';
  };

  const getPolicyStatusText = (status: string) => {
    return status || 'Desconocido';
  };

  // Si no hay póliza, no mostrar nada
  if (!policy) {
    return null;
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Mi Póliza de Seguro
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Información General */}
          <div className="space-y-4">
            <div>
              <Label>Plan</Label>
              <p className="text-sm font-medium mt-1">{policy.plan_nombre || 'N/A'}</p>
            </div>
            <div>
              <Label>Agente</Label>
              <p className="text-sm font-medium mt-1">{policy.agente_nombre || 'N/A'}</p>
            </div>
            <div>
              <Label>Estado</Label>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPolicyStatusColor(policy.estado_nombre)}`}>
                  {getPolicyStatusText(policy.estado_nombre)}
                </span>
              </div>
            </div>
          </div>

          {/* Vigencia y Pagos */}
          <div className="space-y-4">
            <div>
              <Label>Fecha Efectiva</Label>
              <p className="text-sm font-medium mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {policy.fecha_efectiva ? new Date(policy.fecha_efectiva).toLocaleDateString('es-MX') : 'N/A'}
              </p>
            </div>
            <div>
              <Label>Fecha de Envío</Label>
              <p className="text-sm font-medium mt-1 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {policy.fecha_envio ? new Date(policy.fecha_envio).toLocaleDateString('es-MX') : 'N/A'}
              </p>
            </div>
            <div>
              <Label>Prima Mensual</Label>
              <p className="text-sm font-medium mt-1 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                {policy.prima_mensual ? `$${parseFloat(policy.prima_mensual).toLocaleString('es-MX')} MXN` : 'N/A'}
              </p>
            </div>
          </div>

          {/* Cobertura y Costos */}
          <div className="space-y-4">
            <div>
              <Label>Costo de Póliza</Label>
              <p className="text-sm font-medium mt-1 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {policy.costo_poliza ? `$${parseFloat(policy.costo_poliza).toLocaleString('es-MX')} MXN` : 'N/A'}
              </p>
            </div>
            <div>
              <Label>Subsidio</Label>
              <p className="text-sm font-medium mt-1">
                {policy.subsidio ? `$${parseFloat(policy.subsidio).toLocaleString('es-MX')} MXN` : 'N/A'}
              </p>
            </div>
            <div>
              <Label>Beneficiarios</Label>
              <p className="text-sm font-medium mt-1 flex items-center gap-2">
                <User className="h-4 w-4" />
                {policy.clientes_info?.length || 0} personas
              </p>
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>ID de Mercado</Label>
              <p className="text-sm font-medium mt-1 font-mono bg-gray-100 p-2 rounded">
                {policy.id_mercado || 'N/A'}
              </p>
            </div>
            <div>
              <Label>ID Miembro</Label>
              <p className="text-sm font-medium mt-1 font-mono bg-gray-100 p-2 rounded">
                {policy.id_miembro || 'N/A'}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <Label>ID Interno</Label>
            <p className="text-sm font-medium mt-1 font-mono bg-gray-100 p-2 rounded">
              {policy.id_interno || 'N/A'}
            </p>
          </div>

          {/* Botones de acción */}
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Ver Documentos
            </Button>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Historial de Pagos
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}