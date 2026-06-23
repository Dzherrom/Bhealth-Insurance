// Archivo principal de exportación de tipos
// Importa y re-exporta todos los tipos de la aplicación

// Tipos comunes
export * from './common';

// Autenticación y usuarios
export * from './auth';

// Clientes y direcciones
export * from './clientes';

// Pólizas, planes y aseguradoras
export * from './polizas';

// Agencias, agentes y tareas
export * from './agencias';

import type { BaseEntity, OptionalBaseEntity } from './common';
import type { Tarea, TareaCreate } from './agencias';

export interface TareaUpdate extends Partial<TareaCreate> {}

export interface TipoProducto extends OptionalBaseEntity {
  nombre: string;
  descripcion?: string;
}

export interface Etiqueta extends OptionalBaseEntity {
  nombre: string;
  color?: string;
  tipo?: 'DOCUMENTO' | 'POLIZA';
}

export interface MisTareasResponse {
  tareas: Tarea[];
}