export function PosHeader() {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-black text-slate-900">Punto de Venta (POS)</h1>
                <p className="text-xs text-slate-500 mt-0.5">Venta de entradas y asignación de pulseras en tiempo real</p>
            </div>
            <span className="bg-pokido-green/10 text-pokido-green font-bold text-xs px-3 py-1.5 rounded-full border border-pokido-green/20">
                ● Caja Abierta
            </span>
        </div>
    )
}