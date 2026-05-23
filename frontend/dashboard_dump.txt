"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import BoxComponent from "@/components/boxes/BoxComponent";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentToken } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://bhealth-insurance.onrender.com/api"
    : "http://127.0.0.1:8000/api");
const USA_GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#6b7280"];

type MonthlyTotalsRow = {
  date: string;
  polizas: number;
  aplicantes: number;
};

type AgentRow = {
  nombre: string;
  num_polizas: number;
  num_aplicantes: number;
  porcentaje_polizas: number;
};

type ProductPieRow = {
  tipo: string;
  count: number;
};

type ProductMonthlyRow = {
  date: string;
  [key: string]: string | number;
};

type InsurerPolicyRow = {
  aseguradora: string;
  count: number;
  porcentaje: number;
};

type InsurerApplicantRow = {
  aseguradora: string;
  aplicantes: number;
  porcentaje: number;
};

type StatePoliciesRow = {
  estado: string;
  count: number;
};

type PolicyStatusPieRow = {
  estado: string;
  count: number;
};

type DashboardStats = {
  recordatorios_pendientes: number;
  cumpleanos_semana: number;
  failed_logins_count: number;
  nuevos_prospectos: number;
  total_polizas: number;
  total_aplicantes: number;
  polizas_efectivas_mensual_chart: MonthlyTotalsRow[];
  clasificacion_agentes: AgentRow[];
  polizas_efectivas_tipo_producto_mensual_chart: ProductMonthlyRow[];
  tipos_producto_disponibles: string[];
  polizas_tipo_producto: ProductPieRow[];
  polizas_por_aseguradora_top10: InsurerPolicyRow[];
  aplicantes_por_aseguradora_top10: InsurerApplicantRow[];
  polizas_por_estado: StatePoliciesRow[];
  polizas_por_estado_poliza_chart: PolicyStatusPieRow[];
};

const formatDateLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-ES", { month: "short", year: "numeric" });
};

const normalizeState = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

const getMapColor = (count: number, max: number) => {
  if (!count || max <= 0) return "#e5e7eb";
  const intensity = Math.max(0.15, count / max);
  if (intensity > 0.8) return "#1d4ed8";
  if (intensity > 0.6) return "#2563eb";
  if (intensity > 0.4) return "#3b82f6";
  if (intensity > 0.2) return "#60a5fa";
  return "#93c5fd";
};

const getDefaultRange = () => ({
  startDate: "",
  endDate: "",
});

export default function DashboardPage() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshAccessToken = useAuthStore((state) => state.refreshAccessToken);

  const defaultRange = useMemo(() => getDefaultRange(), []);
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);
  const [appliedRange, setAppliedRange] = useState(defaultRange);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<{
    name: string;
    count: number;
    percentage: number;
    x: number;
    y: number;
  } | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);

    try {
      let token = accessToken || getCurrentToken();

      if (!token) {
        throw new Error("No hay sesión activa. Inicia sesión nuevamente.");
      }

      const params = new URLSearchParams();
      if (appliedRange.startDate) params.append("start_date", appliedRange.startDate);
      if (appliedRange.endDate) params.append("end_date", appliedRange.endDate);

      const url = `${API_BASE_URL}/dashboard/stats/?${params.toString()}`;
      let response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        try {
          await refreshAccessToken();
        } catch {
          throw new Error("No hay sesión activa. Inicia sesión nuevamente.");
        }
        const refreshedToken = useAuthStore.getState().accessToken || getCurrentToken();

        if (!refreshedToken) {
          throw new Error("No fue posible renovar la sesión.");
        }

        response = await fetch(url, {
          headers: { Authorization: `Bearer ${refreshedToken}` },
        });
      }

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`HTTP ${response.status}${detail ? `: ${detail}` : ""}`);
      }

      const payload = (await response.json()) as DashboardStats;
      setStats(payload);
    } catch (err) {
      console.error(err);
      setStats(null);
      setError(err instanceof Error ? err.message : "No se pudieron cargar las estadísticas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [appliedRange.startDate, appliedRange.endDate, accessToken, refreshAccessToken]);

  const stateCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of stats?.polizas_por_estado || []) {
      map.set(normalizeState(row.estado), row.count);
    }
    return map;
  }, [stats]);

  const maxStateCount = useMemo(() => {
    if (!stats?.polizas_por_estado?.length) return 0;
    return Math.max(...stats.polizas_por_estado.map((row) => row.count));
  }, [stats]);

  const totalPolicyCount = stats?.total_polizas || 0;

  const canApplyRange = !!startDate && !!endDate && startDate <= endDate;

  if (loading && !stats) return <div className="p-6">Cargando Dashboard...</div>;
  if (!stats) return <div className="p-6">No se pudieron cargar las estadísticas. {error ? `(${error})` : ""}</div>;

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard CRM</h2>
          <p className="text-sm text-muted-foreground">Resumen ejecutivo por rango de fechas</p>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border bg-card p-3 md:flex-row md:items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Desde</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Hasta</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>

          <Button
            disabled={!canApplyRange || loading}
            onClick={() => setAppliedRange({ startDate, endDate })}
            className="md:mb-0"
          >
            Aplicar filtro
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <BoxComponent title="Recordatorios pendientes" value={stats.recordatorios_pendientes || 0} />
        <BoxComponent title="Cumpleaños esta semana" value={stats.cumpleanos_semana || 0} />
        <BoxComponent title="Inicios de sesión fallidos" value={stats.failed_logins_count || 0} />
        <BoxComponent title="Nuevos prospectos" value={stats.nuevos_prospectos || 0} />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <BoxComponent title="Total de pólizas" value={stats.total_polizas || 0} />
        <BoxComponent title="Total de aplicantes" value={stats.total_aplicantes || 0} />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pólizas efectivas por mes</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {stats.polizas_efectivas_mensual_chart?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.polizas_efectivas_mensual_chart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDateLabel} />
                  <YAxis />
                  <RechartsTooltip labelFormatter={(label) => formatDateLabel(String(label))} />
                  <Legend />
                  <Bar dataKey="polizas" name="Pólizas" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="aplicantes" name="Aplicantes" fill="#16a34a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">Sin datos</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clasificación de agentes</CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 overflow-auto">
            <div className="space-y-3">
              {stats.clasificacion_agentes?.map((agent, index) => (
                <div key={`${agent.nombre}-${index}`} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{agent.nombre}</p>
                    <p className="text-sm text-muted-foreground">{agent.porcentaje_polizas}%</p>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {agent.num_polizas} pólizas | {agent.num_aplicantes} aplicantes
                  </div>
                </div>
              ))}
              {!stats.clasificacion_agentes?.length && (
                <p className="text-sm text-muted-foreground">No hay datos de agentes.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pólizas efectivas por mes según tipo de producto</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {stats.polizas_efectivas_tipo_producto_mensual_chart?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.polizas_efectivas_tipo_producto_mensual_chart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={formatDateLabel} />
                  <YAxis />
                  <RechartsTooltip labelFormatter={(label) => formatDateLabel(String(label))} />
                  <Legend />
                  {stats.tipos_producto_disponibles?.map((tipo, index) => (
                    <Line
                      key={tipo}
                      type="monotone"
                      dataKey={tipo}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2.5}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">Sin datos</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pólizas por tipo de producto</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {stats.polizas_tipo_producto?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.polizas_tipo_producto}
                    dataKey="count"
                    nameKey="tipo"
                    cx="50%"
                    cy="50%"
                    outerRadius={105}
                    label
                  >
                    {stats.polizas_tipo_producto.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend align="right" verticalAlign="middle" layout="vertical" iconType="square" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">Sin datos</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pólizas por aseguradora (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">Aseguradora</th>
                    <th className="py-2 text-right">Total</th>
                    <th className="py-2 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.polizas_por_aseguradora_top10?.map((item, index) => (
                    <tr key={`${item.aseguradora}-${index}`} className="border-b">
                      <td className="py-2">{item.aseguradora}</td>
                      <td className="py-2 text-right">{item.count}</td>
                      <td className="py-2 text-right">{item.porcentaje}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aplicantes por aseguradora (Top 10)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2">Aseguradora</th>
                    <th className="py-2 text-right">Aplicantes</th>
                    <th className="py-2 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.aplicantes_por_aseguradora_top10?.map((item, index) => (
                    <tr key={`${item.aseguradora}-${index}`} className="border-b">
                      <td className="py-2">{item.aseguradora}</td>
                      <td className="py-2 text-right">{item.aplicantes}</td>
                      <td className="py-2 text-right">{item.porcentaje}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mapa de pólizas por estado (EEUU)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full overflow-x-auto rounded-md border bg-slate-50 p-2">
              {hoveredState ? (
                <div
                  className="pointer-events-none fixed z-20 rounded-md border bg-white px-3 py-2 text-xs shadow-lg"
                  style={{ left: hoveredState.x, top: hoveredState.y, transform: 'translate(12px, 12px)' }}
                >
                  <div className="font-semibold text-slate-900">{hoveredState.name}</div>
                  <div className="text-slate-600">{hoveredState.count} pólizas</div>
                  <div className="text-slate-600">{hoveredState.percentage.toFixed(1)}% del total</div>
                </div>
              ) : null}
              <ComposableMap projection="geoAlbersUsa" width={980} height={540}>
                <Geographies geography={USA_GEO_URL}>
                  {({ geographies }: { geographies: Array<{ rsmKey: string; properties: { name?: string } }> }) =>
                    geographies.map((geo: { rsmKey: string; properties: { name?: string } }) => {
                      const stateName = String((geo.properties as { name?: string })?.name || "");
                      const count = stateCountMap.get(normalizeState(stateName)) || 0;
                      const percentage = totalPolicyCount > 0 ? (count / totalPolicyCount) * 100 : 0;
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          title={`${stateName}: ${percentage.toFixed(1)}% (${count})`}
                          fill={getMapColor(count, maxStateCount)}
                          stroke="#ffffff"
                          strokeWidth={0.8}
                          onMouseEnter={(event: { clientX: number; clientY: number }) => {
                            setHoveredState({
                              name: stateName,
                              count,
                              percentage,
                              x: event.clientX,
                              y: event.clientY,
                            });
                          }}
                          onMouseMove={(event: { clientX: number; clientY: number }) => {
                            setHoveredState((current) =>
                              current
                                ? {
                                    ...current,
                                    x: event.clientX,
                                    y: event.clientY,
                                  }
                                : current
                            );
                          }}
                          onMouseLeave={() => setHoveredState(null)}
                          style={{
                            default: { outline: "none", cursor: "pointer" },
                            hover: { outline: "none", fill: "#1d4ed8", cursor: "pointer" },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ComposableMap>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">La intensidad del color representa mayor volumen de pólizas.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pólizas por estado de póliza</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {stats.polizas_por_estado_poliza_chart?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.polizas_por_estado_poliza_chart}
                    dataKey="count"
                    nameKey="estado"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    label
                  >
                    {stats.polizas_por_estado_poliza_chart.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend align="right" verticalAlign="middle" layout="vertical" iconType="square" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">Sin datos</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
