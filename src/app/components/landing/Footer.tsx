import Link from "next/link"

export function Footer() {
    return (
        <footer className="bg-slate-950 border-t border-slate-900 py-12 text-slate-400 text-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <span className="text-2xl font-black tracking-wider text-pokido-purple">POKIDDO</span>
                        <span className="text-xs bg-pokido-purple/10 text-pokido-purple px-2 py-0.5 rounded-full font-bold uppercase border border-pokido-purple/20">Park</span>
                    </div>
                    <p className="text-xs text-slate-500">
                        El centro de entretenimiento familiar y parque de trampolines líder en la ciudad.
                    </p>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-4">Navegación</h4>
                    <ul className="space-y-2 text-xs">
                        <li><Link href="#atracciones" className="hover:text-pokido-orange">Atracciones</Link></li>
                        <li><Link href="#precios" className="hover:text-pokido-orange">Precios y Pases</Link></li>
                        <li><Link href="#cumpleanos" className="hover:text-pokido-orange">Fiestas de Cumpleaños</Link></li>
                        <li><Link href="#deslinde" className="hover:text-pokido-orange">Firmar Waiver</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-4">Horarios</h4>
                    <ul className="space-y-1 text-xs text-slate-400">
                        <li>Lunes a Jueves: 14:00 - 21:00 hs</li>
                        <li>Viernes a Domingo: 11:00 - 23:00 hs</li>
                        <li className="text-pokido-green font-medium mt-2">Feriados Abierto</li>
                    </ul>
                </div>

                <div>
                    <h4 className="text-white font-bold mb-4">Acceso Sistema</h4>
                    <Link href="/login" className="inline-block bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold">
                        Portal Empleados / POS
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-900 text-center text-xs text-slate-600">
                © {new Date().getFullYear()} Pokido Park System. Todos los derechos reservados.
            </div>
        </footer>
    )
}