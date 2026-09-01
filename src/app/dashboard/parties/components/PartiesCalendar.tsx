"use client"

import { useState, useEffect } from "react"
import { getMonthlyBookings } from "@/app/actions/partyActions"

export interface CalendarBooking {
    id: string
    birthdayChild: string
    childAge: number
    guestCount: number
    dateStr: string
    startTime: string
    endTime: string
    status: string
    roomName: string
    roomId?: string | null
    customerName: string
    customerPhone: string
    customerDni: string
}

const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
]

const DAYS_OF_WEEK = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]

export function PartiesCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [bookings, setBookings] = useState<CalendarBooking[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedBooking, setSelectedBooking] = useState<CalendarBooking | null>(null)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() // 0 a 11

    const loadBookings = async () => {
        setLoading(true)
        const res = await getMonthlyBookings(year, month + 1)
        setLoading(false)
        if (res.success && res.bookings) {
            setBookings(res.bookings as any)
        }
    }

    useEffect(() => {
        loadBookings()
    }, [year, month])

    // Navegación de meses
    const handlePrevMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1))
    }

    const handleNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1))
    }

    const handleToday = () => {
        setCurrentDate(new Date())
    }

    // Generar días del mes para el grid
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const calendarCells = []

    // Días en blanco iniciales
    for (let i = 0; i < firstDayOfMonth; i++) {
        calendarCells.push(null)
    }

    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
        const monthStr = String(month + 1).padStart(2, "0")
        const dayStr = String(day).padStart(2, "0")
        const fullDateStr = `${year}-${monthStr}-${dayStr}`

        const dayBookings = bookings.filter((b) => b.dateStr === fullDateStr)

        calendarCells.push({
            day,
            dateStr: fullDateStr,
            bookings: dayBookings,
            isToday:
                new Date().toISOString().split("T")[0] === fullDateStr,
        })
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
            {/* HEADER DE NAVEGACIÓN DE MESES */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span>📅</span> Cronograma Mensual de Eventos
                    </h2>
                    <p className="text-xs text-slate-400 font-medium">
                        Consulta los cumpleaños y reservas programadas a futuro.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleToday}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
                    >
                        Hoy
                    </button>
                    <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                        <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="px-3 py-1.5 rounded-xl text-xs font-black hover:bg-white transition cursor-pointer text-slate-700"
                        >
                            ◀
                        </button>
                        <span className="px-4 text-xs font-black text-slate-900 min-w-[130px] text-center">
                            {MONTH_NAMES[month]} {year}
                        </span>
                        <button
                            type="button"
                            onClick={handleNextMonth}
                            className="px-3 py-1.5 rounded-xl text-xs font-black hover:bg-white transition cursor-pointer text-slate-700"
                        >
                            ▶
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-xs font-bold text-slate-400 animate-pulse">
                    Cargando reservas de {MONTH_NAMES[month]}...
                </div>
            ) : (
                /* GRID DE CALENDARIO */
                <div className="grid grid-cols-7 gap-2">
                    {/* NOMBRES DÍAS DE LA SEMANA */}
                    {DAYS_OF_WEEK.map((d) => (
                        <div
                            key={d}
                            className="text-center text-[11px] font-black text-slate-400 uppercase py-2"
                        >
                            {d}
                        </div>
                    ))}

                    {/* CELDAS DE DÍAS */}
                    {calendarCells.map((cell, idx) => {
                        if (!cell) {
                            return <div key={`empty-${idx}`} className="bg-slate-50/50 rounded-2xl min-h-[100px]" />
                        }

                        return (
                            <div
                                key={cell.dateStr}
                                className={`min-h-[110px] p-2.5 rounded-2xl border flex flex-col justify-between transition ${cell.isToday
                                        ? "bg-pokido-purple/5 border-pokido-purple/30 ring-2 ring-pokido-purple/20"
                                        : cell.bookings.length > 0
                                            ? "bg-white border-slate-200 shadow-xs"
                                            : "bg-slate-50/30 border-slate-100"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span
                                        className={`text-xs font-black w-6 h-6 rounded-full flex items-center justify-center ${cell.isToday
                                                ? "bg-pokido-purple text-white"
                                                : "text-slate-700"
                                            }`}
                                    >
                                        {cell.day}
                                    </span>
                                    {cell.bookings.length > 0 && (
                                        <span className="text-[10px] font-black text-pokido-purple bg-pokido-purple/10 border border-pokido-purple/20 px-1.5 py-0.5 rounded-md">
                                            {cell.bookings.length} Evento(s)
                                        </span>
                                    )}
                                </div>

                                {/* EVENTOS DEL DÍA */}
                                <div className="space-y-1 mt-1 overflow-y-auto max-h-[75px] scrollbar-none">
                                    {cell.bookings.map((booking) => (
                                        <button
                                            key={booking.id}
                                            type="button"
                                            onClick={() => setSelectedBooking(booking)}
                                            className="w-full text-left p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200/80 transition cursor-pointer block"
                                        >
                                            <div className="text-[10px] font-extrabold text-pokido-purple truncate">
                                                🕒 {booking.startTime} - {booking.birthdayChild}
                                            </div>
                                            <div className="text-[9px] text-slate-500 truncate font-medium">
                                                {booking.roomName}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* MODAL DETALLE DE LA RESERVA */}
            {selectedBooking && (
                <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-150">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                                <span>🎉</span> Ficha del Cumpleaños
                            </h3>
                            <button
                                type="button"
                                onClick={() => setSelectedBooking(null)}
                                className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 font-black text-xs flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="p-3 bg-pokido-purple/10 border border-pokido-purple/20 rounded-2xl space-y-1">
                                <span className="text-[10px] font-black uppercase text-pokido-purple block">
                                    {selectedBooking.roomName}
                                </span>
                                <div className="text-sm font-black text-slate-900">
                                    🎉 Cumpleaños de {selectedBooking.birthdayChild} ({selectedBooking.childAge} años)
                                </div>
                                <div className="text-xs font-bold text-slate-700">
                                    📅 Fecha: {selectedBooking.dateStr}
                                </div>
                                <div className="text-xs font-bold text-slate-700">
                                    🕒 Horario: {selectedBooking.startTime} a {selectedBooking.endTime} hs
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                <span className="text-[10px] font-black uppercase text-slate-400 block">
                                    Responsable / Tutor
                                </span>
                                <div className="font-bold text-slate-900">{selectedBooking.customerName}</div>
                                <div className="text-slate-500 font-mono">DNI: {selectedBooking.customerDni}</div>
                                <div className="text-slate-500">Teléfono: {selectedBooking.customerPhone || "Sin teléfono"}</div>
                            </div>

                            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-amber-800 text-[11px] font-bold">
                                🎟️ Cupos Retenidos de Aforo: {selectedBooking.guestCount} Niños
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => setSelectedBooking(null)}
                                className="w-full bg-slate-900 text-white font-bold py-3 rounded-2xl text-xs"
                            >
                                Cerrar Ficha
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}