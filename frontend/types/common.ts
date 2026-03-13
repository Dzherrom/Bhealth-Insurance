// Tipos y interfaces comunes para toda la aplicación

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// Tipo base para entidades con ID
export interface BaseEntity {
  id: number;
}

// Tipo base para entidades opcionales con ID
export interface OptionalBaseEntity {
  id?: number;
}

// Tipos de relación comunes
export type RelacionFamiliar = 
  | "Self"
  | "Spouse" 
  | "Child"
  | "Parent"
  | "Sibling"
  | "Other";

// Tipos de género
export type Genero = "Masculino" | "Femenino" | "Otro";

// Estados civiles
export type EstadoCivil = 
  | "Soltero"
  | "Soltera" 
  | "Casado"
  | "Casada"
  | "Divorciado"
  | "Divorciada"
  | "Viudo"
  | "Viuda"
  | "Union_libre";

// Estados de inmigración
export type EstadoInmigracion = 
  | "Ciudadano"
  | "Residente_permanente"
  | "Visa_trabajo"
  | "Visa_estudiante"
  | "Asilado"
  | "Otro";

// Respuesta de error estándar de la API
export interface ApiError {
  message?: string;
  error?: string;
  detail?: string;
  [key: string]: any;
}