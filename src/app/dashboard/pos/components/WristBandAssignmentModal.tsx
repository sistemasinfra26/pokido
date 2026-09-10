"use client"

import { useState, useRef, useEffect } from "react"

export interface PendingWristbandItem {
    ticketId: string
    minorName: string
    wristbandCode?: string
    assigned: boolean
}

interface WristbandAssignmentModalProps {
    orderNumber: string
    items: PendingWristbandItem[]
    onCompleteAssignment: (assignedItems: PendingWristbandItem[]) => void
}

export function WristbandAssignmentModal({
    orderNumber,
    items: initialItems,
    onCompleteAssignment,
}: WristbandAssignmentModalProps) {
    const [items, setItems] = useState<PendingWristbandItem[]>(initialItems)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [scannedCode, setScannedCode] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    const currentItem = items[currentIndex]

    // Autofocus automático para disparar la pistola láser
    useEffect(() => {
        inputRef.current?.focus()
    }, [currentIndex])

    // Asignación por Escaneo con Pistola Láser
    const handleScanCode = (code: string) => {
        if (!code.trim()) return
        const updated = [...items]
        updated[currentIndex] = {
            ...updated[currentIndex],
            wristbandCode: code.toUpperCase().trim(),
            assigned: true,
        }
        setItems(updated)
        setScannedCode("")

        if (currentIndex < items.length - 1) {
            setCurrentIndex(currentIndex + 1)
        }
    }

    // Asignación por Generación Automática (Para impresión al instante)
    const handleAutoGenerate = () => {
        const autoCode = `PKD-${Math.floor(100000 + Math.random() * 900000)}`
        handleScanCode(autoCode)
    }

    const allAssigned = items.every((i) => i.assigned)

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-6 animate-in fade-in zoom-in duration-200">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-pokido-purple bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                            Orden: #{orderNumber}
                        </span>
                        <h3 className="font-black text-slate-900 text-lg mt-1">
                            🏷️ Asignación de Pulseras Post-Pago
                        </h3>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                        {currentIndex + 1} de {items.length}
                    </span>
                </div>

                {!allAssigned ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-1">
                            <span className="text-xs font-bold text-slate-400 uppercase">Menor actual:</span>
                            <div className="text-xl font-black text-slate-900">{currentItem.minorName}</div>
                        </div>

                        {/* OPCIÓN 1: ESCANEAR PULSERA FÍSICA PRE-IMPRESA */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-600 block">
                                Opción 1: Escanear Pulsera Pre-impresa (Pistola Láser)
                            </label>
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Dispara la pistola láser sobre la pulsera..."
                                value={scannedCode}
                                onChange={(e) => setScannedCode(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault()
                                        handleScanCode(scannedCode)
                                    }
                                }}
                                className="w-full bg-cyan-50/50 border border-pokido-cyan rounded-2xl p-3.5 text-sm font-mono font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-pokido-cyan uppercase tracking-wider"
                            />
                        </div>

                        <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-slate-200"></div>
                            <span className="flex-shrink mx-3 text-slate-400 text-[10px] font-bold uppercase">o bien</span>
                            <div className="flex-grow border-t border-slate-200"></div>
                        </div>

                        {/* OPCIÓN 2: AUTOGENERAR E IMPRIMIR AL INSTANTE */}
                        <button
                            type="button"
                            onClick={handleAutoGenerate}
                            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-2xl text-xs transition shadow-md cursor-pointer flex items-center justify-center gap-2"
                        >
                            <span>🖨️</span> Generar e Imprimir Código Automático
                        </button>
                    </div>
                ) : (
                    <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                        <span className="text-3xl">🎉</span>
                        <h4 className="font-black text-emerald-900 text-base">
                            ¡Todas las pulseras han sido asignadas con éxito!
                        </h4>
                        <div className="space-y-1 text-xs text-emerald-800 text-left font-mono">
                            {items.map((item, idx) => (
                                <div key={idx} className="flex justify-between border-b border-emerald-200/50 pb-1">
                                    <span>{item.minorName}</span>
                                    <strong className="font-black">{item.wristbandCode}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {allAssigned && (
                    <button
                        type="button"
                        onClick={() => onCompleteAssignment(items)}
                        className="w-full py-4 bg-pokido-green hover:bg-pokido-green/90 text-white font-black rounded-2xl text-sm transition shadow-xl shadow-pokido-green/20 cursor-pointer"
                    >
                        ✓ Finalizar Orden y Entregar Pulseras
                    </button>
                )}
            </div>
        </div>
    )
}