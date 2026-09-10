"use client"

import { getWristbandColorForTime } from "@/lib/wristbandLogic"

export interface IssuedReceiptTicket {
    id: string
    qrCode: string
    price: number
    startTime: string
    endTime: string
    minorName: string
    durationMinutes: number
    wristbandCode: string
}

export interface SaleReceiptData {
    orderId: string
    orderNumber: string
    total: number
    paymentMethod: string
    createdAt: Date | string
    customerName: string
    customerDni: string
    tickets: IssuedReceiptTicket[]
}

interface ReceiptModalProps {
    isOpen: boolean
    onClose: () => void
    receiptData: SaleReceiptData | null
}

export function ReceiptModal({ isOpen, onClose, receiptData }: ReceiptModalProps) {
    if (!isOpen || !receiptData) return null

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-6 flex flex-col max-h-[90vh]">

                {/* CABECERA CONTROLES */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 no-print">
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                        <span>✅</span> Comprobante Generado
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* RECIBO FORMATEADO PARA TICKET TÉRMICO (58mm/80mm) */}
                <div id="printable-receipt" className="overflow-y-auto space-y-4 text-slate-800 font-mono text-xs p-4 bg-slate-50 border border-slate-200 rounded-2xl">

                    <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                        <h1 className="text-base font-black uppercase tracking-wider font-sans text-slate-900">
                            POKIDOPARK
                        </h1>
                        <p className="text-[10px] text-slate-500">Trampoline Park & Fun</p>
                        <p className="text-[10px] font-bold text-slate-700">{receiptData.orderNumber}</p>
                        <p className="text-[10px] text-slate-400">
                            {new Date(receiptData.createdAt).toLocaleString("es-CL")}
                        </p>
                    </div>

                    <div className="pb-3 border-b border-dashed border-slate-300 space-y-0.5">
                        <p className="font-bold text-slate-900 font-sans">Tutor / Cliente:</p>
                        <p>{receiptData.customerName}</p>
                        <p className="text-slate-500">DNI: {receiptData.customerDni}</p>
                    </div>

                    <div className="space-y-3 pb-3 border-b border-dashed border-slate-300">
                        <p className="font-bold text-slate-900 font-sans">Detalle del Pase:</p>
                        {receiptData.tickets.map((t) => {
                            const startObj = new Date(t.startTime)
                            const timeStr = `${String(startObj.getHours()).padStart(2, "0")}:${String(startObj.getMinutes()).padStart(2, "0")}`
                            const colorObj = getWristbandColorForTime(timeStr, t.durationMinutes)
                            const isPenalty = t.durationMinutes === 0 || (t.wristbandCode && t.wristbandCode.includes("REC"))

                            return (
                                <div key={t.id} className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                                    <div className="flex justify-between font-bold text-slate-900 font-sans">
                                        <span>👦 {t.minorName}</span>
                                        <span>${t.price.toLocaleString("es-CL")}</span>
                                    </div>

                                    {isPenalty ? (
                                        <div className="text-[10px] font-black text-red-600 bg-red-50 p-1 rounded text-center border border-red-100">
                                            ⚠️ RECARGO POR EXCESO DE TIEMPO
                                        </div>
                                    ) : (
                                        <div className="text-[11px] text-slate-600">
                                            Duración: {t.durationMinutes} Min (Ingreso: {timeStr} hs)
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-1">
                                        {!isPenalty && (
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black border ${colorObj.badgeClass}`}>
                                                <span className={`w-2 h-2 rounded-full ${colorObj.bgClass}`} />
                                                {colorObj.label}
                                            </span>
                                        )}
                                        <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded ml-auto">
                                            Cod: {t.wristbandCode}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="space-y-1 pt-1 font-sans">
                        <div className="flex justify-between text-xs text-slate-600">
                            <span>Medio de Pago:</span>
                            <span className="font-bold">{receiptData.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-200">
                            <span>TOTAL:</span>
                            <span className="text-pokido-green">${receiptData.total.toLocaleString("es-CL")}</span>
                        </div>
                    </div>

                    <div className="text-center text-[9px] text-slate-400 pt-3">
                        ¡Gracias por tu visita!
                        <br />
                        Conserva esta pulsera durante la estadía.
                    </div>
                </div>

                {/* BOTONES */}
                <div className="flex gap-3 no-print">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl transition text-xs cursor-pointer"
                    >
                        Cerrar
                    </button>
                    <button
                        type="button"
                        onClick={handlePrint}
                        className="flex-1 bg-pokido-purple hover:bg-pokido-purple/90 text-white font-bold py-3 rounded-2xl transition text-xs shadow-lg shadow-pokido-purple/20 cursor-pointer flex items-center justify-center gap-2"
                    >
                        <span>🖨️</span> Imprimir
                    </button>
                </div>
            </div>

            {/* ESTILOS EXCLUSIVOS PARA IMPRESIÓN */}
            <style jsx global>{`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .no-print {
                        display: none !important;
                    }
                    #printable-receipt, #printable-receipt * {
                        visibility: visible;
                    }
                    #printable-receipt {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        border: none !important;
                        background: white !important;
                        padding: 0 !important;
                    }
                }
            `}</style>
        </div>
    )
}