import { CustomerData } from "./CustomersTable"

interface CustomerDetailModalProps {
    customer: CustomerData | null
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
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
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

                {/* Lista de Menores */}
                <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Menores Asociados</h3>
                    <div className="space-y-2">
                        {customer.minors.map((minor) => (
                            <div key={minor.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-800">{minor.fullName}</span>
                                <span className="text-slate-500 font-medium">{minor.age} años</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Acciones de Waiver */}
                <div className="pt-4 border-t border-slate-100 flex gap-3">
                    <button className="flex-1 bg-pokido-cyan hover:bg-pokido-cyan/90 text-white font-bold py-3 rounded-2xl text-xs transition">
                        📲 Enviar Link por WhatsApp
                    </button>
                    <button
                        onClick={onClose}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-3 rounded-2xl text-xs transition"
                    >
                        Cerrar
                    </button>
                </div>

            </div>
        </div>
    )
}