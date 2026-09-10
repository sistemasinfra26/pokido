// src/lib/overtimeLogic.ts

export interface OvertimeResult {
    isExpired: boolean
    minutesOverdue: number
    blocksToCharge: number
    amountToPay: number
    detailReason: string
}

/**
 * Calcula el recargo por tiempo excedido
 * @param rawEndTime Fecha y hora exacta de fin del ticket
 * @param gracePeriodMinutes Minutos de tolerancia sin cobro (ej. 10 min)
 * @param pricePerBlock Precio del tramo de 30 min extra (ej. $5.000)
 */
export function calculateOvertimeFee(
    rawEndTime: string | Date,
    gracePeriodMinutes: number = 10,
    pricePerBlock: number = 5000
): OvertimeResult {
    const now = new Date()
    const endTime = new Date(rawEndTime)

    const diffMs = now.getTime() - endTime.getTime()
    const totalOverdueMinutes = Math.floor(diffMs / (1000 * 60))

    // Si no ha superado el tiempo o está dentro de la tolerancia
    if (totalOverdueMinutes <= gracePeriodMinutes) {
        return {
            isExpired: false,
            minutesOverdue: Math.max(0, totalOverdueMinutes),
            blocksToCharge: 0,
            amountToPay: 0,
            detailReason: totalOverdueMinutes > 0
                ? `Dentro del período de tolerancia (${totalOverdueMinutes} min)`
                : "Tiempo en regla",
        }
    }

    // Minutos excedidos considerando el período de gracia
    const effectiveMinutes = totalOverdueMinutes - gracePeriodMinutes

    // Bloques de 30 min a cobrar (redondea hacia arriba)
    const blocksToCharge = Math.ceil(effectiveMinutes / 30)
    const amountToPay = blocksToCharge * pricePerBlock

    return {
        isExpired: true,
        minutesOverdue: totalOverdueMinutes,
        blocksToCharge,
        amountToPay,
        detailReason: `Excedido por ${totalOverdueMinutes} min (${blocksToCharge} bloque(s) de 30 min)`,
    }
}