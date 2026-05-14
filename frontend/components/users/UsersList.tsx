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
}

export function UsersList({
  users,
  getRoleBadgeVariant,
  getStatusBadgeVariant,
  getInitials,
  formatLastLogin,
  formatDate,
  onViewUser,
}: UsersListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Usuarios ({users.length})
        </CardTitle>
        <CardDescription>
          Lista de todos los usuarios registrados en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
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
            />
          ))}

          {users.length === 0 && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                No se encontraron usuarios
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajusta los filtros o agrega un nuevo usuario.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
