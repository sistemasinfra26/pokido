import { CustomerData } from "./CustomersTable"

// Interfaz adaptada al modelo de Prisma (qrCode mapeado al Ticket)
export interface MinorWithWristband {
    id: string
    fullName: string
    age: number
    qrCode?: string          // 👈 Propiedad real almacenada en Ticket (Prisma)
    wristbandCode?: string   // 👈 Fallback por compatibilidad
}

interface CustomerDetailModalProps {
    customer: (Omit<CustomerData, "minors"> & { minors: MinorWithWristband[] }) | null
    onClose: () => void
}

export function CustomerDetailModal({ customer, onClose }: CustomerDetailModalProps) {
    if (!customer) return null

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-6">

                {/* Header Modal */}
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">{customer.fullName}</h2>
                        <p className="text-xs text-slate-400">Ficha técnica del Tutor Legal</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* Información del Tutor */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-slate-400 font-bold block">DNI</span>
                        <span className="font-bold text-slate-800">{customer.dni}</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <span className="text-slate-400 font-bold block">Teléfono</span>
                        <span className="font-bold text-slate-800">{customer.phone}</span>
                    </div>
                </div>

                {/* Lista de Menores con Código de Pulsera / QR Activo */}
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Menores Asociados y Pulseras Activas
                    </h3>
                    <div className="space-y-2">
                        {customer.minors && customer.minors.length > 0 ? (
                            customer.minors.map((minor) => {
                                // Muestra qrCode prioritariamente o wristbandCode si existe
                                const activeCode = minor.qrCode || minor.wristbandCode

                                return (
                                    <div key={minor.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-xs">
                                        <div>
                                            <div className="font-bold text-slate-800">{minor.fullName}</div>
                                            <div className="text-slate-400 font-medium text-[11px]">{minor.age} años</div>
                                        </div>

                                        {/* INSIGNIA CON CÓDIGO DE PULSERA (qrCode) */}
                                        {activeCode ? (
                                            <div className="flex items-center gap-1.5 bg-cyan-50 border border-pokido-cyan/30 text-pokido-cyan px-3 py-1.5 rounded-xl">
                                                <span className="text-xs">🏷️</span>
                                                <span className="font-mono font-black text-xs uppercase tracking-wider">
                                                    {activeCode}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl">
                                                Sin pulsera activa
                                            </span>
                                        )}
                                    </div>
                                )
                            })
                        ) : (
                            <p className="text-xs text-slate-400">No hay menores registrados.</p>
                        )}
                    </div>
                </div>

                {/* Acciones de Waiver */}
                <div className="pt-4 border-t border-slate-100 flex gap-3">
                    <button
                        type="button"
                        className="flex-1 bg-pokido-cyan hover:bg-pokido-cyan/90 text-white font-bold py-3 rounded-2xl text-xs transition cursor-pointer"
                    >
                        📲 Enviar Link por WhatsApp
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-3 rounded-2xl text-xs transition cursor-pointer"
                    >
                        Cerrar
                    </button>
                </div>

            </div>
        </div>
    )
}