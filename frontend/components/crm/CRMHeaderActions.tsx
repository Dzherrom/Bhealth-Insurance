'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
  ExternalLink,
  Globe,
  LogIn,
  LogOut,
  Plus,
  Receipt,
  ShieldPlus,
  UserPlus,
  Users,
  BookOpen,
  Home,
  Briefcase,
  FileText,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuthStore } from '@/store/authStore';
import { CrearClienteModal } from './CrearClienteModal';
import { cn } from '@/lib/utils';

const HEALTHCARE_LINKS = [
  {
    id: 'login',
    label: 'Iniciar sesión',
    description: 'Ingresa a tu cuenta en HealthCare.gov desde la página de inicio de sesión',
    href: 'https://www.healthcare.gov/login',
    icon: LogIn,
  },
  {
    id: 'home',
    label: 'Página de inicio',
    description: 'Visita el sitio web principal de HealthCare.gov',
    href: 'https://www.healthcare.gov/',
    icon: Home,
  },
  {
    id: 'agents-hc',
    label: 'Para agentes y corredores',
    description: 'Recursos de HealthCare.gov para agentes y corredores de seguros',
    href: 'https://www.healthcare.gov/marketplace/agents-brokers/',
    icon: Users,
  },
  {
    id: 'agents-cms',
    label: 'Recursos CMS para agentes',
    description: 'Portal oficial de CMS con herramientas, capacitación y noticias',
    href: 'https://www.cms.gov/marketplace/agents-brokers/resources',
    icon: Briefcase,
  },
  {
    id: 'taxes-main',
    label: 'Información fiscal y 1095-A',
    description: 'Consulta documentos fiscales e información sobre el Formulario 1095-A',
    href: 'https://www.healthcare.gov/taxes/',
    icon: Receipt,
  },
  {
    id: 'taxes-1095',
    label: 'Detalle del Formulario 1095-A',
    description: 'Información específica sobre el Formulario 1095-A',
    href: 'https://www.healthcare.gov/tax-form-1095-a/about-form-1095-a/',
    icon: FileText,
  },
  {
    id: 'pay-enroll',
    label: '¿Cómo pagar tu prima?',
    description: 'Aprende cómo completar tu inscripción y realizar el pago mensual',
    href: 'https://www.healthcare.gov/apply-and-enroll/complete-your-enrollment/',
    icon: CreditCard,
  },
  {
    id: 'pay-payments',
    label: 'Pagos de prima',
    description: 'Guía adicional sobre pagos mensuales y métodos disponibles',
    href: 'https://www.healthcare.gov/payments/your-premium-payment/',
    icon: BookOpen,
  },
] as const;

function SectionLabel({
  icon: Icon,
  label,
  tone = 'light',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone?: 'light' | 'dark';
}) {
  const isDark = tone === 'dark';
  return (
    <div className="mb-3 flex shrink-0 items-center gap-2">
      <span
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-md',
          isDark ? 'bg-sky-950/60' : 'bg-[#eef2ff] dark:bg-indigo-950/60',
        )}
      >
        <Icon className={cn('h-3.5 w-3.5', isDark ? 'text-sky-300' : 'text-[#4f46e5] dark:text-indigo-300')} />
      </span>
      <h3
        className={cn(
          'text-[11px] font-semibold uppercase tracking-[0.08em]',
          isDark ? 'text-slate-400' : 'text-[#64748b] dark:text-slate-400',
        )}
      >
        {label}
      </h3>
    </div>
  );
}

function HealthcareResourceLink({
  href,
  label,
  description,
  icon: Icon,
}: {
  href: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#334155]/80 ring-1 ring-white/5">
        <Icon className="h-4 w-4 text-indigo-300" />
      </span>
      <span className="min-w-0 flex-1 pt-0.5">
        <span className="flex items-start justify-between gap-2">
          <span className="text-[13px] font-medium leading-snug text-white">{label}</span>
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-400">{description}</span>
      </span>
    </a>
  );
}

export function CRMHeaderActions() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const logout = useAuthStore((state) => state.logout);
  const [clienteModalOpen, setClienteModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/auth/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || 'Usuario';
  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'U';
  const npn = user?.profile?.agente_npn || user?.profile?.npn;
  const ffm = user?.profile?.agente_ffm;
  const profileHref = user?.id ? `/crm/users/${user.id}` : null;

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              className="h-9 gap-1.5 bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Crear
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-1.5">
            <DropdownMenuItem
              className="gap-2.5 py-2.5 cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                setClienteModalOpen(true);
              }}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300">
                <UserPlus className="w-4 h-4" />
              </span>
              <div className="flex flex-col">
                <span className="font-medium">Nuevo cliente</span>
                <span className="text-xs text-muted-foreground">Registrar persona en el CRM</span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="gap-2.5 py-2.5 cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                router.push('/crm/polizas/nueva');
              }}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300">
                <ShieldPlus className="w-4 h-4" />
              </span>
              <div className="flex flex-col">
                <span className="font-medium">Nueva póliza</span>
                <span className="text-xs text-muted-foreground">Iniciar cotización o venta</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1.5 border-[#e2e8f0] dark:border-[#475569] bg-white dark:bg-[#1e293b] font-semibold text-[#0f172a] dark:text-white hover:bg-[#f8fafc] dark:hover:bg-[#334155]"
            >
              <Globe className="w-4 h-4 text-[#4f46e5]" />
              Recursos
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="w-[640px] max-w-[calc(100vw-2rem)] p-0 overflow-hidden rounded-xl border border-[#e2e8f0] dark:border-[#334155] shadow-xl"
          >
            <div className="grid grid-cols-[220px_minmax(0,1fr)]">
              {/* Mi portal */}
              <div className="border-r border-[#e2e8f0] dark:border-[#334155] bg-[#f8fafc] dark:bg-[#0f172a]/80 p-4">
                <SectionLabel icon={Users} label="Mi portal" />
                <div className="rounded-xl border border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] p-3.5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] dark:bg-indigo-950 text-sm font-bold text-[#4f46e5] dark:text-indigo-200">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#0f172a] dark:text-white">{displayName}</p>
                      <p className="truncate text-xs text-[#64748b] dark:text-slate-400">{user?.email || '—'}</p>
                    </div>
                  </div>

                  {role ? (
                    <span className="mt-3 inline-flex rounded-full bg-[#eff6ff] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#2563eb] dark:bg-blue-950/80 dark:text-blue-300">
                      {role}
                    </span>
                  ) : null}

                  {(npn || ffm) && (
                    <div className="mt-3 space-y-1.5 border-t border-[#f1f5f9] dark:border-[#334155] pt-3">
                      {npn ? (
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-[#64748b] dark:text-slate-400">NPN</span>
                          <span className="truncate font-medium text-[#0f172a] dark:text-slate-200">{npn}</span>
                        </div>
                      ) : null}
                      {ffm ? (
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="text-[#64748b] dark:text-slate-400">FFM</span>
                          <span className="truncate font-medium text-[#0f172a] dark:text-slate-200">{ffm}</span>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {profileHref ? (
                    <Link
                      href={profileHref}
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#4f46e5] hover:text-[#4338ca] dark:text-indigo-300 dark:hover:text-indigo-200"
                    >
                      Ver mi perfil
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : null}

                  <div className="mt-3 border-t border-[#f1f5f9] dark:border-[#334155] pt-3">
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:text-red-400 dark:hover:bg-red-950/40"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      {isLoggingOut ? 'Cerrando...' : 'Cerrar sesión'}
                    </button>
                  </div>
                </div>
              </div>

              {/* HealthCare.gov */}
              <div className="flex min-w-0 flex-col bg-[#1e293b] p-4">
                <SectionLabel icon={Globe} label="HealthCare.gov" tone="dark" />
                <div className="max-h-[300px] min-h-0 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:#475569_transparent]">
                  <div className="divide-y divide-white/[0.06]">
                    {HEALTHCARE_LINKS.map((link) => (
                      <HealthcareResourceLink key={link.id} {...link} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CrearClienteModal open={clienteModalOpen} onOpenChange={setClienteModalOpen} />
    </>
  );
}
