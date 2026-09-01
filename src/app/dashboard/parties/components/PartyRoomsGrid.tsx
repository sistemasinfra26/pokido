"use client"

export interface RoomWithBookings {
    id: string
    name: string
    capacity: number
    color?: string
    bookings: {
        id: string
        birthdayChild?: string | null
        childAge?: number | null
        guestCount: number
        date: Date | string
        startTime: string
        endTime: string
        status: string
        customer: {
            fullName: string
            phone?: string | null
        }
    }[]
}

interface PartyRoomsGridProps {
    rooms: RoomWithBookings[]
    onOpenBookingModal: (roomId: string) => void
}

export function PartyRoomsGrid({ rooms = [], onOpenBookingModal }: PartyRoomsGridProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rooms.map((room) => (
                <div key={room.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="font-extrabold text-slate-900 text-lg">{room.name}</h3>
                                <span className="text-xs font-bold text-slate-400">
                                    Capacidad Máx: {room.capacity} Niños
                                </span>
                            </div>
                            <span className="w-3 h-3 rounded-full bg-pokido-purple animate-pulse" />
                        </div>

                        {/* LISTA DE RESERVAS */}
                        <div className="space-y-2">
                            <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider block">
                                Reservas del Día
                            </span>

                            {room.bookings.length === 0 ? (
                                <div className="p-4 bg-slate-50 rounded-2xl text-center text-slate-400 text-xs font-medium">
                                    Sin cumpleaños programados hoy.
                                </div>
                            ) : (
                                room.bookings.map((booking) => (
                                    <div key={booking.id} className="p-3 bg-pokido-purple/5 border border-pokido-purple/15 rounded-2xl space-y-1">
                                        <div className="flex justify-between items-center text-xs font-bold text-pokido-purple">
                                            <span>🕒 {booking.startTime} - {booking.endTime} hs</span>
                                            <span className="bg-pokido-purple text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                                                {booking.guestCount} Cupos
                                            </span>
                                        </div>
                                        <div className="text-xs font-extrabold text-slate-800">
                                            🎉 Cumple de {booking.birthdayChild || "Festejado"} ({booking.childAge || 0} años)
                                        </div>
                                        <div className="text-[11px] text-slate-400">
                                            Tutor: {booking.customer.fullName} ({booking.customer.phone || "Sin teléfono"})
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => onOpenBookingModal(room.id)}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl transition text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                        <span>➕</span> Agendar Cumpleaños
                    </button>
                </div>
            ))}
        </div>
    )
}