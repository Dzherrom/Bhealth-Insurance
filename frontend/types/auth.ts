// Tipos e interfaces para autenticación y gestión de usuarios

import { BaseEntity } from "./common";

// ===============================
// ROLES Y PERMISOS
// ===============================

/** Roles disponibles en el sistema. Deben coincidir con los claims del JWT. */
export type UserRole =
  | 'admin'
  | 'manager'
  | 'asistente'
  | 'sherpa'
  | 'pagos'
  | 'citas'
  | 'cliente';

// ===============================
// INTERFACES DE REQUEST
// ===============================

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh: string;
}

// ===============================
// INTERFACES DE RESPONSE
// ===============================

export interface UserProfileSettings {
  selectedYears?: string[];
  [key: string]: unknown;
}

export interface UserProfile {
  role?: string;
  status?: string;
  avatar?: string | null;
  telefono?: string | null;
  npn?: string | null;
  ssn?: string | null;
  agente?: number | null;
  agente_npn?: string | null;
  agente_ffm?: string | null;
  settings?: UserProfileSettings;
}

export interface User extends BaseEntity {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
  is_active?: boolean;
  date_joined?: string;
  profile?: UserProfile;
}

export interface AuthTokens {
  access: string;
  refresh: string;
  role?: string;
}

export interface RefreshTokenResponse {
  access: string;
  role?: string;
}

// ===============================
// TIPOS DERIVADOS
// ===============================

export type UserUpdate = Partial<Omit<User, 'id' | 'username'>> & {
  password?: string;
};
export type RegisterData = RegisterRequest;
export type LoginData = LoginRequest;

// ===============================
// ESTADOS DE AUTENTICACIÓN
// ===============================

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}