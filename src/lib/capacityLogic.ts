export const PARK_TOTAL_MAX_CAPACITY = 90

export interface SlotCapacityResult {
    totalMaxCapacity: number       // 90
    partyReservedCapacity: number   // Cupos retenidos por cumple
    generalAvailableCapacity: number // 90 - partyReservedCapacity
    bookedGeneralCount: number
    remainingGeneralSpots: number
    isFull: boolean
}

/**
 * Calcula el aforo restando cumpleaños SOLO si ocurren en el día y bloque horario evaluado.
 */
export function calculateSlotCapacity(
    slotTimeStr: string,           // Ej: "17:00"
    durationMinutes: number,       // Ej: 60
    activeParties: { date: Date; startTime: string; endTime: string; guestCount: number }[],
    generalBookingsCount: number,  // Entradas generales vendidas para esa hora
    evaluationDate: Date = new Date()
): SlotCapacityResult {
    const [hours, minutes] = slotTimeStr.split(":").map(Number)

    // Rango del turno a evaluar en minutos transcurridos desde las 00:00
    const slotStartMinutes = hours * 60 + minutes
    const slotEndMinutes = slotStartMinutes + durationMinutes

    let partyReservedCapacity = 0

    for (const party of activeParties) {
        const partyDate = new Date(party.date)

        // 1. Verificar si el cumpleaños es HOY (mismo año, mes y día)
        const isSameDay =
            partyDate.getFullYear() === evaluationDate.getFullYear() &&
            partyDate.getMonth() === evaluationDate.getMonth() &&
            partyDate.getDate() === evaluationDate.getDate()

        if (isSameDay) {
            const [pStartH, pStartM] = party.startTime.split(":").map(Number)
            const [pEndH, pEndM] = party.endTime.split(":").map(Number)

            const partyStartMinutes = pStartH * 60 + pStartM
            const partyEndMinutes = pEndH * 60 + pEndM

            // 2. Verificar si hay solapamiento de horario entre el turno y el cumpleaños
            if (slotStartMinutes < partyEndMinutes && slotEndMinutes > partyStartMinutes) {
                partyReservedCapacity += party.guestCount
            }
        }
    }

    // Capacidad máxima real para entradas generales
    const generalAvailableCapacity = Math.max(0, PARK_TOTAL_MAX_CAPACITY - partyReservedCapacity)
    const remainingGeneralSpots = Math.max(0, generalAvailableCapacity - generalBookingsCount)

    return {
        totalMaxCapacity: PARK_TOTAL_MAX_CAPACITY,
        partyReservedCapacity,
        generalAvailableCapacity,
        bookedGeneralCount: generalBookingsCount,
        remainingGeneralSpots,
        isFull: remainingGeneralSpots <= 0,
    }
}