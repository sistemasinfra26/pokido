interface ScannerSidebarProps {
    searchQuery: string
    setSearchQuery: (query: string) => void
    activeCount: number
    maxCapacity: number
    expiredCount: number
}

export function ScannerSidebar({
    searchQuery,
    setSearchQuery,
    activeCount,
    maxCapacity,
    expiredCount,
}: ScannerSidebarProps) {
    const occupancyPercentage = Math.round((activeCount / maxCapacity) * 100)

    return (
        <div className="w-full lg:w-80 space-y-6 shrink-0">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-pokido-cyan/15 text-pokido-cyan flex items-center justify-center font-bold text-lg border border-pokido-cyan/20">🔍</div>
                    <div>
                        <h2 className="font-bold text-slate-900 text-base">Escanear brazalete</h2>
                        <p className="text-xs text-slate-400">Ingreso y consulta rápida</p>
                    </div>
                </div>

                <div className="space-y-3">
                    <input
                        type="text"
                        placeholder="ID del brazalete • ej. PK-014"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-pokido-cyan/40 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pokido-cyan font-medium text-slate-800"
                    />
                    <button className="w-full bg-pokido-cyan hover:bg-pokido-cyan/90 text-white font-bold py-3.5 px-4 rounded-2xl transition shadow-lg shadow-pokido-cyan/20 text-sm">
                        📷 Buscar / Registrar
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h2 className="font-bold text-slate-900 text-base">Resumen del parque</h2>
                <div className="bg-pokido-green/10 border border-pokido-green/20 rounded-2xl p-4">
                    <span className="text-[11px] font-black text-pokido-green uppercase tracking-wider block">Niños en el parque</span>
                    <div className="text-3xl font-black text-slate-900 mt-1">{activeCount} <span className="text-lg text-slate-400 font-normal">/ {maxCapacity}</span></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Cupos Libres</span>
                        <div className="text-xl font-bold text-slate-800 mt-0.5">{maxCapacity - activeCount}</div>
                    </div>
                    <div className="bg-pokido-red/10 border border-pokido-red/20 rounded-2xl p-3">
                        <span className="text-[10px] font-bold text-pokido-red uppercase">Excedidos</span>
                        <div className="text-xl font-bold text-pokido-red mt-0.5">{expiredCount}</div>
                    </div>
                </div>

                <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-500">Ocupación</span>
                        <span className="text-slate-800">{occupancyPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-pokido-green h-full rounded-full transition-all duration-300" style={{ width: `${occupancyPercentage}%` }} />
                    </div>
                </div>
            </div>
        </div>
    )
}