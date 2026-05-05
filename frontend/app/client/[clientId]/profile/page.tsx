'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Edit, Save, X, CheckCircle2, XCircle, LogOut } from 'lucide-react';
import { useAuthStore, usePolizaStore } from '@/store';
import {
  ClientProfileInfo,
  ClientContactInfo,
  ClientAccountInfo,
  ClientPolicyInfo,
  type ClientProfile,
  type PolicyInfo
} from '@/components/client';

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.clientId as string;
  
  // Zustand stores
  const { user, updateProfile: updateUserProfile, logout, isLoading: isLoadingAuth } = useAuthStore();
  const { polizas, fetchPolizas, isLoading: isLoadingPolizas } = usePolizaStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<ClientProfile>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Convertir user a ClientProfile format
  const profile: ClientProfile | null = user ? {
    id: user.id.toString(),
    firstName: user.first_name || '',
    lastName: user.last_name || '',
    email: user.email,
    phone: '', // Agregar cuando esté disponible en el modelo User
    address: '', // Agregar cuando esté disponible en el modelo User
    birthDate: '', // Agregar cuando esté disponible en el modelo User
    registrationDate: '', // Agregar cuando esté disponible en el modelo User
    status: 'active'
  } : null;

  // Convertir primera póliza a PolicyInfo format (temporal)
  const policy: PolicyInfo | null = polizas.length > 0 ? {
    id: polizas[0].id.toString(),
    planName: polizas[0].plan_nombre || 'Plan sin nombre',
    type: 'Salud', // Mejorar con info del plan
    status: polizas[0].estado_nombre === 'Activo' ? 'active' : 'pending',
    startDate: polizas[0].fecha_efectiva,
    expirationDate: '', // Calcular basado en vigencia
    monthlyPremium: parseFloat(polizas[0].prima_mensual),
    coverage: polizas[0].costo_poliza,
    deductible: 0, // Agregar cuando esté disponible
    beneficiaries: 0, // Pendiente: agregar campo en API
    lastPayment: '' // Agregar cuando esté disponible
  } : null;

  useEffect(() => {
    // Cargar datos reales de la API
    const loadData = async () => {
      try {
        await fetchPolizas();
      } catch (error) {
        console.error('Error cargando datos:', error);
      }
    };

    loadData();
  }, [fetchPolizas]);

  useEffect(() => {
    // Inicializar editedProfile cuando user cambie
    if (profile) {
      setEditedProfile(profile);
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedProfile(profile || {});
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setErrorMessage('');
      setSuccessMessage('');
      
      // Actualizar perfil usando el store
      await updateUserProfile({
        first_name: editedProfile.firstName,
        last_name: editedProfile.lastName,
        email: editedProfile.email,
      });
      
      setIsEditing(false);
      setSuccessMessage('Perfil actualizado exitosamente');
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error actualizando perfil:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Error al actualizar perfil');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setEditedProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogout = async () => {
    await logout();
    router.push('/client');
  };

  if (isLoadingAuth || !profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Cargando perfil...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <Button onClick={handleEdit} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Editar Perfil
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Guardar
              </Button>
              <Button variant="outline" onClick={handleCancel} className="flex items-center gap-2">
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            </div>
          )}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </Button>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Información Personal */}
        <ClientProfileInfo
          profile={profile}
          isEditing={isEditing}
          editedProfile={editedProfile}
          onInputChange={handleInputChange}
        />

        {/* Información de Contacto */}
        <ClientContactInfo
          profile={profile}
          isEditing={isEditing}
          editedProfile={editedProfile}
          onInputChange={handleInputChange}
        />

        {/* Información de la Cuenta */}
        <ClientAccountInfo
          clientId={clientId}
        />

        {/* Información de Póliza */}
        <ClientPolicyInfo clientId={clientId} />
      </div>
    </div>
  );
}