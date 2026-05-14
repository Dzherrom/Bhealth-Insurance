'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, X, CheckCheck, Clock, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/animate-ui/components/radix/sheet';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
}

interface NotificationButtonProps {
  /**
   * Modo de visualización del botón
   * - 'floating': Botón flotante en posición fija
   * - 'inline': Botón integrado para usar en navbars
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
   * Notificaciones iniciales
   */
  initialNotifications?: Notification[];
  
  /**
   * Callback cuando se hace clic en una notificación
   */
  onNotificationClick?: (notification: Notification) => void;
  
  /**
   * Callback cuando se marcan todas como leídas
   */
  onMarkAllAsRead?: () => void;
  
  /**
   * Clase CSS adicional
   */
  className?: string;
}

const defaultNotifications: Notification[] = [
  {
    id: '1',
    title: 'Bienvenido a Bhealth',
    message: '¡Gracias por unirte a nuestro sistema de seguros médicos!',
    type: 'success',
    timestamp: new Date(),
    read: false,
  },
  {
    id: '2',
    title: 'Documentos pendientes',
    message: 'Tienes 2 documentos por revisar en tu póliza de seguro médico.',
    type: 'warning',
    timestamp: new Date(Date.now() - 60000),
    read: false,
  },
  {
    id: '3',
    title: 'Renovación próxima',
    message: 'Tu póliza de seguro vence en 30 días. Renueva ahora para evitar interrupciones.',
    type: 'info',
    timestamp: new Date(Date.now() - 120000),
    read: false,
  },
  {
    id: '4',
    title: 'Pago procesado',
    message: 'Tu último pago de $450.00 ha sido procesado exitosamente.',
    type: 'success',
    timestamp: new Date(Date.now() - 300000),
    read: true,
  },
];

export default function NotificationButton({
  variant = 'floating',
  position = 'top-right',
  size = 'md',
  initialNotifications = defaultNotifications,
  onNotificationClick,
  onMarkAllAsRead,
  className
}: NotificationButtonProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  
  const unreadCount = notifications.filter(n => !n.read).length;
  console.log('Unread')
  console.log('Unread',unreadCount)
  
  // Estilos según el tamaño
  const sizeStyles = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg'
  };
  
  // Estilos según la posición (solo para floating)
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };
  
  const handleNotificationClick = (notification: Notification) => {
    // Marcar como leída
    setNotifications(prev => 
      prev.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      )
    );
    
    onNotificationClick?.(notification);
  };
  
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    onMarkAllAsRead?.();
  };
  
  const formatTimeAgo = (timestamp: Date) => {
    console.log('Timestamp format',timestamp)
    console.log('Timestamp format type',typeof timestamp)
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Hace un momento';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `Hace ${Math.floor(diffInMinutes / 60)}h`;
    return `Hace ${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case 'success':
        return <CheckCheck className={cn(iconClass, "text-green-600")} />;
      case 'warning':
        return <AlertTriangle className={cn(iconClass, "text-yellow-600")} />;
      case 'error':
        return <X className={cn(iconClass, "text-red-600")} />;
      case 'info':
      default:
        return <Info className={cn(iconClass, "text-blue-600")} />;
    }
  };

  const getNotificationCardStyle = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-l-green-500 bg-green-50/50';
      case 'warning':
        return 'border-l-4 border-l-yellow-500 bg-yellow-50/50';
      case 'error':
        return 'border-l-4 border-l-red-500 bg-red-50/50';
      case 'info':
      default:
        return 'border-l-4 border-l-blue-500 bg-blue-50/50';
    }
  };
  
  const buttonClasses = cn(
    'relative text-white transition-all duration-200 flex items-center justify-center hover:cursor-pointer',
    sizeStyles[size],
    variant === 'floating' && `fixed z-50 ${positionStyles[position]} rounded-full shadow-lg hover:shadow-xl bg-blue-600 hover:bg-blue-700`,
    variant === 'inline' && 'relative rounded-full bg-blue-600 hover:bg-blue-700 flex-shrink-0',
    className
  );
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          className={buttonClasses}
          aria-label={`Notificaciones ${unreadCount > 0 ? `(${unreadCount} no leídas)` : ''}`}
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute top-1 right-1 h-5 w-5 p-0 text-xs font-bold bg-red-500 hover:bg-red-500 animate-pulse flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent 
        className="w-[400px] sm:w-[540px] max-w-[90vw] h-full overflow-hidden"
        side="right"
      >
        <SheetHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-semibold">Notificaciones</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-blue-600 hover:text-blue-700"
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Marcar todas como leídas
              </Button>
            )}
          </div>
          <SheetDescription>
            {unreadCount > 0 
              ? `Tienes ${unreadCount} notificación${unreadCount > 1 ? 'es' : ''} sin leer`
              : 'No tienes notificaciones sin leer'
            }
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4 max-h-[calc(100vh-200px)] px-4 overflow-y-auto">
          {notifications.length === 0 ? (
            <Card className="p-8">
              <CardContent className="flex flex-col items-center justify-center space-y-3">
                <Bell className="h-12 w-12 text-gray-300" />
                <p className="text-gray-500 text-center">No tienes notificaciones</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                className={cn(
                  'cursor-pointer hover:shadow-md transition-all duration-200',
                  getNotificationCardStyle(notification.type),
                  !notification.read && 'ring-2 ring-blue-100'
                )}
                onClick={() => handleNotificationClick(notification)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center mt-2 space-x-2">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <p className="text-xs text-gray-400">
                              {formatTimeAgo(
                                notification.timestamp instanceof Date 
                                  ? notification.timestamp 
                                  : new Date(notification.timestamp)
                              )}
                            </p>
                          </div>
                        </div>
                        
                        {!notification.read && (
                          <div className="h-2 w-2 bg-blue-600 rounded-full ml-3 mt-1 shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        
        {/* {notifications.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
            <Button
              variant="outline"
              className="w-full text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
              onClick={() => {
                console.log('Ver todas las notificaciones');
              }}
            >
              Ver todas las notificaciones
            </Button>
          </div>
        )} */}
      </SheetContent>
    </Sheet>
  );
}