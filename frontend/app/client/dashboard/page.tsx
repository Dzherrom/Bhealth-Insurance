'use client';

import { useEffect, useRef, useState } from 'react';
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
  Upload,
  FileText,
  Clock3,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { portalClienteApi, type PortalClienteDashboard } from '@/lib/api';
import { getStatusBadgeClass } from '@/components/polizas/polizaStatusUtils';

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

const DOCUMENTO_CATEGORIAS = [
  { value: 'IDENTIFICACION', label: 'Identificación' },
  { value: 'ESTATUS_MIGRATORIO', label: 'Estatus migratorio' },
  { value: 'CARTA_MERCADO', label: 'Carta de mercado' },
  { value: 'ASEGURANZA', label: 'Aseguranza' },
  { value: 'CONSENTIMIENTO', label: 'Consentimiento' },
  { value: 'OTRO', label: 'Otro documento' },
];

const cardClass =
  'border-[#e2e8f0] bg-white shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2';

function InfoRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[#f8fafc]">
      <Icon className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">{label}</p>
        <p className="text-sm font-medium text-[#0f172a] break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${getStatusBadgeClass(label)}`}
    >
      {label}
    </span>
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

  const [docTitulo, setDocTitulo] = useState('');
  const [docCategoria, setDocCategoria] = useState('IDENTIFICACION');
  const [docComentario, setDocComentario] = useState('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmitDocumento = async () => {
    if (!data?.poliza?.id || !docTitulo.trim() || !docFile) return;
    setIsUploadingDoc(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('poliza_id', String(data.poliza.id));
      formData.append('titulo', docTitulo.trim());
      formData.append('categoria', docCategoria);
      formData.append('archivo', docFile);
      if (docComentario.trim()) {
        formData.append('comentario', docComentario.trim());
      }

      const result = await portalClienteApi.solicitarDocumento(formData);
      setSuccessMsg(result.mensaje || 'Documento enviado para revisión.');
      setDocTitulo('');
      setDocComentario('');
      setDocFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadDashboard();
      setTimeout(() => setSuccessMsg(null), 6000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el documento');
    } finally {
      setIsUploadingDoc(false);
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
      <Alert variant="destructive" className="bg-white border-red-200">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  const camposEditables = data.campos_editables || Object.keys(CAMPO_LABELS);
  const documentos = data.documentos_solicitados || [];

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in slide-in-from-top-2 duration-500">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0f172a]">Hola, {data.nombre_completo}</h1>
        <p className="text-sm text-[#64748b] mt-1">
          Consulta tu póliza, envía documentos y solicita actualizaciones de forma segura.
        </p>
      </div>

      {successMsg && (
        <Alert className="bg-emerald-50 border-emerald-200 animate-in fade-in zoom-in-95 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-800">{successMsg}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="bg-white border-red-200 animate-in fade-in duration-300">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!data.poliza ? (
        <Card className={cardClass}>
          <CardContent className="py-10 text-center text-[#64748b]">
            {data.mensaje || 'No tiene pólizas registradas en este momento.'}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className={`lg:col-span-2 ${cardClass}`} style={{ animationDelay: '50ms' }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#0f172a]">
                <User className="h-5 w-5 text-emerald-600" /> Mis datos
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

          <Card className={cardClass} style={{ animationDelay: '100ms' }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#0f172a]">
                <Shield className="h-5 w-5 text-emerald-600" /> Mi póliza
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
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

          <Card className={`lg:col-span-2 ${cardClass}`} style={{ animationDelay: '150ms' }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#0f172a]">
                <Upload className="h-5 w-5 text-emerald-600" /> Enviar documento para revisión
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[#64748b]">
                Suba un documento (identificación, estatus migratorio, etc.). Un empleado lo revisará y actualizará el estatus.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="docTitulo">Nombre del documento</Label>
                  <Input
                    id="docTitulo"
                    value={docTitulo}
                    onChange={(e) => setDocTitulo(e.target.value)}
                    placeholder="Ej. INE actualizada"
                    className="bg-white border-[#e2e8f0]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={docCategoria} onValueChange={setDocCategoria}>
                    <SelectTrigger className="bg-white border-[#e2e8f0]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENTO_CATEGORIAS.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="docComentario">Comentario para el agente (opcional)</Label>
                <Textarea
                  id="docComentario"
                  value={docComentario}
                  onChange={(e) => setDocComentario(e.target.value)}
                  rows={2}
                  placeholder="Indique por qué envía este documento"
                  className="bg-white border-[#e2e8f0]"
                />
              </div>

              <div
                className="rounded-xl border-2 border-dashed border-[#cbd5e1] bg-[#f8fafc] p-6 text-center transition-all hover:border-emerald-400 hover:bg-emerald-50/40 cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-[#0f172a]">
                  {docFile ? docFile.name : 'Haga clic para seleccionar un archivo'}
                </p>
                <p className="text-xs text-[#64748b] mt-1">PDF, JPG o PNG</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                />
              </div>

              <Button
                className="bg-emerald-600 hover:bg-emerald-700 transition-transform hover:scale-[1.01] active:scale-[0.99]"
                disabled={isUploadingDoc || !docTitulo.trim() || !docFile}
                onClick={handleSubmitDocumento}
              >
                {isUploadingDoc ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" /> Enviar documento
                  </>
                )}
              </Button>

              {documentos.length > 0 ? (
                <div className="pt-2 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Documentos enviados</p>
                  {documentos.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2.5 transition-colors hover:bg-white hover:border-emerald-200"
                    >
                      <div className="flex items-start gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#0f172a] truncate">{doc.titulo}</p>
                          <p className="text-xs text-[#64748b] flex items-center gap-1">
                            <Clock3 className="h-3 w-3" />
                            {doc.fecha_subida ? new Date(doc.fecha_subida).toLocaleDateString('es-MX') : 'Reciente'}
                          </p>
                        </div>
                      </div>
                      <StatusPill label={doc.estado_display || doc.estado_documento} />
                    </div>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className={cardClass} style={{ animationDelay: '200ms' }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#0f172a]">
                <Users className="h-5 w-5 text-emerald-600" /> Grupo familiar
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.grupo_familiar.length === 0 ? (
                <p className="text-sm text-[#64748b]">Sin miembros registrados.</p>
              ) : (
                <div className="space-y-2">
                  {data.grupo_familiar.map((member, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 transition-all hover:bg-white hover:border-emerald-200"
                    >
                      <span className="text-sm font-medium text-[#0f172a]">{member.nombre}</span>
                      <span className="text-xs text-[#64748b]">
                        {member.relacion}
                        {member.es_solicitante_principal ? ' · Principal' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={cardClass} style={{ animationDelay: '250ms' }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#0f172a]">
                <CreditCard className="h-5 w-5 text-emerald-600" /> Tarjetas digitales
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.tarjetas_digitales.length === 0 ? (
                <p className="text-sm text-[#64748b]">Sin tarjetas registradas.</p>
              ) : (
                data.tarjetas_digitales.map((tarjeta) => (
                  <div
                    key={tarjeta.id}
                    className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3 mb-2 last:mb-0 transition-all hover:bg-white hover:shadow-sm"
                  >
                    <p className="text-sm font-semibold text-[#0f172a]">{tarjeta.tipo_tarjeta}</p>
                    <p className="text-xs font-mono text-[#64748b]">{tarjeta.numero_enmascarado}</p>
                    <p className="text-xs text-[#64748b] mt-1">Vence {tarjeta.fecha_vencimiento}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className={`lg:col-span-3 ${cardClass}`} style={{ animationDelay: '300ms' }}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-[#0f172a]">
                <FileEdit className="h-5 w-5 text-emerald-600" /> Solicitar cambios de datos
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
                    className="justify-start border-[#e2e8f0] bg-white hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 text-left h-auto py-3 transition-all hover:scale-[1.01]"
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
        <DialogContent className="sm:max-w-md bg-white border-[#e2e8f0]">
          <DialogHeader>
            <DialogTitle className="text-[#0f172a]">Solicitar cambio</DialogTitle>
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
                className="bg-white border-[#e2e8f0]"
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
                className="bg-white border-[#e2e8f0]"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedCampo(null)} className="border-[#e2e8f0]">
              Cancelar
            </Button>
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
