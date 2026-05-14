"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { notificacionesApi } from "@/lib/api";

export function NotificacionesConfig() {
  const [tipo, setTipo] = useState('SISTEMA');
  const [mensaje, setMensaje] = useState('');
  const [asunto, setAsunto] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!mensaje.trim()) {
      toast({ title: 'Error', description: 'Escribe un mensaje para enviar', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      await notificacionesApi.enviarGeneral({ tipo, mensaje: asunto ? `${asunto}\n\n${mensaje}` : mensaje });
      toast({ title: 'Enviado', description: 'La notificación general fue enviada a los agentes.' });
      setAsunto('');
      setMensaje('');
      setTipo('SISTEMA');
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo enviar la notificación', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar notificación general</CardTitle>
        <CardDescription>Se enviará a todos los agentes activos del sistema.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Asunto</label>
          <Input value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Mensaje principal" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de notificación</label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SISTEMA">Sistema</SelectItem>
              <SelectItem value="SEGURIDAD">Seguridad</SelectItem>
              <SelectItem value="ASIGNACION">Asignación</SelectItem>
              <SelectItem value="TAG">Etiquetado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Mensaje</label>
          <Textarea rows={6} value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Escribe el mensaje a enviar a todos los agentes" />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSend} disabled={sending}>{sending ? 'Enviando...' : 'Enviar'}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
