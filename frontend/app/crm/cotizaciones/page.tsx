'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { API_BASE_URL, getCurrentToken } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function CotizacionesPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const accessToken = useAuthStore((s) => s.accessToken);
  const router = useRouter();

  useEffect(() => {
    const fetchCotizaciones = async () => {
      setLoading(true);
      try {
        const token = accessToken || getCurrentToken();
        const res = await fetch(`${API_BASE_URL}/polizas/cotizaciones/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          console.error('Cotizaciones fetch failed', res.status, body);
          throw new Error(`Error fetching cotizaciones: ${res.status} ${body}`);
        }
        const data = await res.json();
        setItems(data.results || data);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };
    fetchCotizaciones();
  }, [accessToken]);

  return (
    <div className="app-page w-full h-full p-6 bg-[#f8fafc]">
      <div className="max-w-[1100px] mx-auto">
        <h2 className="text-2xl font-bold mb-4">Cotizaciones</h2>
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !items.length && <div>No hay cotizaciones.</div>}
        <div className="grid gap-4 mt-4">
          {items.map((p) => (
            <div key={p.id} className="bg-white p-4 rounded-md border border-[#e6eef7] shadow-sm flex justify-between items-center">
              <div>
                <div className="text-sm text-[#374151] font-bold">{p.id_mercado}</div>
                <div className="text-xs text-[#6b7280]">Cliente: {p.cliente_principal || 'N/A'}</div>
                <div className="text-xs text-[#6b7280]">Estado: {p.estado_nombre || 'N/A'}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => router.push(`/crm/polizas/${p.id}`)} className="text-sm text-[#2563eb]">Ver</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
