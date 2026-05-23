'use client';

import { useState } from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/sidebar";
import SidebarCRM from "@/components/sidebar/sidebarCRM";
import CRMNotificationButton from "@/components/configuraciones/CRMNotificationButton";
import { CatalogoProvider } from "@/components/providers";
import { useAuthStore } from "@/store/authStore";
import { useRouter, usePathname } from "next/navigation";

interface CRMLayoutProps {
  children: React.ReactNode;
}

export default function CRMLayout({ children }: CRMLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
          <SidebarInset className="flex-1 overflow-hidden">
            <div className="flex h-16 shrink-0 items-center gap-2 px-4 pt-2 justify-between border-b">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* <SidebarTrigger className="ml-1" /> */}
                <h1 className="text-xl font-semibold truncate">CRM - BHealth Insurance</h1>
              </div>
            </div>

            <div className="flex-1 overflow-auto">
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