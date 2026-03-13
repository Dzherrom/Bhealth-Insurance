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
}

export function UserCard({
  user,
  getRoleBadgeVariant,
  getStatusBadgeVariant,
  getInitials,
  formatLastLogin,
  formatDate,
}: UserCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.avatar} />
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium leading-none">
              {user.name}
            </p>
            <Badge variant={getRoleBadgeVariant(user.role)}>
              {user.role}
            </Badge>
            <Badge variant={getStatusBadgeVariant(user.status)}>
              {user.status}
            </Badge>
          </div>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Mail className="mr-1 h-3 w-3" />
              {user.email}
            </div>
            <div className="flex items-center">
              <Phone className="mr-1 h-3 w-3" />
              {user.phone}
            </div>
            {user.department && (
              <div className="flex items-center">
                <Settings className="mr-1 h-3 w-3" />
                {user.department}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <span>Último acceso: {formatLastLogin(user.lastLogin)}</span>
            <span>Registrado: {formatDate(user.createdAt)}</span>
          </div>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menú</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Ver perfil</DropdownMenuItem>
          <DropdownMenuItem>Editar usuario</DropdownMenuItem>
          <DropdownMenuItem>Cambiar permisos</DropdownMenuItem>
          <DropdownMenuItem>Resetear contraseña</DropdownMenuItem>
          <DropdownMenuItem className="text-red-600">
            Desactivar usuario
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
