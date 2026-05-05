export interface FormularioFirma {
  id: number;
  nombre: string;
  status: 'activo' | 'pendiente' | 'validado' | 'revisión';
  creadoPor: string;
  fechaCreacion: string;
  horaCreacion: string;
  total: number;
}

export interface FormulariosFirmasFilters {
  search: string;
  status?: string;
}