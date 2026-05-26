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
import { Wallet, FolderOpen, Ban, Zap, TrendingUp, TrendingDown, Users, UserX, FileText } from "lucide-react";
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
  total_polizas_canceladas: number;
  total_aplicantes_cancelados: number;
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

const getDefaultRange = () => {
  const endDateObj = new Date();
  const startDateObj = new Date();
  startDateObj.setMonth(startDateObj.getMonth() - 6);
  
  const endYYYY = endDateObj.getFullYear();
  const endMM = String(endDateObj.getMonth() + 1).padStart(2, '0');
  const endDD = String(endDateObj.getDate()).padStart(2, '0');

  const startYYYY = startDateObj.getFullYear();
  const startMM = String(startDateObj.getMonth() + 1).padStart(2, '0');
  const startDD = String(startDateObj.getDate()).padStart(2, '0');

  return {
    startDate: `${startYYYY}-${startMM}-${startDD}`,
    endDate: `${endYYYY}-${endMM}-${endDD}`,
  };
};

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

  
  const insurerMergedData = useMemo(() => {
    if (!stats) return [];
    
    // Check if map logic needs to be constructed using basic maps
    const m = new Map<string, { aseguradora: string; polizas: number; aplicantes: number }>();
    
    (stats.polizas_por_aseguradora_top10 || []).forEach(item => {
      m.set(item.aseguradora, { aseguradora: item.aseguradora, polizas: item.count, aplicantes: 0 });
    });
    
    (stats.aplicantes_por_aseguradora_top10 || []).forEach(item => {
      if (m.has(item.aseguradora)) {
        m.get(item.aseguradora)!.aplicantes = item.aplicantes;
      } else {
        m.set(item.aseguradora, { aseguradora: item.aseguradora, polizas: 0, aplicantes: item.aplicantes });
      }
    });

    return Array.from(m.values()).sort((a, b) => b.polizas - a.polizas).slice(0, 10);
  }, [stats]);

  if (loading && !stats) return <div className="p-6">Cargando Dashboard...</div>;
  if (!stats) return <div className="p-6">No se pudieron cargar las estadísticas. {error ? `(${error})` : ""}</div>;

  return (
    <div className="app-page w-full md:p-[30px]">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-[30px] md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-[20px] font-bold text-[#0f172a] m-0">Resumen del Panel</h2>
        </div>

        <div className="flex items-center gap-[12px]">
          <div className="flex items-center bg-white border border-[#f1f5f9] rounded-[10px] p-[6px] gap-[8px]">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-8 border-none shadow-none focus-visible:ring-0 w-[125px] text-[13px] text-[#475569] font-medium p-0 bg-transparent" />
            <span className="text-[#94a3b8] font-bold">-</span>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-8 border-none shadow-none focus-visible:ring-0 w-[125px] text-[13px] text-[#475569] font-medium p-0 bg-transparent" />
          </div>
          <Button
            disabled={!canApplyRange || loading}
            onClick={() => setAppliedRange({ startDate, endDate })}
            className="h-[38px] bg-[#4f46e5] hover:bg-[#4338ca] text-white rounded-[10px] text-[13px] font-semibold px-[16px] shadow-[0_4px_10px_rgba(79,70,229,0.3)] transition-all"
          >
            Filtrar
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-[20px] mb-[24px]">
        
        {/* KPI 1 : Ventas Totales */}
        <div className="bg-white rounded-[16px] p-[20px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-transform hover:-translate-y-[2px]">
          <div className="flex items-center justify-between mb-[16px]">
            <span className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-[0.5px]">Ventas Totales</span>
            <Wallet className="w-5 h-5 text-[#4f46e5]" />
          </div>
          <div className="text-[32px] font-bold text-[#0f172a] tracking-[-0.5px] leading-[1.2]">$184,500</div>
          <div className="text-[12px] font-semibold text-[#64748b] mt-[8px]">+14.2% vs año anterior</div>
        </div>

        {/* KPI 2 : Pólizas */}
        <div className="bg-white rounded-[16px] p-[20px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-transform hover:-translate-y-[2px]">
          <div className="flex items-center justify-between mb-[16px]">
            <span className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-[0.5px]">Pólizas</span>
            <FileText className="w-5 h-5 text-[#10b981]" />
          </div>
          <div className="text-[32px] font-bold text-[#0f172a] tracking-[-0.5px] leading-[1.2]">{stats.total_polizas || "0"}</div>
          <div className="text-[12px] font-semibold text-[#64748b] mt-[8px]">Número total de pólizas</div>
        </div>

        {/* KPI 3 : Aplicantes */}
        <div className="bg-white rounded-[16px] p-[20px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-transform hover:-translate-y-[2px]">
          <div className="flex items-center justify-between mb-[16px]">
            <span className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-[0.5px]">Aplicantes</span>
            <Users className="w-5 h-5 text-[#3b82f6]" />
          </div>
          <div className="text-[32px] font-bold text-[#0f172a] tracking-[-0.5px] leading-[1.2]">{stats.total_aplicantes || "0"}</div>
          <div className="text-[12px] font-semibold text-[#64748b] mt-[8px]">Número total de aplicantes</div>
        </div>

        {/* KPI 4 : Pólizas Canceladas */}
        <div className="bg-white rounded-[16px] p-[20px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-transform hover:-translate-y-[2px]">
          <div className="flex items-center justify-between mb-[16px]">
            <span className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-[0.5px]">Pólizas Canceladas</span>
            <Ban className="w-5 h-5 text-[#ef4444]" />
          </div>
          <div className="text-[32px] font-bold text-[#0f172a] tracking-[-0.5px] leading-[1.2]">{stats.total_polizas_canceladas || "0"}</div>
          <div className="text-[12px] font-semibold text-[#64748b] mt-[8px]">Total de pólizas canceladas</div>
        </div>

        {/* KPI 5 : Aplicantes Cancelados */}
        <div className="bg-white rounded-[16px] p-[20px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-transform hover:-translate-y-[2px]">
          <div className="flex items-center justify-between mb-[16px]">
            <span className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-[0.5px]">Aplicantes Cancelados</span>
            <UserX className="w-5 h-5 text-[#ef4444]" />
          </div>
          <div className="text-[32px] font-bold text-[#0f172a] tracking-[-0.5px] leading-[1.2]">{stats.total_aplicantes_cancelados || "0"}</div>
          <div className="text-[12px] font-semibold text-[#64748b] mt-[8px]">Total de aplicantes cancelados</div>
        </div>

        {/* KPI 6 : Tasa de Retención */}
        <div className="bg-white rounded-[16px] p-[20px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] flex flex-col justify-between transition-transform hover:-translate-y-[2px]">
          <div className="flex items-center justify-between mb-[16px]">
            <span className="text-[12px] font-bold text-[#94a3b8] uppercase tracking-[0.5px]">Tasa de Retención</span>
            <Zap className="w-5 h-5 text-[#f59e0b]" />
          </div>
          <div className="text-[32px] font-bold text-[#0f172a] tracking-[-0.5px] leading-[1.2]">98.4%</div>
          <div className="text-[12px] font-semibold text-[#10b981] mt-[8px]">Eficiencia óptima</div>
        </div>

      </div>

      <div className="grid gap-[24px] lg:grid-cols-2 mb-[24px]">
        {/* Rendimiento de Ventas */}
        <div className="bg-white rounded-[16px] p-[24px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)]">
          <div className="text-[16px] font-bold text-[#0f172a] mb-[20px]">Rendimiento de Ventas</div>
          <div className="h-[320px] w-full">
            {stats.polizas_efectivas_mensual_chart?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.polizas_efectivas_mensual_chart}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tickFormatter={formatDateLabel} tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} dy={10} />
                  <YAxis tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dx={-10} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} labelFormatter={(label) => formatDateLabel(String(label))} />
                  <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                  <Bar dataKey="polizas" name="Pólizas" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="aplicantes" name="Aplicantes" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">Sin datos</div>
            )}
          </div>
        </div>

        {/* Rendimiento de Asistentes */}
        <div className="bg-white rounded-[16px] p-[24px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] flex flex-col gap-[20px]">
          <div>
            <div className="text-[16px] font-bold text-[#0f172a] mb-[4px]">Métricas de Rendimiento de Asistentes</div>
            <div className="text-[13px] font-medium text-[#64748b] leading-[1.5]">Clasificación basada en el volumen independiente de pólizas cerradas y aplicantes gestionados</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[20px]">
            
            {/* Top Productores */}
            <div className="bg-[#f8fafc] rounded-[12px] p-[16px] border-l-[4px] border-l-[#10b981]">
              <div className="text-[12px] font-bold uppercase tracking-[0.5px] flex items-center gap-[6px] mb-[16px] text-[#10b981]">
                <TrendingUp className="w-4 h-4" /> Mayores Productores (Top 3)
              </div>
              <div className="flex flex-col gap-[16px]">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[12px]">
                    <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 bg-[#d1fae5] text-[#065f46]">DM</div>
                    <div>
                      <h5 className="text-[14px] font-bold text-[#0f172a] m-0">Daniella Mendoza</h5>
                      <p className="text-[11px] font-semibold text-[#64748b] m-0">Conversión: 84%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-bold text-[#10b981]">153 Pólizas</div>
                    <div className="text-[11px] font-semibold text-[#64748b]">185 Ap</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[12px]">
                    <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 bg-[#d1fae5] text-[#065f46]">CR</div>
                    <div>
                      <h5 className="text-[14px] font-bold text-[#0f172a] m-0">Carlos Rdz</h5>
                      <p className="text-[11px] font-semibold text-[#64748b] m-0">Conversión: 79%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-bold text-[#10b981]">125 Pólizas</div>
                    <div className="text-[11px] font-semibold text-[#64748b]">140 Ap</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[12px]">
                    <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 bg-[#d1fae5] text-[#065f46]">LG</div>
                    <div>
                      <h5 className="text-[14px] font-bold text-[#0f172a] m-0">Luis Gómez</h5>
                      <p className="text-[11px] font-semibold text-[#64748b] m-0">Conversión: 72%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-bold text-[#10b981]">98 Pólizas</div>
                    <div className="text-[11px] font-semibold text-[#64748b]">110 Ap</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Bajo productivo */}
            <div className="bg-[#f8fafc] rounded-[12px] p-[16px] border-l-[4px] border-l-[#ef4444]">
              <div className="text-[12px] font-bold uppercase tracking-[0.5px] flex items-center gap-[6px] mb-[16px] text-[#ef4444]">
                <TrendingDown className="w-4 h-4" /> Requiere Revisión
              </div>
              <div className="flex flex-col gap-[16px]">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[12px]">
                    <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 bg-[#fee2e2] text-[#991b1b]">MP</div>
                    <div>
                      <h5 className="text-[14px] font-bold text-[#0f172a] m-0">Miguel P</h5>
                      <p className="text-[11px] font-semibold text-[#64748b] m-0">Conv: 31%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-bold text-[#ef4444]">12 Pólizas</div>
                    <div className="text-[11px] font-semibold text-[#64748b]">25 Ap</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[12px]">
                    <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 bg-[#fee2e2] text-[#991b1b]">AF</div>
                    <div>
                      <h5 className="text-[14px] font-bold text-[#0f172a] m-0">Ana F</h5>
                      <p className="text-[11px] font-semibold text-[#64748b] m-0">Conv: 28%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-bold text-[#ef4444]">8 Pólizas</div>
                    <div className="text-[11px] font-semibold text-[#64748b]">14 Ap</div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-[12px]">
                    <div className="w-[36px] h-[36px] rounded-full flex items-center justify-center font-bold text-[12px] shrink-0 bg-[#fee2e2] text-[#991b1b]">RJ</div>
                    <div>
                      <h5 className="text-[14px] font-bold text-[#0f172a] m-0">Roberto J</h5>
                      <p className="text-[11px] font-semibold text-[#64748b] m-0">Conv: 21%</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-bold text-[#ef4444]">7 Pólizas</div>
                    <div className="text-[11px] font-semibold text-[#64748b]">9 Ap</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>


      <div className="grid gap-[24px] lg:grid-cols-2 mb-[24px]">
        {/* Pólizas por estados de EEUU */}
        <div className="bg-white rounded-[16px] p-[24px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] flex flex-col">
          <div className="text-[16px] font-bold text-[#0f172a] mb-[20px]">Pólizas por Estados (EE.UU.)</div>
          <div className="flex-1 relative flex items-center justify-center min-h-[320px]">
            <ComposableMap projection="geoAlbersUsa" className="w-full h-full">
              <Geographies geography={USA_GEO_URL}>
                {({ geographies }: { geographies: any[] }) =>
                  geographies.map((geo: any) => {
                    const stateName = normalizeState(geo.properties.name);
                    const count = stateCountMap.get(stateName) || 0;
                    const fill = getMapColor(count, maxStateCount);
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fill}
                        stroke="#ffffff"
                        strokeWidth={0.5}
                        style={{
                          default: { outline: "none" },
                          hover: { fill: "#f59e0b", outline: "none", cursor: "pointer", transition: "all 250ms" },
                          pressed: { outline: "none" },
                        }}
                        onMouseEnter={(e: any) => {
                          const rect = (e.target as SVGElement).getBoundingClientRect();
                          setHoveredState({
                            name: geo.properties.name,
                            count,
                            percentage: totalPolicyCount > 0 ? (count / totalPolicyCount) * 100 : 0,
                            x: rect.left + rect.width / 2,
                            y: rect.top,
                          });
                        }}
                        onMouseLeave={() => setHoveredState(null)}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
            {/* Tooltip Map */}
            {hoveredState && (
              <div 
                className="fixed z-50 pointer-events-none bg-[#0f172a] text-white p-[12px] rounded-[8px] shadow-xl border border-[#334155] transform -translate-x-1/2 -translate-y-full mt-[-10px]"
                style={{ left: hoveredState.x, top: hoveredState.y }}
              >
                <div className="text-[13px] font-bold mb-[4px]">{hoveredState.name}</div>
                <div className="text-[12px] text-[#cbd5e1]">{hoveredState.count} pólizas</div>
                <div className="text-[11px] text-[#94a3b8] font-semibold mt-[2px]">{hoveredState.percentage.toFixed(1)}% del total</div>
              </div>
            )}
          </div>
        </div>

        {/* Pólizas y Aplicantes por Aseguradora */}
        <div className="bg-white rounded-[16px] p-[24px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] flex flex-col">
          <div className="text-[16px] font-bold text-[#0f172a] mb-[20px]">Pólizas y Aplicantes por Aseguradora</div>
          <div className="h-[320px] w-full">
            {insurerMergedData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insurerMergedData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} />
                  <YAxis type="category" dataKey="aseguradora" tickLine={false} axisLine={false} tick={{fill: '#475569', fontSize: 11, fontWeight: 600}} width={90} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'}} />
                  <Legend iconType="circle" wrapperStyle={{paddingTop: '10px'}} />
                  <Bar dataKey="polizas" name="Pólizas" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={20} />
                  <Bar dataKey="aplicantes" name="Aplicantes" fill="#ec4899" radius={[0, 4, 4, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-[#94a3b8] text-[13px] font-medium">Sin datos para mostrar</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-[24px] lg:grid-cols-1 mb-[24px]">
        {/* Tabla de Clasificación de Agentes */}
        <div className="bg-white rounded-[16px] p-[24px] border border-[#f1f5f9] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.03),0_8px_10px_-6px_rgba(0,0,0,0.03)] flex flex-col gap-[20px]">
          <div className="text-[16px] font-bold text-[#0f172a]">Tabla de Clasificación de Agentes y Licencias</div>
          <div className="flex flex-col gap-[12px]">
            {stats.clasificacion_agentes?.map((agent, index) => (
              <div key={`${agent.nombre}-${index}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-[16px] rounded-[12px] bg-white border border-[#f1f5f9] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.02)] transition-all hover:border-[#e2e8f0] hover:shadow-[0_4px_12px_-2px_rgba(0,0,0,0.05)] gap-4 sm:gap-0">
                <div className="flex items-center gap-[16px]">
                  <div className="w-[45px] h-[45px] bg-[#f8fafc] text-[#4f46e5] text-[16px] font-bold rounded-full flex items-center justify-center border border-[#e2e8f0] shrink-0">
                    {agent.nombre.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-[14px] font-bold text-[#0f172a] uppercase m-0 leading-[1.2]">{agent.nombre}</h4>
                    <p className="text-[12px] font-semibold text-[#64748b] mt-[4px] m-0">NPN {Math.floor(10000000 + Math.random() * 90000000)} • Principal Activo</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-[12px] sm:gap-[30px]">
                  <div className="flex items-center gap-[12px]">
                    <span className="w-[32px] h-[32px] bg-[#e0e7ff] text-[#3b82f6] text-[11px] font-bold flex items-center justify-center rounded-[8px]">FL</span>
                    <div className="flex items-center gap-[10px]">
                        <span className="bg-[#f8fafc] border border-[#e2e8f0] text-[#475569] text-[11px] font-semibold px-[8px] py-[4px] rounded-[10px] flex items-center gap-[6px]">
                          <span className="w-[6px] h-[6px] rounded-full bg-[#10b981] shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>Progressive
                        </span>
                        <span className="bg-[#f8fafc] border border-[#e2e8f0] text-[#475569] text-[11px] font-semibold px-[8px] py-[4px] rounded-[10px] flex items-center gap-[6px]">
                          <span className="w-[6px] h-[6px] rounded-full bg-[#3b82f6] shadow-[0_0_5px_rgba(59,130,246,0.5)]"></span>Blue Cross
                        </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col text-right">
                    <div className="text-[15px] font-bold text-[#0f172a]">{agent.num_polizas} Ventas ({agent.porcentaje_polizas}%)</div>
                    <div className="text-[12px] font-semibold text-[#10b981]">Totalizado</div>
                  </div>
                </div>
              </div>
            ))}
            {!stats.clasificacion_agentes?.length && (
              <p className="text-[13px] text-muted-foreground text-center py-4">No hay datos de agentes.</p>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
