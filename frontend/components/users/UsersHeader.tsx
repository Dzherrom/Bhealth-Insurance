import { Button } from '@/components/ui/button';
import { Settings, Plus, Users } from 'lucide-react';

interface UsersHeaderProps {
  onNewUser?: () => void;
  isCreating?: boolean;
}

export function UsersHeader({ onNewUser, isCreating = false }: UsersHeaderProps) {
  return (
    <div className="flex flex-col gap-4 mb-[20px] md:flex-row md:items-center md:justify-between">
      <div>
        <h2 className="text-[20px] font-bold text-[#0f172a] dark:text-white m-0">Gestión de Empleados</h2>
        <p className="text-[13px] text-[#64748b] dark:text-gray-400 mt-[4px]">
          Administra los empleados operativos y sus niveles de acceso al CRM
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button onClick={onNewUser} disabled={isCreating} className="h-[38px] bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-[10px] text-[13px] font-semibold px-[16px] shadow-[0_4px_10px_rgba(79,70,229,0.3)] transition-all">
          <Plus className="h-4 w-4 mr-2" />
          {isCreating ? 'Creando...' : 'Nuevo Empleado'}
        </Button>
      </div>
    </div>
  );
}
