'use client';

import { useState } from 'react';
import { User, MapPin, Phone, Mail, Shield, BadgeCheck, CreditCard, Landmark, FileEdit, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { portalClienteApi, type PortalClienteDashboard } from '@/lib/api';
import { PaymentCardFormModal } from '@/components/polizas/PaymentCardFormModal';
import { PaymentBankFormModal } from '@/components/polizas/PaymentBankFormModal';
import { cardClass, clientLight, formatCurrency, formatDate } from './constants';
import { InfoRow, PaymentItemCard } from './shared';

interface MisDatosCardProps {
  data: PortalClienteDashboard;
  polizaId: number;
  onSolicitarCambio: (campo: string) => void;
  onRefresh: () => Promise<void>;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const DATOS_PERSONALES = [
  { campo: 'fecha_nacimiento', icon: User, label: 'Fecha de nacimiento', getValue: (d: PortalClienteDashboard) => formatDate(d.fecha_nacimiento) },
  { campo: 'direccion', icon: MapPin, label: 'Dirección', getValue: (d: PortalClienteDashboard) => d.direccion_completa },
  { campo: 'telefono', icon: Phone, label: 'Teléfono', getValue: (d: PortalClienteDashboard) => d.telefono },
  { campo: 'email', icon: Mail, label: 'Correo', getValue: (d: PortalClienteDashboard) => d.email },
  { campo: 'ingresos', icon: Shield, label: 'Ingresos anuales', getValue: (d: PortalClienteDashboard) => formatCurrency(d.ingresos) },
] as const;

export function MisDatosCard({
  data,
  polizaId,
  onSolicitarCambio,
  onRefresh,
  onSuccess,
  onError,
}: MisDatosCardProps) {
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<PortalClienteDashboard['tarjetas_digitales'][number] | null>(null);
  const [editingBank, setEditingBank] = useState<NonNullable<PortalClienteDashboard['cuentas_bancarias']>[number] | null>(null);

  const nombreCompleto = [
    data.primer_nombre,
    data.apellido_paterno,
    data.apellido_materno,
  ].filter(Boolean).join(' ') || data.nombre_completo;

  const elegibilidad =
    (data.elegibilidad?.estado_inmigracion as string) ||
    (data.elegibilidad?.categoria_inmigracion as string) ||
    'En revisión';

  const editButton = (campo: string) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
      onClick={() => onSolicitarCambio(campo)}
    >
      <FileEdit className="h-3 w-3 mr-1" />
      Solicitar cambio
    </Button>
  );

  const openAddCard = () => {
    setEditingCard(null);
    setCardModalOpen(true);
  };

  const openEditCard = (tarjeta: PortalClienteDashboard['tarjetas_digitales'][number]) => {
    setEditingCard(tarjeta);
    setCardModalOpen(true);
  };

  const openAddBank = () => {
    setEditingBank(null);
    setBankModalOpen(true);
  };

  const openEditBank = (cuenta: NonNullable<PortalClienteDashboard['cuentas_bancarias']>[number]) => {
    setEditingBank(cuenta);
    setBankModalOpen(true);
  };

  const submitCardSolicitud = async (form: {
    tipo_tarjeta: string;
    numero: string;
    nombre_titular: string;
    cvv: string;
    fecha_vencimiento: string;
    es_predeterminado: boolean;
  }) => {
    try {
      const accion = editingCard ? 'EDITAR' : 'AGREGAR';
      await portalClienteApi.solicitarCambio({
        poliza_id: polizaId,
        campos: {
          tarjetas_digitales: {
            accion,
            tarjeta_id: editingCard?.id,
            datos: form,
          },
        },
        descripcion:
          accion === 'AGREGAR'
            ? 'Solicitud de agregar tarjeta de pago desde portal del cliente.'
            : `Solicitud de editar tarjeta de pago #${editingCard?.id} desde portal del cliente.`,
      });
      onSuccess(
        accion === 'AGREGAR'
          ? 'Solicitud para agregar tarjeta enviada correctamente.'
          : 'Solicitud para editar tarjeta enviada correctamente.',
      );
      await onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud de tarjeta');
      throw err;
    }
  };

  const submitBankSolicitud = async (form: {
    nombre_banco: string;
    numero_cuenta: string;
    aba_routing: string;
    titular_cuenta: string;
    es_predeterminado: boolean;
  }) => {
    try {
      const accion = editingBank ? 'EDITAR' : 'AGREGAR';
      await portalClienteApi.solicitarCambio({
        poliza_id: polizaId,
        campos: {
          cuentas_bancarias: {
            accion,
            cuenta_id: editingBank?.id,
            datos: form,
          },
        },
        descripcion:
          accion === 'AGREGAR'
            ? 'Solicitud de agregar cuenta bancaria desde portal del cliente.'
            : `Solicitud de editar cuenta bancaria #${editingBank?.id} desde portal del cliente.`,
      });
      onSuccess(
        accion === 'AGREGAR'
          ? 'Solicitud para agregar cuenta enviada correctamente.'
          : 'Solicitud para editar cuenta enviada correctamente.',
      );
      await onRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud de cuenta bancaria');
      throw err;
    }
  };

  return (
    <>
      <Card className={`lg:col-span-2 ${cardClass}`}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2 text-[#0f172a]">
            <User className="h-5 w-5 text-emerald-600" /> Mis datos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748b]">Nombre completo</p>
            <p className="text-base font-semibold text-[#0f172a] mt-1 break-words">{nombreCompleto}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            {DATOS_PERSONALES.map((item) => (
              <InfoRow
                key={item.campo}
                icon={item.icon}
                label={item.label}
                value={item.getValue(data)}
                action={editButton(item.campo)}
              />
            ))}
            <InfoRow icon={BadgeCheck} label="Elegibilidad" value={elegibilidad} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#e2e8f0]">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" /> Tarjetas de pago
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 text-xs shrink-0 ${clientLight.outlineButton}`}
                  onClick={openAddCard}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Solicitar agregar
                </Button>
              </div>
              {(data.tarjetas_digitales ?? []).length === 0 ? (
                <p className="text-sm text-[#64748b]">Sin tarjetas registradas.</p>
              ) : (
                data.tarjetas_digitales.map((tarjeta) => (
                  <PaymentItemCard
                    key={tarjeta.id}
                    title={tarjeta.tipo_tarjeta}
                    maskedNumber={tarjeta.numero_enmascarado}
                    subtitle={tarjeta.nombre_titular}
                    footer={[
                      tarjeta.fecha_vencimiento ? `Vence ${tarjeta.fecha_vencimiento}` : null,
                      tarjeta.es_predeterminado ? 'Predeterminada' : null,
                    ].filter(Boolean).join(' · ') || null}
                    action={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-emerald-700"
                        onClick={() => openEditCard(tarjeta)}
                      >
                        <FileEdit className="h-3 w-3 mr-1" />
                        Solicitar editar
                      </Button>
                    }
                  />
                ))
              )}
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <p className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-emerald-600" /> Cuentas bancarias
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-8 text-xs shrink-0 ${clientLight.outlineButton}`}
                  onClick={openAddBank}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Solicitar agregar
                </Button>
              </div>
              {(data.cuentas_bancarias ?? []).length === 0 ? (
                <p className="text-sm text-[#64748b]">Sin cuentas bancarias registradas.</p>
              ) : (
                (data.cuentas_bancarias ?? []).map((cuenta) => (
                  <PaymentItemCard
                    key={cuenta.id}
                    title={cuenta.nombre_banco}
                    maskedNumber={cuenta.numero_enmascarado}
                    subtitle={cuenta.titular_cuenta}
                    footer={[
                      cuenta.aba_enmascarado ? `ABA ${cuenta.aba_enmascarado}` : null,
                      cuenta.es_predeterminado ? 'Predeterminada' : null,
                    ].filter(Boolean).join(' · ') || null}
                    action={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-emerald-700"
                        onClick={() => openEditBank(cuenta)}
                      >
                        <FileEdit className="h-3 w-3 mr-1" />
                        Solicitar editar
                      </Button>
                    }
                  />
                ))
              )}
            </div>
          </div>

          <p className="text-xs text-[#64748b]">
            Las tarjetas y cuentas se gestionan con el mismo formulario del CRM. Los cambios se envían como solicitud para revisión del agente.
          </p>
        </CardContent>
      </Card>

      <PaymentCardFormModal
        open={cardModalOpen}
        onOpenChange={setCardModalOpen}
        initial={editingCard ? {
          id: editingCard.id,
          tipo_tarjeta: editingCard.tipo_tarjeta,
          nombre_titular: editingCard.nombre_titular,
          fecha_vencimiento: editingCard.fecha_vencimiento,
          es_predeterminado: editingCard.es_predeterminado,
        } : undefined}
        title={editingCard ? 'Solicitar editar tarjeta' : 'Solicitar agregar tarjeta'}
        submitLabel={editingCard ? 'Enviar solicitud' : 'Solicitar agregar'}
        lightMode
        sensitiveOptional
        onSubmit={submitCardSolicitud}
      />

      <PaymentBankFormModal
        open={bankModalOpen}
        onOpenChange={setBankModalOpen}
        initial={editingBank ? {
          id: editingBank.id,
          nombre_banco: editingBank.nombre_banco,
          titular_cuenta: editingBank.titular_cuenta,
          es_predeterminado: editingBank.es_predeterminado,
        } : undefined}
        title={editingBank ? 'Solicitar editar cuenta bancaria' : 'Solicitar agregar cuenta bancaria'}
        submitLabel={editingBank ? 'Enviar solicitud' : 'Solicitar agregar'}
        lightMode
        sensitiveOptional
        onSubmit={submitBankSolicitud}
      />
    </>
  );
}
