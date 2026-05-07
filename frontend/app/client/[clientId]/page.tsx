'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, use  } from 'react';

export default function ClientDashboard() {
  const params = useParams();
  const router = useRouter();
  const clientId = params?.clientId ? use(Promise.resolve(params.clientId)) : '';

  useEffect(() => {
    // Redirigir automáticamente al perfil del cliente
    if (clientId) {
      router.push(`/client/${clientId}/profile`);
    }
  }, [clientId, router]);

  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Redirigiendo...</h2>
        <p className="text-gray-600">Te estamos llevando a tu perfil</p>
      </div>
    </div>
  );
}