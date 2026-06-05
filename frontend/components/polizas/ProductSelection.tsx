'use client';

import { useEffect, useState } from 'react';
import { tiposProductoApi } from '@/lib/api';
import { TipoProducto } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductSelectionProps {
  onSelect: (productId: number) => void;
  selectedProductId: number | null;
}

export function ProductSelection({ onSelect, selectedProductId }: ProductSelectionProps) {
  const [tipos, setTipos] = useState<TipoProducto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTipos = async () => {
      try {
        const data = await tiposProductoApi.list();
        setTipos(data);
      } catch (error) {
        console.error('Error fetching product types:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTipos();
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {tipos.map(tipo => (
        <Card
          key={tipo.id}
          onClick={() => onSelect(tipo.id)}
          className={`cursor-pointer transition-all ${
            selectedProductId === tipo.id
              ? 'border-blue-500 ring-2 ring-blue-500'
              : 'border-gray-200 hover:border-blue-400'
          }`}
        >
          <CardHeader>
            <CardTitle className="text-md">{tipo.nombre}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{tipo.descripcion}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
