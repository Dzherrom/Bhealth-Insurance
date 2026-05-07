'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NotificationButton from '@/components/ui/notification-button';
import { useNotificationStore } from '@/store';
import type { Notification as StoreNotification } from '@/store';
import { clientNotifications } from './clientNotifications';

interface ClientNotificationButtonProps {
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

  /**
   * ID del cliente para personalizar las notificaciones
   */
  clientId?: string;
}

export default function ClientNotificationButton({
  variant = 'inline',
  position = 'top-right',
  size = 'md',
  className,
  clientId
}: ClientNotificationButtonProps) {
  const router = useRouter();
  
  // Usar el store de notificaciones
  const { 
    notifications,
    markAsRead,
    markAllAsRead,
    addNotification 
  } = useNotificationStore();

  // Inicializar notificaciones mock si está vacío (solo para desarrollo)
  useEffect(() => {
    if (notifications.length === 0) {
      clientNotifications.forEach(notif => {
        addNotification({
          title: notif.title,
          message: notif.message,
          type: notif.type,
          actionUrl: notif.id === 'client-2' ? '/client/payments' : undefined,
        });
      });
    }
  }, [notifications.length, addNotification]);
  
  const handleNotificationClick = (notification: StoreNotification) => {
    // Marcar como leída
    markAsRead(notification.id);
    
    // Lógica de navegación según el tipo de notificación
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      return;
    }

    // Navegación basada en el título (temporal, mejorar con tipos específicos)
    if (notification.title.includes('Pago')) {
      router.push(`/client/${clientId}/payments`);
    } else if (notification.title.includes('Póliza')) {
      router.push(`/client/${clientId}/profile`);
    } else if (notification.title.includes('Cita')) {
      router.push(`/client/${clientId}/appointments`);
    } else if (notification.title.includes('Documento')) {
      router.push(`/client/${clientId}/documents`);
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
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