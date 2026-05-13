"use client";
import { useEffect, useState } from "react";
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from "recharts";
import BoxComponent from "@/components/boxes/BoxComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function DashboardPage() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchStats = async () => {
        setLoading(true);
        try {
            const token = window.localStorage.getItem("token");
            const headers: any = {};
            if (token) headers["Authorization"] = "Bearer " + token;
            
            let url = "http://localhost:8000/api/dashboard/stats/";
            const params = new URLSearchParams();
            if (startDate) params.append("start_date", startDate);
            if (endDate) params.append("end_date", endDate);
            
            if (params.toString()) {
                url += "?" + params.toString();
            }

            const res = await fetch(url, { headers });
            if (res.ok) {
                setStats(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [startDate, endDate]);

    if (!stats && loading) return <div className="p-4">Cargando Dashboard...</div>;
    if (!stats) return <div className="p-4">No se pudieron cargar las estadísticas.</div>;

    return (
        <div className="flex flex-col gap-6 p-6 w-full fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard CRM</h2>
                
                <div className="flex items-center gap-3 bg-card p-2 rounded-xl border shadow-sm">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Desde:</label>
                        <input 
                            type="date" 
                            className="p-1 text-sm border rounded bg-background"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Hasta:</label>
                        <input 
                            type="date" 
                            className="p-1 text-sm border rounded bg-background"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => fetchStats()} 
                        className="text-sm px-3 py-1 bg-primary text-primary-foreground rounded-md ml-2 hover:bg-primary/90 transition"
                    >
                        Filtrar
                    </button>
                </div>
            </div>
            
            <div className="grid auto-rows-min gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <BoxComponent title="Pólizas Activas" value={stats.general_stats?.estatus_de_las_polizas?.activos?.count || 0} />
                <BoxComponent title="Nuevos Prospectos" value={stats.nuevos_prospectos || 0} />
                <BoxComponent title="Cumpleaños (7 días)" value={stats.cumpleanos_semana || 0} />
                <BoxComponent title="Recordatorios" value={stats.recordatorios_pendientes || 0} />
            </div>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                
                {/* Product Type Chart */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Distribución por Producto</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                        {stats.polizas_tipo_producto && stats.polizas_tipo_producto.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.polizas_tipo_producto}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="count"
                                        nameKey="tipo"
                                        label
                                    >
                                        {stats.polizas_tipo_producto.map((entry: any, index: number) => (
                                            <Cell key={cell-} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">Sin datos</div>
                        )}
                    </CardContent>
                </Card>

                {/* Active Policies Monthly */}
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Pólizas Activas (Mensual)</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                        {stats.activas_mensual_chart && stats.activas_mensual_chart.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.activas_mensual_chart}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis 
                                        dataKey="date" 
                                        tickFormatter={(val) => new Date(val).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                                    />
                                    <YAxis />
                                    <RechartsTooltip 
                                        labelFormatter={(val) => new Date(val).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                    />
                                    <Legend />
                                    <Bar dataKey="polizas" name="Pólizas" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="aplicantes" name="Aplicantes" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">Sin datos</div>
                        )}
                    </CardContent>
                </Card>

                {/* New Prospects */}
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Crecimiento de Prospectos</CardTitle>
                    </CardHeader>
                    <CardContent className="h-72">
                        {stats.new_prospects_chart && stats.new_prospects_chart.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={stats.new_prospects_chart}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis 
                                        dataKey="date" 
                                        tickFormatter={(val) => new Date(val).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' })}
                                    />
                                    <YAxis />
                                    <RechartsTooltip 
                                        labelFormatter={(val) => new Date(val).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                    />
                                    <Legend />
                                    <Line type="monotone" dataKey="count" name="Nuevos Prospectos" stroke="#FF8042" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-muted-foreground">Sin datos</div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Agents */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Top 5 Agentes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.top_agentes?.map((ag: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <span className="text-sm font-medium">{ag.nombre}</span>
                                    <div className="flex flex-col text-right">
                                        <span className="text-sm font-bold">{ag.num_polizas} pólizas</span>
                                        <span className="text-xs text-muted-foreground">{ag.num_aplicantes} cols</span>
                                    </div>
                                </div>
                            ))}
                            {(!stats.top_agentes || stats.top_agentes.length === 0) && (
                                <p className="text-sm text-muted-foreground text-center">No hay agentes registrados.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Geographical US Map Distribution placeholder OR list */}
                <Card className="col-span-1 lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="text-lg">Pólizas por Estado Físico (Top 10)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                            {stats.polizas_por_estado?.map((estado: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
                                    <span className="font-bold">{estado.estado}</span>
                                    <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                                        {estado.count} pólizas
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
}
