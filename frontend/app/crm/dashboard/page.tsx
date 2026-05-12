'use client';

import { useEffect, useState } from "react";
import BoxComponent from "@/components/boxes/BoxComponent";
import { useAuthStore } from "@/store/authStore";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface DashboardData {
    general_stats: {
        total_policies: number;
        active_agents: number;
        total_commissions: number;
    };
    company_balance: {
        pagadas_monto: number;
        no_pagadas_monto: number;
    };
    policies_by_status: { name: string; value: number }[];
    agents_current_period: { name: string; value: number }[];
    policies_by_state: { state: string; value: number }[];
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];

const DashboardPage = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const { accessToken } = useAuthStore();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Peticion al backend local configurado con NEXT_PUBLIC_API_URL o fallback local
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
                const res = await fetch(`${apiUrl}/dashboard/stats/`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
                    }
                });
                
                if (!res.ok) {
                    throw new Error(`API respondió con estado ${res.status}`);
                }
                
                const json = await res.json();
                setData(json);
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <div className="p-4">Cargando dashboard...</div>;
    }

    if (!data) {
        return <div className="p-4 text-red-500">Error al cargar datos del dashboard.</div>;
    }

    // Prepared data for balance pie
    const balanceData = [
        { name: 'Pagado', value: parseFloat(data.company_balance.pagadas_monto as any) || 0 },
        { name: 'No Pagado', value: parseFloat(data.company_balance.no_pagadas_monto as any) || 0 }
    ];

    return (
        <div className="flex flex-col gap-6 p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Dashboard General</h2>
            </div>
            
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                <BoxComponent title="Total Pólizas" value={data.general_stats.total_policies} />
                <BoxComponent title="Agentes Activos" value={data.general_stats.active_agents} />
                <BoxComponent title="Comisiones Totales" value={`$${data.general_stats.total_commissions}`} />
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl bg-muted/50 p-4 min-h-[300px]">
                    <h2 className="text-lg font-semibold mb-4 text-center">Balance de la Empresa</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={balanceData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                label
                            >
                                {balanceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `$${value}`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="rounded-xl bg-muted/50 p-4 min-h-[300px]">
                    <h2 className="text-lg font-semibold mb-4 text-center">Pólizas por Estatus</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={data.policies_by_status}
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                label
                            >
                                {data.policies_by_status.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="rounded-xl bg-muted/50 p-4 min-h-[350px]">
                    <h2 className="text-lg font-semibold mb-4 text-center">Top Agentes (Periodo Actual)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={data.agents_current_period}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#3b82f6" name="Pólizas" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="rounded-xl bg-muted/50 p-4 min-h-[350px]">
                    <h2 className="text-lg font-semibold mb-4 text-center">Distribución por Estado (USA)</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={data.policies_by_state}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="state" type="category" />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8b5cf6" name="Pólizas" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;