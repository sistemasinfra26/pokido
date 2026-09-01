interface CustomersHeaderProps {
    totalCustomers: number
    searchQuery: string
    setSearchQuery: (query: string) => void
}

export function CustomersHeader({ totalCustomers, searchQuery, setSearchQuery }: CustomersHeaderProps) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black text-slate-900">Clientes y Waivers</h1>
                    <span className="bg-pokido-purple/10 text-pokido-purple font-bold text-xs px-3 py-1 rounded-full border border-pokido-purple/20">
                        {totalCustomers} Registrados
                    </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                    Gestión de tutores legales, menores a cargo y verificación de exenciones de responsabilidad.
                </p>
            </div>

            <div className="flex items-center gap-3">
                <input
                    type="text"
                    placeholder="Buscar por Nombre, DNI o Teléfono..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pokido-purple font-medium text-slate-800 w-full sm:w-72"
                />
                <button className="bg-pokido-purple hover:bg-pokido-purple/90 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition shadow-lg shadow-pokido-purple/20 whitespace-nowrap">
                    ➕ Nuevo Cliente
                </button>
            </div>
        </div>
    )
}