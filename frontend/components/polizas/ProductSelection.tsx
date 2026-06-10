'use client';

import { useEffect, useState } from 'react';
import { tiposProductoApi } from '@/lib/api';
import { TipoProducto } from '@/types';
import { Briefcase, HeartPulse, Shield, FileText, Umbrella, Glasses, Activity, Plane, Home, Banknote, ShieldAlert, Star } from 'lucide-react';
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

  const getIconForProduct = (productName: string, selected: boolean) => {
    const name = productName.toLowerCase();
    const className = `w-6 h-6 shrink-0 ${selected ? 'text-[#4f46e5]' : 'text-[#64748b] dark:text-gray-400'}`;
    
    if (name.includes('medicare')) return <Briefcase className={className} />;
    if (name.includes('medicaid')) return <HeartPulse className={className} />;
    if (name.includes('aca') || name.includes('health')) return <ShieldAlert className={className} />;
    if (name.includes('life')) return <HeartPulse className={className} />;
    if (name.includes('dental')) return <Star className={className} />; // Fallback icon
    if (name.includes('vision')) return <Glasses className={className} />;
    if (name.includes('supplemental')) return <FileText className={className} />;
    if (name.includes('annuities')) return <Banknote className={className} />;
    if (name.includes('final expense')) return <Umbrella className={className} />;
    if (name.includes('travel')) return <Plane className={className} />;
    if (name.includes('property') || name.includes('p&c')) return <Home className={className} />;
    if (name.includes('private')) return <Briefcase className={className} />;
    
    return <Shield className={className} />;
  };

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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[16px]">
      {tipos.map(tipo => {
        const isSelected = selectedProductId === tipo.id;
        return (
          <div
            key={tipo.id}
            onClick={() => onSelect(tipo.id)}
            className={`cursor-pointer transition-all duration-200 rounded-[12px] p-[20px] flex flex-col gap-[12px] border ${
              isSelected
                ? 'bg-[#e0e7ff] border-[#4f46e5] shadow-sm ring-1 ring-[#4f46e5]'
                : 'bg-white dark:bg-[#1e293b] border-[#e2e8f0] dark:border-[#334155] hover:border-[#818cf8] hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-[12px]">
              <div className={`flex items-center justify-center w-[32px] h-[32px] rounded-[8px] ${isSelected ? 'bg-[#c7d2fe]' : 'bg-[#f1f5f9] dark:bg-[#1e293b]'}`}>
                {getIconForProduct(tipo.nombre, isSelected)}
              </div>
              <h3 className={`text-[16px] font-bold m-0 leading-tight ${isSelected ? 'text-[#312e81]' : 'text-[#0f172a] dark:text-white'}`}>
                {tipo.nombre}
              </h3>
            </div>
            <p className={`text-[13px] m-0 leading-snug ${isSelected ? 'text-[#4338ca]' : 'text-[#64748b] dark:text-gray-400'}`}>
              {tipo.descripcion}
            </p>
          </div>
        );
      })}
    </div>
  );
}
