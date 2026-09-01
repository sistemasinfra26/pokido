export interface MinorSummary {
    id: string
    fullName: string
    age: number
}

export interface CustomerData {
    id: string
    dni: string
    fullName: string
    email: string
    phone: string
    waiverStatus: "VALID" | "EXPIRED" | "MISSING"
    waiverExpiresAt?: string
    minors: MinorSummary[]
}

interface CustomersTableProps {
    customers: CustomerData[]
    onSelectCustomer: (customer: CustomerData) => void
}

export function CustomersTable({ customers = [], onSelectCustomer }: CustomersTableProps) {
    if (customers.length === 0) {
        return (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 text-sm shadow-sm">
                No se encontraron clientes registrados en la base de datos.
            </div>
        )
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50 text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                            <th className="py-4 px-6">Tutor / Responsable</th>
                            <th className="py-4 px-6">Contacto</th>
                            <th className="py-4 px-6">Menores Registrados</th>
                            <th className="py-4 px-6">Estado Deslinde (Waiver)</th>
                            <th className="py-4 px-6 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                        {customers.map((customer) => (
                            <tr key={customer.id} className="hover:bg-slate-50/80 transition">
                                <td className="py-4 px-6">
                                    <div className="font-bold text-slate-900">{customer.fullName}</div>
                                    <div className="text-xs text-slate-400 font-mono">DNI: {customer.dni}</div>
                                </td>

                                <td className="py-4 px-6">
                                    <div className="text-xs text-slate-700 font-medium">{customer.phone}</div>
                                    <div className="text-xs text-slate-400">{customer.email}</div>
                                </td>

                                <td className="py-4 px-6">
                                    {customer.minors.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
                                            {customer.minors.map((minor) => (
                                                <span
                                                    key={minor.id}
                                                    className="bg-slate-100 text-slate-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                                                >
                                                    {minor.fullName} ({minor.age}a)
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-slate-400 italic">Sin menores vinculados</span>
                                    )}
                                </td>

                                <td className="py-4 px-6">
                                    {customer.waiverStatus === "VALID" && (
                                        <div>
                                            <span className="inline-block text-[10px] font-bold text-pokido-green bg-pokido-green/10 border border-pokido-green/20 px-2.5 py-0.5 rounded-full uppercase">
                                                ✓ Vigente
                                            </span>
                                            <div className="text-[10px] text-slate-400 mt-0.5">Vence: {customer.waiverExpiresAt}</div>
                                        </div>
                                    )}

                                    {customer.waiverStatus === "EXPIRED" && (
                                        <div>
                                            <span className="inline-block text-[10px] font-bold text-pokido-orange bg-pokido-orange/10 border border-pokido-orange/20 px-2.5 py-0.5 rounded-full uppercase">
                                                ⚠️ Vencido
                                            </span>
                                            <div className="text-[10px] text-slate-400 mt-0.5">Renovación requerida</div>
                                        </div>
                                    )}

                                    {customer.waiverStatus === "MISSING" && (
                                        <span className="inline-block text-[10px] font-bold text-pokido-red bg-pokido-red/10 border border-pokido-red/20 px-2.5 py-0.5 rounded-full uppercase">
                                            ✕ Sin Firma
                                        </span>
                                    )}
                                </td>

                                <td className="py-4 px-6 text-right whitespace-nowrap">
                                    <button
                                        type="button"
                                        onClick={() => onSelectCustomer(customer)}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                                    >
                                        🔍 Ver Ficha
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}