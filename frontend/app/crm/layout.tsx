'use client';

import { useEffect, useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/sidebar";
import SidebarCRM from "@/components/sidebar/sidebarCRM";
import CRMNotificationButton from "@/components/configuraciones/CRMNotificationButton";
import { CatalogoProvider } from "@/components/providers";
import { useAuthStore } from "@/store/authStore";
import { canAccessClientPortal, getClientDashboardPath, getPortalAuthSnapshot } from "@/lib/portalAccess";
import { useLanguageStore } from "@/store/languageStore";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, Languages } from "lucide-react";

interface CRMLayoutProps {
  children: React.ReactNode;
}

export default function CRMLayout({ children }: CRMLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const role = useAuthStore((state) => state.role);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const { language, toggleLanguage } = useLanguageStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || pathname === '/crm') return;

    const snapshot = getPortalAuthSnapshot({
      role,
      profileRole: user?.profile?.role,
      profileClienteId: user?.profile?.cliente,
    });

    if (canAccessClientPortal(snapshot)) {
      window.location.replace(getClientDashboardPath());
    }
  }, [isAuthenticated, role, user, pathname]);

  // No mostrar sidebar en la página principal de CRM (login)
  const showSidebar = pathname !== '/crm';

  const handleSidebarNavigation = (item: any) => {
    if (item.href) {
      router.push(item.href);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/auth/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Si no necesitamos sidebar (página de login), renderizar solo children
  if (!showSidebar) {
    return <>{children}</>;
  }

  // Layout con sidebar para páginas internas del CRM
  return (
    <CatalogoProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden">
          <SidebarCRM
            onItemClick={handleSidebarNavigation}
            onLogout={handleLogout}
            isLoggingOut={isLoggingOut}
          />
          <SidebarInset className="relative z-0 flex-1 overflow-hidden bg-[#f8fafc] dark:bg-[#0f172a]">
            <div className="flex h-16 shrink-0 items-center gap-2 px-6 justify-between border-b border-[#e2e8f0] dark:border-[#334155] bg-white dark:bg-[#1e293b] dark:border-[#334155]">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* <SidebarTrigger className="ml-1" /> */}
                <h1 className="text-xl font-bold text-[#0f172a] dark:text-white truncate">CRM - BHealth Insurance</h1>
              </div>
              
              <div className="flex items-center gap-4">
                {mounted && (
                  <>
                    <button
                      onClick={() => toggleLanguage()}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200"
                    >
                      <Languages className="w-4 h-4" />
                      {language === 'es' ? 'ES' : 'EN'}
                    </button>
                    
                    <button
                      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
                    >
                      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto crm-content">
              {children}
            </div>

            <CRMNotificationButton
              variant="floating"
              position="bottom-right"
              size="md"
              className="bg-blue-600 hover:bg-blue-700"
            />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </CatalogoProvider>
  );
}