'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  getRelacionFamiliarLabel,
  getEstatusMigratorioLabel,
  getIdiomaLabel,
  DOCUMENTOS_LEGALES,
  type LegalDocumentType,
} from '@/lib/familyMemberOptions';
import {
  calculateAge,
  formatMemberBirthDate,
  formatIsoDateDisplay,
  maskEmail,
  maskPhone,
  maskDocumentNumber,
  formatUsd,
  getMemberFullName,
  copyToClipboard,
  monthlyFromAnnual,
  buildPolizaClientesPayload,
  memberCountsAsApplicant,
} from '@/lib/familyMemberUtils';
import api, { documentosLegalesApi, ingresosEmpleadorApi, resolveApiMediaUrl } from '@/lib/api';
import { FamilyMemberFormModal } from './FamilyMemberFormModal';
import { FamilyMemberMigratoryModal } from './FamilyMemberMigratoryModal';
import { FamilyMemberIngresoModal, type IngresoEmpleadorForm } from './FamilyMemberIngresoModal';
import { SelectLegalDocumentModal, type DocumentoLegalLink } from './SelectLegalDocumentModal';
import { Switch } from '@/components/ui/switch';

interface FamilyMembersSectionProps {
  poliza: any;
  onRefresh: () => void;
}

function isTitular(member: any): boolean {
  return Boolean(member.es_solicitante_principal);
}

function isAplicante(member: any): boolean {
  return memberCountsAsApplicant(member);
}

function getRelacionBadge(member: any): string {
  if (isTitular(member)) return 'Titular';
  return getRelacionFamiliarLabel(member.relacion);
}

function getMemberIncome(member: any): number {
  const details = member.cliente_details;
  const ingresos = details?.ingresos_empleador;
  if (Array.isArray(ingresos) && ingresos.length > 0) {
    return ingresos.reduce(
      (sum: number, row: any) => sum + (parseFloat(String(row.ingreso_anual || 0)) || 0),
      0,
    );
  }
  return parseFloat(String(details?.ingreso_anual || 0)) || 0;
}

function getGenderLabel(genero?: string | null): string {
  if (!genero) return '—';
  const g = genero.toLowerCase();
  if (g.startsWith('f')) return 'Femenino';
  if (g.startsWith('m')) return 'Masculino';
  return genero;
}

function getLegalDocLink(details: any, tipo: LegalDocumentType): DocumentoLegalLink | null {
  const links = details?.documentos_legales;
  if (!Array.isArray(links)) return null;
  return links.find((item: DocumentoLegalLink) => item.tipo === tipo) ?? null;
}

function DetailField({
  label,
  value,
  copyValue,
  onCopy,
}: {
  label: string;
  value: ReactNode;
  copyValue?: string;
  onCopy?: (text: string) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0">
      <span className="text-xs text-slate-400">{label}</span>
      <span className="text-sm text-white flex items-center gap-1.5 break-words">
        {value}
        {copyValue && onCopy ? (
          <button
            type="button"
            className="text-slate-400 hover:text-primary shrink-0"
            onClick={() => onCopy(copyValue)}
            aria-label={`Copiar ${label}`}
          >
            <i className="fa-regular fa-copy text-xs" />
          </button>
        ) : null}
      </span>
    </div>
  );
}

export function FamilyMembersSection({ poliza, onRefresh }: FamilyMembersSectionProps) {
  const { toast } = useToast();
  const clientesInfo = poliza?.clientes_info || [];

  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [revealedContact, setRevealedContact] = useState<Record<number, { email?: boolean; phone?: boolean }>>({});

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  const [migratoryModalOpen, setMigratoryModalOpen] = useState(false);
  const [ingresoModalOpen, setIngresoModalOpen] = useState(false);
  const [selectedIngreso, setSelectedIngreso] = useState<IngresoEmpleadorForm | null>(null);

  const [legalDocModalOpen, setLegalDocModalOpen] = useState(false);
  const [legalDocTipo, setLegalDocTipo] = useState<LegalDocumentType>('pasaporte');
  const [legalDocTipoLabel, setLegalDocTipoLabel] = useState('');
  const [legalDocExisting, setLegalDocExisting] = useState<DocumentoLegalLink | null>(null);
  const [revealedDocNumbers, setRevealedDocNumbers] = useState<Record<string, boolean>>({});
  const [togglingApplicantId, setTogglingApplicantId] = useState<number | null>(null);

  const stats = useMemo(() => {
    const aplicantes = clientesInfo.filter(isAplicante).length;
    const familiares = clientesInfo.filter((m: any) => !isTitular(m)).length;
    const dependientes = clientesInfo.filter((m: any) => !isTitular(m) && !isAplicante(m)).length;
    return { aplicantes, familiares, dependientes };
  }, [clientesInfo]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clientesInfo;
    return clientesInfo.filter((member: any) => {
      const name = getMemberFullName(member.cliente_details).toLowerCase();
      return name.includes(q);
    });
  }, [clientesInfo, search]);

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    toast({
      title: ok ? 'Copiado al portapapeles' : 'No se pudo copiar',
      variant: ok ? 'default' : 'destructive',
    });
  };

  const openCreate = () => {
    setSelectedMember(null);
    setFormMode('create');
    setFormModalOpen(true);
  };

  const openEdit = (member: any) => {
    setSelectedMember(member);
    setFormMode('edit');
    setFormModalOpen(true);
  };

  const toggleExpand = (memberId: number) => {
    setExpandedId((prev) => (prev === memberId ? null : memberId));
  };

  const toggleReveal = (memberId: number, field: 'email' | 'phone') => {
    setRevealedContact((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], [field]: !prev[memberId]?.[field] },
    }));
  };

  const handleQuickUpdate = (member: any) => {
    openEdit(member);
  };

  const handleToggleAplicante = async (member: any, checked: boolean) => {
    if (!poliza?.id || isTitular(member)) return;

    setTogglingApplicantId(member.id);
    try {
      const principal = clientesInfo.find((m: any) => m.es_solicitante_principal);
      const direccionId = principal?.direccion_residencia || poliza.direccion_fisica || null;
      const payload = buildPolizaClientesPayload(clientesInfo, {
        updateMemberId: member.id,
        es_aplicante: checked,
        fallbackDireccionId: direccionId,
      });
      await api.polizas.patch(poliza.id, payload as any);
      toast({
        title: checked ? 'Miembro marcado como aplicante' : 'Miembro marcado como no aplicante',
      });
      onRefresh();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estatus de aplicante.',
        variant: 'destructive',
      });
    } finally {
      setTogglingApplicantId(null);
    }
  };

  const handleSendSms = (member: any) => {
    const phone = member.cliente_details?.telefono;
    if (!phone) {
      toast({ title: 'Sin teléfono registrado', variant: 'destructive' });
      return;
    }
    toast({ title: 'Enviar SMS', description: `Funcionalidad pendiente para ${phone}` });
  };

  const handleSendEmail = (member: any) => {
    const email = member.cliente_details?.email;
    if (!email) {
      toast({ title: 'Sin correo registrado', variant: 'destructive' });
      return;
    }
    window.location.href = `mailto:${email}`;
  };

  const getIngresosRows = (member: any) => {
    const details = member.cliente_details;
    const rows = details?.ingresos_empleador;
    if (Array.isArray(rows) && rows.length > 0) return rows;
    const annual = parseFloat(String(details?.ingreso_anual || 0)) || 0;
    if (annual > 0) {
      return [
        {
          id: undefined,
          nombre_empleador: '',
          telefono_empleador: '',
          cargo_ocupacion: '',
          ingreso_anual: annual,
          ingreso_mensual: monthlyFromAnnual(annual),
          _fallback: true,
        },
      ];
    }
    return [];
  };

  const handleDeleteIngreso = async (ingresoId: number) => {
    try {
      await ingresosEmpleadorApi.delete(ingresoId);
      toast({ title: 'Ingreso eliminado' });
      onRefresh();
    } catch {
      toast({ title: 'Error al eliminar ingreso', variant: 'destructive' });
    }
  };

  const openLegalDocModal = (member: any, tipo: LegalDocumentType, label: string) => {
    setSelectedMember(member);
    setLegalDocTipo(tipo);
    setLegalDocTipoLabel(label);
    setLegalDocExisting(getLegalDocLink(member.cliente_details, tipo));
    setLegalDocModalOpen(true);
  };

  const handleUnlinkLegalDoc = async (link: DocumentoLegalLink | null) => {
    if (!link?.id) return;
    try {
      await documentosLegalesApi.unlink(link.id);
      toast({ title: 'Documento desvinculado' });
      onRefresh();
    } catch {
      toast({ title: 'Error al desvincular', variant: 'destructive' });
    }
  };

  const handleViewLegalDoc = (link: DocumentoLegalLink | null) => {
    const url = link?.documento_details?.archivo;
    if (!url) {
      toast({ title: 'Archivo no disponible', variant: 'destructive' });
      return;
    }
    window.open(resolveApiMediaUrl(url) || url, '_blank', 'noopener,noreferrer');
  };

  const toggleRevealDocNumber = (memberId: number, tipo: LegalDocumentType) => {
    const key = `${memberId}-${tipo}`;
    setRevealedDocNumbers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <div className="bg-white shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 dark:shadow-none flex w-full min-w-0 flex-col p-4 lg:p-4 overflow-hidden">
        <div className="flex items-center flex-wrap justify-between gap-2 mb-2">
          <h2 className="text-gray-700 dark:text-white text-base font-semibold">Miembros de la familia</h2>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              onClick={() => setShowSearch((prev) => !prev)}
            >
              <i className="fa-solid fa-magnifying-glass" />
              Buscar contacto
            </button>
            <button
              className="flex gap-2 items-center w-fit cursor-pointer justify-center rounded-md transition-colors py-1.5 font-medium bg-primary text-white hover:bg-primary/90 px-2 text-xs"
              type="button"
              onClick={openCreate}
            >
              <i className="fa-solid fa-plus" />
              Agregar miembro
            </button>
          </div>
        </div>

        {showSearch && (
          <div className="mb-3">
            <Input
              autoFocus
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm max-w-xs dark:bg-slate-900 dark:border-slate-600"
            />
          </div>
        )}

        <hr className="border-slate-200 dark:border-slate-600 flex-1 mx-2 mb-4" />

        <div className="flex flex-wrap gap-6 mb-4 items-center">
          <div className="flex flex-col">
            <h3 className="text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-1">
              Total de aplicantes
              <i className="fa-regular fa-circle-info text-xs text-slate-400" />
            </h3>
            <p className="dark:text-white text-base text-primary font-semibold">{stats.aplicantes}</p>
          </div>
          <div className="flex flex-col">
            <h3 className="text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-1">
              Total de miembros de la familia
              <i className="fa-regular fa-circle-info text-xs text-slate-400" />
            </h3>
            <p className="dark:text-white text-base text-primary font-semibold">{stats.familiares}</p>
          </div>
          <div className="flex flex-col">
            <h3 className="text-gray-700 dark:text-gray-300 text-sm font-medium flex items-center gap-1">
              Total de dependientes
              <i className="fa-regular fa-circle-info text-xs text-slate-400" />
            </h3>
            <p className="dark:text-white text-base text-primary font-semibold">{stats.dependientes}</p>
          </div>
        </div>

        <div className="flex flex-col divide-y divide-slate-200 dark:divide-slate-700">
          {filteredMembers.map((member: any) => {
            const details = member.cliente_details || {};
            const memberId = member.id;
            const expanded = expandedId === memberId;
            const age = calculateAge(details.fecha_nacimiento);
            const income = getMemberIncome(member);
            const reveal = revealedContact[memberId] || {};
            const email = details.email as string | undefined;
            const phone = details.telefono as string | undefined;
            const ingresosRows = getIngresosRows(member);
            const totalAnnual = ingresosRows.reduce(
              (s: number, r: any) => s + (parseFloat(String(r.ingreso_anual || 0)) || 0),
              0,
            );
            const totalMonthly = ingresosRows.reduce(
              (s: number, r: any) => s + (parseFloat(String(r.ingreso_mensual || 0)) || 0),
              0,
            );

            return (
              <div key={memberId} className="py-4 first:pt-0">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center rounded-lg bg-blue-100 dark:bg-primary/20 w-10 h-10 shrink-0 mt-0.5">
                    <i className="text-blue-500 dark:text-blue-400 fas fa-user" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-primary font-medium text-sm sm:text-base">
                            {getMemberFullName(details)}
                          </span>
                          <span className="text-xs bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full">
                            {getRelacionBadge(member)}
                          </span>
                          {isAplicante(member) ? (
                            <span className="text-xs flex items-center gap-1 text-green-600 dark:text-green-400">
                              <i className="fa-solid fa-circle-check" />
                              Aplicante
                            </span>
                          ) : (
                            <span className="text-xs flex items-center gap-1 text-red-500 dark:text-red-400">
                              <i className="fa-solid fa-circle-xmark" />
                              No aplicante
                            </span>
                          )}
                        </div>

                        <div className="text-gray-500 dark:text-gray-400 text-xs flex flex-wrap items-center gap-1">
                          <span>{details.idioma_preferido || 'ES'}</span>
                          <span>•</span>
                          <span>
                            {getGenderLabel(details.genero)}
                            {age != null ? ` (${age})` : ''}
                          </span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <i className="fa-regular fa-calendar" />
                            {formatMemberBirthDate(details.fecha_nacimiento)}
                            <button
                              type="button"
                              className="text-slate-400 hover:text-primary"
                              onClick={() =>
                                details.fecha_nacimiento &&
                                handleCopy(formatMemberBirthDate(details.fecha_nacimiento))
                              }
                            >
                              <i className="fa-regular fa-copy text-[10px]" />
                            </button>
                          </span>
                        </div>

                        {(email || phone) && (
                          <div className="text-gray-500 dark:text-gray-400 text-xs flex flex-wrap items-center gap-3 mt-0.5">
                            {email ? (
                              <span className="inline-flex items-center gap-1">
                                <i className="fa-regular fa-envelope" />
                                {reveal.email ? email : maskEmail(email)}
                                <button
                                  type="button"
                                  className="text-slate-400 hover:text-primary"
                                  onClick={() => toggleReveal(memberId, 'email')}
                                >
                                  <i className={`fa-regular ${reveal.email ? 'fa-eye-slash' : 'fa-eye'} text-[10px]`} />
                                </button>
                              </span>
                            ) : null}
                            {phone ? (
                              <span className="inline-flex items-center gap-1">
                                <i className="fa-solid fa-phone" />
                                {reveal.phone ? phone : maskPhone(phone)}
                                <button
                                  type="button"
                                  className="text-slate-400 hover:text-primary"
                                  onClick={() => toggleReveal(memberId, 'phone')}
                                >
                                  <i className={`fa-regular ${reveal.phone ? 'fa-eye-slash' : 'fa-eye'} text-[10px]`} />
                                </button>
                              </span>
                            ) : null}
                          </div>
                        )}

                        <div className="text-sm font-medium text-white mt-1">{formatUsd(income)}</div>
                      </div>

                      <div className="flex shrink-0">
                        <div className="inline-flex rounded-md overflow-hidden border border-primary">
                          <button
                            type="button"
                            className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 min-w-[3.25rem] text-primary bg-transparent hover:bg-primary/10 transition-colors border-r border-primary"
                            onClick={() => toggleExpand(memberId)}
                          >
                            <span className="text-xs font-medium leading-none">Ver</span>
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="flex items-center justify-center px-2 py-1.5 text-primary bg-transparent hover:bg-primary/10 transition-colors"
                                aria-label="Opciones"
                              >
                                <ChevronDown className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-700 min-w-[180px]">
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer"
                                onClick={() => handleQuickUpdate(member)}
                              >
                                <i className="fa-solid fa-pen text-sm" />
                                Actualización rápida
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-slate-400"
                                disabled={!phone}
                                onClick={() => handleSendSms(member)}
                              >
                                <i className="fa-solid fa-mobile-screen" />
                                Mensaje de texto
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="gap-2 cursor-pointer text-slate-400"
                                disabled={!email}
                                onClick={() => handleSendEmail(member)}
                              >
                                <i className="fa-regular fa-envelope" />
                                Enviar correo
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>

                    {expanded && (
                      <div className="mt-4 min-w-0 overflow-hidden space-y-4 rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-white">Información personal</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-primary gap-1 hover:bg-primary/10"
                            onClick={() => openEdit(member)}
                          >
                            <i className="fa-solid fa-pen text-[10px]" />
                            Editar
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <DetailField
                            label="¿Aplicante?"
                            value={
                              isTitular(member) ? (
                                <span className="text-green-400 flex items-center gap-2">
                                  Sí
                                  <Switch checked disabled aria-label="Titular aplicante" />
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  <Switch
                                    checked={Boolean(member.es_aplicante)}
                                    disabled={togglingApplicantId === memberId}
                                    onCheckedChange={(checked) => handleToggleAplicante(member, checked)}
                                    aria-label="Marcar como aplicante"
                                  />
                                  <span className={member.es_aplicante ? 'text-green-400' : 'text-red-400'}>
                                    {member.es_aplicante ? 'Sí' : 'No'}
                                  </span>
                                </span>
                              )
                            }
                          />
                          <DetailField label="Relación con el titular" value={getRelacionBadge(member)} />
                          <DetailField
                            label="Lenguaje de preferencia"
                            value={getIdiomaLabel(details.idioma_preferido)}
                          />
                          <DetailField
                            label="Nombre"
                            value={details.primer_nombre || '—'}
                            copyValue={details.primer_nombre}
                            onCopy={handleCopy}
                          />
                          <DetailField
                            label="Segundo nombre"
                            value={details.segundo_nombre || '—'}
                            copyValue={details.segundo_nombre || undefined}
                            onCopy={details.segundo_nombre ? handleCopy : undefined}
                          />
                          <DetailField
                            label="Apellido paterno"
                            value={details.apellido_paterno || '—'}
                            copyValue={details.apellido_paterno}
                            onCopy={handleCopy}
                          />
                          <DetailField
                            label="Segundo apellido"
                            value={details.apellido_materno || '—'}
                            copyValue={details.apellido_materno || undefined}
                            onCopy={details.apellido_materno ? handleCopy : undefined}
                          />
                          <DetailField
                            label="Fecha de nacimiento"
                            value={formatMemberBirthDate(details.fecha_nacimiento)}
                            copyValue={
                              details.fecha_nacimiento
                                ? formatMemberBirthDate(details.fecha_nacimiento)
                                : undefined
                            }
                            onCopy={handleCopy}
                          />
                          <DetailField label="Género" value={getGenderLabel(details.genero)} />
                          <DetailField label="País de nacimiento" value={details.pais_nacimiento || '—'} />
                          <DetailField label="Estado civil" value={details.estado_civil || '—'} />
                          <DetailField
                            label="Correo electrónico"
                            value={details.email || '—'}
                            copyValue={details.email || undefined}
                            onCopy={details.email ? handleCopy : undefined}
                          />
                          <DetailField
                            label="Teléfono"
                            value={details.telefono || '—'}
                            copyValue={details.telefono || undefined}
                            onCopy={details.telefono ? handleCopy : undefined}
                          />
                          <DetailField label="Peso (Lbs)" value={details.peso || '—'} />
                          <DetailField label="Altura (Ft)" value={details.estatura || '—'} />
                          <DetailField
                            label="¿Usa tabaco?"
                            value={
                              details.usa_tabaco ? (
                                <span className="text-green-400">Sí</span>
                              ) : (
                                <span className="text-red-400 flex items-center gap-1">
                                  No <i className="fa-solid fa-circle-xmark text-xs" />
                                </span>
                              )
                            }
                          />
                        </div>

                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-white">Ingresos</h4>
                            <div className="inline-flex rounded-md overflow-hidden border border-primary">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary bg-transparent hover:bg-primary/10 transition-colors"
                                onClick={() => {
                                  setSelectedMember(member);
                                  setSelectedIngreso(null);
                                  setIngresoModalOpen(true);
                                }}
                              >
                                <i className="fa-solid fa-plus text-[10px]" />
                                Agregar
                              </button>
                              <button
                                type="button"
                                className="px-1.5 py-1 text-primary bg-transparent hover:bg-primary/10 transition-colors border-l border-primary"
                                aria-label="Agregar ingreso"
                                onClick={() => {
                                  setSelectedMember(member);
                                  setSelectedIngreso(null);
                                  setIngresoModalOpen(true);
                                }}
                              >
                                <i className="fa-solid fa-chevron-down text-[10px]" />
                              </button>
                            </div>
                          </div>
                          <div className="w-full max-w-full overflow-x-auto rounded-md border border-slate-700">
                            <table className="w-full min-w-[560px] table-fixed text-xs text-left">
                              <thead className="bg-slate-800/80 text-slate-300">
                                <tr>
                                  <th className="w-[26%] px-3 py-2 font-medium">Nombre del empleador</th>
                                  <th className="w-[16%] px-3 py-2 font-medium">Teléfono del empleador</th>
                                  <th className="w-[18%] px-3 py-2 font-medium">Cargo / Ocupación</th>
                                  <th className="w-[14%] px-3 py-2 font-medium">Ingreso anual</th>
                                  <th className="w-[14%] px-3 py-2 font-medium">Ingreso mensual</th>
                                  <th className="w-[12%] px-3 py-2 font-medium text-right">Acciones</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-700">
                                {ingresosRows.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="px-3 py-4 text-center text-slate-400">
                                      Sin ingresos registrados
                                    </td>
                                  </tr>
                                ) : (
                                  ingresosRows.map((row: any, idx: number) => (
                                    <tr key={row.id ?? `fallback-${idx}`} className="text-slate-200">
                                      <td className="px-3 py-2">{row.nombre_empleador || '—'}</td>
                                      <td className="px-3 py-2">{row.telefono_empleador || '—'}</td>
                                      <td className="px-3 py-2">{row.cargo_ocupacion || '—'}</td>
                                      <td className="px-3 py-2">{formatUsd(row.ingreso_anual)}</td>
                                      <td className="px-3 py-2">{formatUsd(row.ingreso_mensual)}</td>
                                      <td className="px-3 py-2 text-right">
                                        {row._fallback ? (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 text-[10px] border-primary text-primary"
                                            onClick={() => {
                                              setSelectedMember(member);
                                              setSelectedIngreso({
                                                ingreso_anual: String(row.ingreso_anual),
                                                ingreso_mensual: String(row.ingreso_mensual),
                                                nombre_empleador: '',
                                                telefono_empleador: '',
                                                cargo_ocupacion: '',
                                              });
                                              setIngresoModalOpen(true);
                                            }}
                                          >
                                            Editar
                                          </Button>
                                        ) : (
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-6 text-[10px] border-primary text-primary gap-1"
                                              >
                                                Editar
                                                <i className="fa-solid fa-chevron-down text-[8px]" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="dark:bg-slate-900">
                                              <DropdownMenuItem
                                                onClick={() => {
                                                  setSelectedMember(member);
                                                  setSelectedIngreso({
                                                    id: row.id,
                                                    nombre_empleador: row.nombre_empleador || '',
                                                    telefono_empleador: row.telefono_empleador || '',
                                                    cargo_ocupacion: row.cargo_ocupacion || '',
                                                    ingreso_anual: String(row.ingreso_anual ?? ''),
                                                    ingreso_mensual: String(row.ingreso_mensual ?? ''),
                                                  });
                                                  setIngresoModalOpen(true);
                                                }}
                                              >
                                                Editar
                                              </DropdownMenuItem>
                                              {row.id ? (
                                                <DropdownMenuItem
                                                  className="text-red-400"
                                                  onClick={() => handleDeleteIngreso(row.id)}
                                                >
                                                  Eliminar
                                                </DropdownMenuItem>
                                              ) : null}
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                              {ingresosRows.length > 0 && (
                                <tfoot className="bg-slate-800/50 text-slate-200 font-medium">
                                  <tr>
                                    <td colSpan={3} className="px-3 py-2 text-right">
                                      Total:
                                    </td>
                                    <td className="px-3 py-2">
                                      <span className="inline-flex items-center gap-1">
                                        {formatUsd(totalAnnual)}
                                        {totalAnnual > 0 ? (
                                          <button
                                            type="button"
                                            className="text-slate-400 hover:text-primary"
                                            onClick={() => handleCopy(String(totalAnnual))}
                                            aria-label="Copiar ingreso anual total"
                                          >
                                            <i className="fa-regular fa-copy text-[10px]" />
                                          </button>
                                        ) : null}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2">
                                      <span className="inline-flex items-center gap-1">
                                        {formatUsd(totalMonthly)}
                                        {totalMonthly > 0 ? (
                                          <button
                                            type="button"
                                            className="text-slate-400 hover:text-primary"
                                            onClick={() => handleCopy(String(totalMonthly))}
                                            aria-label="Copiar ingreso mensual total"
                                          >
                                            <i className="fa-regular fa-copy text-[10px]" />
                                          </button>
                                        ) : null}
                                      </span>
                                    </td>
                                    <td />
                                  </tr>
                                </tfoot>
                              )}
                            </table>
                          </div>
                        </div>

                        <div className="pt-2">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-white">Estatus migratorio</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-primary gap-1 hover:bg-primary/10"
                              onClick={() => {
                                setSelectedMember(member);
                                setMigratoryModalOpen(true);
                              }}
                            >
                              <i className="fa-solid fa-pen text-[10px]" />
                              Editar
                            </Button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <DetailField
                              label="Estatus migratorio"
                              value={getEstatusMigratorioLabel(details.estado_inmigracion)}
                              copyValue={getEstatusMigratorioLabel(details.estado_inmigracion) !== '—'
                                ? getEstatusMigratorioLabel(details.estado_inmigracion)
                                : undefined}
                              onCopy={details.estado_inmigracion ? handleCopy : undefined}
                            />
                            <DetailField
                              label="Categoría de estatus migratorio"
                              value={details.categoria_inmigracion || '—'}
                              copyValue={details.categoria_inmigracion || undefined}
                              onCopy={details.categoria_inmigracion ? handleCopy : undefined}
                            />
                            <DetailField
                              label="Número de USCIS"
                              value={details.numero_uscis || '—'}
                              copyValue={details.numero_uscis || undefined}
                              onCopy={details.numero_uscis ? handleCopy : undefined}
                            />
                          </div>

                          <h5 className="text-xs font-semibold text-slate-300 mb-2">Documentos legales</h5>
                          <div className="w-full max-w-full overflow-x-auto rounded-md border border-slate-700">
                            <table className="w-full min-w-[640px] table-fixed text-xs text-left">
                              <thead className="bg-slate-800/80 text-slate-300">
                                <tr>
                                  <th className="w-[24%] px-3 py-2 font-medium">Documento</th>
                                  <th className="w-[20%] px-3 py-2 font-medium">Documento #</th>
                                  <th className="w-[18%] px-3 py-2 font-medium">Fecha de emisión</th>
                                  <th className="w-[18%] px-3 py-2 font-medium">Fecha de vencimiento</th>
                                  <th className="w-[20%] px-3 py-2 font-medium text-right">Acciones</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-700">
                                {DOCUMENTOS_LEGALES.map((doc) => {
                                  const link = getLegalDocLink(details, doc.key);
                                  const docNumber = link?.numero_documento || '';
                                  const revealKey = `${memberId}-${doc.key}`;
                                  const revealed = revealedDocNumbers[revealKey];
                                  const fechaEmision =
                                    link?.fecha_emision ||
                                    link?.documento_details?.fecha_subida ||
                                    null;
                                  const fechaVencimiento =
                                    link?.fecha_vencimiento ||
                                    link?.documento_details?.fecha_vencimiento ||
                                    null;
                                  const linkedTitle = link?.documento_details?.titulo;

                                  return (
                                    <tr key={doc.key} className="text-slate-200">
                                      <td className="px-3 py-2 align-top">
                                        <div className="truncate" title={doc.label}>{doc.label}</div>
                                        {linkedTitle ? (
                                          <div
                                            className="text-[10px] text-slate-400 truncate"
                                            title={linkedTitle}
                                          >
                                            {linkedTitle}
                                          </div>
                                        ) : null}
                                      </td>
                                      <td className="px-3 py-2 align-top">
                                        {docNumber ? (
                                          <span className="inline-flex items-center gap-1">
                                            {revealed ? docNumber : maskDocumentNumber(docNumber)}
                                            <button
                                              type="button"
                                              className="text-slate-400 hover:text-primary"
                                              onClick={() => toggleRevealDocNumber(memberId, doc.key)}
                                            >
                                              <i className={`fa-regular ${revealed ? 'fa-eye-slash' : 'fa-eye'} text-[10px]`} />
                                            </button>
                                          </span>
                                        ) : link?.documento_details ? (
                                          <span className="text-slate-400 italic text-[10px]">Archivo vinculado</span>
                                        ) : (
                                          '—'
                                        )}
                                      </td>
                                      <td className="px-3 py-2 align-top whitespace-nowrap">
                                        {fechaEmision ? formatIsoDateDisplay(fechaEmision) : '—'}
                                      </td>
                                      <td className="px-3 py-2 align-top whitespace-nowrap">
                                        {fechaVencimiento ? formatIsoDateDisplay(fechaVencimiento) : '—'}
                                      </td>
                                      <td className="px-3 py-2 align-top text-right">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="h-6 text-[10px] border-primary text-primary gap-1"
                                            >
                                              Editar
                                              <i className="fa-solid fa-chevron-down text-[8px]" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-700">
                                            <DropdownMenuItem
                                              className="cursor-pointer"
                                              onClick={() => openLegalDocModal(member, doc.key, doc.label)}
                                            >
                                              {link?.documento ? 'Cambiar documento' : 'Seleccionar documento'}
                                            </DropdownMenuItem>
                                            {link?.documento ? (
                                              <>
                                                <DropdownMenuItem
                                                  className="cursor-pointer"
                                                  onClick={() => handleViewLegalDoc(link)}
                                                >
                                                  Ver archivo
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                  className="cursor-pointer text-red-400"
                                                  onClick={() => handleUnlinkLegalDoc(link)}
                                                >
                                                  Quitar vínculo
                                                </DropdownMenuItem>
                                              </>
                                            ) : null}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredMembers.length === 0 && (
            <p className="text-sm text-slate-400 py-4 text-center">No hay miembros que coincidan con la búsqueda.</p>
          )}
        </div>
      </div>

      <FamilyMemberFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        mode={formMode}
        poliza={poliza}
        member={selectedMember}
        onSaved={onRefresh}
      />

      <FamilyMemberMigratoryModal
        open={migratoryModalOpen}
        onOpenChange={setMigratoryModalOpen}
        member={selectedMember}
        onSaved={onRefresh}
      />

      {selectedMember?.cliente ? (
        <FamilyMemberIngresoModal
          open={ingresoModalOpen}
          onOpenChange={setIngresoModalOpen}
          clienteId={selectedMember.cliente}
          initial={selectedIngreso}
          onSaved={onRefresh}
        />
      ) : null}

      {selectedMember?.cliente && poliza?.id ? (
        <SelectLegalDocumentModal
          open={legalDocModalOpen}
          onOpenChange={setLegalDocModalOpen}
          polizaId={poliza.id}
          clienteId={selectedMember.cliente}
          tipo={legalDocTipo}
          tipoLabel={legalDocTipoLabel}
          existing={legalDocExisting}
          onSaved={onRefresh}
        />
      ) : null}
    </>
  );
}
