"use client"

import { useEffect, useState } from "react"
import { getWristbandColorForTime, WRISTBAND_COLORS, WristbandColorDef } from "@/lib/wristbandLogic"
import { getTicketTypes } from "@/app/actions/ticketTypeActions"

interface TicketTypeItem {
    id: string
    name: string
    durationMinutes: number
    price: number
}

export interface MinorFormEntry {
    id: string
    fullName: string
    age: string
    wristbandCode: string
    medicalNotes: string
}

interface MinorTicketStepProps {
    ticketType: string
    setTicketType: (val: string) => void
    setTicketPrice: (val: number) => void
    entryTime: string
    setEntryTime: (val: string) => void
    selectedColorId: number
    setSelectedColorId: (val: number) => void
    onAddMultipleMinorsToCart: (minors: MinorFormEntry[]) => void
}

const timeSlotsList = [
    "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "13:00", "13:30",
    "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30",
    "18:00", "18:30", "19:00", "19:30",
    "20:00", "20:30", "21:00", "21:30",
]

function parseDurationFromTicketType(typeStr: string): number {
    if (typeStr.includes("120")) return 120
    if (typeStr.includes("90")) return 90
    if (typeStr.includes("30")) return 30
    if (typeStr.includes("60")) return 60
    const match = typeStr.match(/(\d+)\s*min/i)
    return match && match[1] ? Number(match[1]) : 60
}

export function MinorTicketStep({
    ticketType,
    setTicketType,
    setTicketPrice,
    entryTime,
    setEntryTime,
    selectedColorId,
    setSelectedColorId,
    onAddMultipleMinorsToCart,
}: MinorTicketStepProps) {
    const [ticketTypesList, setTicketTypesList] = useState<TicketTypeItem[]>([])

    // 🔑 Estado dinámico para manejar 1 o N niños simultáneamente en el formulario
    const [minorsList, setMinorsList] = useState<MinorFormEntry[]>([
        { id: "1", fullName: "", age: "", wristbandCode: "", medicalNotes: "" },
    ])

    useEffect(() => {
        async function loadTypes() {
            const res = await getTicketTypes()

            //  FIX: Evalúa res.ticketTypes o res.data de forma segura
            const typesArray = res.success ? (res.ticketTypes || (res as any).data) : null

            if (typesArray) {
                const formattedTypes = typesArray.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    durationMinutes: item.durationMinutes,
                    price: Number(item.price),
                }))
                setTicketTypesList(formattedTypes)
            }
        }
        loadTypes()
    }, [])

    const duration = parseDurationFromTicketType(ticketType)

    useEffect(() => {
        const found = ticketTypesList.find((t) => t.durationMinutes === duration)
        if (found) {
            const expectedTypeStr = `${found.name} ($${found.price.toLocaleString("es-CL")})`
            if (ticketType !== expectedTypeStr) setTicketType(expectedTypeStr)
            setTicketPrice(found.price)
        } else {
            if (duration === 120) setTicketPrice(14000)
            else if (duration === 90) setTicketPrice(11500)
            else if (duration === 30) setTicketPrice(5000)
            else setTicketPrice(8500)
        }
    }, [duration, ticketTypesList, setTicketPrice, setTicketType, ticketType])

    useEffect(() => {
        if (entryTime) {
            const calculated = getWristbandColorForTime(entryTime, duration)
            setSelectedColorId(calculated.id)
        }
    }, [entryTime, duration, setSelectedColorId])

    // Funciones para manipular la lista de niños
    const handleAddChildRow = () => {
        setMinorsList((prev) => [
            ...prev,
            { id: Date.now().toString(), fullName: "", age: "", wristbandCode: "", medicalNotes: "" },
        ])
    }

    const handleRemoveChildRow = (id: string) => {
        if (minorsList.length === 1) return
        setMinorsList((prev) => prev.filter((item) => item.id !== id))
    }

    const handleUpdateChildField = (id: string, field: keyof MinorFormEntry, value: string) => {
        setMinorsList((prev) =>
            prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
        )
    }

    const handleSubmitAllToCart = () => {
        const validMinors = minorsList.filter((m) => m.fullName.trim() !== "")
        if (validMinors.length === 0) return

        onAddMultipleMinorsToCart(validMinors)

        // Resetea el formulario dejando una sola fila limpia
        setMinorsList([{ id: Date.now().toString(), fullName: "", age: "", wristbandCode: "", medicalNotes: "" }])
    }

    const activeColorObj: WristbandColorDef = WRISTBAND_COLORS[selectedColorId] || WRISTBAND_COLORS[1]
    const hasValidMinors = minorsList.some((m) => m.fullName.trim() !== "")

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-pokido-purple text-white text-xs flex items-center justify-center font-black">2</span>
                    Asignación de Pase y Niños
                </h2>

                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${activeColorObj.badgeClass}`}>
                    <span className={`w-3 h-3 rounded-full ${activeColorObj.bgClass} border border-black/10`} />
                    <span>Pulsera Sugerida: Color {activeColorObj.id}</span>
                </div>
            </div>

            {/* CONFIGURACIÓN GLOBAL DE TURNO Y TICKET */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Pase / Tarifa Configurada</label>
                    <select
                        value={ticketType}
                        onChange={(e) => setTicketType(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pokido-purple font-medium text-slate-800"
                    >
                        {ticketTypesList.length > 0 ? (
                            ticketTypesList.map((type) => (
                                <option key={type.id} value={`${type.name} ($${type.price.toLocaleString("es-CL")})`}>
                                    {type.name} (${type.price.toLocaleString("es-CL")})
                                </option>
                            ))
                        ) : (
                            <>
                                <option value="Pase 30 Minutos ($5.000)">Pase 30 Minutos ($5.000)</option>
                                <option value="Pase 60 Minutos ($8.500)">Pase 60 Minutos ($8.500)</option>
                                <option value="Pase 90 Minutos ($11.500)">Pase 90 Minutos ($11.500)</option>
                                <option value="Pase 120 Minutos ($14.000)">Pase 120 Minutos ($14.000)</option>
                            </>
                        )}
                    </select>
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Horario de Turno</label>
                    <select
                        value={entryTime}
                        onChange={(e) => setEntryTime(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pokido-purple font-medium text-slate-800"
                    >
                        {timeSlotsList.map((slot) => (
                            <option key={slot} value={slot}>Turno {slot} hs</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* LISTA DINÁMICA DE NIÑOS */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                        Datos de los Niños ({minorsList.length})
                    </label>
                    <button
                        type="button"
                        onClick={handleAddChildRow}
                        className="text-xs font-bold text-pokido-purple hover:text-pokido-purple/80 bg-pokido-purple/10 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                        <span>➕</span> Agregar Otro Niño
                    </button>
                </div>

                {minorsList.map((child, index) => (
                    <div key={child.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 relative">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-slate-400">Niño #{index + 1}</span>
                            {minorsList.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveChildRow(child.id)}
                                    className="text-xs font-bold text-red-500 hover:text-red-700 cursor-pointer"
                                >
                                    ✕ Quitar
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                                <input
                                    type="text"
                                    placeholder="Nombre del Niño/a *"
                                    value={child.fullName}
                                    onChange={(e) => handleUpdateChildField(child.id, "fullName", e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pokido-purple"
                                />
                            </div>

                            <div>
                                <input
                                    type="number"
                                    placeholder="Edad (Años)"
                                    value={child.age}
                                    onChange={(e) => handleUpdateChildField(child.id, "age", e.target.value)}
                                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pokido-purple"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <input
                                type="text"
                                placeholder="Código Pulsera (Opcional)"
                                value={child.wristbandCode}
                                onChange={(e) => handleUpdateChildField(child.id, "wristbandCode", e.target.value.toUpperCase())}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-pokido-purple"
                            />

                            <input
                                type="text"
                                placeholder="Observaciones / Notas Médicas"
                                value={child.medicalNotes}
                                onChange={(e) => handleUpdateChildField(child.id, "medicalNotes", e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pokido-purple"
                            />
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                disabled={!hasValidMinors}
                onClick={handleSubmitAllToCart}
                className="w-full bg-pokido-cyan hover:bg-pokido-cyan/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition shadow-lg shadow-pokido-cyan/20 text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
                <span>🛒</span> Agregar ({minorsList.filter(m => m.fullName.trim() !== "").length}) Niño(s) al Carrito
            </button>
        </div>
    )
}