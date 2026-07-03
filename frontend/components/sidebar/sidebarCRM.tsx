'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { canManageUsers, normalizeRoleClaim } from '@/lib/roles';
import {
  Home,
  Users,
  Calendar,
  ShieldCheck,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
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
      { icon: FileText, label: 'Cotizaciones', href: '/crm/cotizaciones', colorClass: 'text-[#059669]', shadowClass: 'hover:drop-shadow-[0_0_10px_rgba(5,150,105,0.5)]' },
    ],
  },
  {
    label: 'Documentos',
    items: [
      { icon: FileText, label: 'Formularios', href: '/crm/formularios-de-firmas', colorClass: 'text-[#ea580c]', shadowClass: 'hover:drop-shadow-[0_0_10px_rgba(234,88,12,0.5)]' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { icon: Settings, label: 'Configuración', href: '/crm/configuraciones', colorClass: 'text-[#475569] dark:text-gray-300', shadowClass: 'hover:drop-shadow-[0_0_10px_rgba(71,85,105,0.5)]' },
    ],
  },
];

const SidebarCRM = ({ onItemClick }: SidebarCRMProps) => {
  const { state, toggleSidebar } = useSidebar();
  const { role, user } = useAuthStore();
  const pathname = usePathname();

  const isCollapsed = state === 'collapsed';
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'Usuario';
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U';

  const filteredNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.href === '/crm/users') {
          const effectiveRole =
            normalizeRoleClaim(role) ?? normalizeRoleClaim(user?.profile?.role);
          return canManageUsers(effectiveRole);
        }
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <aside
      className={cn(
        "bg-white dark:bg-[#1e293b] border-r border-[#e5e7eb] dark:border-[#334155] flex flex-col justify-between h-full transition-all duration-300 ease-in-out whitespace-nowrap relative z-30 font-['Inter',sans-serif] shrink-0",
        isCollapsed ? 'w-[56px]' : 'w-[200px]',
      )}
    >
      <div
        className={cn(
          'p-[12px] flex items-center border-b border-[#f3f4f6] dark:border-[#334155] relative overflow-visible',
          isCollapsed ? 'justify-center' : '',
        )}
      >
        <button
          onClick={toggleSidebar}
          title={isCollapsed ? 'Mostrar menú' : 'Ocultar menú'}
          className="absolute top-1/2 -translate-y-1/2 right-[-11px] w-[22px] h-[22px] bg-white dark:bg-[#1e293b] border border-[#e5e7eb] dark:border-[#334155] rounded-full cursor-pointer flex items-center justify-center text-[#4b5563] dark:text-gray-300 z-20 hover:bg-[#f9fafb] dark:hover:bg-[#334155] hover:text-[#111827] dark:text-white transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        <div className={cn('flex items-center gap-[8px]', isCollapsed ? 'justify-center w-full' : '')}>
          <div className="w-[28px] h-[28px] bg-[#e2e8f0] text-[#475569] dark:text-gray-300 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0">
            {initials}
          </div>
          {!isCollapsed && (
            <span className="text-[12px] font-bold text-[#111827] dark:text-white">BHealth Insurance</span>
          )}
        </div>
      </div>

      <div className="flex-grow p-[10px_6px] overflow-y-auto">
        {filteredNavGroups.map((group, idx) => (
          <div
            key={idx}
            className={cn(
              'mb-[12px]',
              isCollapsed ? 'mb-[4px] pb-[4px] border-b border-[#f3f4f6] dark:border-[#334155] last:border-b-0' : '',
            )}
          >
            {!isCollapsed && (
              <div className="text-[9.5px] text-[#9ca3af] dark:text-gray-500 uppercase tracking-[0.5px] mb-[6px] pl-[8px] font-semibold">
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
                        'w-full flex items-center gap-[8px] py-[6px] px-[8px] text-decoration-none text-[#4b5563] dark:text-gray-300 text-[12px] font-medium rounded-[6px] transition-all duration-150 group',
                        isActive
                          ? 'bg-[#f3f4f6] dark:bg-[#334155] text-[#111827] dark:text-white'
                          : 'hover:bg-[#f3f4f6] dark:hover:bg-[#334155] hover:text-[#111827] dark:text-white',
                        isCollapsed ? 'justify-center' : '',
                      )}
                    >
                      <item.icon
                        className={cn(
                          'w-4 h-4 transition-all duration-300',
                          item.colorClass,
                          'group-hover:drop-shadow-[0_0_8px_currentColor]',
                        )}
                      />
                      {!isCollapsed && <span>{item.label}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="p-[10px_6px] border-t border-[#f3f4f6] dark:border-[#334155] text-center">
        {!isCollapsed && <div className="text-[10px] text-[#9ca3af] dark:text-gray-500">BHealth v1.0</div>}
      </div>
    </aside>
  );
};

export default SidebarCRM;
