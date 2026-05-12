'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import { Poliza } from './types';

interface PolizasDataTableProps {
  polizas: Poliza[];
  selectedPolizas: number[];
  onSelectionChange: (selected: number[]) => void;
  onViewPoliza: (id: number) => void;
  onEditPoliza: (id: number) => void;
  onDeletePoliza: (id: number) => void;
}

export function PolizasDataTable({
  polizas,
  selectedPolizas,
  onSelectionChange,
  onViewPoliza,
  onEditPoliza,
  onDeletePoliza,
}: PolizasDataTableProps) {
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'activo': return 'default';
      case 'inactivo': return 'secondary';
      case 'pendiente': return 'outline';
      case 'cancelado': return 'destructive';
      case 'renovación': return 'default';
      default: return 'outline';
    }
  };

  const getPlanBadgeVariant = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'vip': return 'destructive';
      case 'premium': return 'default';
      case 'familiar': return 'secondary';
      case 'básico': return 'outline';
      default: return 'outline';
    }
  };

  const isAllSelected = polizas.length > 0 && selectedPolizas.length === polizas.length;
  const isIndeterminate = selectedPolizas.length > 0 && selectedPolizas.length < polizas.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(polizas.map(p => p.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectPoliza = (polizaId: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedPolizas, polizaId]);
    } else {
      onSelectionChange(selectedPolizas.filter(id => id !== polizaId));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Pólizas ({polizas.length})
          {selectedPolizas.length > 0 && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              • {selectedPolizas.length} seleccionadas
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected ? true : (isIndeterminate ? "indeterminate" : false)}
                  
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>ID Mercado</TableHead>
              <TableHead>Cliente Principal</TableHead>
              <TableHead>Agente</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Prima Mensual</TableHead>
              <TableHead>Fecha Efectiva</TableHead>
              <TableHead className="w-12">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {polizas.map((poliza) => (
              <TableRow key={poliza.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedPolizas.includes(poliza.id)}
                    onCheckedChange={(checked) => 
                      handleSelectPoliza(poliza.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell className="font-medium">{poliza.id_mercado}</TableCell>
                <TableCell>
                  {poliza.cliente_principal || 'No asignado'}
                </TableCell>
                <TableCell>{poliza.agente_nombre}</TableCell>
                <TableCell>
                  <Badge variant={getPlanBadgeVariant(poliza.plan_nombre)}>
                    {poliza.plan_nombre}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(poliza.estado_nombre)}>
                    {poliza.estado_nombre}
                  </Badge>
                </TableCell>
                <TableCell>{formatCurrency(poliza.prima_mensual)}</TableCell>
                <TableCell>{formatDate(poliza.fecha_efectiva)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Abrir menú</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onViewPoliza(poliza.id)}
                        className="cursor-pointer"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onEditPoliza(poliza.id)}
                        className="cursor-pointer"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDeletePoliza(poliza.id)}
                        className="cursor-pointer text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {polizas.length === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            No hay pólizas disponibles
          </div>
        )}
      </CardContent>
    </Card>
  );
}
