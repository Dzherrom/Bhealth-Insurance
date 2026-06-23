'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

function getInitials(firstName?: string, lastName?: string, email?: string) {
  const first = firstName?.trim()?.[0] || '';
  const last = lastName?.trim()?.[0] || '';
  if (first || last) return `${first}${last}`.toUpperCase();
  return (email?.[0] || 'C').toUpperCase();
}

export default function ClientDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/client');
  };

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'Cliente';
  const initials = getInitials(user?.first_name, user?.last_name, user?.email);

  return (
    <div className="light min-h-screen bg-[#f8fafc] text-slate-900">
      <header className="sticky top-0 z-30 bg-white border-b border-[#e2e8f0] shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
              <Heart className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[#0f172a] truncate leading-tight">BHealth Insurance</p>
              <p className="text-[11px] font-medium text-[#64748b] uppercase tracking-wide">Portal del cliente</p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-3 rounded-xl border border-[#e2e8f0] bg-white px-3 py-2 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-sm font-bold text-white shadow-inner">
                {initials}
              </div>
              <div className="min-w-0 pr-1">
                <p className="text-sm font-semibold text-[#0f172a] truncate max-w-[160px]">{displayName}</p>
                <p className="text-xs text-[#64748b] truncate max-w-[160px]">{user?.email || 'Cuenta verificada'}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="border-[#e2e8f0] bg-white text-[#334155] hover:bg-[#f8fafc] hover:border-emerald-300 hover:text-emerald-700 transition-all"
            >
              <LogOut className="h-4 w-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  );
}
