export interface StatusPoliza {
  id: number;
  titulo: string;
  color: string;
  habilitadoParaAgentes: boolean;
}

export interface StatusListFilters {
  search: string;
  itemsPerPage: number;
  statusFilter?: string;
}