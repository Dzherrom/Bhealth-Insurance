'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import NotificationButton, { type Notification } from '@/components/ui/notification-button';
import { notificacionesApi } from '@/lib/api';

interface CRMNotificationButtonProps {
  /**
   * Modo de visualización del botón
   */
  variant?: 'floating' | 'inline';
  
  /**
   * Posición del botón flotante (solo aplica cuando variant='floating')
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  
  /**
   * Tamaño del botón
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * Clase CSS adicional
   */
  className?: string;
}

export default function CRMNotificationButton({
  variant = 'inline',
  position = 'top-right',
  size = 'md',
  className
}: CRMNotificationButtonProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await notificacionesApi.list();
      const formatted: Notification[] = data.map((n: any) => {
        let type: Notification['type'] = 'info';
        if (n.tipo === 'SISTEMA') type = 'info';
        else if (n.tipo === 'SEGURIDAD') type = 'warning';
        else if (n.tipo === 'ASIGNACION') type = 'success';
        else if (n.tipo === 'RECORDATORIO') type = 'warning';
        else if (n.tipo === 'TAG') type = 'info';

        return {
          id: String(n.id),
          title: n.tipo || 'Notificación',
          message: n.mensaje,
          type,
          timestamp: new Date(n.fecha_creacion),
          read: n.leida,
          raw: n, // Guardamos el objeto original por si necesitamos más datos
        };
      });
      setNotifications(formatted);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    
    // Polling cada 30 segundos para tiempo real
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (!notification.read) {
        await notificacionesApi.marcarLeida(Number(notification.id));
        // Actualizamos localmente para que se sienta rápido
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
      }

      const raw = (notification as any).raw;
      
      // Redirección basada en el tipo o contenido
      if (raw?.tipo === 'RECORDATORIO' && raw?.object_id) {
        // Podríamos redirigir a la póliza si tuviéramos el ID de la póliza
        // Por ahora, el recordatorio no tiene un endpoint directo de vista, 
        // pero podríamos redirigir a un dashboard o intentar extraer la póliza.
        // Si no hay ruta clara, simplemente se marca como leída.
      } else if (raw?.tipo === 'ASIGNACION') {
        // Redirigir a pólizas
        router.push('/crm/polizas');
      }

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificacionesApi.marcarTodasLeidas();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <NotificationButton
      variant={variant}
      position={position}
      size={size}
      className={className}
      initialNotifications={notifications}
      onNotificationClick={handleNotificationClick}
      onMarkAllAsRead={handleMarkAllAsRead}
    />
  );
}
