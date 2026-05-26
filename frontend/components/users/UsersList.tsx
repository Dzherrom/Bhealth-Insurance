import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { User } from './types';
import { UserCard } from './UserCard';
import React from 'react';

interface UsersListProps {
  users: User[];
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

export function UsersList({
  users,
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
}: UsersListProps) {
  return (
    <div className="bg-white rounded-[16px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] overflow-hidden">
      <div className="border-b border-[#f1f5f9] p-[20px]">
        <div className="text-[16px] font-bold text-[#0f172a] mb-[4px]">
          Empleados ({users.length})
        </div>
        <div className="text-[13px] text-[#64748b]">
          Lista de todos los empleados registrados en el sistema
        </div>
      </div>
      <div className="p-[20px]">
        <div className="space-y-3">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              getRoleBadgeVariant={getRoleBadgeVariant}
              getStatusBadgeVariant={getStatusBadgeVariant}
              getInitials={getInitials}
              formatLastLogin={formatLastLogin}
              formatDate={formatDate}
              onViewUser={onViewUser}
              onEditUser={onEditUser}
              onResetPassword={onResetPassword}
              onDeactivateUser={onDeactivateUser}
              actionBusyId={actionBusyId}
            />
          ))}

          {users.length === 0 && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-[#94a3b8]" />
              <h3 className="mt-2 text-[14px] font-bold text-[#0f172a]">
                No se encontraron empleados
              </h3>
              <p className="mt-1 text-[13px] text-[#64748b]">
                Ajusta los filtros o agrega un nuevo empleado.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
