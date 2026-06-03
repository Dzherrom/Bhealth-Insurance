'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getCurrentToken, API_BASE_URL } from '@/lib/api';
import { ArrowLeft, Plus, ChevronRight, Trash2 } from 'lucide-react';

interface FamilyMember {
  primerNombre: string;
  segundoNombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  sexo: string;
  telefono: string;
  email: string;
  usaTabaco: boolean;
  peso: string;
  estatura: string;
  condicionMedica: string;
  relacion: string;
}

interface PlanCard {
  id: number;
  nombre: string;
  aseguradora_nombre?: string;
}

export default function NuevaPolizaWizard() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [agentes, setAgentes] = useState<any[]>([]);
  const [planes, setPlanes] = useState<PlanCard[]>([]);
  const [conyuge, setConyuge] = useState<FamilyMember | null>(null);
  const [dependientes, setDependientes] = useState<FamilyMember[]>([]);
  const [counties, setCounties] = useState<string[]>([]);

  // Default effective date es el primer día del siguiente mes
  const getDefaultEffectiveDate = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextMonth.toISOString().split('T')[0];
  };

  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, zipCode: value }));
    setCounties([]);
    if (value && value.length >= 5) {
      try {
        const token = accessToken || getCurrentToken();
        const res = await fetch(`${API_BASE_URL}/utils/zipcode/${value}/`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        if (data.city) setFormData(prev => ({ ...prev, ciudad: data.city }));
        if (data.state) setFormData(prev => ({ ...prev, estadoProvincia: data.state }));
        if (Array.isArray(data.counties)) setCounties(data.counties);
      } catch (err) {
        console.error('ZIP lookup error', err);
      }
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Info Póliza
    fechaEfectividad: getDefaultEffectiveDate(),
    agenteId: '',
    planId: '',
    planName: '',
    // Step 2: Info Personal
    primerNombre: '',
    segundoNombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
    sexo: 'Masculino',
    telefono: '',
    email: '',
    esAplicante: true,
    usaTabaco: false,
    peso: '',
    estatura: '',
    condicionMedica: '',
    // Step 3: Familiar & Address
    ingresoAnual: '',
    tamanoFamilia: '',
    direccion1: '',
    direccion2: '',
    ciudad: '',
    estadoProvincia: '',
    zipCode: '',
    condado: '',
  });

  // Fetch initial data (agentes and planes)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = accessToken || getCurrentToken();

        const [agentesRes, planesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/agentes/`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/planes/`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (agentesRes.ok) {
          const data = await agentesRes.json();
          setAgentes(data.results || data);
        }

        if (planesRes.ok) {
          const data = await planesRes.json();
          setPlanes((data.results || data).map((plan: any) => ({
            id: plan.id,
            nombre: plan.nombre,
            aseguradora_nombre: plan.aseguradora_nombre,
          })));
        }
      } catch (err) {
        console.error("Error fetching agentes or planes", err);
      }
    };
    fetchInitialData();
  }, [accessToken]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked as any) : value
    }));
  };

  const handleAddConyuge = () => {
    setConyuge({
      primerNombre: '',
      segundoNombre: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      fechaNacimiento: '',
      sexo: 'Femenino',
      telefono: '',
      email: '',
      usaTabaco: false,
      peso: '',
      estatura: '',
      condicionMedica: '',
      relacion: 'CONYUGE',
    });
  };

  const handleRemoveConyuge = () => {
    setConyuge(null);
  };

  const handleAddDependiente = () => {
    setDependientes(prev => [
      ...prev,
      {
        primerNombre: '',
        segundoNombre: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        fechaNacimiento: '',
        sexo: 'Masculino',
        telefono: '',
        email: '',
        usaTabaco: false,
        peso: '',
        estatura: '',
        condicionMedica: '',
        relacion: 'DEPENDIENTE',
      }
    ]);
  };

  const handleDependienteChange = (index: number, field: keyof FamilyMember, value: string | boolean) => {
    setDependientes(prev => prev.map((item, idx) => idx === index ? { ...item, [field]: value } : item));
  };

  const handleConyugeChange = (field: keyof FamilyMember, value: string | boolean) => {
    if (!conyuge) return;
    setConyuge(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleRemoveDependiente = (index: number) => {
    setDependientes(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.agenteId || !formData.planId) {
        setError('Por favor seleccione agente y plan antes de continuar.');
        return;
      }
    }
    setError(null);
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const validateDate = (value: string | undefined) => {
    if (!value) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  };

  const validateFamilyMember = (member: FamilyMember | null, label: string) => {
    if (!member) return { valid: true };

    const isBlank = [member.primerNombre, member.apellidoPaterno, member.fechaNacimiento, member.telefono, member.email].every(value => !value?.toString().trim());
    if (isBlank) {
      return { valid: false, error: `Complete o elimine los datos del ${label} antes de continuar.` };
    }

    const missingFields = [];
    if (!member.primerNombre?.trim()) missingFields.push('primer nombre');
    if (!member.apellidoPaterno?.trim()) missingFields.push('apellido paterno');
    if (!member.fechaNacimiento) missingFields.push('fecha de nacimiento');
    if (member.fechaNacimiento && !validateDate(member.fechaNacimiento)) missingFields.push('fecha de nacimiento válida');

    if (missingFields.length > 0) {
      return { valid: false, error: `El ${label} requiere: ${missingFields.join(', ')}.` };
    }

    return { valid: true };
  };

  const validateFamilyMembers = () => {
    const spouseValidation = validateFamilyMember(conyuge, 'cónyuge');
    if (!spouseValidation.valid) return spouseValidation.error;

    for (const [index, dep] of dependientes.entries()) {
      const depValidation = validateFamilyMember(dep, `dependiente ${index + 1}`);
      if (!depValidation.valid) return depValidation.error;
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const familyError = validateFamilyMembers();
    if (familyError) {
      setError(familyError);
      setLoading(false);
      return;
    }

    // Validate main applicant required fields
    if (!formData.primerNombre?.trim() || !formData.apellidoPaterno?.trim()) {
      setError('Complete el nombre y apellido del solicitante principal.');
      setLoading(false);
      return;
    }

    if (!formData.fechaNacimiento || !validateDate(formData.fechaNacimiento)) {
      setError('Ingrese una fecha de nacimiento válida para el solicitante principal.');
      setLoading(false);
      return;
    }

    try {
      let token = accessToken || getCurrentToken();

      // Helper to normalize dates to YYYY-MM-DD (ISO date)
      const formatToISO = (input?: string | Date | null) => {
        if (!input) return null;
        // Date object -> ISO date
        if (input instanceof Date) {
          if (isNaN(input.getTime())) return null;
          return input.toISOString().split('T')[0];
        }

        // String input -> try to normalize
        const str = String(input).trim();
        if (!str) return null;

        // If contains 'T', take date part
        const datePart = str.split('T')[0];

        // If already in YYYY-MM-DD
        const dashParts = datePart.split('-');
        if (dashParts.length === 3 && dashParts[0].length === 4) {
          return `${dashParts[0].padStart(4, '0')}-${dashParts[1].padStart(2, '0')}-${dashParts[2].padStart(2, '0')}`;
        }

        // If in MM/DD/YYYY
        if (datePart.includes('/')) {
          const p = datePart.split('/');
          if (p.length === 3) {
            const [m, d, y] = p;
            return `${y.padStart(4, '0')}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
          }
        }

        // Fallback: try Date parse
        const parsed = new Date(str);
        if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];

        return null;
      };

      const createClientPayload = (member: FamilyMember, fallbackPrefix: string) => ({
        primer_nombre: member.primerNombre,
        segundo_nombre: member.segundoNombre || '',
        apellido_paterno: member.apellidoPaterno,
        apellido_materno: member.apellidoMaterno || '',
        fecha_nacimiento: formatToISO(member.fechaNacimiento),
        genero: member.sexo,
        telefono: member.telefono || '0000000000',
        email: member.email || `${fallbackPrefix}-${Date.now()}@example.com`,
        estado_civil: 'Desconocido',
        pais_nacimiento: 'Desconocido',
        estado_inmigracion: 'Desconocido',
        ingreso_anual: formData.ingresoAnual || 0,
        usa_tabaco: !!member.usaTabaco,
        peso: member.peso || '',
        estatura: member.estatura || '',
        condicion_medica: member.condicionMedica || '',
        // Generate a short SSN-like temporary string capped to 20 chars to satisfy backend max_length
        ssn: (() => {
          const raw = `TMP-${fallbackPrefix}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2,6)}`;
          return raw.slice(0, 20);
        })()
      });

      // 1) Crear cliente principal
      const clientBody = createClientPayload({
        primerNombre: formData.primerNombre,
        segundoNombre: formData.segundoNombre,
        apellidoPaterno: formData.apellidoPaterno,
        apellidoMaterno: formData.apellidoMaterno,
        fechaNacimiento: formData.fechaNacimiento,
        sexo: formData.sexo,
        telefono: formData.telefono,
        email: formData.email,
        usaTabaco: formData.usaTabaco,
        peso: formData.peso,
        estatura: formData.estatura,
        condicionMedica: formData.condicionMedica,
        relacion: 'PRINCIPAL'
      }, 'cliente')

      const resCliente = await fetch(`${API_BASE_URL}/clientes/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(clientBody)
      });

      if (!resCliente.ok) {
        const txt = await resCliente.text();
        console.error('Create client failed:', resCliente.status, txt, clientBody);
        throw new Error('Error al crear el cliente principal: ' + txt);
      }
      const clienteCreado = await resCliente.json();

      // 2) Crear dirección (vinculada a la póliza)
      const direccionBody = {
        linea1: formData.direccion1,
        linea2: formData.direccion2,
        ciudad: formData.ciudad,
        estado: formData.estadoProvincia,
        zip_code: formData.zipCode,
        condado: formData.condado,
      };

      const resDireccion = await fetch(`${API_BASE_URL}/direcciones/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(direccionBody)
      });

      if (!resDireccion.ok) throw new Error('Error al crear la dirección');
      const direccionCreada = await resDireccion.json();

      // 3) Crear póliza (no enviar estado para que backend ponga QUOTE por defecto)
      const clientes_data: any[] = [
        {
          cliente: clienteCreado.id,
          es_solicitante_principal: true,
          relacion: 'PRINCIPAL',
          direccion_residencia: direccionCreada.id
        }
      ];

      if (conyuge && conyuge.primerNombre && conyuge.apellidoPaterno) {
        const conyugeRes = await fetch(`${API_BASE_URL}/clientes/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(createClientPayload(conyuge, 'conyuge'))
        });

        if (!conyugeRes.ok) throw new Error('Error al crear el cliente cónyuge');
        const conyugeCreado = await conyugeRes.json();

        clientes_data.push({
          cliente: conyugeCreado.id,
          es_solicitante_principal: false,
          relacion: 'CONYUGE',
          direccion_residencia: direccionCreada.id
        });
      }

      for (const [index, dep] of dependientes.entries()) {
        if (!dep.primerNombre || !dep.apellidoPaterno) continue;
        const depRes = await fetch(`${API_BASE_URL}/clientes/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(createClientPayload(dep, `dependiente-${index}`))
        });

        if (!depRes.ok) throw new Error(`Error al crear el dependiente ${index + 1}`);
        const depCreado = await depRes.json();

        clientes_data.push({
          cliente: depCreado.id,
          es_solicitante_principal: false,
          relacion: 'DEPENDIENTE',
          direccion_residencia: direccionCreada.id
        });
      }

      const polizaBody = {
        agente: formData.agenteId || null,
        fecha_efectiva: formatToISO(formData.fechaEfectividad),
        id_mercado: `QUOTE-${Date.now()}`,
        id_miembro: 'Pendiente',
        plan: Number(formData.planId),
        costo_poliza: 0,
        subsidio: 0,
        prima_mensual: 0,
        fecha_envio: formatToISO(new Date()),
        direccion_fisica: direccionCreada.id,
        clientes_data,
      };

      const resPoliza = await fetch(`${API_BASE_URL}/polizas/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(polizaBody)
      });

      if (!resPoliza.ok) {
        const txt = await resPoliza.text();
        throw new Error('Error al crear la póliza: ' + txt);
      }

      router.push('/crm/cotizaciones');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error inesperado al crear');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-page w-full h-full flex flex-col overflow-auto bg-[#f8fafc]">
      <header className="px-[30px] md:px-[40px] py-[20px] bg-white border-b border-[#e2e8f0] shadow-sm flex items-center gap-[16px]">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f5f9] text-[#64748b]">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-[20px] font-bold text-[#0f172a] m-0">Registro de Nueva Póliza</h2>
          <p className="text-[13px] text-[#64748b]">Paso {step} de 3</p>
        </div>
      </header>

      <div className="max-w-[900px] mx-auto w-full p-[30px] md:p-[40px]">
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()}>
          {step === 1 && (
            <div className="space-y-[30px] animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h3 className="text-[18px] font-bold text-[#0f172a] border-b border-[#e2e8f0] pb-[10px]">1. Información de Póliza</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155]">Fecha de Efectividad</label>
                  <input
                    type="date"
                    name="fechaEfectividad"
                    value={formData.fechaEfectividad}
                    onChange={handleChange}
                    className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] text-[#0f172a] bg-white focus:ring-2 focus:ring-[#4f46e5] outline-none"
                  />
                </div>
                
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155]">Agente Registrado *</label>
                  <select
                    name="agenteId"
                    value={formData.agenteId}
                    onChange={handleChange}
                    className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] text-[#0f172a] bg-white focus:ring-2 focus:ring-[#4f46e5] outline-none"
                    required
                  >
                    <option value="">Seleccione un agente</option>
                    {agentes.map((ag: any) => (
                      <option key={ag.id} value={ag.id}>{ag.nombre_completo}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-[8px]">
                <label className="text-[13px] font-semibold text-[#334155]">Selecciona un Producto para Cotizar *</label>
                {planes.length === 0 ? (
                  <div className="text-[#64748b] text-sm">Cargando productos o sin planes disponibles.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-[16px]">
                    {planes.map(plan => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, planId: String(plan.id), planName: plan.nombre }))}
                        className={`text-left border p-[16px] rounded-[12px] transition-all min-h-[80px] ${formData.planId === String(plan.id)
                          ? 'border-[#4f46e5] bg-[#eef2ff] text-[#4f46e5] shadow-sm ring-1 ring-[#4f46e5]'
                          : 'border-[#cbd5e1] bg-white text-[#475569] hover:border-[#94a3b8] hover:bg-[#f8fafc]'}`}
                      >
                        <div className="font-bold text-[14px]">{plan.nombre}</div>
                        {plan.aseguradora_nombre && <div className="text-[12px] text-[#64748b] mt-[6px]">{plan.aseguradora_nombre}</div>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 flex justify-end">
                <button onClick={handleNext} className="bg-[#4f46e5] hover:bg-[#4338ca] text-white py-[10px] px-[24px] text-[14px] font-semibold rounded-[10px] shadow-sm flex items-center gap-2">
                  Siguiente Paso <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-[30px] animate-in fade-in slide-in-from-right-8 duration-300">
              <h3 className="text-[18px] font-bold text-[#0f172a] border-b border-[#e2e8f0] pb-[10px]">2. Información Personal</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155]">Primer Nombre</label>
                  <input type="text" name="primerNombre" value={formData.primerNombre} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155]">Segundo Nombre</label>
                  <input type="text" name="segundoNombre" value={formData.segundoNombre} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155]">Apellido Paterno</label>
                  <input type="text" name="apellidoPaterno" value={formData.apellidoPaterno} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155]">Apellido Materno</label>
                  <input type="text" name="apellidoMaterno" value={formData.apellidoMaterno} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155]">Fecha de Nacimiento</label>
                  <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155]">Sexo</label>
                  <select name="sexo" value={formData.sexo} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]">
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155]">Teléfono</label>
                  <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155]">Correo Electrónico</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                </div>
              </div>

              <div className="border border-[#e2e8f0] rounded-[12px] p-[20px] bg-white space-y-[16px]">
                <h4 className="text-[14px] font-bold text-[#0f172a]">Detalles Clínicos & Estatus</h4>
                
                <div className="flex items-center gap-[12px]">
                  <input type="checkbox" id="esAplicante" name="esAplicante" checked={formData.esAplicante} onChange={handleChange} className="w-5 h-5 rounded text-[#4f46e5] focus:ring-[#4f46e5]" />
                  <label htmlFor="esAplicante" className="text-[14px] font-medium text-[#334155]">Este miembro es un aplicante principal</label>
                </div>

                <div className="flex items-center gap-[12px]">
                  <input type="checkbox" id="usaTabaco" name="usaTabaco" checked={formData.usaTabaco} onChange={handleChange} className="w-5 h-5 rounded text-[#4f46e5] focus:ring-[#4f46e5]" />
                  <label htmlFor="usaTabaco" className="text-[14px] font-medium text-[#334155]">¿Usa Tabaco?</label>
                </div>

                <div className="grid grid-cols-2 gap-[24px]">
                  <div className="flex flex-col gap-[8px]">
                    <label className="text-[13px] font-semibold text-[#334155]">Peso</label>
                    <input type="text" name="peso" placeholder="Ej. 75 kg" value={formData.peso} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <label className="text-[13px] font-semibold text-[#334155]">Estatura</label>
                    <input type="text" name="estatura" placeholder="Ej. 1.75 m" value={formData.estatura} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                  </div>
                </div>

                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155]">Condición Médica</label>
                  <textarea name="condicionMedica" value={formData.condicionMedica} onChange={handleChange} className="min-h-[100px] rounded-[10px] border border-[#cbd5e1] p-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5] resize-y" />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button onClick={handleBack} className="text-[#64748b] hover:text-[#0f172a] py-[10px] px-[20px] font-semibold text-[14px]">
                  Atrás
                </button>
                <button onClick={handleNext} className="bg-[#4f46e5] hover:bg-[#4338ca] text-white py-[10px] px-[24px] text-[14px] font-semibold rounded-[10px] shadow-sm flex items-center gap-2">
                  Siguiente Paso <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-[30px] animate-in fade-in slide-in-from-right-8 duration-300">
              <h3 className="text-[18px] font-bold text-[#0f172a] border-b border-[#e2e8f0] pb-[10px]">3. Información Familiar & Dirección</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155]">Ingreso Familiar Anual</label>
                  <input type="number" name="ingresoAnual" value={formData.ingresoAnual} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155]">Tamaño del Grupo Familiar</label>
                  <input type="number" name="tamanoFamilia" value={formData.tamanoFamilia} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                </div>
              </div>

              {/* Conyuge & Dependientes placeholders for UI layout */}
              <div className="flex flex-col gap-[16px]">
                <div className="flex flex-wrap gap-[16px]">
                  {!conyuge ? (
                    <button type="button" onClick={handleAddConyuge} className="border border-[#cbd5e1] text-[#4f46e5] bg-white hover:bg-[#f8fafc] py-[10px] px-[20px] text-[13px] font-semibold rounded-[10px] shadow-sm flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Añadir Cónyuge
                    </button>
                  ) : (
                    <button type="button" onClick={handleRemoveConyuge} className="border border-red-200 text-red-600 bg-white hover:bg-red-50 py-[10px] px-[20px] text-[13px] font-semibold rounded-[10px] shadow-sm flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Eliminar Cónyuge
                    </button>
                  )}

                  <button type="button" onClick={handleAddDependiente} className="border border-[#cbd5e1] text-[#4f46e5] bg-white hover:bg-[#f8fafc] py-[10px] px-[20px] text-[13px] font-semibold rounded-[10px] shadow-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Añadir Dependiente
                  </button>
                </div>

                {conyuge && (
                  <div className="border border-[#cbd5e1] rounded-[12px] p-[20px] bg-white space-y-[16px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[14px] font-bold text-[#0f172a]">Cónyuge</h4>
                        <p className="text-[12px] text-[#64748b]">Información de cónyuge vinculada a la cotización.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155]">Primer Nombre</label>
                        <input type="text" value={conyuge.primerNombre} onChange={(e) => handleConyugeChange('primerNombre', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155]">Apellido Paterno</label>
                        <input type="text" value={conyuge.apellidoPaterno} onChange={(e) => handleConyugeChange('apellidoPaterno', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155]">Apellido Materno</label>
                        <input type="text" value={conyuge.apellidoMaterno} onChange={(e) => handleConyugeChange('apellidoMaterno', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155]">Fecha de Nacimiento</label>
                        <input type="date" value={conyuge.fechaNacimiento} onChange={(e) => handleConyugeChange('fechaNacimiento', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155]">Sexo</label>
                        <select value={conyuge.sexo} onChange={(e) => handleConyugeChange('sexo', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]">
                          <option value="Masculino">Masculino</option>
                          <option value="Femenino">Femenino</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155]">Teléfono</label>
                        <input type="text" value={conyuge.telefono} onChange={(e) => handleConyugeChange('telefono', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155]">Correo Electrónico</label>
                        <input type="email" value={conyuge.email} onChange={(e) => handleConyugeChange('email', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                    </div>
                  </div>
                )}

                {dependientes.length > 0 && dependientes.map((dep, index) => (
                  <div key={index} className="border border-[#cbd5e1] rounded-[12px] p-[20px] bg-white space-y-[16px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[14px] font-bold text-[#0f172a]">Dependiente {index + 1}</h4>
                        <p className="text-[12px] text-[#64748b]">Información del familiar para la cotización.</p>
                      </div>
                      <button type="button" onClick={() => handleRemoveDependiente(index)} className="text-red-600 hover:text-red-800 text-[12px] font-semibold">Eliminar</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155]">Primer Nombre</label>
                        <input type="text" value={dep.primerNombre} onChange={(e) => handleDependienteChange(index, 'primerNombre', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155]">Apellido Paterno</label>
                        <input type="text" value={dep.apellidoPaterno} onChange={(e) => handleDependienteChange(index, 'apellidoPaterno', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155]">Apellido Materno</label>
                        <input type="text" value={dep.apellidoMaterno} onChange={(e) => handleDependienteChange(index, 'apellidoMaterno', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155]">Fecha de Nacimiento</label>
                        <input type="date" value={dep.fechaNacimiento} onChange={(e) => handleDependienteChange(index, 'fechaNacimiento', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155]">Sexo</label>
                        <select value={dep.sexo} onChange={(e) => handleDependienteChange(index, 'sexo', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]">
                          <option value="Masculino">Masculino</option>
                          <option value="Femenino">Femenino</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155]">Teléfono</label>
                        <input type="text" value={dep.telefono} onChange={(e) => handleDependienteChange(index, 'telefono', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155]">Correo Electrónico</label>
                        <input type="email" value={dep.email} onChange={(e) => handleDependienteChange(index, 'email', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border border-[#e2e8f0] rounded-[12px] p-[20px] bg-[#f8fafc] space-y-[16px]">
                <h4 className="text-[14px] font-bold text-[#0f172a]">Dirección Residencial</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                  <div className="flex flex-col gap-[8px] md:col-span-2">
                    <label className="text-[13px] font-semibold text-[#334155]">Línea de Dirección 1</label>
                    <input type="text" name="direccion1" value={formData.direccion1} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                  </div>
                  <div className="flex flex-col gap-[8px] md:col-span-2">
                    <label className="text-[13px] font-semibold text-[#334155]">Línea de Dirección 2 (opcional)</label>
                    <input type="text" name="direccion2" value={formData.direccion2} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <label className="text-[13px] font-semibold text-[#334155]">Código Postal</label>
                    <input type="text" name="zipCode" value={formData.zipCode} onChange={handleZipChange} placeholder="Ingrese Zip Code..." className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <label className="text-[13px] font-semibold text-[#334155]">Ciudad</label>
                    <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5] bg-[#f1f5f9]" readOnly={formData.zipCode.length === 5} />
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <label className="text-[13px] font-semibold text-[#334155]">Estado</label>
                    <input type="text" name="estadoProvincia" value={formData.estadoProvincia} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5] bg-[#f1f5f9]" readOnly={formData.zipCode.length === 5} />
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <label className="text-[13px] font-semibold text-[#334155]">Condado</label>
                    <select name="condado" value={formData.condado} onChange={handleChange} disabled={!counties.length} className="h-[44px] rounded-[10px] border border-[#cbd5e1] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]">
                      <option value="">Seleccione Condado...</option>
                      {counties.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button onClick={handleBack} className="text-[#64748b] hover:text-[#0f172a] py-[10px] px-[20px] font-semibold text-[14px]">
                  Atrás
                </button>
                <button onClick={handleSubmit} disabled={loading} className="bg-[#10b981] hover:bg-[#059669] text-white py-[10px] px-[24px] text-[14px] font-bold rounded-[10px] shadow-sm flex items-center gap-2">
                  {loading ? 'Guardando...' : 'Finalizar y Crear Cotización (QUOTE)'}
                </button>
              </div>

            </div>
          )}
        </form>
      </div>
    </div>
  );
}