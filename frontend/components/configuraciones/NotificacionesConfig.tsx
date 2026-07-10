"use client";
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { notificacionesApi, usersApi } from "@/lib/api";
import { CRM_ROLE_OPTIONS } from "@/lib/roles";

type TargetMode = "all" | "roles" | "users";

export function NotificacionesConfig() {
  const [tipo, setTipo] = useState('SISTEMA');
  const [mensaje, setMensaje] = useState('');
  const [asunto, setAsunto] = useState('');
  const [sending, setSending] = useState(false);
  const [targetMode, setTargetMode] = useState<TargetMode>('all');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: number; username: string; label: string }>>([]);

  useEffect(() => {
    usersApi.listPaginated({ empleados: '1', page_size: 200 })
      .then((result) => {
        const users = (result.results || []).map((user: any) => ({
          id: user.id,
          username: user.username,
          label: `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username,
        }));
        setAvailableUsers(users);
      })
      .catch(() => setAvailableUsers([]));
  }, []);

  const toggleRole = (role: string, checked: boolean) => {
    setSelectedRoles((prev) =>
      checked ? [...prev, role] : prev.filter((item) => item !== role)
    );
  };

  const toggleUser = (userId: number, checked: boolean) => {
    setSelectedUserIds((prev) =>
      checked ? [...prev, userId] : prev.filter((id) => id !== userId)
    );
  };

  const handleSend = async () => {
    if (!mensaje.trim()) {
      toast({ title: 'Error', description: 'Escribe un mensaje para enviar', variant: 'destructive' });
      return;
    }
    if (targetMode === 'roles' && selectedRoles.length === 0) {
      toast({ title: 'Error', description: 'Selecciona al menos un rol', variant: 'destructive' });
      return;
    }
    if (targetMode === 'users' && selectedUserIds.length === 0) {
      toast({ title: 'Error', description: 'Selecciona al menos un usuario', variant: 'destructive' });
      return;
    }

    setSending(true);
    try {
      const payload: {
        tipo: string;
        mensaje: string;
        roles?: string[];
        user_ids?: number[];
      } = {
        tipo,
        mensaje: asunto ? `${asunto}\n\n${mensaje}` : mensaje,
      };
      if (targetMode === 'roles') payload.roles = selectedRoles;
      if (targetMode === 'users') payload.user_ids = selectedUserIds;

      const result = await notificacionesApi.enviarGeneral(payload);
      toast({
        title: 'Enviado',
        description: `Notificación enviada a ${result?.creadas ?? 0} usuario(s).`,
      });
      setAsunto('');
      setMensaje('');
      setTipo('SISTEMA');
      setTargetMode('all');
      setSelectedRoles([]);
      setSelectedUserIds([]);
    } catch {
      toast({ title: 'Error', description: 'No se pudo enviar la notificacion', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enviar notificación</CardTitle>
        <CardDescription>Envía mensajes a todos los agentes, por rol o a usuarios específicos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Destinatarios</label>
          <Select value={targetMode} onValueChange={(value) => setTargetMode(value as TargetMode)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona destinatarios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los agentes activos</SelectItem>
              <SelectItem value="roles">Por rol</SelectItem>
              <SelectItem value="users">Usuarios específicos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {targetMode === 'roles' && (
          <div className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-2">
            {CRM_ROLE_OPTIONS.map((option) => (
              <label key={option.value} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={selectedRoles.includes(option.value)}
                  onCheckedChange={(checked) => toggleRole(option.value, checked === true)}
                />
                {option.label}
              </label>
            ))}
          </div>
        )}

        {targetMode === 'users' && (
          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border p-3">
            {availableUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay usuarios disponibles.</p>
            ) : (
              availableUsers.map((user) => (
                <label key={user.id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={selectedUserIds.includes(user.id)}
                    onCheckedChange={(checked) => toggleUser(user.id, checked === true)}
                  />
                  <span>{user.label}</span>
                  <span className="text-muted-foreground">@{user.username}</span>
                </label>
              ))
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-medium">Asunto</Label>
          <Input value={asunto} onChange={(e) => setAsunto(e.target.value)} placeholder="Mensaje principal" />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Tipo de notificacion</Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SISTEMA">Sistema</SelectItem>
              <SelectItem value="SEGURIDAD">Seguridad</SelectItem>
              <SelectItem value="ASIGNACION">Asignacion</SelectItem>
              <SelectItem value="TAG">Etiquetado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">Mensaje</Label>
          <Textarea rows={6} value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Escribe el mensaje a enviar" />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleSend} disabled={sending}>{sending ? 'Enviando...' : 'Enviar'}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
