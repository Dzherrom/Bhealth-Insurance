'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/authStore';
import { cambiosDeVidaApi } from '@/lib/api';
import {
  X,
  Plus,
  Search,
  ArrowLeft,
  MapPin,
  DollarSign,
  Plane,
  UserPlus,
  Baby,
  HeartCrack,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  User,
} from 'lucide-react';
import {
  TIPOS_CAMBIO,
  ESTADOS_CAMBIO,
  BLOG_FILTERS,
  buildDescripcionFromDatos,
  buildBlogDetailLines,
  isEstadoPendiente,
  isEstadoRealizado,
  isPortalClienteOrigen,
  matchesBlogFilter,
  type CambioDeVidaDatos,
} from './cambiosDeVida/constants';
import { CambioDeVidaTipoForm, validateCambioDeVidaDatos } from './cambiosDeVida/CambioDeVidaTipoForm';

const TIPO_ICONS: Record<string, React.ElementType> = {
  NUEVA_DIRECCION: MapPin,
  CAMBIO_INGRESOS: DollarSign,
  CAMBIO_ESTADO_MIGRATORIO: Plane,
  NUEVO_MIEMBRO: UserPlus,
  EMBARAZO: Baby,
  FALLECIDO: HeartCrack,
  OTROS: MoreHorizontal,
};

interface CambioDeVidaItem {
  id: number;
  poliza: number;
  tipo: string;
  tipo_display?: string;
  descripcion?: string;
  datos?: CambioDeVidaDatos;
  estado: string;
  estado_display?: string;
  fecha_limite?: string | null;
  fecha_creacion?: string;
  creado_por_username?: string;
  agente_nombre?: string;
  agente_creador_nombre?: string;
}

export interface PolizaContextoCambioVida {
  clientes_info?: any[];
  direccion_fisica_details?: any;
  direccion_postal_details?: any;
  direccion_facturacion_details?: any;
}

interface CambiosDeVidaPanelProps {
  isOpen: boolean;
  onClose: () => void;
  polizaId: number;
  polizaContext?: PolizaContextoCambioVida;
  polizaInfo?: {
    cliente?: string;
    id_mercado?: string;
  };
}

type PanelView = 'blog' | 'form';

function getTipoMeta(tipo: string) {
  return TIPOS_CAMBIO.find((t) => t.value === tipo);
}

function getEstadoMeta(estado: string) {
  return ESTADOS_CAMBIO.find((e) => e.value === estado);
}

function formatDateTime(value?: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CambioBlogEntry({
  item,
  onUpdateEstado,
  updatingId,
}: {
  item: CambioDeVidaItem;
  onUpdateEstado: (id: number, estado: string) => void;
  updatingId: number | null;
}) {
  const tipoMeta = getTipoMeta(item.tipo);
  const estadoMeta = getEstadoMeta(item.estado);
  const Icon = TIPO_ICONS[item.tipo] || MoreHorizontal;
  const resumen = item.descripcion || buildDescripcionFromDatos(item.tipo, item.datos || {});
  const detalles = buildBlogDetailLines(item.tipo, item.datos || {});
  const isUpdating = updatingId === item.id;
  const realizado = isEstadoRealizado(item.estado);
  const fromPortal = isPortalClienteOrigen(item.datos);

  return (
    <article className="relative pl-8 pb-8 last:pb-2">
      <div className={`absolute left-[11px] top-3 bottom-0 w-px ${realizado ? 'bg-emerald-200 dark:bg-emerald-800' : 'bg-slate-200 dark:bg-slate-700'}`} />
      <div
        className={`absolute left-0 top-2 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
          realizado
            ? 'bg-emerald-50 border-emerald-400 dark:bg-emerald-900/30 dark:border-emerald-500'
            : 'bg-amber-50 border-amber-400 dark:bg-amber-900/30 dark:border-amber-500'
        }`}
      >
        <Icon className={`w-3 h-3 ${realizado ? 'text-emerald-600' : 'text-amber-600'}`} />
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800/60 overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {item.tipo_display || tipoMeta?.label || item.tipo}
                </h3>
                {fromPortal ? (
                  <Badge variant="outline" className="text-[10px] border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300">
                    Portal cliente
                  </Badge>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{formatDateTime(item.fecha_creacion)}</p>
            </div>
            <Badge className={`text-[10px] shrink-0 ${estadoMeta?.color || ''}`}>
              {item.estado_display || estadoMeta?.label || item.estado}
            </Badge>
          </div>
        </div>

        <div className="px-4 py-3 space-y-2">
          {resumen && (
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">{resumen}</p>
          )}
          {detalles.length > 0 && (
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1 border-t border-slate-100 dark:border-slate-700 pt-2">
              {detalles.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          )}
          <div className="text-[11px] text-slate-400 space-y-0.5 pt-1">
            {item.agente_creador_nombre && (
              <p className="flex items-center gap-1">
                <User className="w-3 h-3" />
                Agente registro: {item.agente_creador_nombre}
              </p>
            )}
            {item.agente_nombre && (
              <p className="flex items-center gap-1">
                <User className="w-3 h-3" />
                Agente asignado: {item.agente_nombre}
              </p>
            )}
            {item.creado_por_username && !item.agente_creador_nombre && (
              <p className="flex items-center gap-1">
                <User className="w-3 h-3" />
                Registrado por {item.creado_por_username}
              </p>
            )}
          </div>
        </div>

        {!realizado && (
          <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 flex flex-wrap gap-2">
            {item.estado === 'PENDIENTE' && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                disabled={isUpdating}
                onClick={() => onUpdateEstado(item.id, 'EN_PROCESO')}
              >
                <Clock className="w-3 h-3 mr-1" />
                En proceso
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800"
              disabled={isUpdating}
              onClick={() => onUpdateEstado(item.id, 'COMPLETADO')}
            >
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Marcar realizado
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

export function CambiosDeVidaPanel({ isOpen, onClose, polizaId, polizaContext, polizaInfo }: CambiosDeVidaPanelProps) {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [cambios, setCambios] = useState<CambioDeVidaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('TODOS');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const [view, setView] = useState<PanelView>('blog');
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [saving, setSaving] = useState(false);

  const [tipo, setTipo] = useState('');
  const [datos, setDatos] = useState<CambioDeVidaDatos>({});

  const loadCambios = async () => {
    if (!polizaId) return;
    setLoading(true);
    try {
      const data = await cambiosDeVidaApi.listByPoliza(polizaId);
      setCambios(data);
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudieron cargar los cambios de vida.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      loadCambios();
    } else {
      setView('blog');
      setFormStep(1);
    }
  }, [isOpen, polizaId]);

  const counts = useMemo(() => ({
    todos: cambios.length,
    pendientes: cambios.filter((c) => isEstadoPendiente(c.estado)).length,
    realizados: cambios.filter((c) => isEstadoRealizado(c.estado)).length,
  }), [cambios]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return cambios.filter((c) => {
      const desc = c.descripcion || buildDescripcionFromDatos(c.tipo, c.datos || {});
      const matchesSearch =
        (c.tipo_display || c.tipo).toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q) ||
        (c.creado_por_username || '').toLowerCase().includes(q);
      return matchesSearch && matchesBlogFilter(c.estado, filterEstado);
    });
  }, [cambios, search, filterEstado]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(onClose, 280);
  };

  const resetForm = () => {
    setTipo('');
    setDatos({});
    setFormStep(1);
  };

  const openCreate = () => {
    resetForm();
    setView('form');
    setFormStep(1);
  };

  const handleTipoContinue = () => {
    if (!tipo) {
      toast({ title: 'Selecciona un tipo', description: 'Indica qué evento de vida deseas reportar.', variant: 'destructive' });
      return;
    }
    setFormStep(2);
  };

  const handleSave = async () => {
    const validationError = validateCambioDeVidaDatos(tipo, datos);
    if (validationError) {
      toast({ title: 'Campos incompletos', description: validationError, variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const descripcion = buildDescripcionFromDatos(tipo, datos);
      await cambiosDeVidaApi.create({
        poliza: polizaId,
        tipo,
        descripcion,
        datos,
        estado: 'PENDIENTE',
        asignado_a: (user as any)?.id || null,
      });
      toast({ title: 'Solicitud registrada', description: 'El cambio de vida quedó pendiente de seguimiento.' });
      resetForm();
      setView('blog');
      await loadCambios();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo registrar el cambio de vida.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEstado = async (id: number, nuevoEstado: string) => {
    setUpdatingId(id);
    try {
      await cambiosDeVidaApi.patch(id, { estado: nuevoEstado });
      const label = getEstadoMeta(nuevoEstado)?.label || nuevoEstado;
      toast({ title: 'Estado actualizado', description: `Cambio marcado como ${label.toLowerCase()}.` });
      await loadCambios();
    } catch (error) {
      console.error(error);
      toast({ title: 'Error', description: 'No se pudo actualizar el estado.', variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={handleClose} />

      <div
        className={`fixed right-0 top-0 h-full w-[520px] max-w-[95vw] bg-white dark:bg-slate-900 shadow-xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out border-l border-slate-200 dark:border-slate-800 ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {view === 'form' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => {
                    if (formStep === 2) {
                      setFormStep(1);
                    } else {
                      resetForm();
                      setView('blog');
                    }
                  }}
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              )}
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {view === 'form' ? 'Nueva solicitud' : 'Seguimiento de cambios'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {polizaInfo?.cliente || 'Póliza'} {polizaInfo?.id_mercado ? `· ${polizaInfo.id_mercado}` : ''}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {view === 'blog' && (
            <>
              <div className="flex gap-2 mt-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar en el historial..."
                    className="pl-8 h-9 dark:bg-slate-800"
                  />
                </div>
                <Button size="sm" onClick={openCreate} className="shrink-0">
                  <Plus className="w-4 h-4 mr-1" />
                  Nuevo
                </Button>
              </div>
              <div className="flex gap-1.5 mt-2">
                {BLOG_FILTERS.map((f) => {
                  const count = f.value === 'TODOS' ? counts.todos : f.value === 'PENDIENTES' ? counts.pendientes : counts.realizados;
                  return (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFilterEstado(f.value)}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        filterEstado === f.value
                          ? 'bg-primary text-white border-primary'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {f.label} ({count})
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          {view === 'blog' ? (
            loading ? (
              <p className="text-sm text-slate-500 text-center py-8">Cargando historial...</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 px-4">
                <i className="fa-duotone fa-family text-4xl text-slate-300 dark:text-slate-600 mb-3 block" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Sin solicitudes registradas</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">
                  Las solicitudes del cliente aparecerán aquí para que el equipo lleve el seguimiento.
                </p>
                <Button size="sm" variant="outline" onClick={openCreate}>
                  <Plus className="w-4 h-4 mr-1" /> Registrar solicitud
                </Button>
              </div>
            ) : (
              <div className="relative">
                {filtered.map((item) => (
                  <CambioBlogEntry
                    key={item.id}
                    item={item}
                    onUpdateEstado={handleUpdateEstado}
                    updatingId={updatingId}
                  />
                ))}
              </div>
            )
          ) : formStep === 1 ? (
            <div className="space-y-4">
              <div className="border border-primary/30 bg-primary/5 dark:bg-primary/10 rounded-xl p-5">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                  ¿Qué tipo de evento de vida le gustaría reportar?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Selecciona el tipo de cambio solicitado por el cliente.
                </p>
                <div className="space-y-2">
                  <Label>Tipo de evento *</Label>
                  <Select value={tipo} onValueChange={(v) => { setTipo(v); setDatos({}); }}>
                    <SelectTrigger className="bg-white dark:bg-slate-800">
                      <SelectValue placeholder="Seleccionar tipo de evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_CAMBIO.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="w-full" onClick={handleTipoContinue} disabled={!tipo}>
                Continuar
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                {(() => {
                  const Icon = TIPO_ICONS[tipo] || MoreHorizontal;
                  const label = getTipoMeta(tipo)?.label;
                  return (
                    <>
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-slate-800 dark:text-white">{label}</span>
                    </>
                  );
                })()}
              </div>

              <CambioDeVidaTipoForm
                tipo={tipo}
                datos={datos}
                onChange={setDatos}
                poliza={polizaContext || {}}
              />

              <Button className="w-full" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : 'Registrar solicitud'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
