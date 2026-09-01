import Link from "next/link"

export function Navbar() {
    return (
        <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-3xl font-black tracking-wider text-pokido-purple">POKIDO</span>
                    <span className="text-xs bg-pokido-purple/10 text-pokido-purple px-2 py-1 rounded-full font-bold uppercase border border-pokido-purple/20">Park</span>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
                    <Link href="#atracciones" className="hover:text-pokido-orange transition">Atracciones</Link>
                    <Link href="#precios" className="hover:text-pokido-orange transition">Pases</Link>
                    <Link href="#cumpleanos" className="hover:text-pokido-orange transition">Cumpleaños</Link>
                    <Link href="#deslinde" className="hover:text-pokido-orange transition">Firmar Waiver</Link>
                </nav>

                <div className="flex items-center gap-4">
                    <Link
                        href="#deslinde"
                        className="hidden sm:inline-flex bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition border border-slate-700"
                    >
                        Firma Digital
                    </Link>
                    <Link
                        href="#precios"
                        className="bg-pokido-orange hover:bg-pokido-orange/90 text-white px-5 py-2.5 rounded-xl text-sm font-black transition shadow-lg shadow-pokido-orange/20"
                    >
                        Comprar Pases
                    </Link>
                </div>
            </div>
        </header>
    )
}