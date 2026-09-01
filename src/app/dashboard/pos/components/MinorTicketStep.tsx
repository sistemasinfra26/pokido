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

interface MinorTicketStepProps {
    minorName: string
    setMinorName: (val: string) => void
    minorAge: string
    setMinorAge: (val: string) => void
    ticketType: string
    setTicketType: (val: string) => void
    setTicketPrice: (val: number) => void
    wristbandCode: string
    setWristbandCode: (val: string) => void
    entryTime: string
    setEntryTime: (val: string) => void
    selectedColorId: number
    setSelectedColorId: (val: number) => void
    medicalNotes?: string
    setMedicalNotes?: (val: string) => void
    onAddMinorToCart: () => void
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
    if (match && match[1]) {
        return Number(match[1])
    }

    return 60
}

export function MinorTicketStep({
    minorName,
    setMinorName,
    minorAge,
    setMinorAge,
    ticketType,
    setTicketType,
    setTicketPrice,
    wristbandCode,
    setWristbandCode,
    entryTime,
    setEntryTime,
    selectedColorId,
    setSelectedColorId,
    medicalNotes = "",
    setMedicalNotes,
    onAddMinorToCart,
}: MinorTicketStepProps) {
    const [ticketTypesList, setTicketTypesList] = useState<TicketTypeItem[]>([])

    // 1. Cargar tarifas de la base de datos
    useEffect(() => {
        async function loadTypes() {
            const res = await getTicketTypes()
            if (res.success && res.ticketTypes) {
                const formattedTypes = res.ticketTypes.map((item: any) => ({
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

    // 2. Sincronizar automáticamente el selector con la lista configurada cuando cambia la duración
    useEffect(() => {
        const found = ticketTypesList.find((t) => t.durationMinutes === duration)
        if (found) {
            const expectedTypeStr = `${found.name} ($${found.price.toLocaleString("es-CL")})`
            if (ticketType !== expectedTypeStr) {
                setTicketType(expectedTypeStr)
            }
            setTicketPrice(found.price)
        } else {
            if (duration === 120) setTicketPrice(14000)
            else if (duration === 90) setTicketPrice(11500)
            else if (duration === 30) setTicketPrice(5000)
            else setTicketPrice(8500)
        }
    }, [duration, ticketTypesList, setTicketPrice, setTicketType, ticketType])

    // 3. Recalcular la pulsera sugerida
    useEffect(() => {
        if (entryTime) {
            const calculated = getWristbandColorForTime(entryTime, duration)
            setSelectedColorId(calculated.id)
        }
    }, [entryTime, duration, setSelectedColorId])

    const isFormValid = minorName.trim() !== "" && wristbandCode.trim() !== ""
    const activeColorObj: WristbandColorDef = WRISTBAND_COLORS[selectedColorId] || WRISTBAND_COLORS[1]

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-pokido-purple text-white text-xs flex items-center justify-center font-black">2</span>
                    Asignación de Pase, Horario y Pulsera
                </span>

                <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 ${activeColorObj.badgeClass}`}>
                    <span className={`w-3 h-3 rounded-full ${activeColorObj.bgClass} border border-black/10`} />
                    <span>Pulsera: Color {activeColorObj.id}</span>
                </div>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* NOMBRE Y EDAD */}
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Nombre del Niño/a *</label>
                    <input
                        type="text"
                        placeholder="Ej. Lucas Gómez"
                        value={minorName}
                        onChange={(e) => setMinorName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pokido-purple font-medium text-slate-800"
                    />
                </div>

                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Edad</label>
                    <input
                        type="number"
                        placeholder="Ej. 7"
                        value={minorAge}
                        onChange={(e) => setMinorAge(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pokido-purple font-medium text-slate-800"
                    />
                </div>

                {/* PASE / DURACIÓN DINÁMICO */}
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Pase / Tarifa Configurada</label>
                    <select
                        value={ticketType}
                        onChange={(e) => setTicketType(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pokido-purple font-medium text-slate-800"
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

                {/* HORARIO DE INGRESO */}
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Horario de Turno</label>
                    <select
                        value={entryTime}
                        onChange={(e) => setEntryTime(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pokido-purple font-medium text-slate-800"
                    >
                        {timeSlotsList.map((slot) => (
                            <option key={slot} value={slot}>
                                Turno {slot} hs
                            </option>
                        ))}
                    </select>
                </div>

                {/* SELECTOR Y CAMBIO MANUAL DE COLOR */}
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Color de Pulsera Asignado</label>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4].map((id) => {
                            const col = WRISTBAND_COLORS[id]
                            const isSelected = selectedColorId === id
                            return (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => setSelectedColorId(id)}
                                    className={`flex-1 py-2.5 rounded-xl border font-extrabold text-xs transition flex items-center justify-center gap-1 cursor-pointer ${isSelected
                                            ? `${col.badgeClass} ring-2 ring-slate-900 border-transparent shadow-sm`
                                            : "bg-slate-50 border-slate-200 text-slate-400 opacity-60 hover:opacity-100"
                                        }`}
                                >
                                    <span className={`w-3 h-3 rounded-full ${col.bgClass}`} />
                                    <span>Color {id}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* CÓDIGO DE PULSERA / ESCÁNER */}
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Código / Pulsera Física (Escanear) *</label>
                    <input
                        type="text"
                        placeholder="Ej. PK-099"
                        value={wristbandCode}
                        onChange={(e) => setWristbandCode(e.target.value)}
                        className="w-full bg-slate-50 border border-pokido-cyan/50 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pokido-cyan font-bold text-pokido-cyan uppercase"
                    />
                </div>
            </div>

            {/* NOTAS MÉDICAS */}
            {setMedicalNotes && (
                <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Notas Médicas / Observaciones (Opcional)</label>
                    <input
                        type="text"
                        placeholder="Ej. Alergia al maní, usa lentes, etc."
                        value={medicalNotes}
                        onChange={(e) => setMedicalNotes(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-pokido-purple font-medium text-slate-800"
                    />
                </div>
            )}

            <button
                type="button"
                disabled={!isFormValid}
                onClick={onAddMinorToCart}
                className="w-full bg-pokido-cyan hover:bg-pokido-cyan/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl transition shadow-lg shadow-pokido-cyan/20 text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
                <span>➕</span> Agregar Niño al Carrito
            </button>
        </div>
    )
}