"use client";
import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import api from "@/services/api";
import { Loader2 } from "lucide-react";

export function NotificacionesConfig() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  const fetchNotificaciones = async () => {
    try {
      const res = await api.get("/configuracion-notificaciones/");
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (item: any) => {
    try {
      const payload = {
        tipo_notificacion: item.tipo_notificacion,
        asunto_general: item.asunto_general,
        cuerpo_general: item.cuerpo_general
      };
      if (item.id) {
        await api.put(`/configuracion-notificaciones/${item.id}/`, payload);
      } else {
        await api.post("/configuracion-notificaciones/", payload);
      }
      toast({ title: "Guardado", description: "Configuración guardada exitosamente" });
      fetchNotificaciones();
    } catch (e) {
      toast({ title: "Error", description: "Error al guardar", variant: "destructive" });
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Notificaciones</h2>
      <p className="text-sm text-slate-500">Configura las plantillas de correo por defecto.</p>
      
      {data.length === 0 && <p className="text-sm text-slate-500">No hay configuraciones.</p>}
      
      {data.map((item, idx) => (
        <Card key={item.id || idx}>
          <CardHeader>
            <CardTitle>
              <Input 
                value={item.tipo_notificacion} 
                onChange={(e) => {
                  const newData = [...data];
                  newData[idx].tipo_notificacion = e.target.value;
                  setData(newData);
                }} 
                placeholder="Ej. CONTRATOS, RECORDATORIOS_PAGO" 
                className="max-w-md font-bold"
              />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Asunto</label>
              <Input 
                value={item.asunto_general || ""} 
                onChange={(e) => {
                  const newData = [...data];
                  newData[idx].asunto_general = e.target.value;
                  setData(newData);
                }} 
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cuerpo del Mensaje</label>
              <Textarea 
                value={item.cuerpo_general || ""} 
                rows={5}
                onChange={(e) => {
                  const newData = [...data];
                  newData[idx].cuerpo_general = e.target.value;
                  setData(newData);
                }} 
              />
            </div>
            <Button onClick={() => handleSave(item)}>Guardar Cambios</Button>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={() => setData([...data, { tipo_notificacion: "NUEVA", asunto_general: "", cuerpo_general: "" }])}>
        + Nueva Configuración
      </Button>
    </div>
  );
}
