"use client"

import { useRouter } from "next/navigation"

export interface AlertItem {
    type: string
    title: string
    detail: string
    color: string
}

export function RealtimeAlerts({ alerts = [] }: { alerts: AlertItem[] }) {
    const router = useRouter()

    const handleManageAlert = (alert: AlertItem) => {
        if (alert.type === "TIME" || alert.type === "CAPACITY") {
            // Redirige directamente al Control de Accesos
            router.push("/dashboard/access")
        } else if (alert.type === "STOCK") {
            // Redirige al Inventario / Ajustes de productos
            router.push("/dashboard/settings")
        } else {
            // Ruta por defecto a Control de Accesos
            router.push("/dashboard/access")
        }
    }

    return (
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <span>🔔</span> Alertas y Notificaciones en Vivo
                </h2>
                <span className="text-xs text-slate-400 font-medium">Actualizado en tiempo real</span>
            </div>

            <div className="space-y-3">
                {alerts.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 font-medium border border-dashed border-slate-200 rounded-2xl">
                        ✓ No hay alertas pendientes por resolver.
                    </div>
                ) : (
                    alerts.map((alert, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-2xl border flex items-center justify-between ${alert.color}`}
                        >
                            <div>
                                <div className="font-bold text-sm">{alert.title}</div>
                                <div className="text-xs opacity-80">{alert.detail}</div>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleManageAlert(alert)}
                                className="text-xs font-black bg-white/90 hover:bg-white text-slate-800 px-3.5 py-2 rounded-xl border border-slate-200 transition shadow-sm cursor-pointer"
                            >
                                Gestionar
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}