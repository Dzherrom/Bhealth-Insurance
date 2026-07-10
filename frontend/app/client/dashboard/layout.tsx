'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { canAccessClientPortal, getClientDashboardPath } from '@/lib/portalAccess';
import { getHomePathForUser } from '@/lib/routing';
import { clientLight } from '@/components/client/dashboard/constants';

export default function ClientDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { logout, user, role, isAuthenticated, hasHydrated } = useAuthStore();

  useEffect(() => {
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.replace('/client');
      return;
    }

    const allowed = canAccessClientPortal({
      role,
      profileRole: user?.profile?.role,
      profileClienteId: user?.profile?.cliente,
    });

    if (allowed) return;

    const destination = getHomePathForUser(role, user);
    if (destination && destination !== getClientDashboardPath()) {
      router.replace(destination);
      return;
    }

    router.replace('/client');
  }, [hasHydrated, isAuthenticated, role, user, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/client');
  };

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-slate-600">
        Cargando portal...
      </div>
    );
  }

  return (
    <div className="light min-h-screen bg-[#f8fafc] text-slate-900" style={{ colorScheme: 'light' }}>
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

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className={`shrink-0 ${clientLight.outlineButton} hover:!border-emerald-300 hover:!text-emerald-700`}
          >
            <LogOut className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Salir</span>
          </Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 min-w-0">{children}</main>
    </div>
  );
}
