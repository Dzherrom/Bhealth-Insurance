'use client';

import { useState } from 'react';
import { UsersHeader } from '@/components/users/UsersHeader';
import { UsersFilters } from '@/components/users/UsersFilters';
import BoxComponent from '@/components/boxes/BoxComponent';
import { UsersList } from '@/components/users/UsersList';
import { User } from '@/components/users/types';

// Datos de ejemplo
const mockUsers: User[] = [
  {
    id: 1,
    name: 'Ana García',
    email: 'ana.garcia@bhealth.com',
    phone: '+34 600 123 456',
    role: 'admin',
    status: 'activo',
    lastLogin: '2024-12-30T10:30:00Z',
    createdAt: '2024-01-15T09:00:00Z',
    department: 'Administración'
  },
  {
    id: 2,
    name: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@bhealth.com',
    phone: '+34 600 234 567',
    role: 'agente',
    status: 'activo',
    lastLogin: '2024-12-30T09:15:00Z',
    createdAt: '2024-02-20T10:00:00Z',
    department: 'Ventas'
  },
  {
    id: 3,
    name: 'María López',
    email: 'maria.lopez@bhealth.com',
    phone: '+34 600 345 678',
    role: 'agente',
    status: 'inactivo',
    lastLogin: '2024-12-28T16:45:00Z',
    createdAt: '2024-03-10T11:30:00Z',
    department: 'Atención al Cliente'
  },
  {
    id: 4,
    name: 'Juan Pérez',
    email: 'juan.perez@cliente.com',
    phone: '+34 600 456 789',
    role: 'cliente',
    status: 'pendiente',
    lastLogin: '2024-12-29T14:20:00Z',
    createdAt: '2024-12-25T12:00:00Z'
  },
  {
    id: 5,
    name: 'Laura Martínez',
    email: 'laura.martinez@bhealth.com',
    phone: '+34 600 567 890',
    role: 'agente',
    status: 'activo',
    lastLogin: '2024-12-30T08:45:00Z',
    createdAt: '2024-04-05T09:15:00Z',
    department: 'Siniestros'
  }
];

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Funciones utilitarias
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  const formatLastLogin = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    return `Hace ${diffDays} días`;
  };
  const getRoleBadgeVariant = (role: User['role']) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'agente': return 'default';
      case 'cliente': return 'secondary';
      default: return 'outline';
    }
  };
  const getStatusBadgeVariant = (status: User['status']) => {
    switch (status) {
      case 'activo': return 'default';
      case 'inactivo': return 'secondary';
      case 'pendiente': return 'outline';
      default: return 'outline';
    }
  };
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex flex-col space-y-6 p-6">
      <UsersHeader />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <BoxComponent 
          title="Total Usuarios" 
          value={users.length} 
        />
        <BoxComponent 
          title="Usuarios Activos" 
          value={users.filter(u => u.status === 'activo').length} 
        />
        <BoxComponent 
          title="Usuarios Inactivos" 
          value={users.filter(u => u.status === 'inactivo').length} 
        />
        <BoxComponent 
          title="Pendientes" 
          value={users.filter(u => u.status === 'pendiente').length} 
        />
      </div>
      <UsersFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />
      <UsersList
        users={filteredUsers}
        getRoleBadgeVariant={getRoleBadgeVariant}
        getStatusBadgeVariant={getStatusBadgeVariant}
        getInitials={getInitials}
        formatLastLogin={formatLastLogin}
        formatDate={formatDate}
      />
    </div>
  );
}