"use client"

interface ScannerSidebarProps {
    searchQuery: string
    setSearchQuery: (query: string) => void
    activeCount: number
    maxCapacity: number
    expiredCount: number
    onSearchSubmit?: () => void // 👈 Agregamos callback opcional al presionar Buscar
}

export function ScannerSidebar({
    searchQuery,
    setSearchQuery,
    activeCount,
    maxCapacity,
    expiredCount,
    onSearchSubmit,
}: ScannerSidebarProps) {
    const occupancyPercentage = Math.round((activeCount / maxCapacity) * 100)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (onSearchSubmit) {
            onSearchSubmit()
        }
    }

    return (
        <div className="w-full lg:w-80 space-y-6 shrink-0 font-sans">
            {/* BUSCADOR RÁPIDO DE PISTA */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-pokido-cyan/15 text-pokido-cyan flex items-center justify-center font-bold text-lg border border-pokido-cyan/20">
                        🔍
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900 text-base">Escanear / Consultar</h2>
                        <p className="text-xs text-slate-400">Pulsera o Código Web</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                        type="text"
                        placeholder="Ej. P-014 o WEB-88210..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border border-pokido-cyan/40 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pokido-cyan font-medium text-slate-800"
                    />
                    <button
                        type="submit"
                        className="w-full bg-pokido-cyan hover:bg-pokido-cyan/90 text-slate-950 font-black py-3.5 px-4 rounded-2xl transition shadow-lg shadow-pokido-cyan/20 text-sm cursor-pointer"
                    >
                        📷 Buscar / Filtrar
                    </button>
                </form>
            </div>

            {/* RESUMEN DE AFORO EN TIEMPO REAL */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h2 className="font-bold text-slate-900 text-base">Resumen del parque</h2>

                <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4">
                    <span className="text-[11px] font-black text-emerald-700 uppercase tracking-wider block">
                        Niños en pista (En juego)
                    </span>
                    <div className="text-3xl font-black text-slate-900 mt-1">
                        {activeCount} <span className="text-lg text-slate-400 font-normal">/ {maxCapacity}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Cupos Libres</span>
                        <div className="text-xl font-bold text-slate-800 mt-0.5">
                            {Math.max(0, maxCapacity - activeCount)}
                        </div>
                    </div>

                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3">
                        <span className="text-[10px] font-bold text-rose-700 uppercase">Excedidos</span>
                        <div className="text-xl font-bold text-rose-700 mt-0.5">
                            {expiredCount}
                        </div>
                    </div>
                </div>

                {/* BARRA PROGRESIVA DE OCUPACIÓN */}
                <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-500">Ocupación</span>
                        <span className="text-slate-800">{occupancyPercentage}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${occupancyPercentage >= 90
                                    ? "bg-rose-500"
                                    : occupancyPercentage >= 70
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                }`}
                            style={{ width: `${Math.min(100, occupancyPercentage)}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}