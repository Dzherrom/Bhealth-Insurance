'use client';

import { useState } from 'react';
import { ChevronDown, CreditCard, Eye, EyeOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePermission } from '@/hooks/use-permission';
import api from '@/lib/api';
import {
  formatCardTypeLabel,
  formatPaymentCreatedAt,
  maskAccountNumber,
  maskCardNumber,
  maskCvv,
  maskRoutingNumber,
} from '@/lib/paymentMaskUtils';
import { PaymentCardFormModal } from '@/components/polizas/PaymentCardFormModal';
import { PaymentBankFormModal } from '@/components/polizas/PaymentBankFormModal';

interface PaymentMethodsSectionProps {
  polizaId: number;
  infoPago?: any | null;
  tarjetas: any[];
  cuentas: any[];
  onRefresh: () => void;
  onEditInfoPago?: () => void;
  formatFechaDisplay?: (value?: string | null) => string;
}

function SensitiveValue({
  masked,
  full,
  canReveal,
  revealed,
  onToggle,
}: {
  masked: string;
  full: string;
  canReveal: boolean;
  revealed: boolean;
  onToggle: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 min-w-0">
      <span className="truncate">{canReveal && revealed ? full : masked}</span>
      {canReveal ? (
        <button
          type="button"
          className="text-primary hover:text-primary/80 shrink-0"
          onClick={onToggle}
          aria-label={revealed ? 'Ocultar dato sensible' : 'Mostrar dato sensible'}
        >
          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      ) : null}
    </span>
  );
}

function SplitEditButton({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="inline-flex rounded-md overflow-hidden border border-primary ml-auto">
      <button
        type="button"
        className="px-0 py-0"
        onClick={onEdit}
      >
        <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10">
          Editar
        </span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center px-1.5 py-1 text-primary border-l border-primary hover:bg-primary/10"
            aria-label="Más acciones"
          >
            <ChevronDown className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="dark:bg-slate-900 dark:border-slate-700 min-w-[120px]">
          <DropdownMenuItem className="cursor-pointer" onClick={onEdit}>
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer text-red-400" onClick={onDelete}>
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function PaymentMethodsSection({
  polizaId,
  infoPago,
  tarjetas,
  cuentas,
  onRefresh,
  onEditInfoPago,
  formatFechaDisplay = (value) => value || '-',
}: PaymentMethodsSectionProps) {
  const { toast } = useToast();
  const { isAdmin } = usePermission();
  const canRevealSensitive = isAdmin;

  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<any | null>(null);
  const [editingBank, setEditingBank] = useState<any | null>(null);

  const toggleReveal = (key: string) => {
    setRevealed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openAddCard = () => {
    setEditingCard(null);
    setCardModalOpen(true);
  };

  const openEditCard = (card: any) => {
    setEditingCard(card);
    setCardModalOpen(true);
  };

  const openAddBank = () => {
    setEditingBank(null);
    setBankModalOpen(true);
  };

  const openEditBank = (bank: any) => {
    setEditingBank(bank);
    setBankModalOpen(true);
  };

  const deleteCard = async (id: number) => {
    if (!window.confirm('¿Eliminar esta tarjeta?')) return;
    try {
      await api.tarjetasCredito.delete(id);
      toast({ title: 'Tarjeta eliminada' });
      onRefresh();
    } catch {
      toast({ title: 'Error al eliminar tarjeta', variant: 'destructive' });
    }
  };

  const deleteBank = async (id: number) => {
    if (!window.confirm('¿Eliminar esta cuenta bancaria?')) return;
    try {
      await api.cuentasBancarias.delete(id);
      toast({ title: 'Cuenta eliminada' });
      onRefresh();
    } catch {
      toast({ title: 'Error al eliminar cuenta', variant: 'destructive' });
    }
  };

  return (
    <>
      <div className="bg-white shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 p-4 min-w-0 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-gray-700 dark:text-white text-base font-semibold">Información de pago</h2>
          {onEditInfoPago ? (
            <button
              className="flex gap-2 items-center bg-primary text-white hover:bg-primary/90 h-[30px] px-2 text-xs rounded-md"
              type="button"
              onClick={onEditInfoPago}
            >
              <i className="fa-duotone fa-edit" />
              {infoPago ? 'Editar' : 'Agregar'}
            </button>
          ) : null}
        </div>
        <hr className="border-slate-200 dark:border-slate-600 mx-2 mb-3" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Pago recurrente</div>
            <div className="text-sm dark:text-white">{infoPago ? (infoPago.pago_recurrente ? 'Sí' : 'No') : '-'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Fecha del primer pago</div>
            <div className="text-sm dark:text-white">{formatFechaDisplay(infoPago?.fecha_primer_pago)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">Día de pago preferido</div>
            <div className="text-sm dark:text-white">{infoPago?.dia_pago_preferido ?? '-'}</div>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-600 mx-2 my-4" />

        <div className="flex items-center justify-between mb-2">
          <h3 className="text-gray-700 dark:text-white text-sm font-semibold">Tarjetas de pago</h3>
          <button
            className="flex gap-2 items-center bg-primary text-white hover:bg-primary/90 h-[30px] px-2 text-xs rounded-md"
            type="button"
            onClick={openAddCard}
          >
            <i className="fa-solid fa-plus" />
            Agregar
          </button>
        </div>
        <hr className="border-slate-200 dark:border-slate-600 mx-2 mb-3" />

        {tarjetas.length === 0 ? (
          <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-md py-8 text-center flex flex-col items-center">
            <i className="fa-solid fa-credit-card text-2xl text-gray-400 mb-2" />
            <p className="font-medium dark:text-white">No se encontró información de la tarjeta</p>
            <p className="text-sm dark:text-gray-400 mt-1">Aún no tienes ninguna tarjeta de crédito o débito asociada.</p>
          </div>
        ) : (
          <div className="w-full max-w-full overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
            <table className="w-full min-w-[760px] table-fixed text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-300">
                <tr>
                  <th className="w-[12%] px-3 py-2 font-medium">Tipo de tarjeta</th>
                  <th className="w-[24%] px-3 py-2 font-medium">Número de tarjeta</th>
                  <th className="w-[22%] px-3 py-2 font-medium">Nombre en la tarjeta</th>
                  <th className="w-[10%] px-3 py-2 font-medium">CVV</th>
                  <th className="w-[14%] px-3 py-2 font-medium">Fecha de vencimiento</th>
                  <th className="w-[18%] px-3 py-2 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {tarjetas.map((tarjeta) => {
                  const cardKey = `card-${tarjeta.id}-numero`;
                  const cvvKey = `card-${tarjeta.id}-cvv`;
                  const fullNumber = String(tarjeta.numero || '');
                  const fullCvv = String(tarjeta.cvv || '');
                  const createdLabel = formatPaymentCreatedAt(tarjeta.fecha_creacion);

                  return (
                    <tr key={tarjeta.id} className="text-slate-700 dark:text-slate-200 align-top">
                      <td className="px-3 py-3">{formatCardTypeLabel(tarjeta.tipo_tarjeta)}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-start gap-2 min-w-0">
                          <CreditCard className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <SensitiveValue
                              masked={maskCardNumber(fullNumber)}
                              full={fullNumber}
                              canReveal={canRevealSensitive}
                              revealed={Boolean(revealed[cardKey])}
                              onToggle={() => toggleReveal(cardKey)}
                            />
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              {tarjeta.es_predeterminado ? (
                                <span className="inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                                  Predeterminado
                                </span>
                              ) : null}
                            </div>
                            {createdLabel ? (
                              <p className="text-[10px] text-slate-400 mt-1">Creado: {createdLabel}</p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 uppercase break-words">{tarjeta.nombre_titular || '—'}</td>
                      <td className="px-3 py-3">
                        <SensitiveValue
                          masked={maskCvv(fullCvv)}
                          full={fullCvv}
                          canReveal={canRevealSensitive}
                          revealed={Boolean(revealed[cvvKey])}
                          onToggle={() => toggleReveal(cvvKey)}
                        />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">{tarjeta.fecha_vencimiento || '—'}</td>
                      <td className="px-3 py-3 text-right">
                        <SplitEditButton
                          onEdit={() => openEditCard(tarjeta)}
                          onDelete={() => deleteCard(tarjeta.id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <hr className="border-slate-200 dark:border-slate-600 mx-2 my-4" />

        <div className="flex items-center justify-between mb-2">
          <h3 className="text-gray-700 dark:text-white text-sm font-semibold">Cuentas bancarias</h3>
          <button
            className="flex gap-2 items-center bg-primary text-white hover:bg-primary/90 h-[30px] px-2 text-xs rounded-md"
            type="button"
            onClick={openAddBank}
          >
            <i className="fa-solid fa-plus" />
            Agregar
          </button>
        </div>
        <hr className="border-slate-200 dark:border-slate-600 mx-2 mb-3" />

        {cuentas.length === 0 ? (
          <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-md py-8 text-center flex flex-col items-center">
            <i className="fa-solid fa-building-columns text-2xl text-gray-400 mb-2" />
            <p className="font-medium dark:text-white">No se encontró información de la cuenta bancaria</p>
            <p className="text-sm dark:text-gray-400 mt-1">Aún no tienes ninguna cuenta bancaria asociada.</p>
          </div>
        ) : (
          <div className="w-full max-w-full overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
            <table className="w-full min-w-[720px] table-fixed text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-300">
                <tr>
                  <th className="w-[22%] px-3 py-2 font-medium">Nombre del banco</th>
                  <th className="w-[24%] px-3 py-2 font-medium">Número de cuenta</th>
                  <th className="w-[20%] px-3 py-2 font-medium">ABA / Enrutamiento</th>
                  <th className="w-[20%] px-3 py-2 font-medium">Titular de la cuenta</th>
                  <th className="w-[14%] px-3 py-2 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {cuentas.map((cuenta) => {
                  const accountKey = `bank-${cuenta.id}-account`;
                  const routingKey = `bank-${cuenta.id}-routing`;
                  const fullAccount = String(cuenta.numero_cuenta || '');
                  const fullRouting = String(cuenta.aba_routing || '');
                  const createdLabel = formatPaymentCreatedAt(cuenta.fecha_creacion);

                  return (
                    <tr key={cuenta.id} className="text-slate-700 dark:text-slate-200 align-top">
                      <td className="px-3 py-3 uppercase break-words">{cuenta.nombre_banco || '—'}</td>
                      <td className="px-3 py-3">
                        <SensitiveValue
                          masked={maskAccountNumber(fullAccount)}
                          full={fullAccount}
                          canReveal={canRevealSensitive}
                          revealed={Boolean(revealed[accountKey])}
                          onToggle={() => toggleReveal(accountKey)}
                        />
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {cuenta.es_predeterminado ? (
                            <span className="inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                              Predeterminado
                            </span>
                          ) : null}
                        </div>
                        {createdLabel ? (
                          <p className="text-[10px] text-slate-400 mt-1">Creado: {createdLabel}</p>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <SensitiveValue
                          masked={maskRoutingNumber(fullRouting)}
                          full={fullRouting}
                          canReveal={canRevealSensitive}
                          revealed={Boolean(revealed[routingKey])}
                          onToggle={() => toggleReveal(routingKey)}
                        />
                      </td>
                      <td className="px-3 py-3 uppercase break-words">{cuenta.titular_cuenta || '—'}</td>
                      <td className="px-3 py-3 text-right">
                        <SplitEditButton
                          onEdit={() => openEditBank(cuenta)}
                          onDelete={() => deleteBank(cuenta.id)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PaymentCardFormModal
        open={cardModalOpen}
        onOpenChange={setCardModalOpen}
        initial={editingCard}
        onSubmit={async (form) => {
          const payload = { ...form, poliza: polizaId };
          if (editingCard?.id) {
            await api.tarjetasCredito.patch(editingCard.id, payload);
          } else {
            await api.tarjetasCredito.create(payload);
          }
          toast({ title: editingCard?.id ? 'Tarjeta actualizada' : 'Tarjeta agregada' });
          onRefresh();
        }}
      />

      <PaymentBankFormModal
        open={bankModalOpen}
        onOpenChange={setBankModalOpen}
        initial={editingBank}
        onSubmit={async (form) => {
          const payload = { ...form, poliza: polizaId };
          if (editingBank?.id) {
            await api.cuentasBancarias.patch(editingBank.id, payload);
          } else {
            await api.cuentasBancarias.create(payload);
          }
          toast({ title: editingBank?.id ? 'Cuenta actualizada' : 'Cuenta agregada' });
          onRefresh();
        }}
      />
    </>
  );
}
