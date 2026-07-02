import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Mail, Phone, Settings, MoreHorizontal } from 'lucide-react';
import { User } from './types';
import React from 'react';

interface UserCardProps {
  user: User;
  getRoleBadgeVariant: (role: User['role']) => string;
  getStatusBadgeVariant: (status: User['status']) => string;
  getInitials: (name: string) => string;
  formatLastLogin: (dateString: string) => string;
  formatDate: (dateString: string) => string;
  onViewUser?: (id: number) => void;
  onEditUser?: (id: number) => void;
  onResetPassword?: (id: number) => void;
  onDeactivateUser?: (id: number) => void;
  actionBusyId?: number | null;
}

export function UserCard({
  user,
  getRoleBadgeVariant,
  getStatusBadgeVariant,
  getInitials,
  formatLastLogin,
  formatDate,
  onViewUser,
  onEditUser,
  onResetPassword,
  onDeactivateUser,
  actionBusyId,
}: UserCardProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-[12px] border border-[#e2e8f0] dark:border-[#334155] p-[16px] bg-[#f8fafc] dark:bg-[#0f172a] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] hover:border-[#cbd5e1] dark:hover:border-[#475569] transition-colors gap-4 sm:gap-0">
      <div className="flex items-center space-x-4 w-full">
        <Avatar className="h-[48px] w-[48px] rounded-full border-2 border-white dark:border-[#334155] shadow-sm shrink-0">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="bg-[#4f46e5] text-white font-bold">{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col space-y-[4px] min-w-0">
          <div className="flex flex-wrap items-center gap-[8px]">
            <p className="text-[14px] font-bold text-[#0f172a] dark:text-white truncate max-w-[200px] sm:max-w-xs leading-none">
              {user.name}
            </p>
            <Badge variant={getRoleBadgeVariant(user.role) as any} className="text-[10px] px-2 py-0 h-[20px] font-semibold tracking-wide uppercase">
              {user.role}
            </Badge>
            <Badge variant={getStatusBadgeVariant(user.status) as any} className="text-[10px] px-2 py-0 h-[20px] font-semibold tracking-wide uppercase">
              {user.status}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-[12px] text-[12px] font-medium text-[#64748b] dark:text-gray-400">
            <div className="flex items-center gap-[4px] truncate">
              <Mail className="h-[14px] w-[14px] shrink-0" />
              <span className="truncate max-w-[120px] sm:max-w-[200px]">{user.email}</span>
            </div>
            <div className="flex items-center gap-[4px]">
              <Phone className="h-[14px] w-[14px] shrink-0" />
              <span>{user.phone}</span>
            </div>
            {user.department && (
              <div className="flex items-center gap-[4px]">
                <Settings className="h-[14px] w-[14px] shrink-0" />
                <span>{user.department}</span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-[12px] text-[11px] text-[#94a3b8] dark:text-gray-500 font-medium">
            <span>Último acceso: <span className="text-[#64748b] dark:text-gray-400">{formatLastLogin(user.lastLogin)}</span></span>
            <span className="hidden sm:inline">•</span>
            <span>Registrado: <span className="text-[#64748b] dark:text-gray-400">{formatDate(user.createdAt)}</span></span>
          </div>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-[32px] w-[32px] p-0 text-[#64748b] dark:text-gray-400 hover:text-[#0f172a] dark:hover:text-white hover:bg-[#e2e8f0] dark:hover:bg-[#334155] shrink-0 self-end sm:self-center">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[180px] rounded-[10px] p-[8px] border-[#e2e8f0] dark:border-[#334155] dark:bg-[#1e293b] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)]">
          <DropdownMenuItem className="text-[13px] font-medium text-[#334155] dark:text-gray-200 rounded-[6px] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] cursor-pointer focus:bg-[#f1f5f9] dark:focus:bg-[#334155]" onClick={() => onViewUser?.(user.id)}>Ver perfil</DropdownMenuItem>
          <DropdownMenuItem className="text-[13px] font-medium text-[#334155] dark:text-gray-200 rounded-[6px] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] cursor-pointer focus:bg-[#f1f5f9] dark:focus:bg-[#334155]" onClick={() => onEditUser?.(user.id)}>Editar empleado</DropdownMenuItem>
          <DropdownMenuItem className="text-[13px] font-medium text-[#334155] dark:text-gray-200 rounded-[6px] hover:bg-[#f1f5f9] dark:hover:bg-[#334155] cursor-pointer focus:bg-[#f1f5f9] dark:focus:bg-[#334155]" onClick={() => onResetPassword?.(user.id)} disabled={actionBusyId === user.id}>Restablecer contraseña</DropdownMenuItem>
          <div className="h-[1px] bg-[#e2e8f0] dark:bg-[#334155] my-[4px]" />
          <DropdownMenuItem onClick={() => onDeactivateUser?.(user.id)} className="text-[13px] font-bold text-red-600 dark:text-red-400 rounded-[6px] hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300 cursor-pointer focus:bg-red-50 dark:focus:bg-red-950/30 focus:text-red-700 dark:focus:text-red-300" disabled={actionBusyId === user.id}>
            {actionBusyId === user.id ? 'Procesando...' : 'Desactivar empleado'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
