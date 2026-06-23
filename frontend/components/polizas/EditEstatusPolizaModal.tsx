'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EstatusPolizaCards } from './EstatusPolizaCards';

interface EditEstatusPolizaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  polizaId: number;
  estado?: number | null;
  estadoNombre?: string;
  estadoDocumento?: string | null;
  infoPagoId?: number | null;
  estadoPago?: string | null;
  onUpdated?: () => void;
}

export function EditEstatusPolizaModal({
  open,
  onOpenChange,
  polizaId,
  estado,
  estadoNombre,
  estadoDocumento,
  infoPagoId,
  estadoPago,
  onUpdated,
}: EditEstatusPolizaModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar estatus de la póliza</DialogTitle>
          <DialogDescription>
            Actualice el estatus de póliza, documento y pago. Los cambios se aplican al guardar.
          </DialogDescription>
        </DialogHeader>

        <EstatusPolizaCards
          polizaId={polizaId}
          estado={estado}
          estadoNombre={estadoNombre}
          estadoDocumento={estadoDocumento}
          infoPagoId={infoPagoId}
          estadoPago={estadoPago}
          layout="column"
          deferSave
          showSaveButton
          onUpdated={onUpdated}
          onSaved={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
