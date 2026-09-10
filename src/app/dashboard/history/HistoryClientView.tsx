"use client"

import { useEffect, useState } from "react"
import { getParkHistory } from "@/app/actions/historyActions"

export default function HistoryClientView() {
    const [history, setHistory] = useState<any[]>([])
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            setLoading(true)
            const res = await getParkHistory()
            if (res.success && res.data) {
                setHistory(res.data)
            }
            setLoading(false)
        }
        load()
    }, [])

    const filteredHistory = history.filter(
        (item) =>
            item.minorName.toLowerCase().includes(search.toLowerCase()) ||
            item.tutorName.toLowerCase().includes(search.toLowerCase()) ||
            item.qrCode.toLowerCase().includes(search.toLowerCase())
    )

    if (loading) {
        return (
            <div className="p-6 bg-slate-100 min-h-screen flex items-center justify-center font-bold text-slate-400">
                Cargando historial de movimientos...
            </div>
        )
    }

    return (
        <div className="p-6 bg-slate-100 min-h-screen font-sans text-slate-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900">📜 Historial de Entradas, Salidas y Recargos</h1>
                    <p className="text-xs text-slate-500 font-medium">Registro general de pases emitidos, salidas efectivas y cobranzas por exceso de tiempo.</p>
                </div>

                <input
                    type="text"
                    placeholder="🔍 Buscar por pulsera, niño o tutor..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-white border border-slate-200 text-xs px-4 py-2.5 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-pokido-purple/20 w-full sm:w-72"
                />
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                                <th className="py-4 px-6">Registro / Fecha</th>
                                <th className="py-4 px-6">Menor / Pulsera</th>
                                <th className="py-4 px-6">Tutor Responsable</th>
                                <th className="py-4 px-6">Tipo de Movimiento</th>
                                <th className="py-4 px-6">Monto / Pago</th>
                                <th className="py-4 px-6 text-right">Estado Pase</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm font-medium">
                            {filteredHistory.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                                    {/* FECHA Y HORA */}
                                    <td className="py-4 px-6 whitespace-nowrap">
                                        <div className="font-bold text-slate-900">
                                            {new Date(item.createdAt).toLocaleDateString("es-CL")}
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(item.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })} hs
                                        </div>
                                    </td>

                                    {/* MENOR Y CÓDIGO */}
                                    <td className="py-4 px-6">
                                        <div className="font-bold text-slate-900">{item.minorName}</div>
                                        <div className="text-xs text-slate-400 font-mono font-bold">{item.qrCode}</div>
                                    </td>

                                    {/* TUTOR */}
                                    <td className="py-4 px-6">
                                        <div className="font-bold text-slate-800">{item.tutorName}</div>
                                        <div className="text-xs text-slate-400">DNI: {item.tutorDni}</div>
                                    </td>

                                    {/* TIPO DE MOVIMIENTO */}
                                    <td className="py-4 px-6 whitespace-nowrap">
                                        {item.isOvertime ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-50 text-pokido-red border border-red-200">
                                                ⚠️ Cobro de Recargo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                🎟️ Entrada Estándar
                                            </span>
                                        )}
                                    </td>

                                    {/* MONTO Y MÉTODO */}
                                    <td className="py-4 px-6 whitespace-nowrap">
                                        <div className="font-extrabold text-slate-900">${item.amount.toLocaleString("es-CL")}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">{item.paymentMethod}</div>
                                    </td>

                                    {/* ESTADO DINÁMICO */}
                                    <td className="py-4 px-6 text-right whitespace-nowrap">
                                        {item.realStatus === "USED" && (
                                            <span className="inline-block text-[10px] font-extrabold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full uppercase">
                                                🚪 Salida Registrada
                                            </span>
                                        )}

                                        {item.realStatus === "WAITING" && (
                                            <span className="inline-block text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full uppercase">
                                                ⏳ En Espera (Turno {item.startTime ? new Date(item.startTime).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }) : ""} hs)
                                            </span>
                                        )}

                                        {item.realStatus === "PLAYING" && (
                                            <span className="inline-block text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase">
                                                🟢 En Pista / Activo
                                            </span>
                                        )}

                                        {item.realStatus === "EXPIRED" && (
                                            <span className="inline-block text-[10px] font-extrabold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full uppercase">
                                                ⚠️ Tiempo Excedido
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}