"use client"

import { useState, useEffect } from "react"
import { getFinancialReports, getOperationalReports } from "@/app/actions/reportActions"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from "recharts"

export default function ReportsPage() {
    const [loading, setLoading] = useState(true)
    const [dateRange, setDateRange] = useState<"today" | "week" | "month">("month")

    const [financials, setFinancials] = useState({
        grossRevenue: 0,
        netRevenue: 0,
        discounts: 0,
        totalOrders: 0,
        averageTicket: 0,
        revenueByChannel: [] as { channel: string; total: number }[],
    })

    const [operations, setOperations] = useState({
        totalTicketsSold: 0,
        totalPartyChildren: 0,
        totalParties: 0,
        totalChildrenInPark: 0,
    })

    const loadReports = async () => {
        setLoading(true)

        const now = new Date()
        let startDate = new Date()
        const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

        if (dateRange === "today") {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        } else if (dateRange === "week") {
            const firstDayOfWeek = now.getDate() - now.getDay()
            startDate = new Date(now.setDate(firstDayOfWeek))
            startDate.setHours(0, 0, 0, 0)
        } else if (dateRange === "month") {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)
        }

        const [resFin, resOp] = await Promise.all([
            getFinancialReports({ startDate, endDate }),
            getOperationalReports({ startDate, endDate }),
        ])

        if (resFin.success && resFin.data) {
            setFinancials(resFin.data)
        }

        if (resOp.success && resOp.data) {
            setOperations(resOp.data)
        }

        setLoading(false)
    }

    useEffect(() => {
        loadReports()
    }, [dateRange])

    // Datos formateados para los gráficos de Recharts
    const channelChartData = financials.revenueByChannel.map((ch) => ({
        canal: ch.channel === "POS" ? "Boletería / POS" : "Reserva Web",
        monto: ch.total,
    }))

    const capacityPieData = [
        { name: "Pases Libres", value: operations.totalTicketsSold, color: "#0f172a" },
        { name: "Chicos Cumpleaños", value: operations.totalPartyChildren, color: "#9333ea" },
    ]

    return (
        <div className="p-6 bg-slate-100 min-h-screen text-slate-800 font-sans space-y-6">
            {/* CABECERA Y FILTROS */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <span>📊</span> Reportes e Inteligencia de Negocio
                    </h1>
                    <p className="text-xs text-slate-400 mt-0.5">
                        Estadísticas financieras, análisis visual de ingresos y ocupación del parque.
                    </p>
                </div>

                <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                    <button
                        type="button"
                        onClick={() => setDateRange("today")}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${dateRange === "today"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                            }`}
                    >
                        Hoy
                    </button>
                    <button
                        type="button"
                        onClick={() => setDateRange("week")}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${dateRange === "week"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                            }`}
                    >
                        Esta Semana
                    </button>
                    <button
                        type="button"
                        onClick={() => setDateRange("month")}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${dateRange === "month"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-900"
                            }`}
                    >
                        Este Mes
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center font-bold text-slate-400">
                    Cargando gráficos e indicadores...
                </div>
            ) : (
                <>
                    {/* METRICAS PRINCIPALES (KPIS) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-400">Ingresos Brutos</span>
                            <h3 className="text-2xl font-black text-slate-900">
                                ${financials.grossRevenue.toLocaleString()} <span className="text-xs text-slate-400">ARS</span>
                            </h3>
                            <p className="text-[11px] font-medium text-slate-500">
                                {financials.totalOrders} transacciones cerradas
                            </p>
                        </div>

                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-400">Ticket Promedio</span>
                            <h3 className="text-2xl font-black text-pokido-purple">
                                ${Math.round(financials.averageTicket).toLocaleString()} <span className="text-xs text-slate-400">ARS</span>
                            </h3>
                            <p className="text-[11px] font-medium text-slate-500">Por venta realizada</p>
                        </div>

                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-400">Aforo Total Atendido</span>
                            <h3 className="text-2xl font-black text-slate-900">
                                {operations.totalChildrenInPark} <span className="text-xs text-slate-400">chicos</span>
                            </h3>
                            <p className="text-[11px] font-medium text-slate-500">
                                {operations.totalTicketsSold} pases + {operations.totalPartyChildren} cumples
                            </p>
                        </div>

                        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-400">Eventos de Cumpleaños</span>
                            <h3 className="text-2xl font-black text-emerald-600">
                                {operations.totalParties} <span className="text-xs text-slate-400">fiestas</span>
                            </h3>
                            <p className="text-[11px] font-medium text-slate-500">Reservadas y completadas</p>
                        </div>
                    </div>

                    {/* SECCIÓN DE GRÁFICOS INTERACTIVOS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* GRÁFICO 1: COMPARATIVA DE INGRESOS POR CANAL (BARRAS) */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                        <span>💳</span> Ingresos por Canal de Venta
                                    </h3>
                                    <p className="text-xs text-slate-400">Mostrador POS vs. Reservas Web Mercado Pago</p>
                                </div>
                            </div>

                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={channelChartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="canal" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: "#64748b" }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickFormatter={(val) => `$${val / 1000}k`} />
                                        <Tooltip
                                            formatter={(value: any) => [`$${Number(value).toLocaleString()} ARS`, "Monto Facturado"]}
                                            contentStyle={{ borderRadius: "16px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                        />
                                        <Bar dataKey="monto" fill="#9333ea" radius={[12, 12, 0, 0]} barSize={48} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* GRÁFICO 2: DISTRIBUCIÓN DE AFORO (PIE / DONA CHART) */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                            <div>
                                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                                    <span>🍩</span> Distribución de Ocupación
                                </h3>
                                <p className="text-xs text-slate-400">Proporción de entradas libres frente a invitados de cumpleaños</p>
                            </div>

                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={capacityPieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={85}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {capacityPieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: any) => [`${value} niños`, "Total"]}
                                            contentStyle={{ borderRadius: "16px", border: "1px solid #e2e8f0" }}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            formatter={(value) => <span className="text-xs font-bold text-slate-700">{value}</span>}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}