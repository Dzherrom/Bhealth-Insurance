import { Notification } from '@/components/ui/notification-button';

export const clientNotifications: Notification[] = [
  {
    id: 'client-1',
    title: 'Bienvenido a tu Portal',
    message: '¡Tu cuenta ha sido activada! Explora tu perfil y configura tus preferencias.',
    type: 'success',
    timestamp: new Date(),
    read: false,
  },
  {
    id: 'client-2',
    title: 'Próximo Pago Programado',
    message: 'Tu siguiente pago de $2,500 MXN vence el 25 de enero. ¿Deseas configurar pago automático?',
    type: 'warning',
    timestamp: new Date(Date.now() - 45000),
    read: false,
  },
  {
    id: 'client-3',
    title: 'Actualización de Póliza',
    message: 'Se han agregado nuevos beneficios a tu plan familiar. Revisa los detalles en tu perfil.',
    type: 'info',
    timestamp: new Date(Date.now() - 180000),
    read: false,
  },
  {
    id: 'client-4',
    title: 'Recordatorio de Cita Médica',
    message: 'Recuerda tu cita con el Dr. García el 22 de enero a las 10:00 AM.',
    type: 'info',
    timestamp: new Date(Date.now() - 240000),
    read: false,
  },
  {
    id: 'client-5',
    title: 'Pago Confirmado',
    message: 'Tu pago mensual de $2,500 MXN ha sido procesado exitosamente.',
    type: 'success',
    timestamp: new Date(Date.now() - 432000000), // 5 días atrás
    read: true,
  },
  {
    id: 'client-6',
    title: 'Descarga tu Póliza',
    message: 'Tu póliza digital está lista. Descárgala desde la sección de documentos.',
    type: 'success',
    timestamp: new Date(Date.now() - 864000000), // 10 días atrás
    read: true,
  },
  {
    id: 'client-7',
    title: 'Red Médica Actualizada',
    message: 'Nuevos hospitales y especialistas han sido agregados a tu red médica.',
    type: 'info',
    timestamp: new Date(Date.now() - 1209600000), // 14 días atrás
    read: true,
  },
];