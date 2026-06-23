'use client';

import { useEffect, useState } from 'react';
import {
  User,
  MapPin,
  Phone,
  Mail,
  Shield,
  CreditCard,
  Users,
  FileEdit,
  Loader2,
  CheckCircle2,
  BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { portalClienteApi, type PortalClienteDashboard } from '@/lib/api';

const CAMPO_LABELS: Record<string, string> = {
  fecha_nacimiento: 'Fecha de nacimiento',
  direccion: 'Dirección completa',
  telefono: 'Teléfono',
  email: 'Correo electrónico',
  estatus_poliza: 'Estatus de póliza',
  ingresos: 'Ingresos',
  grupo_familiar: 'Grupo familiar',
  tarjetas_digitales: 'Tarjetas digitales',
};

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">{label}</p>
        <p className="text-sm font-medium text-[#0f172a] break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function ClientDashboardPage() {
  const [data, setData] = useState<PortalClienteDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampo, setSelectedCampo] = useState<string | null>(null);
  const [nuevoValor, setNuevoValor] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dashboard = await portalClienteApi.getDashboard();
      setData(dashboard);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar su información');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  const handleOpenSolicitud = (campo: string) => {
    setSelectedCampo(campo);
    setNuevoValor('');
    setDescripcion('');
  };

  const handleSubmitSolicitud = async () => {
    if (!selectedCampo || !data?.poliza?.id || !nuevoValor.trim()) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await portalClienteApi.solicitarCambio({
        poliza_id: data.poliza.id,
        campos: { [selectedCampo]: nuevoValor.trim() },
        descripcion: descripcion.trim() || undefined,
      });
      setSuccessMsg('Su solicitud fue enviada. Un agente revisará los cambios pronto.');
      setSelectedCampo(null);
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  const camposEditables = data.campos_editables || Object.keys(CAMPO_LABELS);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#065f46]">Hola, {data.nombre_completo}</h1>
        <p className="text-sm text-[#64748b] mt-1">Consulta tu póliza y solicita actualizaciones de forma segura.</p>
      </div>

      {successMsg && (
        <Alert className="bg-emerald-50 border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">{successMsg}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!data.poliza ? (
        <Card>
          <CardContent className="py-8 text-center text-[#64748b]">
            {data.mensaje || 'No tiene pólizas registradas en este momento.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Datos personales */}
          <Card className="lg:col-span-2 border-emerald-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#065f46]">
                <User className="h-5 w-5" /> Mis datos
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <InfoRow icon={User} label="Fecha de nacimiento" value={data.fecha_nacimiento ? new Date(data.fecha_nacimiento).toLocaleDateString('es-MX') : null} />
              <InfoRow icon={MapPin} label="Dirección" value={data.direccion_completa} />
              <InfoRow icon={Phone} label="Teléfono" value={data.telefono} />
              <InfoRow icon={Mail} label="Correo" value={data.email} />
              <InfoRow icon={Shield} label="Ingresos anuales" value={data.ingresos ? `$${parseFloat(data.ingresos).toLocaleString('es-MX')}` : null} />
              <InfoRow icon={BadgeCheck} label="Elegibilidad" value={(data.elegibilidad?.estado_inmigracion as string) || 'En revisión'} />
            </CardContent>
          </Card>

          {/* Agente y póliza */}
          <Card className="border-emerald-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#065f46]">
                <Shield className="h-5 w-5" /> Mi póliza
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={User} label="Agente" value={data.agente?.nombre} />
              <InfoRow icon={Shield} label="NPN agente" value={data.agente?.npn} />
              <InfoRow icon={Shield} label="Plan" value={data.poliza.plan} />
              <InfoRow icon={Shield} label="Estatus" value={data.poliza.estatus} />
              <InfoRow
                icon={CreditCard}
                label="Prima mensual"
                value={data.poliza.prima_mensual ? `$${parseFloat(data.poliza.prima_mensual).toLocaleString('es-MX')}` : null}
              />
            </CardContent>
          </Card>

          {/* Grupo familiar */}
          <Card className="lg:col-span-2 border-emerald-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#065f46]">
                <Users className="h-5 w-5" /> Grupo familiar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.grupo_familiar.length === 0 ? (
                <p className="text-sm text-[#64748b]">Sin miembros registrados.</p>
              ) : (
                <div className="space-y-2">
                  {data.grupo_familiar.map((member, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg bg-emerald-50/60 px-3 py-2">
                      <span className="text-sm font-medium">{member.nombre}</span>
                      <span className="text-xs text-[#64748b]">{member.relacion}{member.es_solicitante_principal ? ' · Principal' : ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tarjetas */}
          <Card className="border-emerald-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#065f46]">
                <CreditCard className="h-5 w-5" /> Tarjetas digitales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.tarjetas_digitales.length === 0 ? (
                <p className="text-sm text-[#64748b]">Sin tarjetas registradas.</p>
              ) : (
                data.tarjetas_digitales.map((tarjeta) => (
                  <div key={tarjeta.id} className="rounded-lg border border-emerald-100 p-3 mb-2 last:mb-0">
                    <p className="text-sm font-semibold">{tarjeta.tipo_tarjeta}</p>
                    <p className="text-xs font-mono text-[#64748b]">{tarjeta.numero_enmascarado}</p>
                    <p className="text-xs text-[#64748b] mt-1">Vence {tarjeta.fecha_vencimiento}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Solicitar cambios */}
          <Card className="lg:col-span-3 border-emerald-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#065f46]">
                <FileEdit className="h-5 w-5" /> Solicitar cambios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[#64748b] mb-4">
                Seleccione el dato que desea actualizar. Su solicitud será revisada por su agente asignado.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {camposEditables.map((campo) => (
                  <Button
                    key={campo}
                    variant="outline"
                    className="justify-start border-emerald-200 hover:bg-emerald-50 text-left h-auto py-3"
                    onClick={() => handleOpenSolicitud(campo)}
                  >
                    <FileEdit className="h-4 w-4 mr-2 shrink-0 text-emerald-600" />
                    <span className="text-sm">{CAMPO_LABELS[campo] || campo}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={!!selectedCampo} onOpenChange={(open) => !open && setSelectedCampo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar cambio</DialogTitle>
            <DialogDescription>
              {selectedCampo ? CAMPO_LABELS[selectedCampo] : ''} — indique el nuevo valor deseado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="nuevoValor">Nuevo valor</Label>
              <Input
                id="nuevoValor"
                value={nuevoValor}
                onChange={(e) => setNuevoValor(e.target.value)}
                placeholder="Escriba el valor solicitado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descripcion">Comentario (opcional)</Label>
              <Textarea
                id="descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Detalle adicional para su agente"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedCampo(null)}>Cancelar</Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={isSubmitting || !nuevoValor.trim()}
              onClick={handleSubmitSolicitud}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
