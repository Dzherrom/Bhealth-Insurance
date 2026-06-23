'use client';

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';

export default function ClientDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/client');
  };

  return (
    <div className="min-h-screen bg-[#ecfdf5]">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-emerald-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Heart className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="font-bold text-[#065f46] truncate">BHealth · Portal Cliente</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline text-sm text-[#64748b] truncate max-w-[180px]">
              {user?.first_name} {user?.last_name}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout} className="border-emerald-200 text-emerald-800">
              <LogOut className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">{children}</main>
    </div>
  );
}
