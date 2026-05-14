export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  avatar?: string;
  lastLogin: string;
  createdAt: string;
  department?: string;
}
