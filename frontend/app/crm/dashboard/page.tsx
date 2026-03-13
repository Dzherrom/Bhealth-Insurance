'use client';

import BoxComponent from "@/components/boxes/BoxComponent";

const DashboardPage = () => {
    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            </div>
            
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <BoxComponent title="Usuarios Activos" value={1234} />
                <BoxComponent title="Usuarios Inactivos" value={45} />
                <BoxComponent title="Candidatos" value={12} />
            </div>
            
            <div className="flex-1 rounded-xl bg-muted/50 p-4 min-h-[400px]">
                <h2 className="text-lg font-semibold mb-4">Actividad Reciente</h2>
                <div className="space-y-2">
                    <div className="p-3 bg-background rounded-lg">
                        <p className="text-sm">Nuevo usuario registrado: Juan Pérez</p>
                        <small className="text-muted-foreground">Hace 5 minutos</small>
                    </div>
                    <div className="p-3 bg-background rounded-lg">
                        <p className="text-sm">Cita confirmada para mañana</p>
                        <small className="text-muted-foreground">Hace 15 minutos</small>
                    </div>
                    <div className="p-3 bg-background rounded-lg">
                        <p className="text-sm">Nuevo caso de seguro procesado</p>
                        <small className="text-muted-foreground">Hace 30 minutos</small>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;