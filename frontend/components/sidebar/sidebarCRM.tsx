import React, { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  Calendar,
  ShieldCheck,
  CircleDollarSign,
  FileText,
  PenTool,
  Mail,
  Settings,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  SlidersHorizontal,
  LogOut,
} from 'lucide-react';

interface SidebarItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  colorClass: string;
  shadowClass: string;
}

interface SidebarGroup {
  label: string;
  items: SidebarItem[];
}

interface SidebarCRMProps {
  onItemClick?: (item: { href?: string }) => void;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

const navGroups: SidebarGroup[] = [
  {
    label: 'Principal',
    items: [
      { icon: Home, label: 'Dashboard', href: '/crm/dashboard', colorClass: 'text-[#2563eb]', shadowClass: 'hover:drop-shadow-[0_0_10px_rgba(37,99,235,0.5)]' },
      { icon: Users, label: 'Usuarios', href: '/crm/users', colorClass: 'text-[#4f46e5]', shadowClass: 'hover:drop-shadow-[0_0_10px_rgba(79,70,229,0.5)]' },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { icon: Calendar, label: 'Citas', href: '/crm/citas', colorClass: 'text-[#0d9488]', shadowClass: 'hover:drop-shadow-[0_0_10px_rgba(13,148,136,0.5)]' },
      { icon: ShieldCheck, label: 'Pólizas', href: '/crm/polizas', colorClass: 'text-[#059669]', shadowClass: 'hover:drop-shadow-[0_0_10px_rgba(5,150,105,0.5)]' },
      { icon: CircleDollarSign, label: 'Comisiones', href: '/crm/analytics', colorClass: 'text-[#e11d48]', shadowClass: 'hover:drop-shadow-[0_0_10px_rgba(225,29,72,0.5)]' },
    ],
  },
  {
    label: 'Documentos',
    items: [
      { icon: FileText, label: 'Formularios', href: '/crm/formularios-de-firmas', colorClass: 'text-[#ea580c]', shadowClass: 'hover:drop-shadow-[0_0_10px_rgba(234,88,12,0.5)]' },
      { icon: PenTool, label: 'Contratos', href: '/crm/contracts', colorClass: 'text-[#d97706]', shadowClass: 'hover:drop-shadow-[0_0_10px_rgba(217,119,6,0.5)]' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { icon: Mail, label: 'Correos', href: '/crm/messages', colorClass: 'text-[#7c3aed]', shadowClass: 'hover:drop-shadow-[0_0_10px_rgba(124,58,237,0.5)]' },
      { icon: Settings, label: 'Configuración', href: '/crm/configuraciones', colorClass: 'text-[#475569]', shadowClass: 'hover:drop-shadow-[0_0_10px_rgba(71,85,105,0.5)]' },
    ],
  },
];

const SidebarCRM = ({ onItemClick, onLogout, isLoggingOut = false }: SidebarCRMProps) => {
  const { state, toggleSidebar, setOpen } = useSidebar();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();

  const isCollapsed = state === 'collapsed';

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#profile-container')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <aside
      className={cn(
        "bg-white border-r border-[#e5e7eb] flex flex-col justify-between h-full transition-all duration-300 ease-in-out whitespace-nowrap relative z-10 font-['Inter',sans-serif]",
        isCollapsed ? "w-[56px]" : "w-[200px]"
      )}
    >
      {/* Header */}
      <div className={cn("p-[12px] flex items-center border-b border-[#f3f4f6] relative", isCollapsed ? "justify-center" : "")}>
        <button
          onClick={toggleSidebar}
          title={isCollapsed ? "Mostrar menú" : "Ocultar menú"}
          className="absolute top-1/2 -translate-y-1/2 right-[-11px] w-[22px] h-[22px] bg-white border border-[#e5e7eb] rounded-full cursor-pointer flex items-center justify-center text-[#4b5563] z-20 hover:bg-[#f9fafb] hover:text-[#111827] transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <div id="profile-container" className="relative flex cursor-pointer" onClick={() => setDropdownOpen(!dropdownOpen)}>
          <button className={cn("flex items-center gap-[8px] bg-transparent border-none rounded-[6px] transition-colors hover:bg-[#f3f4f6]", isCollapsed ? "w-full justify-center p-[4px]" : "p-[4px]")}>
            <div className="w-[28px] h-[28px] bg-[#e2e8f0] text-[#475569] rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0">
              NF
            </div>
          </button>
          
          {!isCollapsed && <span className="text-[12px] font-bold text-[#111827] ml-[8px] self-center">BHealth Insurance</span>}

          {/* Dropdown */}
          <div
            className={cn(
              "absolute top-[8px] left-[calc(100%+14px)] w-[200px] bg-white rounded-[8px] border border-[#e5e7eb] z-[9999] flex-col shadow-lg animate-in slide-in-from-left-4 duration-300",
              dropdownOpen ? "flex" : "hidden"
            )}
          >
            <div className="absolute top-[15px] left-[-5px] w-[8px] h-[8px] bg-white border-l border-b border-[#e5e7eb] rotate-45"></div>
            
            <div className="flex items-start p-[8px_10px] gap-[8px] relative z-[2]">
              <div className="w-[28px] h-[28px] bg-[#e2e8f0] text-[#475569] rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 mt-0">
                NF
              </div>
              <div className="flex flex-col gap-[1px] overflow-hidden">
                <strong className="text-[#4b5563] text-[11.5px] font-bold">Norland Figuera</strong>
                <span className="text-[#6b7280] text-[10px] whitespace-nowrap overflow-hidden text-ellipsis" title="norlandf@hihealthclinic.com">norlandf@hihealthclinic.com</span>
                <div className="inline-block bg-[#eff6ff] text-[#3b82f6] text-[9px] font-semibold px-[4px] py-[2px] rounded-[4px] border border-[#bfdbfe] mt-[3px] self-start">
                  Administrador
                </div>
              </div>
            </div>
            
            <div className="h-[1px] bg-[#f3f4f6] mx-[8px] my-[2px]"></div>
            
            <button className="flex items-center gap-[6px] px-[10px] py-[6px] text-decoration-none text-[#6b7280] text-[11px] font-medium transition-colors hover:bg-[#f9fafb] hover:text-[#374151] whitespace-nowrap w-full text-left">
              <UserIcon className="w-3.5 h-3.5 text-[#9ca3af]" /> Mi perfil
            </button>
            <button className="flex items-center gap-[6px] px-[10px] py-[6px] text-decoration-none text-[#6b7280] text-[11px] font-medium transition-colors hover:bg-[#f9fafb] hover:text-[#374151] whitespace-nowrap w-full text-left">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#9ca3af]" /> Preferencias
            </button>
            
            <div className="h-[1px] bg-[#f3f4f6] mx-[8px] my-[2px]"></div>
            
            <button onClick={onLogout} disabled={isLoggingOut} className="flex items-center gap-[6px] px-[10px] py-[6px] text-decoration-none text-red-500 hover:text-red-700 text-[11px] font-medium transition-colors hover:bg-red-50 whitespace-nowrap w-full text-left">
              <LogOut className="w-3.5 h-3.5" /> {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-grow p-[10px_6px] overflow-y-auto">
        {navGroups.map((group, idx) => (
          <div key={idx} className={cn("mb-[12px]", isCollapsed ? "mb-[4px] pb-[4px] border-b border-[#f3f4f6] last:border-b-0" : "")}>
            {!isCollapsed && (
              <div className="text-[9.5px] text-[#9ca3af] uppercase tracking-[0.5px] mb-[6px] pl-[8px] font-semibold">
                {group.label}
              </div>
            )}
            <ul className="list-none flex flex-col gap-[1px]">
              {group.items.map((item, itemIdx) => {
                const isActive = pathname === item.href;
                return (
                  <li key={itemIdx}>
                    <button
                      onClick={() => onItemClick?.(item)}
                      className={cn(
                        "w-full flex items-center gap-[8px] py-[6px] px-[8px] text-decoration-none text-[#4b5563] text-[12px] font-medium rounded-[6px] transition-all duration-150 group",
                        isActive ? "bg-[#f3f4f6] text-[#111827]" : "hover:bg-[#f3f4f6] hover:text-[#111827]",
                        isCollapsed ? "justify-center" : ""
                      )}
                    >
                      <item.icon className={cn("w-4 h-4 transition-all duration-300", item.colorClass, "group-hover:fill-current group-hover:drop-shadow-[0_0_8px_currentColor]")} />
                      {!isCollapsed && <span>{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-[10px_6px] border-t border-[#f3f4f6] text-center">
        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className={cn(
            "w-full flex items-center gap-[8px] py-[6px] px-[8px] rounded-[6px] text-[12px] font-medium transition-all duration-150",
            "text-[#dc2626] hover:bg-[#fef2f2] hover:text-[#b91c1c] disabled:opacity-60 disabled:cursor-not-allowed",
            isCollapsed ? "justify-center" : "justify-start"
          )}
          title={isLoggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>{isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}</span>}
        </button>

        {!isCollapsed && <div className="text-[10px] text-[#9ca3af]">BHealth v1.0</div>}
      </div>
    </aside>
  );
};

export default SidebarCRM;
