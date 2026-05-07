'use client';

import NotificationButton, { type Notification } from '@/components/ui/notification-button';
import { crmNotifications } from './crmNotifications';

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
  
  const handleNotificationClick = (notification: Notification) => {
    console.log('CRM - Notificación clickeada:', notification);
    
    // Lógica específica para el CRM según el tipo de notificación
    switch (notification.id) {
      case 'crm-1': // Nuevo cliente
        // Redirigir a la lista de usuarios pendientes
        console.log('Redirigiendo a usuarios pendientes...');
        break;
      case 'crm-2': // Pólizas vencimiento próximo
        // Redirigir al módulo de pólizas con filtro de vencimiento
        console.log('Redirigiendo a pólizas próximas a vencer...');
        break;
      case 'crm-4': // Reclamo pendiente
        // Redirigir al sistema de reclamos
        console.log('Redirigiendo a reclamos pendientes...');
        break;
      case 'crm-6': // Actualización del sistema
        // Abrir modal con novedades
        console.log('Mostrando novedades del sistema...');
        break;
      default:
        console.log('Notificación genérica del CRM clickeada');
    }
  };

  const handleMarkAllAsRead = () => {
    console.log('CRM - Todas las notificaciones marcadas como leídas');
    // Aquí podrías hacer una llamada a la API para marcar como leídas
  };

  return (
    <NotificationButton
      variant={variant}
      position={position}
      size={size}
      className={className}
      initialNotifications={crmNotifications}
      onNotificationClick={handleNotificationClick}
      onMarkAllAsRead={handleMarkAllAsRead}
    />
  );
}