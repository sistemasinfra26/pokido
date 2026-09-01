"use server"

import { prisma } from "@/lib/prisma"

export interface ExpressWaiverInput {
    customerId: string
    signedName: string
}

export async function createExpressWaiver({ customerId, signedName }: ExpressWaiverInput) {
    try {
        const now = new Date()
        const expiresAt = new Date()
        expiresAt.setFullYear(now.getFullYear() + 1) // Vence en 1 año

        await prisma.waiver.create({
            data: {
                customerId,
                signatureUrl: `EXPRESS-POS-${Date.now()}`,
                signedAt: now,
                expiresAt,
                isValid: true,
                termsVersion: "1.0",
            },
        })

        return { success: true }
    } catch (error: any) {
        console.error("Error al guardar waiver express:", error)
        return { success: false, error: error.message || "No se pudo registrar la firma." }
    }
}