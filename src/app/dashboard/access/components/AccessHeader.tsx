interface AccessHeaderProps {
    activeCount: number   // Niños jugando actualmente en pista
    waitingCount?: number // Niños con entrada comprada esperando su turno
}

export function AccessHeader({ activeCount, waitingCount = 0 }: AccessHeaderProps) {
    return (
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <span className="text-xl">⏱️</span>
                <h1 className="text-xl font-bold text-slate-900">Control de Accesos</h1>
            </div>

            <div className="flex items-center gap-3">
                {/* NIÑOS JUGANDO EN PISTA */}
                <div className="flex items-center gap-2 bg-pokido-green/10 border border-pokido-green/20 px-3 py-1.5 rounded-2xl">
                    <span className="w-2.5 h-2.5 rounded-full bg-pokido-green animate-pulse" />
                    <span className="text-xs font-bold text-slate-700">En Pista:</span>
                    <span className="bg-pokido-green text-white font-extrabold text-xs px-2 py-0.5 rounded-full">
                        {activeCount}
                    </span>
                </div>

                {/* NIÑOS EN ESPERA */}
                {waitingCount > 0 && (
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-2xl">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span className="text-xs font-bold text-slate-700">En Espera:</span>
                        <span className="bg-amber-500 text-white font-extrabold text-xs px-2 py-0.5 rounded-full">
                            {waitingCount}
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
}