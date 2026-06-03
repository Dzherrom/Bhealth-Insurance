'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronLeft, FileText, User, Calendar, DollarSign, Shield, Building, Phone, Mail, Clock, MapPin, CreditCard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from '@/components/ui/skeleton';
import { PolizaResponse } from '@/types/polizas';
import { InfoCard, InfoRow } from '@/components/polizas/InfoCard';
import { PolizaTimeline } from '@/components/polizas/PolizaTimeline';
import { Familiares } from '@/components/polizas/Familiares';
import { PolizaResumen } from '@/components/polizas/PolizaResumen';
import { NotasPoliza } from '@/components/polizas/NotasPoliza';
import { DocumentosPoliza } from '@/components/polizas/DocumentosPoliza';
import { RecordatoriosPoliza } from '@/components/recordatorios';
import { usePolizaStore } from '@/store/polizaStore';
import { InfoPagoPoliza } from '@/components/polizas/InfoPagoPoliza';
import { DireccionesPoliza } from '@/components/polizas/DireccionesPoliza';
import { MetadatosPoliza } from '@/components/polizas/MetadatosPoliza';
import { CalendarioPrimasPoliza } from '@/components/polizas/CalendarioPrimasPoliza';
import { TareasPoliza } from '@/components/polizas/TareasPoliza';
import { useAuthStore } from '@/store/authStore';

/* Mock data comentada — reemplazada por datos reales del API
const mockPolizaDetails: PolizaResponse = {
  id: 1,
  id_mercado: 'POL-2024-001',
  id_miembro: 'MEM-001',
  costo_poliza: '1079.88',
  subsidio: '150.00',
  prima_mensual: '89.99',
  fecha_efectiva: '2024-01-15',
  fecha_envio: '2024-01-10',
  id_interno: 'INT-001',
  plan: 1,
  estado: 1,
  agente: 1,
  estado_nombre: 'Activo',
  plan_nombre: 'Premium',
  agente_nombre: 'Ana García',
  clientes_info: [
    {
      id: 1,
      cliente: 1,
      cliente_details: {
        primer_nombre: 'Juan',
        apellido_paterno: 'Pérez',
        apellido_materno: 'González',
        telefono: '+1 234 567 8900',
        email: 'juan.perez@email.com'
      },
      es_solicitante_principal: true,
      relacion: 'SOLICITANTE',
      direccion_residencia: 1,
      direccion_postal: 1
    },
    {
      id: 2,
      cliente: 2,
      cliente_details: {
        primer_nombre: 'María',
        apellido_paterno: 'Pérez',
        apellido_materno: 'López',
        telefono: '+1 234 567 8901',
        email: 'maria.perez@email.com'
      },
      es_solicitante_principal: false,
      relacion: 'CONYUGUE',
      direccion_residencia: 1,
      direccion_postal: 1
    }
  ],
  fecha_creacion: '2024-01-10',
  fecha_modificacion: '2024-01-10'
};

// Datos de ejemplo para el timeline
const mockTimelineEvents = [
  {
    id: 1,
    title: 'Póliza creada',
    description: 'La póliza fue creada por Ana García',
    date: '2024-01-10T10:00:00Z',
    type: 'created' as const,
    status: 'Pendiente'
  },
  {
    id: 2,
    title: 'Documentos recibidos',
    description: 'Se recibieron todos los documentos requeridos del cliente',
    date: '2024-01-12T14:30:00Z',
    type: 'modified' as const
  },
  {
    id: 3,
    title: 'Póliza aprobada',
    description: 'La póliza fue aprobada y está lista para activarse',
    date: '2024-01-14T09:15:00Z',
    type: 'approved' as const,
    status: 'Activo'
  }
];

// Datos de ejemplo para familiares
const mockFamiliares = [
  {
    id: 1,
    nombre: 'Nelson',
    apellido: 'Vado',
    relacion: 'Aplicante',
    telefono: '+1 (404) 555-0102',
    email: 'nelson.vado@email.com'
  },
  {
    id: 2,
    nombre: 'María',
    apellido: 'Vado',
    relacion: 'Cónyuge',
    telefono: '+1 (404) 555-0103',
    email: 'maria.vado@email.com'
  }
];
*/

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'activo':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pendiente':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelado':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'inactivo':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200';
  }
};

const formatCurrency = (amount: string | number) => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(numAmount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PolizaDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { polizaSeleccionada: poliza, isLoading: loading, fetchPolizaById } = usePolizaStore();
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState('poliza');

  const [isBasicInfoModalOpen, setIsBasicInfoModalOpen] = useState(false);
  const [isFinancialModalOpen, setIsFinancialModalOpen] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [currentFamilyMember, setCurrentFamilyMember] = useState<any>(null);

  useEffect(() => {
    if (params.id) {
      fetchPolizaById(Number(params.id));
    }
  }, [params.id, fetchPolizaById]);

  if (loading) {
    return (
      <div className="app-page space-y-6">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!poliza) {
    return (
      <div className="app-page">
        <div className="text-center space-y-4">
          <FileText className="w-16 h-16 mx-auto text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900">Póliza no encontrada</h2>
          <p className="text-gray-500">No se pudo encontrar la póliza solicitada.</p>
          <Button onClick={() => router.push('/crm/polizas')} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Volver a pólizas
          </Button>
        </div>
      </div>
    );
  }

  const clientePrincipal = poliza.clientes_info.find(c => c.es_solicitante_principal);

  // Derivar familiares desde clientes_info del API
  const familiares = poliza.clientes_info.map(ci => ({
    id: ci.id,
    nombre: ci.cliente_details.primer_nombre,
    apellido: (ci.cliente_details as any).apellido_paterno ?? '',
    relacion: ci.relacion,
    telefono: (ci.cliente_details as any).telefono ?? '',
    email: (ci.cliente_details as any).email ?? '',
  }));

  // Handlers para familiares
  const handleEditFamiliar = (id: number) => {
    const member = poliza.clientes_info.find(ci => ci.id === id);
    if (member) {
      setCurrentFamilyMember(member);
      setIsFamilyModalOpen(true);
    }
  };
  const handleDeleteFamiliar = (id: number) => {
    console.log('Eliminar familiar', id);
  };
  const handleAddFamiliar = () => {
    console.log('Agregar familiar');
  };

  return (
    <div className="app-page space-y-6">
      {/* Header - cubriendo todo el ancho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => router.push('/crm/polizas')}
            className="hover:bg-gray-100"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Póliza {poliza.id_mercado}
            </h1>
            <p className="text-gray-500">
              Cliente principal: {clientePrincipal?.cliente_details.primer_nombre} {clientePrincipal?.cliente_details.apellido_paterno}
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(poliza.estado_nombre)}>
          {poliza.estado_nombre}
        </Badge>
      </div>

      {/* Layout con división lateral */}
      <div className="flex gap-6">
        {/* Panel lateral izquierdo - Resumen */}
        <PolizaResumen 
          poliza={{
            id_mercado: poliza.id_mercado,
            agente_nombre: poliza.agente_nombre,
            plan_nombre: poliza.plan_nombre,
            estado_nombre: poliza.estado_nombre,
            prima_mensual: poliza.prima_mensual,
            fecha_efectiva: poliza.fecha_efectiva,
            cliente_principal: clientePrincipal ? `${clientePrincipal.cliente_details.primer_nombre} ${clientePrincipal.cliente_details.apellido_paterno}` : 'No asignado'
          }}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />

        {/* Contenido principal */}
        <div className="flex-1 space-y-6">
          {activeSection === 'poliza' && (
            <>
              {/* Información general */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Información básica */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span>Información Básica</span>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setIsBasicInfoModalOpen(true)}>
              Editar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <InfoRow label="ID Mercado" value={poliza.id_mercado} />
              <InfoRow label="ID Miembro" value={poliza.id_miembro} />
              <InfoRow label="ID Interno" value={poliza.id_interno} />
            </div>
          </CardContent>
        </Card>

        {/* Información financiera */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span>Información Financiera</span>
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => setIsFinancialModalOpen(true)}>
              Editar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <InfoRow 
                label="Costo Total" 
                value={<span className="text-lg text-green-600">{formatCurrency(poliza.costo_poliza)}</span>} 
              />
              <InfoRow label="Prima Mensual" value={formatCurrency(poliza.prima_mensual)} />
              <InfoRow 
                label="Subsidio" 
                value={<span className="text-blue-600">{formatCurrency(poliza.subsidio)}</span>} 
              />
            </div>
          </CardContent>
        </Card>

        {/* Fechas importantes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span>Fechas Importantes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <InfoRow label="Fecha Efectiva" value={formatDate(poliza.fecha_efectiva)} />
              {poliza.fecha_envio && (
                <InfoRow label="Fecha Envío" value={formatDate(poliza.fecha_envio)} />
              )}
              <InfoRow label="Fecha Creación" value={formatDate(poliza.fecha_creacion!)} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Plan y Agente */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span>Plan de Seguro</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <InfoRow 
                label="Nombre del Plan" 
                value={<span className="text-lg text-blue-600">{poliza.plan_nombre}</span>} 
              />
              <InfoRow label="Plan ID" value={poliza.plan ? poliza.plan.toString() : 'N/A'} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center space-x-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              <span>Agente Asignado</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <InfoRow label="Nombre del Agente" value={poliza.agente_nombre} />
              <InfoRow label="Agente ID" value={poliza.agente ? poliza.agente.toString() : 'N/A'} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>Direcciones</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setActiveSection('direcciones')}>
            Gestionar
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Administra direcciones fisica, postal y de facturacion en la seccion Direcciones.</p>
        </CardContent>
      </Card>

      {/* Familiares */}
      <Familiares 
        familiares={familiares}
        onEdit={handleEditFamiliar}
        onDelete={handleDeleteFamiliar}
        onAdd={handleAddFamiliar}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <span>Pagos y cronograma</span>
          </CardTitle>
          <Button variant="outline" size="sm" onClick={() => setActiveSection('pagos')}>
            Gestionar
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Gestiona medios de pago, cronograma y tarjetas en la seccion Medios de Pago.</p>
        </CardContent>
      </Card>

              {/* Notas de la póliza */}
              <NotasPoliza polizaId={params.id as string} />

              {/* Timeline de la póliza — sin endpoint de historial aún */}
              <PolizaTimeline events={[]} />
            </>
          )}
          
          {activeSection === 'documentos' && (
            <DocumentosPoliza polizaId={params.id as string} />
          )}
          
          {activeSection === 'recordatorios' && (
              <RecordatoriosPoliza polizaId={params.id as string} />
            )}

            {activeSection === 'pagos' && (
              <InfoPagoPoliza poliza={poliza} />
            )}
            
            {activeSection === 'direcciones' && (
              <DireccionesPoliza poliza={poliza} />
            )}
            
            {activeSection === 'metadatos' && (
              <MetadatosPoliza poliza={poliza} />
            )}

            {activeSection === 'calendario' && (
              <CalendarioPrimasPoliza polizaId={poliza.id} />
            )}

            {activeSection === 'tareas' && (
              <TareasPoliza polizaId={poliza.id} userId={user?.id} />
            )}
            
            {activeSection !== 'poliza' && activeSection !== 'documentos' && activeSection !== 'recordatorios' && activeSection !== 'pagos' && activeSection !== 'direcciones' && activeSection !== 'metadatos' && activeSection !== 'calendario' && activeSection !== 'tareas' && (
              <div className="text-center py-8 text-gray-500">
                <p>Sección en desarrollo: {activeSection}</p>
              </div>
            )}
        </div>
      </div>

      {/* Modals */}
      <EditBasicInfoModal 
        open={isBasicInfoModalOpen} 
        onOpenChange={setIsBasicInfoModalOpen} 
        data={poliza} 
      />
      <EditFinancialModal 
        open={isFinancialModalOpen} 
        onOpenChange={setIsFinancialModalOpen} 
        data={poliza} 
      />
      <EditFamilyModal 
        open={isFamilyModalOpen} 
        onOpenChange={setIsFamilyModalOpen} 
        member={currentFamilyMember} 
      />

    </div>
  );
}


function EditBasicInfoModal({ open, onOpenChange, data }: { open: boolean, onOpenChange: (open: boolean) => void, data: any }) {
  const { updatePoliza } = usePolizaStore();
  const { toast } = useToast();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updates = {
      id_mercado: formData.get("id_mercado")?.toString(),
      id_miembro: formData.get("id_miembro")?.toString(),
      id_interno: formData.get("id_interno")?.toString(),
    };
    try {
        if(data?.id) await updatePoliza(data.id, updates);
        toast({
            title: "Éxito",
            description: "Información básica actualizada correctamente.",
        });
        onOpenChange(false);
    } catch (error) {
        toast({
            title: "Error",
            description: "Error al actualizar la póliza.",
            variant: "destructive",
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Información Básica</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="id_mercado">ID Mercado</Label>
            <Input id="id_mercado" name="id_mercado" defaultValue={data?.id_mercado || ''} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="id_miembro">ID Miembro</Label>
            <Input id="id_miembro" name="id_miembro" defaultValue={data?.id_miembro || ''} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="id_interno">ID Interno</Label>
            <Input id="id_interno" name="id_interno" defaultValue={data?.id_interno || ''} />
          </div>
          <DialogFooter><Button type="submit">Guardar Cambios</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditFinancialModal({ open, onOpenChange, data }: { open: boolean, onOpenChange: (open: boolean) => void, data: any }) {
  const { updatePoliza } = usePolizaStore();
  const { toast } = useToast();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updates = {
      costo_poliza: formData.get("costo_poliza") ? Number(formData.get("costo_poliza")) : undefined,
      prima_mensual: formData.get("prima_mensual") ? Number(formData.get("prima_mensual")) : undefined,
      subsidio: formData.get("subsidio") ? Number(formData.get("subsidio")) : undefined,
    };
    try {
        if(data?.id) await updatePoliza(data.id, updates);
        toast({
            title: "Éxito",
            description: "Información financiera actualizada correctamente.",
        });
        onOpenChange(false);
    } catch (error) {
        toast({
            title: "Error",
            description: "Error al actualizar la póliza.",
            variant: "destructive",
        });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Información Financiera</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="costo_poliza">Costo Total</Label>
            <Input id="costo_poliza" name="costo_poliza" type="number" step="0.01" defaultValue={data?.costo_poliza} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="prima_mensual">Prima Mensual</Label>
            <Input id="prima_mensual" name="prima_mensual" type="number" step="0.01" defaultValue={data?.prima_mensual} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subsidio">Subsidio</Label>
            <Input id="subsidio" name="subsidio" type="number" step="0.01" defaultValue={data?.subsidio} />
          </div>
          <DialogFooter><Button type="submit">Guardar Cambios</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditFamilyModal({ open, onOpenChange, member }: { open: boolean, onOpenChange: (open: boolean) => void, member: any }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    console.log("Updating Family Member:", member, formData.get("nombre"));
    // Implement API call for family member
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{member ? 'Editar Familiar' : 'Agregar Familiar'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" name="nombre" defaultValue={member?.cliente_details?.primer_nombre} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="apellido_paterno">Apellido</Label>
            <Input id="apellido_paterno" name="apellido_paterno" defaultValue={member?.cliente_details?.apellido_paterno} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="relacion">Relación</Label>
            <Input id="relacion" name="relacion" defaultValue={member?.relacion} />
          </div>
          <DialogFooter><Button type="submit">Guardar Cambios</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

