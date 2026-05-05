export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'agente' | 'cliente';
  status: 'activo' | 'inactivo' | 'pendiente';
  avatar?: string;
  lastLogin: string;
  createdAt: string;
  department?: string;
}
