'use client';

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/sidebar";
import SidebarClient from "@/components/sidebar/sidebarClient";
import { ClientNotificationButton } from "@/components/client";
import { useRouter } from "next/navigation";
import { use } from 'react';

interface ClientLayoutProps {
  children: React.ReactNode;
  params: Promise<{ clientId: string }>;
}

export default function ClientLayout({ children, params }: ClientLayoutProps) {
  const router = useRouter();
  const { clientId } = use(params);

  const handleSidebarNavigation = (item: any) => {
    if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <SidebarClient onItemClick={handleSidebarNavigation} clientId={clientId} />
        <SidebarInset className="flex-1 overflow-hidden bg-[#f8fafc]">
          <div className="flex h-16 shrink-0 items-center gap-2 px-6 justify-between border-b border-[#e2e8f0] bg-white">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <SidebarTrigger className="ml-1" />
              <h1 className="text-xl font-bold text-[#0f172a] truncate">BHealth Insurance - Perfil</h1>
            </div>
            
            {/* Botón de notificaciones en el header */}
            <div className="flex-shrink-0">
              <ClientNotificationButton 
                variant="inline" 
                size="md"
                className="bg-blue-600 hover:bg-blue-700"
                clientId={clientId}
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}