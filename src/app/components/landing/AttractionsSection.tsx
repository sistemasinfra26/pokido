export function AttractionsSection() {
    const attractions = [
        {
            title: "Open Jump Zone",
            description: "Pistas gigantes de trampolines interconectados para saltos libres, giros y acrobacias.",
            badge: "Todos los pases",
            badgeColor: "bg-pokido-purple/10 text-pokido-purple border-pokido-purple/20",
        },
        {
            title: "Ninja Course & Foam Pit",
            description: "Supera obstáculos de agilidad y cae de forma segura en nuestra enorme piscina de espuma.",
            badge: "Popular",
            badgeColor: "bg-pokido-orange/10 text-pokido-orange border-pokido-orange/20",
        },
        {
            title: "Área Toddler (Menores 5)",
            description: "Espacio protegido y adaptado para los más pequeños, libre de saltos de adultos.",
            badge: "Zona Segura",
            badgeColor: "bg-pokido-green/10 text-pokido-green border-pokido-green/20",
        },
        {
            title: "Pokido Café & Lounge",
            description: "Café de especialidad, comida rápida, Wi-Fi de alta velocidad y vista panorámica al parque.",
            badge: "Para Padres",
            badgeColor: "bg-pokido-cyan/10 text-pokido-cyan border-pokido-cyan/20",
        },
    ]

    return (
        <section id="atracciones" className="py-20 bg-slate-100/70 border-y border-slate-200/80">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight">
                        Nuestras <span className="text-pokido-orange">Atracciones</span>
                    </h2>
                    <p className="text-slate-600 mt-4 text-base sm:text-lg font-medium">
                        Diseñadas para maximizar la diversión bajo los más altos estándares de seguridad.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {attractions.map((item, index) => (
                        <div
                            key={index}
                            className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col justify-between hover:border-pokido-purple/50 hover:shadow-md transition shadow-xs"
                        >
                            <div>
                                <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${item.badgeColor}`}>
                                    {item.badge}
                                </span>
                                <h3 className="text-xl font-black text-slate-900 mt-5 mb-2">{item.title}</h3>
                                <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed">
                                    {item.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}