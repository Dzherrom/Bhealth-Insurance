'use client';

import Image from 'next/image';
import { ReactNode } from 'react';

export type LoginVariant = 'employee' | 'client';

interface SplitLoginLayoutProps {
  variant: LoginVariant;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

const VARIANTS = {
  employee: {
    panelClass: 'bg-gradient-to-br from-[#1e3a8a] via-[#312e81] to-[#4338ca]',
    accentClass: 'text-indigo-100',
    badgeClass: 'bg-indigo-500/30 text-indigo-50',
    formBg: 'bg-[#f8fafc]',
    imageSrc: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Equipo profesional de seguros de salud',
  },
  client: {
    panelClass: 'bg-gradient-to-br from-[#047857] via-[#059669] to-[#10b981]',
    accentClass: 'text-emerald-100',
    badgeClass: 'bg-emerald-500/30 text-emerald-50',
    formBg: 'bg-[#f8fafc]',
    imageSrc: 'https://images.unsplash.com/photo-1631217868264-e5bccd8575d8?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Familia protegida con seguro de salud',
  },
} as const;

export default function SplitLoginLayout({
  variant,
  title,
  subtitle,
  children,
  footer,
}: SplitLoginLayoutProps) {
  const config = VARIANTS[variant];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Panel visual */}
      <div className={`relative hidden lg:flex lg:w-1/2 ${config.panelClass} text-white overflow-hidden`}>
        <Image
          src={config.imageSrc}
          alt={config.imageAlt}
          fill
          priority
          className="object-cover opacity-30 mix-blend-overlay"
          sizes="50vw"
        />
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 py-16 max-w-xl">
          <span className={`inline-flex w-fit px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-6 ${config.badgeClass}`}>
            BHealth Insurance
          </span>
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">{title}</h1>
          <p className={`text-lg ${config.accentClass} leading-relaxed`}>{subtitle}</p>
        </div>
      </div>

      {/* Formulario */}
      <div className={`flex-1 flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-16 ${config.formBg}`}>
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-2xl font-bold text-[#0f172a]">{title}</h1>
            <p className="text-sm text-[#64748b] mt-2">{subtitle}</p>
          </div>
          {children}
          {footer}
        </div>
      </div>
    </div>
  );
}
