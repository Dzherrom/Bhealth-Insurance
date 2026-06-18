'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { getCurrentToken, API_BASE_URL, agentesApi } from '@/lib/api';
import { ClienteCombobox } from '@/components/clientes/ClienteCombobox';
import {
  buildContactEntriesFromWizard,
  getClienteDisplayName,
  mapClienteToWizardAddress,
  mapClienteToWizardPersonal,
  mapClienteWizardContext,
  mergeCountyOptions,
  validateContactsAgainstDatabase,
  type WizardFamilyMember,
} from '@/lib/clienteUtils';
import { clientesApi } from '@/lib/api';
import type { Cliente } from '@/types';
import { ArrowLeft, Plus, ChevronRight, Trash2 } from 'lucide-react';
import { ProductSelection } from '@/components/polizas/ProductSelection';

interface FamilyMember extends WizardFamilyMember {}

type ApplicantMode = 'new' | 'existing';

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
  const [applicantMode, setApplicantMode] = useState<ApplicantMode>('new');
  const [selectedExistingCliente, setSelectedExistingCliente] = useState<Cliente | null>(null);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [isLoadingClienteContext, setIsLoadingClienteContext] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [agentes, setAgentes] = useState<any[]>([]);
  const [conyuge, setConyuge] = useState<FamilyMember | null>(null);
  const [dependientes, setDependientes] = useState<FamilyMember[]>([]);
  const [counties, setCounties] = useState<string[]>([]);

  // Default effective date es el primer día del siguiente mes
  const getDefaultEffectiveDate = () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return nextMonth.toISOString().split('T')[0];
  };

  const syncCountiesForZip = async (zipCode: string, preferredCondado?: string) => {
    if (!zipCode || zipCode.length < 5) {
      if (preferredCondado?.trim()) {
        setCounties([preferredCondado.trim()]);
      }
      return;
    }

    try {
      const token = accessToken || getCurrentToken();
      const res = await fetch(`${API_BASE_URL}/utils/zipcode/${zipCode}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (preferredCondado?.trim()) {
          setCounties([preferredCondado.trim()]);
        }
        return;
      }

      const data = await res.json();
      const merged = mergeCountyOptions(Array.isArray(data.counties) ? data.counties : [], preferredCondado);
      setCounties(merged);
      setFormData((prev) => ({
        ...prev,
        ...(data.city ? { ciudad: data.city } : {}),
        ...(data.state ? { estadoProvincia: data.state } : {}),
        condado: preferredCondado?.trim() || prev.condado,
      }));
    } catch (err) {
      console.error('ZIP lookup error', err);
      if (preferredCondado?.trim()) {
        setCounties([preferredCondado.trim()]);
      }
    }
  };

  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      zipCode: value,
      condado: value.length < 5 ? '' : prev.condado,
    }));

    if (value.length >= 5) {
      await syncCountiesForZip(value);
    } else {
      setCounties([]);
    }
  };

  const handleProductSelect = (productId: number) => {
    setSelectedProductId(productId);
    // Aquí puedes añadir lógica para filtrar planes basados en el producto seleccionado
  };

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Info Poliza
    fechaEfectividad: getDefaultEffectiveDate(),
    agenteId: '',
    // Step 2: Info Personal
    primerNombre: '',
    segundoNombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
    sexo: 'Masculino',
    telefono: '',
    email: '',
    ssn: '',
    esAplicante: true,
    usaTabaco: false,
    peso: '',
    estatura: '',
    condicionMedica: '',
    // Step 3: Familiar
    ingresoAnual: '',
    tamanoFamilia: '',
    // Step 4: Address
    direccion1: '',
    direccion2: '',
    ciudad: '',
    estadoProvincia: '',
    zipCode: '',
    condado: '',
  });

  const emptyFamilyMember = (relacion: string): FamilyMember => ({
    primerNombre: '',
    segundoNombre: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    fechaNacimiento: '',
    sexo: 'Masculino',
    telefono: '',
    email: '',
    ssn: '',
    usaTabaco: false,
    peso: '',
    estatura: '',
    condicionMedica: '',
    relacion,
    clienteId: null,
  });

  const resetPersonalForm = () => {
    setFormData((prev) => ({
      ...prev,
      primerNombre: '',
      segundoNombre: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      fechaNacimiento: '',
      sexo: 'Masculino',
      telefono: '',
      email: '',
      ssn: '',
      usaTabaco: false,
      peso: '',
      estatura: '',
      condicionMedica: '',
      ingresoAnual: '',
      tamanoFamilia: '',
      direccion1: '',
      direccion2: '',
      ciudad: '',
      estadoProvincia: '',
      zipCode: '',
      condado: '',
    }));
    setConyuge(null);
    setDependientes([]);
    setCounties([]);
  };

  const applyExistingClienteFallback = (cliente: Cliente) => {
    setSelectedExistingCliente(cliente);
    const personal = mapClienteToWizardPersonal(cliente);
    const address = mapClienteToWizardAddress(cliente);
    setFormData((prev) => ({
      ...prev,
      ...personal,
      ingresoAnual: cliente.ingreso_anual ? String(cliente.ingreso_anual) : prev.ingresoAnual,
      ...address,
    }));
    if (address.zipCode.length >= 5) {
      void syncCountiesForZip(address.zipCode, address.condado);
    } else if (address.condado) {
      setCounties([address.condado]);
    }
  };

  const loadExistingClienteContext = async (cliente: Cliente) => {
    setIsLoadingClienteContext(true);
    setError(null);
    try {
      const context = await clientesApi.getContextoPoliza(cliente.id);
      const snapshot = mapClienteWizardContext(context);

      setSelectedExistingCliente(context.cliente);
      setFormData((prev) => ({
        ...prev,
        ...snapshot.personal,
        ingresoAnual: snapshot.ingresoAnual,
        tamanoFamilia: snapshot.tamanoFamilia,
        ...snapshot.address,
      }));
      setConyuge(snapshot.conyuge);
      setDependientes(snapshot.dependientes);

      if (snapshot.address.zipCode.length >= 5) {
        await syncCountiesForZip(snapshot.address.zipCode, snapshot.address.condado);
      } else if (snapshot.address.condado) {
        setCounties([snapshot.address.condado]);
      } else {
        setCounties([]);
      }
    } catch (err) {
      console.error(err);
      applyExistingClienteFallback(cliente);
    } finally {
      setIsLoadingClienteContext(false);
    }
  };

  const handleApplicantModeChange = (mode: ApplicantMode) => {
    setApplicantMode(mode);
    setError(null);
    setSelectedExistingCliente(null);
    resetPersonalForm();
  };

  const buildValidationContacts = () =>
    buildContactEntriesFromWizard({
      applicantMode,
      selectedExistingClienteId: selectedExistingCliente?.id,
      principal: { email: formData.email, ssn: formData.ssn },
      conyuge: conyuge
        ? {
            email: conyuge.email,
            ssn: conyuge.ssn,
            excludeClienteId: conyuge.clienteId ?? undefined,
          }
        : null,
      dependientes: dependientes.map((dep) => ({
        email: dep.email,
        ssn: dep.ssn,
        excludeClienteId: dep.clienteId ?? undefined,
      })),
    });

  const validateDuplicateContacts = async () => {
    setIsCheckingDuplicates(true);
    try {
      return await validateContactsAgainstDatabase(buildValidationContacts());
    } finally {
      setIsCheckingDuplicates(false);
    }
  };

  const isPersonalFormReadOnly = applicantMode === 'existing' && Boolean(selectedExistingCliente);

  const stepsInfo = [
    { id: 1, title: 'Información', subtitle: 'de la póliza' },
    { id: 2, title: 'Información', subtitle: 'Personal' },
    { id: 3, title: 'Grupo', subtitle: 'Familiar' },
    { id: 4, title: 'Dirección', subtitle: '' },
  ];

  // Fetch initial data (agentes)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const data = await agentesApi.list();
        setAgentes(Array.isArray(data) ? data : (data as any).results || []);
      } catch (err) {
        console.error("Error fetching agentes", err);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (step !== 4) return;

    if (formData.zipCode.length < 5) {
      if (formData.condado && counties.length === 0) {
        setCounties([formData.condado]);
      }
      return;
    }

    if (counties.length === 0) {
      void syncCountiesForZip(formData.zipCode, formData.condado);
    }
  }, [step, formData.zipCode, formData.condado, counties.length]);

  const countyOptions = React.useMemo(
    () => mergeCountyOptions(counties, formData.condado),
    [counties, formData.condado]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (checked as any) : value
    }));
  };

  const handleAddConyuge = () => {
    setConyuge(emptyFamilyMember('CONYUGE'));
  };

  const handleRemoveConyuge = () => {
    setConyuge(null);
  };

  const handleAddDependiente = () => {
    setDependientes(prev => [...prev, emptyFamilyMember('DEPENDIENTE')]);
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

  const handleNext = async () => {
    if (step === 1) {
      if (!formData.agenteId || !selectedProductId) {
        setError('Por favor seleccione agente y producto antes de continuar.');
        return;
      }
    }
    if (step === 2) {
      if (applicantMode === 'existing') {
        if (!selectedExistingCliente) {
          setError('Seleccione un cliente existente o cambie a "Cliente nuevo".');
          return;
        }
      } else {
        if (!formData.primerNombre?.trim() || !formData.apellidoPaterno?.trim()) {
          setError('Complete el nombre y apellido del solicitante principal.');
          return;
        }
        if (!formData.fechaNacimiento || !validateDate(formData.fechaNacimiento)) {
          setError('Ingrese una fecha de nacimiento válida para el solicitante principal.');
          return;
        }
        if (!formData.sexo?.trim()) {
          setError('Complete el sexo del solicitante principal.');
          return;
        }
        if (!formData.telefono?.trim()) {
          setError('Complete el teléfono del solicitante principal.');
          return;
        }
        if (!formData.email?.trim()) {
          setError('Complete el correo electrónico del solicitante principal.');
          return;
        }
        if (!formData.ssn?.trim()) {
          setError('Complete el SSN del solicitante principal.');
          return;
        }
      }

      const duplicateError = await validateDuplicateContacts();
      if (duplicateError) {
        setError(duplicateError);
        return;
      }
    }
    if (step === 3) {
      if (!formData.ingresoAnual?.toString().trim()) {
        setError('El ingreso familiar anual es obligatorio.');
        return;
      }
      if (!formData.tamanoFamilia?.toString().trim()) {
        setError('El tamaño del grupo familiar es obligatorio.');
        return;
      }
      const familyError = validateFamilyMembers();
      if (familyError) {
        setError(familyError);
        return;
      }

      const duplicateError = await validateDuplicateContacts();
      if (duplicateError) {
        setError(duplicateError);
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

    const isBlank = [member.primerNombre, member.apellidoPaterno, member.fechaNacimiento].every(value => !value?.toString().trim());
    if (isBlank) {
      return { valid: false, error: `Complete o elimine los datos del ${label} antes de continuar.` };
    }

    const missingFields = [];
    if (!member.primerNombre?.trim()) missingFields.push('primer nombre');
    if (!member.apellidoPaterno?.trim()) missingFields.push('apellido paterno');
    if (!member.fechaNacimiento) missingFields.push('fecha de nacimiento');
    if (member.fechaNacimiento && !validateDate(member.fechaNacimiento)) missingFields.push('fecha de nacimiento válida');
    if (!member.sexo?.trim()) missingFields.push('sexo');

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
    if (applicantMode === 'existing') {
      if (!selectedExistingCliente) {
        setError('Seleccione un cliente existente para continuar.');
        setLoading(false);
        return;
      }
    } else {
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

      if (!formData.sexo?.trim() || !formData.telefono?.trim() || !formData.email?.trim()) {
        setError('Complete el sexo, teléfono y correo del solicitante principal.');
        setLoading(false);
        return;
      }
    }

    if (!formData.ingresoAnual?.toString().trim() || !formData.tamanoFamilia?.toString().trim()) {
      setError('El ingreso anual y tamaño familiar son obligatorios.');
      setLoading(false);
      return;
    }

    const duplicateError = await validateDuplicateContacts();
    if (duplicateError) {
      setError(duplicateError);
      setLoading(false);
      return;
    }

    if (applicantMode === 'existing' && !selectedExistingCliente) {
      setError('Seleccione un cliente existente para continuar.');
      setLoading(false);
      return;
    }

    if (applicantMode === 'new' && !formData.ssn?.trim()) {
      setError('Complete el SSN del solicitante principal.');
      setLoading(false);
      return;
    }

    if (!formData.direccion1?.trim() || !formData.ciudad?.trim() || !formData.estadoProvincia?.trim() || !formData.zipCode?.trim()) {
      setError('La dirección residencial completa (Línea 1, Ciudad, Estado, Código Postal) es obligatoria.');
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

      const createClientPayload = (member: FamilyMember, fallbackPrefix: string, requireContact = false) => ({
        primer_nombre: member.primerNombre,
        segundo_nombre: member.segundoNombre || '',
        apellido_paterno: member.apellidoPaterno,
        apellido_materno: member.apellidoMaterno || '',
        fecha_nacimiento: formatToISO(member.fechaNacimiento),
        genero: member.sexo,
        telefono: requireContact ? member.telefono : (member.telefono?.trim() || null),
        email: requireContact ? member.email : (member.email?.trim() || null),
        estado_civil: 'Desconocido',
        pais_nacimiento: 'Desconocido',
        estado_inmigracion: 'Desconocido',
        ingreso_anual: formData.ingresoAnual || 0,
        usa_tabaco: !!member.usaTabaco,
        peso: member.peso || '',
        estatura: member.estatura || '',
        condicion_medica: member.condicionMedica || '',
        ssn: member.ssn?.trim()
          ? member.ssn.trim()
          : (() => {
              const raw = `TMP-${fallbackPrefix}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6)}`;
              return raw.slice(0, 20);
            })(),
      });

      const resolveMemberClienteId = async (
        member: FamilyMember,
        fallbackPrefix: string,
        requireContact = false,
      ): Promise<number> => {
        if (member.clienteId) return member.clienteId;

        const resMember = await fetch(`${API_BASE_URL}/clientes/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(createClientPayload(member, fallbackPrefix, requireContact)),
        });

        if (!resMember.ok) {
          const txt = await resMember.text();
          throw new Error(`Error al crear cliente (${fallbackPrefix}): ${txt}`);
        }

        const created = await resMember.json();
        return created.id;
      };

      let clientePrincipalId: number;

      if (applicantMode === 'existing' && selectedExistingCliente) {
        clientePrincipalId = selectedExistingCliente.id;
      } else {
        const clientBody = createClientPayload({
          primerNombre: formData.primerNombre,
          segundoNombre: formData.segundoNombre,
          apellidoPaterno: formData.apellidoPaterno,
          apellidoMaterno: formData.apellidoMaterno,
          fechaNacimiento: formData.fechaNacimiento,
          sexo: formData.sexo,
          telefono: formData.telefono,
          email: formData.email,
          ssn: formData.ssn,
          usaTabaco: formData.usaTabaco,
          peso: formData.peso,
          estatura: formData.estatura,
          condicionMedica: formData.condicionMedica,
          relacion: 'PRINCIPAL',
        }, 'cliente', true);

        const resCliente = await fetch(`${API_BASE_URL}/clientes/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(clientBody),
        });

        if (!resCliente.ok) {
          const txt = await resCliente.text();
          console.error('Create client failed:', resCliente.status, txt, clientBody);
          throw new Error('Error al crear el cliente principal: ' + txt);
        }
        const clienteCreado = await resCliente.json();
        clientePrincipalId = clienteCreado.id;
      }

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
          cliente: clientePrincipalId,
          es_solicitante_principal: true,
          relacion: 'PRINCIPAL',
          direccion_residencia: direccionCreada.id,
        },
      ];

      if (conyuge && conyuge.primerNombre && conyuge.apellidoPaterno) {
        const conyugeId = await resolveMemberClienteId(conyuge, 'conyuge');

        clientes_data.push({
          cliente: conyugeId,
          es_solicitante_principal: false,
          relacion: conyuge.relacion || 'CONYUGE',
          direccion_residencia: direccionCreada.id,
        });
      }

      for (const [index, dep] of dependientes.entries()) {
        if (!dep.primerNombre || !dep.apellidoPaterno) continue;
        const depId = await resolveMemberClienteId(dep, `dependiente-${index}`);

        clientes_data.push({
          cliente: depId,
          es_solicitante_principal: false,
          relacion: dep.relacion || 'DEPENDIENTE',
          direccion_residencia: direccionCreada.id,
        });
      }

      const polizaBody = {
        agente: formData.agenteId || null,
        fecha_efectiva: formatToISO(formData.fechaEfectividad),
        id_mercado: `QUOTE-${Date.now()}`,
        id_miembro: 'Pendiente',
        tipo_producto: selectedProductId,
        costo_poliza: 0,
        subsidio: 0,
        prima_mensual: 0,
        fecha_envio: formatToISO(new Date()),
        direccion_fisica: direccionCreada.id,
        total_miembros: Number(formData.tamanoFamilia) || clientes_data.length,
        total_aplicantes: clientes_data.filter((item) => item.es_solicitante_principal).length || 1,
        total_dependientes: clientes_data.filter((item) => !item.es_solicitante_principal).length,
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
    <div className="app-page w-full h-full flex flex-col overflow-auto bg-[#f8fafc] dark:bg-[#0f172a]">
      <header className="px-[30px] md:px-[40px] py-[20px] bg-white dark:bg-[#1e293b] border-b border-[#e2e8f0] dark:border-[#334155] shadow-sm flex items-center gap-[16px]">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f1f5f9] dark:hover:bg-[#334155] dark:bg-[#1e293b] text-[#64748b] dark:text-gray-400">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-[20px] font-bold text-[#0f172a] dark:text-white m-0">Registro de Nueva Póliza</h2>
        </div>
      </header>

      {/* Progress Bar Container */}
      <div className="w-full bg-[#f8fafc] dark:bg-[#0f172a] py-[24px] px-[30px] md:px-[40px] flex justify-center overflow-x-auto">
        <div className="w-full max-w-5xl flex items-center justify-between min-w-[700px]">
          {stepsInfo.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className="flex items-center gap-[12px] shrink-0">
                <div className={`w-[40px] h-[40px] rounded-[10px] flex items-center justify-center text-[16px] font-bold ${step >= s.id ? 'bg-[#4f46e5] text-white' : 'bg-[#e2e8f0] text-[#64748b] dark:text-gray-400'}`}>
                  {s.id}
                </div>
                <div className="flex flex-col">
                  <span className={`text-[14px] font-bold leading-tight ${step >= s.id ? 'text-[#0f172a] dark:text-white' : 'text-[#64748b] dark:text-gray-400'}`}>{s.title}</span>
                  {s.subtitle && <span className={`text-[14px] font-bold leading-tight ${step >= s.id ? 'text-[#0f172a] dark:text-white' : 'text-[#64748b] dark:text-gray-400'}`}>{s.subtitle}</span>}
                </div>
              </div>
              {idx < stepsInfo.length - 1 && (
                <div className={`flex-1 h-[2px] mx-[16px] md:mx-[24px] ${step > s.id ? 'bg-[#4f46e5]' : 'bg-[#e2e8f0]'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full p-[30px] md:p-[40px]">
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()}>
          {step === 1 && (
            <div className="space-y-[30px] animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h3 className="text-[18px] font-bold text-[#0f172a] dark:text-white border-b border-[#e2e8f0] dark:border-[#334155] pb-[10px]">1. Información de Póliza</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Fecha de Efectividad</label>
                  <input
                    type="date"
                    name="fechaEfectividad"
                    value={formData.fechaEfectividad}
                    onChange={handleChange}
                    className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] text-[#0f172a] dark:text-white bg-white dark:bg-[#1e293b] focus:ring-2 focus:ring-[#4f46e5] outline-none"
                  />
                </div>
                
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Agente Registrado *</label>
                  <select
                    name="agenteId"
                    value={formData.agenteId}
                    onChange={handleChange}
                    className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] text-[#0f172a] dark:text-white bg-white dark:bg-[#1e293b] focus:ring-2 focus:ring-[#4f46e5] outline-none"
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
                <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200 flex items-center gap-1">
                  Select a product a quote <span className="text-red-500 font-normal text-sm">(required)</span>
                </label>
                <div className="bg-white dark:bg-[#1e293b] border border-[#e2e8f0] dark:border-[#334155] p-4 rounded-xl shadow-sm">
                  <ProductSelection
                    onSelect={handleProductSelect}
                    selectedProductId={selectedProductId}
                  />
                </div>
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
              <h3 className="text-[18px] font-bold text-[#0f172a] dark:text-white border-b border-[#e2e8f0] dark:border-[#334155] pb-[10px]">2. Información Personal</h3>

              <div className="flex flex-col gap-3">
                <p className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Tipo de solicitante</p>
                <div className="inline-flex rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] p-1 bg-white dark:bg-[#1e293b] w-fit">
                  <button
                    type="button"
                    onClick={() => handleApplicantModeChange('new')}
                    className={`px-4 py-2 text-[13px] font-semibold rounded-[8px] transition-colors ${
                      applicantMode === 'new'
                        ? 'bg-[#4f46e5] text-white'
                        : 'text-[#64748b] dark:text-gray-400 hover:text-[#0f172a] dark:hover:text-white'
                    }`}
                  >
                    Cliente nuevo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplicantModeChange('existing')}
                    className={`px-4 py-2 text-[13px] font-semibold rounded-[8px] transition-colors ${
                      applicantMode === 'existing'
                        ? 'bg-[#4f46e5] text-white'
                        : 'text-[#64748b] dark:text-gray-400 hover:text-[#0f172a] dark:hover:text-white'
                    }`}
                  >
                    Cliente existente
                  </button>
                </div>
              </div>

              {applicantMode === 'existing' ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-[8px]">
                    <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Buscar cliente</label>
                    <ClienteCombobox
                      value={selectedExistingCliente}
                      disabled={isLoadingClienteContext}
                      onChange={(cliente) => {
                        if (cliente) {
                          void loadExistingClienteContext(cliente);
                        } else {
                          setSelectedExistingCliente(null);
                          resetPersonalForm();
                        }
                      }}
                      placeholder="Nombre, email, teléfono o SSN..."
                    />
                    {isLoadingClienteContext ? (
                      <p className="text-xs text-[#64748b] dark:text-gray-400">Cargando información del cliente...</p>
                    ) : null}
                  </div>

                  {selectedExistingCliente ? (
                    <div className="rounded-[12px] border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/20 p-4">
                      <p className="text-[13px] font-semibold text-emerald-800 dark:text-emerald-200 mb-1">Cliente seleccionado</p>
                      <p className="text-[14px] font-medium text-[#0f172a] dark:text-white">
                        {getClienteDisplayName(selectedExistingCliente)}
                      </p>
                      <p className="text-[12px] text-[#64748b] dark:text-gray-400 mt-1">
                        {[selectedExistingCliente.email, selectedExistingCliente.telefono, selectedExistingCliente.ssn]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Primer Nombre</label>
                  <input type="text" name="primerNombre" value={formData.primerNombre} onChange={handleChange} readOnly={isPersonalFormReadOnly} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5] read-only:bg-[#f1f5f9] dark:read-only:bg-[#0f172a]" />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Segundo Nombre</label>
                  <input type="text" name="segundoNombre" value={formData.segundoNombre} onChange={handleChange} readOnly={isPersonalFormReadOnly} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5] read-only:bg-[#f1f5f9] dark:read-only:bg-[#0f172a]" />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Apellido Paterno</label>
                  <input type="text" name="apellidoPaterno" value={formData.apellidoPaterno} onChange={handleChange} readOnly={isPersonalFormReadOnly} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5] read-only:bg-[#f1f5f9] dark:read-only:bg-[#0f172a]" />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Apellido Materno</label>
                  <input type="text" name="apellidoMaterno" value={formData.apellidoMaterno} onChange={handleChange} readOnly={isPersonalFormReadOnly} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5] read-only:bg-[#f1f5f9] dark:read-only:bg-[#0f172a]" />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Fecha de Nacimiento</label>
                  <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} readOnly={isPersonalFormReadOnly} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5] read-only:bg-[#f1f5f9] dark:read-only:bg-[#0f172a]" />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Sexo</label>
                  <select name="sexo" value={formData.sexo} onChange={handleChange} disabled={isPersonalFormReadOnly} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5] bg-white dark:bg-[#1e293b] text-[#0f172a] dark:text-white disabled:bg-[#f1f5f9] dark:disabled:bg-[#0f172a]">
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                  </select>
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Teléfono *</label>
                  <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} readOnly={isPersonalFormReadOnly} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5] read-only:bg-[#f1f5f9] dark:read-only:bg-[#0f172a]" />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Correo Electrónico *</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} readOnly={isPersonalFormReadOnly} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5] read-only:bg-[#f1f5f9] dark:read-only:bg-[#0f172a]" />
                </div>
                {applicantMode === 'new' ? (
                  <div className="flex flex-col gap-[8px]">
                    <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">SSN *</label>
                    <input type="text" name="ssn" value={formData.ssn} onChange={handleChange} placeholder="XXX-XX-XXXX" className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                  </div>
                ) : null}
              </div>

              <div className="border border-[#e2e8f0] dark:border-[#334155] rounded-[12px] p-[20px] bg-white dark:bg-[#1e293b] space-y-[16px]">
                <h4 className="text-[14px] font-bold text-[#0f172a] dark:text-white">Detalles Clínicos & Estatus</h4>
                
                <div className="flex items-center gap-[12px]">
                  <input type="checkbox" id="esAplicante" name="esAplicante" checked={formData.esAplicante} onChange={handleChange} disabled={isPersonalFormReadOnly} className="w-5 h-5 rounded text-[#4f46e5] focus:ring-[#4f46e5]" />
                  <label htmlFor="esAplicante" className="text-[14px] font-medium text-[#334155] dark:text-gray-200">Este miembro es un aplicante principal</label>
                </div>

                <div className="flex items-center gap-[12px]">
                  <input type="checkbox" id="usaTabaco" name="usaTabaco" checked={formData.usaTabaco} onChange={handleChange} disabled={isPersonalFormReadOnly} className="w-5 h-5 rounded text-[#4f46e5] focus:ring-[#4f46e5]" />
                  <label htmlFor="usaTabaco" className="text-[14px] font-medium text-[#334155] dark:text-gray-200">¿Usa Tabaco?</label>
                </div>

                <div className="grid grid-cols-2 gap-[24px]">
                  <div className="flex flex-col gap-[8px]">
                    <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Peso</label>
                    <input type="text" name="peso" placeholder="Ej. 75 kg" value={formData.peso} onChange={handleChange} readOnly={isPersonalFormReadOnly} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5] read-only:bg-[#f1f5f9] dark:read-only:bg-[#0f172a]" />
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Estatura</label>
                    <input type="text" name="estatura" placeholder="Ej. 1.75 m" value={formData.estatura} onChange={handleChange} readOnly={isPersonalFormReadOnly} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5] read-only:bg-[#f1f5f9] dark:read-only:bg-[#0f172a]" />
                  </div>
                </div>

                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Condición Médica</label>
                  <textarea name="condicionMedica" value={formData.condicionMedica} onChange={handleChange} readOnly={isPersonalFormReadOnly} className="min-h-[100px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] p-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5] resize-y read-only:bg-[#f1f5f9] dark:read-only:bg-[#0f172a]" />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button onClick={handleBack} className="text-[#64748b] dark:text-gray-400 hover:text-[#0f172a] dark:text-white py-[10px] px-[20px] font-semibold text-[14px]">
                  Atrás
                </button>
                <button onClick={handleNext} disabled={isCheckingDuplicates} className="bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-60 text-white py-[10px] px-[24px] text-[14px] font-semibold rounded-[10px] shadow-sm flex items-center gap-2">
                  {isCheckingDuplicates ? 'Validando...' : 'Siguiente Paso'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-[30px] animate-in fade-in slide-in-from-right-8 duration-300">
              <h3 className="text-[18px] font-bold text-[#0f172a] dark:text-white border-b border-[#e2e8f0] dark:border-[#334155] pb-[10px]">3. Grupo Familiar</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Ingreso Familiar Anual</label>
                  <input type="number" name="ingresoAnual" value={formData.ingresoAnual} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                </div>
                <div className="flex flex-col gap-[8px]">
                  <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Tamaño del Grupo Familiar</label>
                  <input type="number" name="tamanoFamilia" value={formData.tamanoFamilia} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                </div>
              </div>

              {/* Conyuge & Dependientes placeholders for UI layout */}
              <div className="flex flex-col gap-[16px]">
                <div className="flex flex-wrap gap-[16px]">
                  {!conyuge ? (
                    <button type="button" onClick={handleAddConyuge} className="border border-[#cbd5e1] dark:border-[#475569] text-[#4f46e5] bg-white dark:bg-[#1e293b] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] dark:bg-[#0f172a] py-[10px] px-[20px] text-[13px] font-semibold rounded-[10px] shadow-sm flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Añadir Cónyuge
                    </button>
                  ) : (
                    <button type="button" onClick={handleRemoveConyuge} className="border border-red-200 text-red-600 bg-white dark:bg-[#1e293b] hover:bg-red-50 py-[10px] px-[20px] text-[13px] font-semibold rounded-[10px] shadow-sm flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Eliminar Cónyuge
                    </button>
                  )}

                  <button type="button" onClick={handleAddDependiente} className="border border-[#cbd5e1] dark:border-[#475569] text-[#4f46e5] bg-white dark:bg-[#1e293b] hover:bg-[#f8fafc] dark:hover:bg-[#0f172a] dark:bg-[#0f172a] py-[10px] px-[20px] text-[13px] font-semibold rounded-[10px] shadow-sm flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Añadir Dependiente
                  </button>
                </div>

                {conyuge && (
                  <div className="border border-[#cbd5e1] dark:border-[#475569] rounded-[12px] p-[20px] bg-white dark:bg-[#1e293b] space-y-[16px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[14px] font-bold text-[#0f172a] dark:text-white">Cónyuge</h4>
                        <p className="text-[12px] text-[#64748b] dark:text-gray-400">Información de cónyuge vinculada a la cotización.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Primer Nombre</label>
                        <input type="text" value={conyuge.primerNombre} onChange={(e) => handleConyugeChange('primerNombre', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Apellido Paterno</label>
                        <input type="text" value={conyuge.apellidoPaterno} onChange={(e) => handleConyugeChange('apellidoPaterno', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Apellido Materno</label>
                        <input type="text" value={conyuge.apellidoMaterno} onChange={(e) => handleConyugeChange('apellidoMaterno', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Fecha de Nacimiento</label>
                        <input type="date" value={conyuge.fechaNacimiento} onChange={(e) => handleConyugeChange('fechaNacimiento', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Sexo</label>
                        <select value={conyuge.sexo} onChange={(e) => handleConyugeChange('sexo', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5] bg-white dark:bg-[#1e293b] text-[#0f172a] dark:text-white">
                          <option value="Masculino">Masculino</option>
                          <option value="Femenino">Femenino</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Teléfono (opcional)</label>
                        <input type="text" value={conyuge.telefono} onChange={(e) => handleConyugeChange('telefono', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Correo Electrónico (opcional)</label>
                        <input type="email" value={conyuge.email} onChange={(e) => handleConyugeChange('email', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">SSN (opcional)</label>
                        <input type="text" value={conyuge.ssn} onChange={(e) => handleConyugeChange('ssn', e.target.value)} placeholder="XXX-XX-XXXX" className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                    </div>
                  </div>
                )}

                {dependientes.length > 0 && dependientes.map((dep, index) => (
                  <div key={index} className="border border-[#cbd5e1] dark:border-[#475569] rounded-[12px] p-[20px] bg-white dark:bg-[#1e293b] space-y-[16px]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[14px] font-bold text-[#0f172a] dark:text-white">Dependiente {index + 1}</h4>
                        <p className="text-[12px] text-[#64748b] dark:text-gray-400">Información del familiar para la cotización.</p>
                      </div>
                      <button type="button" onClick={() => handleRemoveDependiente(index)} className="border border-red-200 text-red-600 bg-white dark:bg-[#1e293b] hover:bg-red-50 py-[10px] px-[20px] text-[13px] font-semibold rounded-[10px] shadow-sm flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Eliminar Dependiente
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Primer Nombre</label>
                        <input type="text" value={dep.primerNombre} onChange={(e) => handleDependienteChange(index, 'primerNombre', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Apellido Paterno</label>
                        <input type="text" value={dep.apellidoPaterno} onChange={(e) => handleDependienteChange(index, 'apellidoPaterno', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Apellido Materno</label>
                        <input type="text" value={dep.apellidoMaterno} onChange={(e) => handleDependienteChange(index, 'apellidoMaterno', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Fecha de Nacimiento</label>
                        <input type="date" value={dep.fechaNacimiento} onChange={(e) => handleDependienteChange(index, 'fechaNacimiento', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Sexo</label>
                        <select value={dep.sexo} onChange={(e) => handleDependienteChange(index, 'sexo', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5] bg-white dark:bg-[#1e293b] text-[#0f172a] dark:text-white">
                          <option value="Masculino">Masculino</option>
                          <option value="Femenino">Femenino</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Teléfono (opcional)</label>
                        <input type="text" value={dep.telefono} onChange={(e) => handleDependienteChange(index, 'telefono', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Correo Electrónico (opcional)</label>
                        <input type="email" value={dep.email} onChange={(e) => handleDependienteChange(index, 'email', e.target.value)} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                      <div className="flex flex-col gap-[8px]">
                        <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">SSN (opcional)</label>
                        <input type="text" value={dep.ssn} onChange={(e) => handleDependienteChange(index, 'ssn', e.target.value)} placeholder="XXX-XX-XXXX" className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button onClick={handleBack} className="text-[#64748b] dark:text-gray-400 hover:text-[#0f172a] dark:text-white py-[10px] px-[20px] font-semibold text-[14px]">
                  Atrás
                </button>
                <button onClick={handleNext} disabled={isCheckingDuplicates} className="bg-[#4f46e5] hover:bg-[#4338ca] disabled:opacity-60 text-white py-[10px] px-[24px] text-[14px] font-semibold rounded-[10px] shadow-sm flex items-center gap-2">
                  {isCheckingDuplicates ? 'Validando...' : 'Siguiente Paso'} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-[30px] animate-in fade-in slide-in-from-right-8 duration-300">
              <h3 className="text-[18px] font-bold text-[#0f172a] dark:text-white border-b border-[#e2e8f0] dark:border-[#334155] pb-[10px]">4. Dirección</h3>

              <div className="border border-[#e2e8f0] dark:border-[#334155] rounded-[12px] p-[20px] bg-[#f8fafc] dark:bg-[#0f172a] space-y-[16px]">
                <h4 className="text-[14px] font-bold text-[#0f172a] dark:text-white">Dirección Residencial</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
                  <div className="flex flex-col gap-[8px] md:col-span-2">
                    <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Línea de Dirección 1</label>
                    <input type="text" name="direccion1" value={formData.direccion1} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                  </div>
                  <div className="flex flex-col gap-[8px] md:col-span-2">
                    <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Línea de Dirección 2 (opcional)</label>
                    <input type="text" name="direccion2" value={formData.direccion2} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Código Postal</label>
                    <input type="text" name="zipCode" value={formData.zipCode} onChange={handleZipChange} placeholder="Ingrese Zip Code..." className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5]" />
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Ciudad</label>
                    <input type="text" name="ciudad" value={formData.ciudad} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5] bg-[#f1f5f9] dark:bg-[#1e293b]" readOnly={formData.zipCode.length === 5} />
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Estado</label>
                    <input type="text" name="estadoProvincia" value={formData.estadoProvincia} onChange={handleChange} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5] bg-[#f1f5f9] dark:bg-[#1e293b]" readOnly={formData.zipCode.length === 5} />
                  </div>
                  <div className="flex flex-col gap-[8px]">
                    <label className="text-[13px] font-semibold text-[#334155] dark:text-gray-200">Condado</label>
                    <select name="condado" value={formData.condado} onChange={handleChange} disabled={!countyOptions.length} className="h-[44px] rounded-[10px] border border-[#cbd5e1] dark:border-[#475569] px-[14px] text-[14px] outline-none focus:ring-2 focus:ring-[#4f46e5] bg-white dark:bg-[#1e293b] text-[#0f172a] dark:text-white disabled:opacity-50">
                      <option value="">Seleccione Condado...</option>
                      {countyOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button onClick={handleBack} className="text-[#64748b] dark:text-gray-400 hover:text-[#0f172a] dark:text-white py-[10px] px-[20px] font-semibold text-[14px]">
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