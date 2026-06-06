"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { API_BASE_URL, fetchWithAuth } from '@/lib/api';
import { Loader2 } from "lucide-react";

export function UsuariosFacturadosConfig() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [anio, setAno] = useState(new Date().getFullYear());

  const fetchFacturados = async () => {
    setLoading(true);
    try {
      const url = `${API_BASE_URL}/reportes/agentes-facturacion/?mes=${mes}&año=${anio}`;
      const res = await fetchWithAuth(url, { method: 'GET' });
      const payload = await res.json().catch(() => null);
      setData(payload || []);
    } catch (e) {
      toast({ title: "Error", description: "No se pudieron cargar los usuarios facturados", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacturados();
  }, [mes, anio]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios Facturados</CardTitle>
        <CardDescription>Visualiza el total facturado por mes y año.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        <div className="flex gap-4 mb-4">
          <Select value={mes.toString()} onValueChange={(val) => setMes(parseInt(val))}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Mes"/></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }).map((_, i) => (
                <SelectItem key={i+1} value={(i+1).toString()}>Mes {i+1}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={anio.toString()} onValueChange={(val) => setAno(parseInt(val))}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Año"/></SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map(a => (
                <SelectItem key={a} value={a.toString()}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : (
          <div className="border rounded-md">
            <div className="grid grid-cols-4 font-semibold border-b bg-slate-50 p-2 text-sm">
              <span>NPN</span>
              <span>Nombre</span>
              <span>Rol</span>
              <span className="text-right">Total Facturado</span>
            </div>
            {data.length === 0 && <div className="p-4 text-sm text-center text-slate-500">No hay datos.</div>}
            {data.map((user, i) => (
              <div key={i} className="grid grid-cols-4 p-2 text-sm border-b last:border-0 hover:bg-slate-50 items-center">
                <span>{user.npn}</span>
                <span>{user.nombre}</span>
                <span>{user.rol}</span>
                <span className="text-right font-medium text-green-700">${user.total_facturado}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}