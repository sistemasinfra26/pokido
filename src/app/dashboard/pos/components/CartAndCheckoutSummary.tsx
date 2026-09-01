"use client"

import { useState } from "react"
import { processPosSale } from "@/app/actions/posActions"
import { PaymentMethod } from "@prisma/client"

export interface CartItem {
    minorName: string
    minorAge: number
    ticketTypeId: string
    durationMinutes: number
    price: number
    wristbandCode: string
    entryTime: string
}

interface CartAndCheckoutSummaryProps {
    selectedCustomer: { id: string; name: string } | null
    selectedMinors: CartItem[]
    paymentMethod: PaymentMethod
    setPaymentMethod: (method: PaymentMethod) => void
    totalAmount: number
    onSuccessSale: () => void
}

export function CartAndCheckoutSummary({
    selectedCustomer,
    selectedMinors,
    paymentMethod,
    setPaymentMethod,
    totalAmount,
    onSuccessSale,
}: CartAndCheckoutSummaryProps) {
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")

    const handleCheckout = async () => {
        if (!selectedCustomer) {
            setErrorMsg("Debe seleccionar o buscar un tutor primero.")
            return
        }

        if (selectedMinors.length === 0) {
            setErrorMsg("Debe agregar al menos un niño al carrito.")
            return
        }

        setLoading(true)
        setErrorMsg("")

        try {
            const payload = {
                customerId: selectedCustomer.id,
                staffProfileId: "STAFF-DEMO-01", // Cambiar por ID de sesión activa en Supabase/Auth
                paymentMethod,
                items: selectedMinors,
            }

            const res = await processPosSale(payload)

            if (res.success) {
                alert(`¡Pago Procesado con éxito! Orden: ${res.orderNumber}`)
                onSuccessSale()
            } else {
                setErrorMsg(res.error || "Error al completar la transacción.")
            }
        } catch (err: any) {
            setErrorMsg(err.message || "Ocurrió un error inesperado al cobrar.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
                <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-4">
                    🛒 Resumen de la Orden
                </h2>

                {selectedMinors.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-xs">
                        No hay pases agregados aún
                    </div>
                ) : (
                    <div className="space-y-3">
                        {selectedMinors.map((item, index) => (
                            <div key={index} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                                <div>
                                    <div className="font-bold text-slate-900">
                                        {item.minorName || "Niño sin nombre"} {item.minorAge ? `(${item.minorAge} años)` : ""}
                                    </div>
                                    <div className="text-slate-500 font-medium">
                                        Pase {item.durationMinutes || 60} min
                                    </div>
                                    <div className="text-pokido-cyan font-mono font-bold mt-0.5">
                                        Pulsera: {item.wristbandCode}
                                    </div>
                                </div>
                                <div className="font-black text-slate-900 text-sm">
                                    ${item.price.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="space-y-4 border-t border-slate-100 pt-4">
                {errorMsg && (
                    <div className="p-3 bg-pokido-red/10 border border-pokido-red/20 text-pokido-red font-bold text-xs rounded-xl">
                        {errorMsg}
                    </div>
                )}

                <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 block">Método de Pago</label>
                    <div className="grid grid-cols-3 gap-2">
                        {(["CASH", "CREDIT_CARD", "QR_DIGITAL"] as PaymentMethod[]).map((method) => (
                            <button
                                key={method}
                                type="button"
                                onClick={() => setPaymentMethod(method)}
                                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${paymentMethod === method
                                    ? "bg-pokido-purple text-white border-pokido-purple shadow-sm"
                                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                    }`}
                            >
                                {method === "CASH" ? "Efectivo" : method === "CREDIT_CARD" ? "Tarjeta" : "QR Digital"}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase">TOTAL A COBRAR:</span>
                    <span className="text-2xl font-black text-pokido-green">
                        ${totalAmount.toLocaleString()}
                    </span>
                </div>

                <button
                    type="button"
                    disabled={loading || selectedMinors.length === 0}
                    onClick={handleCheckout}
                    className="w-full bg-pokido-green hover:bg-pokido-green/90 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition shadow-xl shadow-pokido-green/20 text-base flex items-center justify-center gap-2 cursor-pointer"
                >
                    {loading ? "Procesando..." : "💳 Procesar Pago y Emitir Tickets"}
                </button>
            </div>
        </div>
    )
}