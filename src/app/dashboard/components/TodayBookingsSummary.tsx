export interface PartyRoomItem {
    name: string
    child: string
    slot: string
    status: string
    badgeColor: string
}

export function TodayBookingsSummary({ rooms }: { rooms: PartyRoomItem[] }) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-4 flex items-center gap-2">
                <span>🎂</span> Estado de Salones
            </h2>

            <div className="space-y-3">
                {rooms.map((room, index) => (
                    <div key={index} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                        <div>
                            <div className="font-bold text-slate-900 text-sm">{room.name}</div>
                            <div className="text-xs text-slate-500 font-medium">{room.child}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">{room.slot}</div>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${room.badgeColor}`}>
                            {room.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}