export interface WristbandColorDef {
    id: number
    name: string
    label: string
    bgClass: string
    textClass: string
    borderClass: string
    badgeClass: string
    hex: string
}

export const WRISTBAND_COLORS: Record<number, WristbandColorDef> = {
    1: {
        id: 1,
        name: "Color 1",
        label: "Rojo / Rosa",
        bgClass: "bg-rose-500",
        textClass: "text-rose-700",
        borderClass: "border-rose-300",
        badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
        hex: "#f43f5e",
    },
    2: {
        id: 2,
        name: "Color 2",
        label: "Amarillo",
        bgClass: "bg-amber-400",
        textClass: "text-amber-800",
        borderClass: "border-amber-300",
        badgeClass: "bg-amber-100 text-amber-900 border-amber-200",
        hex: "#fbbf24",
    },
    3: {
        id: 3,
        name: "Color 3",
        label: "Verde",
        bgClass: "bg-emerald-500",
        textClass: "text-emerald-700",
        borderClass: "border-emerald-300",
        badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
        hex: "#10b981",
    },
    4: {
        id: 4,
        name: "Color 4",
        label: "Azul / Celeste",
        bgClass: "bg-sky-500",
        textClass: "text-sky-700",
        borderClass: "border-sky-300",
        badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
        hex: "#0ea5e9",
    },
}

/**
 * Calcula el índice de color (1, 2, 3 o 4) según la hora de ingreso y duración
 * @param entryTimeStr Hora de ingreso en formato "HH:MM" (ej. "10:00", "14:30")
 * @param durationMinutes Duración del pase en minutos (30, 60, 90, 120)
 */
export function getWristbandColorForTime(entryTimeStr: string, durationMinutes: number): WristbandColorDef {
    const [hours, minutes] = entryTimeStr.split(":").map(Number)

    // Convertir hora a bloques de 30 minutos desde las 10:00 AM (bloque 0 = 10:00)
    const totalMinutesFrom10AM = (hours - 10) * 60 + minutes
    const slotIndex = Math.floor(totalMinutesFrom10AM / 30) // 0 para 10:00, 1 para 10:30, 2 para 11:00...

    // El pase de 30 min usa el color base del slot (rotación de 1 a 4)
    let colorIndex = (slotIndex % 4) + 1

    // Regla de avance según duración:
    // 30 min  -> usa el color base
    // 60 min  -> avanza 1 color (+1 bloque de 30 min)
    // 90 min  -> avanza 2 colores (+2 bloques de 30 min)
    // 120 min -> avanza 3 colores (+3 bloques de 30 min)
    if (durationMinutes === 60) {
        colorIndex = ((slotIndex + 1) % 4) + 1
    } else if (durationMinutes === 90) {
        colorIndex = ((slotIndex + 2) % 4) + 1
    } else if (durationMinutes === 120) {
        colorIndex = ((slotIndex + 3) % 4) + 1
    }

    return WRISTBAND_COLORS[colorIndex] || WRISTBAND_COLORS[1]
}
/**
 * Retorna qué color de pulsera debe SALIR a una hora específica
 */
export function getExpiringWristbandColor(currentTimeStr: string): WristbandColorDef {
    const [hours, minutes] = currentTimeStr.split(":").map(Number)
    const totalMinutesFrom10AM = (hours - 10) * 60 + minutes
    const slotIndex = Math.floor(totalMinutesFrom10AM / 30)

    // En la tabla: a las 10:30 sale Color 1, a las 11:00 sale Color 2, a las 11:30 Color 3...
    const expiringIndex = ((slotIndex - 1) % 4) + 1
    const validIndex = expiringIndex <= 0 ? expiringIndex + 4 : expiringIndex

    return WRISTBAND_COLORS[validIndex] || WRISTBAND_COLORS[1]
}