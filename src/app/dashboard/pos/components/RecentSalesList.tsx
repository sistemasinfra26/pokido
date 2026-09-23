"use client"

import { useState, useEffect } from "react"
import { getRecentOrders } from "@/app/actions/posActions"
import { SaleReceiptData } from "./ReceiptModal"

// 🔑 Extendemos la interfaz para soportar los estados del servidor
export interface ExtendedSaleReceiptData extends SaleReceiptData {
    status?: string
}

interface RecentSalesListProps {
    onSelectReceiptToPrint: (receipt: SaleReceiptData) => void
}

export function RecentSalesList({ onSelectReceiptToPrint }: RecentSalesListProps) {
    const [orders, setOrders] = useState<ExtendedSaleReceiptData[]>([])
    const [loading, setLoading] = useState(false)

    const fetchOrders = async () => {
        setLoading(true)
        const res = await getRecentOrders(10)
        if (res.success && res.orders) {
            setOrders(res.orders as ExtendedSaleReceiptData[])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>🧾</span> Últimas Ventas y Reservas Web
                </h2>
                <button
                    type="button"
                    onClick={fetchOrders}
                    className="text-xs font-bold text-pokido-purple hover:underline cursor-pointer flex items-center gap-1"
                >
                    🔄 Actualizar
                </button>
            </div>

            {loading ? (
                <div className="text-center py-6 text-xs text-slate-400 font-bold animate-pulse">
                    Cargando historial de tickets...
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 font-medium">
                    No hay ventas registradas recientemente
                </div>
            ) : (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1 space-y-1">
                    {orders.map((order) => {
                        const isPending = order.status === "PENDING"
                        const isCancelled = order.status === "CANCELLED"

                        return (
                            <div
                                key={order.orderId}
                                className={`py-3 flex items-center justify-between text-xs px-3 rounded-2xl transition border ${isPending
                                        ? "bg-amber-50/70 border-amber-200/90"
                                        : isCancelled
                                            ? "bg-rose-50/60 border-rose-200/80 opacity-60"
                                            : "bg-white border-transparent hover:bg-slate-50"
                                    }`}
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-slate-900">{order.orderNumber}</span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {new Date(order.createdAt).toLocaleTimeString("es-CL", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })} hs
                                        </span>

                                        {/* 🔑 BADGES DE ESTADO */}
                                        {isPending && (
                                            <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-md">
                                                ⏳ WEB PENDIENTE (MP)
                                            </span>
                                        )}
                                        {isCancelled && (
                                            <span className="text-[9px] font-extrabold bg-rose-100 text-rose-700 border border-rose-300 px-2 py-0.5 rounded-md">
                                                ✕ EXPIRADO
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-slate-500 font-medium text-[11px]">
                                        Tutor: <strong className="text-slate-700">{order.customerName}</strong> ({order.tickets.length} {order.tickets.length === 1 ? "pase" : "pases"})
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <span className="font-black text-pokido-green text-sm block">
                                            ${order.total.toLocaleString("es-CL")}
                                        </span>
                                    </div>

                                    {/* 🔑 SOLO PERMITE VER/REIMPRIMIR COMPROBANTE SI LA ORDEN FUE PAGADA */}
                                    {!isPending && !isCancelled ? (
                                        <button
                                            type="button"
                                            onClick={() => onSelectReceiptToPrint(order)}
                                            className="bg-slate-100 hover:bg-pokido-purple hover:text-white text-slate-700 px-3 py-1.5 rounded-xl transition font-bold cursor-pointer flex items-center gap-1 text-[11px] border border-slate-200/80 shadow-sm"
                                            title="Reimprimir Comprobante"
                                        >
                                            <span>🖨️</span> Reimprimir
                                        </button>
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl">
                                            Sin Recibo
                                        </span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}