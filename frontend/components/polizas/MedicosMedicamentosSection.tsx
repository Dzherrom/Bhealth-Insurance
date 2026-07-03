'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import {
  medicosPolizaApi,
  medicamentosApi,
  type MedicoPoliza,
  type MedicamentoPoliza,
} from '@/lib/api';
import { EditMedicoPolizaModal } from './EditMedicoPolizaModal';
import { EditMedicamentoModal } from './EditMedicamentoModal';

interface MedicosMedicamentosSectionProps {
  polizaId: number;
  medicos: MedicoPoliza[];
  medicamentos: MedicamentoPoliza[];
  onRefresh: () => void;
}

function SplitEditButton({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="inline-flex rounded-md overflow-hidden border border-primary ml-auto">
      <button type="button" className="px-0 py-0" onClick={onEdit}>
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
          <DropdownMenuItem className="cursor-pointer" onClick={onEdit}>Editar</DropdownMenuItem>
          <DropdownMenuItem className="cursor-pointer text-red-400" onClick={onDelete}>Eliminar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function MedicosMedicamentosSection({
  polizaId,
  medicos,
  medicamentos,
  onRefresh,
}: MedicosMedicamentosSectionProps) {
  const { toast } = useToast();

  const [medicoModalOpen, setMedicoModalOpen] = useState(false);
  const [selectedMedico, setSelectedMedico] = useState<MedicoPoliza | null>(null);

  const [medicamentoModalOpen, setMedicamentoModalOpen] = useState(false);
  const [selectedMedicamento, setSelectedMedicamento] = useState<MedicamentoPoliza | null>(null);

  const openAddMedico = () => {
    setSelectedMedico(null);
    setMedicoModalOpen(true);
  };

  const openEditMedico = (medico: MedicoPoliza) => {
    setSelectedMedico(medico);
    setMedicoModalOpen(true);
  };

  const deleteMedico = async (id: number) => {
    if (!window.confirm('¿Eliminar este médico de la póliza?')) return;
    try {
      await medicosPolizaApi.delete(id);
      toast({ title: 'Médico eliminado' });
      onRefresh();
    } catch {
      toast({ title: 'Error al eliminar médico', variant: 'destructive' });
    }
  };

  const openAddMedicamento = () => {
    setSelectedMedicamento(null);
    setMedicamentoModalOpen(true);
  };

  const openEditMedicamento = (medicamento: MedicamentoPoliza) => {
    setSelectedMedicamento(medicamento);
    setMedicamentoModalOpen(true);
  };

  const deleteMedicamento = async (id: number) => {
    if (!window.confirm('¿Eliminar este medicamento de la póliza?')) return;
    try {
      await medicamentosApi.delete(id);
      toast({ title: 'Medicamento eliminado' });
      onRefresh();
    } catch {
      toast({ title: 'Error al eliminar medicamento', variant: 'destructive' });
    }
  };

  return (
    <>
      <div className="bg-white shadow-sm border-[1px] border-slate-100 rounded-lg dark:bg-slate-800 dark:border-slate-800 p-4 min-w-0 overflow-hidden">
        <h2 className="text-gray-700 dark:text-white text-base font-semibold mb-2">Salud y medicamentos</h2>
        <hr className="border-slate-200 dark:border-slate-600 mx-2 mb-3" />

        <div className="flex items-center justify-between mb-2">
          <h3 className="text-gray-700 dark:text-white text-sm font-semibold">Médicos</h3>
          <button
            className="flex gap-2 items-center bg-primary text-white hover:bg-primary/90 h-[30px] px-2 text-xs rounded-md"
            type="button"
            onClick={openAddMedico}
          >
            <i className="fa-solid fa-plus" />
            Agregar
          </button>
        </div>
        <hr className="border-slate-200 dark:border-slate-600 mx-2 mb-3" />

        {medicos.length === 0 ? (
          <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-md py-8 text-center">
            <p className="text-sm font-medium dark:text-white">No hay médicos registrados</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Agrega médicos asociados a esta póliza.</p>
          </div>
        ) : (
          <div className="w-full max-w-full overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
            <table className="w-full min-w-[640px] table-fixed text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-300">
                <tr>
                  <th className="w-[32%] px-3 py-2 font-medium">Nombre / información</th>
                  <th className="w-[20%] px-3 py-2 font-medium">Especialización</th>
                  <th className="w-[20%] px-3 py-2 font-medium">Hospital</th>
                  <th className="w-[14%] px-3 py-2 font-medium">Principal</th>
                  <th className="w-[14%] px-3 py-2 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {medicos.map((medico) => (
                  <tr key={medico.id} className="text-slate-700 dark:text-slate-200 align-top">
                    <td className="px-3 py-3 whitespace-pre-wrap break-words">{medico.nombre || '—'}</td>
                    <td className="px-3 py-3 break-words">{medico.especializacion || '—'}</td>
                    <td className="px-3 py-3 break-words">{medico.hospital || '—'}</td>
                    <td className="px-3 py-3">
                      {medico.es_principal ? (
                        <span className="inline-flex rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                          Principal
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <SplitEditButton
                        onEdit={() => openEditMedico(medico)}
                        onDelete={() => deleteMedico(medico.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <hr className="border-slate-200 dark:border-slate-600 mx-2 my-4" />

        <div className="flex items-center justify-between mb-2">
          <h3 className="text-gray-700 dark:text-white text-sm font-semibold">Medicamentos necesarios</h3>
          <button
            className="flex gap-2 items-center bg-primary text-white hover:bg-primary/90 h-[30px] px-2 text-xs rounded-md"
            type="button"
            onClick={openAddMedicamento}
          >
            <i className="fa-solid fa-plus" />
            Agregar
          </button>
        </div>
        <hr className="border-slate-200 dark:border-slate-600 mx-2 mb-3" />

        {medicamentos.length === 0 ? (
          <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-md py-8 text-center">
            <p className="text-sm font-medium dark:text-white">No hay medicamentos registrados</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Agrega los medicamentos cubiertos por el seguro.</p>
          </div>
        ) : (
          <div className="w-full max-w-full overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
            <table className="w-full min-w-[680px] table-fixed text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-300">
                <tr>
                  <th className="w-[28%] px-3 py-2 font-medium">Medicamento</th>
                  <th className="w-[18%] px-3 py-2 font-medium">Dosis</th>
                  <th className="w-[22%] px-3 py-2 font-medium">Duración del tratamiento</th>
                  <th className="w-[18%] px-3 py-2 font-medium">Frecuencia</th>
                  <th className="w-[14%] px-3 py-2 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {medicamentos.map((medicamento) => (
                  <tr key={medicamento.id} className="text-slate-700 dark:text-slate-200 align-top">
                    <td className="px-3 py-3 whitespace-pre-wrap break-words">{medicamento.nombre || '—'}</td>
                    <td className="px-3 py-3 break-words">{medicamento.dosis || '—'}</td>
                    <td className="px-3 py-3 break-words">{medicamento.duracion_tratamiento || '—'}</td>
                    <td className="px-3 py-3 break-words">{medicamento.frecuencia || '—'}</td>
                    <td className="px-3 py-3 text-right">
                      <SplitEditButton
                        onEdit={() => openEditMedicamento(medicamento)}
                        onDelete={() => deleteMedicamento(medicamento.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <EditMedicoPolizaModal
        open={medicoModalOpen}
        onOpenChange={setMedicoModalOpen}
        polizaId={polizaId}
        medico={selectedMedico}
        onSaved={onRefresh}
      />

      <EditMedicamentoModal
        open={medicamentoModalOpen}
        onOpenChange={setMedicamentoModalOpen}
        polizaId={polizaId}
        medicamento={selectedMedicamento}
        onSaved={onRefresh}
      />
    </>
  );
}
