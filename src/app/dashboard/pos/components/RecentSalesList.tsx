"use client"

import { useState, useEffect } from "react"
import { getRecentOrders } from "@/app/actions/posActions"
import { SaleReceiptData } from "./ReceiptModal"

interface RecentSalesListProps {
    onSelectReceiptToPrint: (receipt: SaleReceiptData) => void
}

export function RecentSalesList({ onSelectReceiptToPrint }: RecentSalesListProps) {
    const [orders, setOrders] = useState<SaleReceiptData[]>([])
    const [loading, setLoading] = useState(false)

    const fetchOrders = async () => {
        setLoading(true)
        const res = await getRecentOrders(10)
        if (res.success && res.orders) {
            setOrders(res.orders as SaleReceiptData[])
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
                    <span>🧾</span> Últimas Ventas y Reimpresión
                </h2>
                <button
                    type="button"
                    onClick={fetchOrders}
                    className="text-xs font-bold text-pokido-purple hover:underline cursor-pointer"
                >
                    🔄 Actualizar
                </button>
            </div>

            {loading ? (
                <div className="text-center py-6 text-xs text-slate-400 font-bold">
                    Cargando historial de tickets...
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 font-medium">
                    No hay ventas registradas recientemente
                </div>
            ) : (
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {orders.map((order) => (
                        <div
                            key={order.orderId}
                            className="py-3 flex items-center justify-between text-xs hover:bg-slate-50 px-2 rounded-xl transition"
                        >
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="font-black text-slate-900">{order.orderNumber}</span>
                                    <span className="text-[10px] text-slate-400">
                                        {new Date(order.createdAt).toLocaleTimeString("es-CL", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })} hs
                                    </span>
                                </div>
                                <div className="text-slate-500 font-medium">
                                    Tutor: <strong className="text-slate-700">{order.customerName}</strong> ({order.tickets.length} pases)
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="font-black text-pokido-green text-sm">
                                    ${order.total.toLocaleString("es-CL")}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onSelectReceiptToPrint(order)}
                                    className="bg-slate-100 hover:bg-pokido-purple hover:text-white text-slate-700 p-2 rounded-xl transition font-bold cursor-pointer flex items-center gap-1 text-[11px]"
                                    title="Reimprimir Comprobante"
                                >
                                    <span>🖨️</span> Ver / Reimprimir
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}