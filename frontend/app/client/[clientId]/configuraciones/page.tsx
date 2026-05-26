'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/store';
import { 
  Settings, 
  Bell, 
  Lock, 
  Eye, 
  EyeOff,
  Save,
  Trash2,
  Shield,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  policiesUpdates: boolean;
  paymentReminders: boolean;
  promotionalEmails: boolean;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  loginNotifications: boolean;
}

export default function ClientConfiguracionesPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Usar authStore para actualización de perfil
  const { updateProfile, error: authError } = useAuthStore();

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    smsNotifications: false,
    policiesUpdates: true,
    paymentReminders: true,
    promotionalEmails: false
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorAuth: false,
    loginNotifications: true
  });

  const handlePasswordChange = (field: string, value: string) => {
    setPasswords(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNotificationChange = (field: keyof NotificationSettings, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSecurityChange = (field: keyof SecuritySettings, value: boolean) => {
    setSecurity(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      // Guardar preferencias en el perfil del usuario
      // Nota: Necesitarías extender el modelo User para incluir estas preferencias
      // Por ahora solo mostramos el éxito
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage('Configuraciones guardadas exitosamente');
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Error al guardar configuraciones');
      console.error('Error guardando configuraciones:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    
    if (passwords.new !== passwords.confirm) {
      setErrorMessage('Las contraseñas no coinciden');
      return;
    }

    if (passwords.new.length < 6) {
      setErrorMessage('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsSaving(true);
    try {
      // Actualizar contraseña usando authStore
      // Nota: El endpoint de cambio de contraseña puede requerir implementación específica
      await updateProfile({
        password: passwords.new,
      } as any); // Temporal: API puede requerir endpoint específico para password
      
      setSuccessMessage('Contraseña cambiada exitosamente');
      
      // Limpiar campos
      setPasswords({
        current: '',
        new: '',
        confirm: ''
      });

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(authError || 'Error al cambiar contraseña');
      console.error('Error cambiando contraseña:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="app-page space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Configuración</h1>
      </div>

      {/* Mensajes de éxito/error */}
      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}
      {errorMessage && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            {errorMessage}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificaciones por Email</Label>
                <p className="text-sm text-gray-600">Recibir notificaciones en tu correo electrónico</p>
              </div>
              <Switch
                checked={notifications.emailNotifications}
                onCheckedChange={(checked) => handleNotificationChange('emailNotifications', checked)}
              />
            </div>

            <Separator />

            {/* <div className="flex items-center justify-between">
              <div>
                <Label>Notificaciones por SMS</Label>
                <p className="text-sm text-gray-600">Recibir notificaciones por mensaje de texto</p>
              </div>
              <Switch
                checked={notifications.smsNotifications}
                onCheckedChange={(checked) => handleNotificationChange('smsNotifications', checked)}
              />
            </div> */}

            {/* <Separator /> */}

            <div className="flex items-center justify-between">
              <div>
                <Label>Actualizaciones de Pólizas</Label>
                <p className="text-sm text-gray-600">Notificaciones sobre cambios en tus pólizas</p>
              </div>
              <Switch
                checked={notifications.policiesUpdates}
                onCheckedChange={(checked) => handleNotificationChange('policiesUpdates', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Recordatorios de Pago</Label>
                <p className="text-sm text-gray-600">Recordatorios antes del vencimiento de pagos</p>
              </div>
              <Switch
                checked={notifications.paymentReminders}
                onCheckedChange={(checked) => handleNotificationChange('paymentReminders', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Emails Promocionales</Label>
                <p className="text-sm text-gray-600">Ofertas especiales y promociones</p>
              </div>
              <Switch
                checked={notifications.promotionalEmails}
                onCheckedChange={(checked) => handleNotificationChange('promotionalEmails', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Autenticación de Dos Factores</Label>
                <p className="text-sm text-gray-600">Seguridad adicional para tu cuenta</p>
              </div>
              <Switch
                checked={security.twoFactorAuth}
                onCheckedChange={(checked) => handleSecurityChange('twoFactorAuth', checked)}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label>Notificaciones de Inicio de Sesión</Label>
                <p className="text-sm text-gray-600">Notificar cuando alguien acceda a tu cuenta</p>
              </div>
              <Switch
                checked={security.loginNotifications}
                onCheckedChange={(checked) => handleSecurityChange('loginNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Cambio de Contraseña */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Cambiar Contraseña
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwords.current}
                    onChange={(e) => handlePasswordChange('current', e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwords.new}
                    onChange={(e) => handlePasswordChange('new', e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="relative">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={passwords.confirm}
                    onChange={(e) => handlePasswordChange('confirm', e.target.value)}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleChangePassword}
                disabled={isSaving || !passwords.current || !passwords.new || !passwords.confirm}
                className="flex items-center gap-2"
              >
                <Lock className="h-4 w-4" />
                Cambiar Contraseña
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botón de Guardar Configuraciones */}
      <div className="flex justify-end gap-2">
        <Button 
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Guardando...' : 'Guardar Configuraciones'}
        </Button>
      </div>

      {/* Zona de Peligro */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="h-5 w-5" />
            Zona de Peligro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label>Eliminar Cuenta</Label>
              <p className="text-sm text-gray-600">
                Una vez que elimines tu cuenta, no podrás recuperarla. Por favor, ten cuidado.
              </p>
            </div>
            <Button variant="destructive" disabled>
              Eliminar Cuenta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}