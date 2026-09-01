import Link from "next/link"

export function DashboardHeader() {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Resumen General</h1>
                <p className="text-xs text-slate-500 mt-1">
                    Caja Activa: <span className="font-bold text-pokido-green">Caja Principal 1</span> • Turno de Tarde
                </p>
            </div>
            <div className="flex gap-3">
                <Link
                    href="/dashboard/access"
                    className="bg-pokido-cyan hover:bg-pokido-cyan/90 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition shadow-lg shadow-pokido-cyan/20 flex items-center gap-2"
                >
                    <span>🎟️</span> Ver Control de Accesos
                </Link>
                <Link
                    href="/dashboard/pos"
                    className="bg-pokido-purple hover:bg-pokido-purple/90 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition shadow-lg shadow-pokido-purple/20"
                >
                    💻 Abrir POS
                </Link>
            </div>
        </div>
    )
}