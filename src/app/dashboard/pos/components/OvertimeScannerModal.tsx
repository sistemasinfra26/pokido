"use client"

import { useState } from "react"
import { findTicketByWristbandCode } from "@/app/actions/posActions"

interface OvertimeScannerModalProps {
    isOpen: boolean
    onClose: () => void
    onAddOvertimeFeeToCart: (data: {
        customerId: string
        customerName: string
        customerDni: string
        minorId: string
        minorName: string
        wristbandCode: string
        overtimeMinutes: number
        penaltyFee: number
    }) => void
}

export function OvertimeScannerModal({ isOpen, onClose, onAddOvertimeFeeToCart }: OvertimeScannerModalProps) {
    const [code, setCode] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [scannedData, setScannedData] = useState<any>(null)

    if (!isOpen) return null

    const handleSearch = async () => {
        if (!code.trim()) return
        setLoading(true)
        setError("")
        setScannedData(null)

        const res = await findTicketByWristbandCode(code.trim().toUpperCase())

        if (res.success && res.ticket) {
            setScannedData(res.ticket)
        } else {
            setError(res.error || "No se encontró un ticket activo vinculado a esta pulsera.")
        }
        setLoading(false)
    }

    const handleConfirmFee = () => {
        if (!scannedData) return

        onAddOvertimeFeeToCart({
            customerId: scannedData.customerId,
            customerName: scannedData.customerName,
            customerDni: scannedData.customerDni,
            minorId: scannedData.minorId,
            minorName: scannedData.minorName,
            wristbandCode: scannedData.wristbandCode,
            overtimeMinutes: scannedData.overtimeMinutes,
            penaltyFee: scannedData.penaltyFee,
        })

        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-6">

                {/* CABECERA */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <span>⚠️</span> Cobro de Recargo por Exceso de Tiempo
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">
                        ✕
                    </button>
                </div>

                {/* BUSCADOR POR ESCANEO DE PULSERA */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 block">Escanear o Digitar Código de Pulsera *</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Ej: PKD-839210"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                            autoFocus
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-pokido-red text-slate-900 uppercase font-bold"
                        />
                        <button
                            type="button"
                            onClick={handleSearch}
                            disabled={loading}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 rounded-2xl text-xs transition cursor-pointer"
                        >
                            {loading ? "Buscando..." : "🔍 Buscar"}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-600 font-bold text-xs rounded-xl">
                        {error}
                    </div>
                )}

                {/* FICHA TÉCNICA DEL EXCESO ENCONTRADO */}
                {scannedData && (
                    <div className="p-4 bg-red-50/60 border border-red-200 rounded-2xl space-y-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-red-500 font-bold uppercase tracking-wider">Menor Identificado</p>
                                <p className="text-base font-black text-slate-900">👦 {scannedData.minorName}</p>
                                <p className="text-xs text-slate-500 font-medium">Tutor: {scannedData.customerName} (DNI: {scannedData.customerDni})</p>
                            </div>
                            <span className="font-mono text-xs font-black bg-white border border-red-200 px-2.5 py-1 rounded-lg text-slate-700">
                                {scannedData.wristbandCode}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-red-200/60 text-xs">
                            <div>
                                <span className="text-slate-500 block font-medium">Tiempo Excedido:</span>
                                <span className="font-black text-red-600 text-sm">+{scannedData.overtimeMinutes} min</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block font-medium">Monto Recargo:</span>
                                <span className="font-black text-pokido-green text-sm">${scannedData.penaltyFee.toLocaleString("es-CL")}</span>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleConfirmFee}
                            className="w-full bg-pokido-red hover:bg-red-700 text-white font-black py-3 rounded-xl transition text-xs shadow-md shadow-red-200 cursor-pointer"
                        >
                            ➕ Cargar Recargo al Carrito
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}