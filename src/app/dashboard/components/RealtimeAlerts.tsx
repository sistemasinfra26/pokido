export interface AlertItem {
    type: string
    title: string
    detail: string
    color: string
}

export function RealtimeAlerts({ alerts }: { alerts: AlertItem[] }) {
    return (
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>🔔</span> Alertas y Notificaciones en Vivo
                </h2>
                <span className="text-xs text-slate-400 font-medium">Actualizado hace un momento</span>
            </div>

            <div className="space-y-3">
                {alerts.map((alert, index) => (
                    <div key={index} className={`p-4 rounded-2xl border flex items-center justify-between ${alert.color}`}>
                        <div>
                            <div className="font-bold text-sm">{alert.title}</div>
                            <div className="text-xs opacity-80">{alert.detail}</div>
                        </div>
                        <button className="text-xs font-bold bg-white/90 hover:bg-white px-3 py-1.5 rounded-xl border border-current transition shadow-sm">
                            Gestionar
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}