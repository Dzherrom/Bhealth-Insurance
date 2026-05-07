// Tipos e interfaces para autenticación y gestión de usuarios

import { BaseEntity } from "./common";

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

export interface User extends BaseEntity {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active?: boolean;
  date_joined?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface RefreshTokenResponse {
  access: string;
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