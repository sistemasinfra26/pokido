"use server"

import { prisma } from "@/lib/prisma"

// Helper para limpiar cualquier formato de DNI/RUT
function cleanDniString(val: string): string {
    return val.replace(/[^0-9kK]/g, "").trim()
}

// 1. Obtener la lista completa de clientes con sus menores y estado de waiver
export async function getCustomersList() {
    try {
        const customers = await prisma.customer.findMany({
            include: {
                minors: true,
                waivers: {
                    orderBy: { signedAt: "desc" },
                    take: 1,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        })

        const now = new Date()

        const formattedCustomers = customers.map((c) => {
            const latestWaiver = c.waivers[0]
            let waiverStatus: "VALID" | "EXPIRED" | "MISSING" = "MISSING"
            let waiverExpiresAt: string | undefined = undefined

            if (latestWaiver) {
                if (latestWaiver.isValid && new Date(latestWaiver.expiresAt) > now) {
                    waiverStatus = "VALID"
                } else {
                    waiverStatus = "EXPIRED"
                }

                waiverExpiresAt = new Date(latestWaiver.expiresAt).toLocaleDateString("es-CL", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                })
            }

            const minors = c.minors.map((m) => {
                const birthYear = new Date(m.birthDate).getFullYear()
                const currentYear = now.getFullYear()
                const age = currentYear - birthYear

                return {
                    id: m.id,
                    fullName: m.fullName,
                    age: age > 0 ? age : 0,
                }
            })

            return {
                id: c.id,
                dni: c.dni,
                fullName: c.fullName,
                email: c.email || "Sin correo",
                phone: c.phone || "Sin teléfono",
                waiverStatus,
                waiverExpiresAt,
                minors,
            }
        })

        return { success: true, data: formattedCustomers }
    } catch (error: any) {
        console.error("Error al obtener lista de clientes:", error)
        return { success: false, error: error.message }
    }
}

// 2. Buscar cliente por DNI (Usado en el POS)
export async function findCustomerByDni(dniQuery: string) {
    try {
        const rawQuery = dniQuery.trim()
        const cleanDni = cleanDniString(rawQuery)

        if (!rawQuery && !cleanDni) {
            return { success: false, error: "DNI inválido" }
        }

        // Busca coincidencia exacta por DNI limpio O por el texto ingresado con puntos
        const customer = await prisma.customer.findFirst({
            where: {
                OR: [
                    { dni: { equals: cleanDni, mode: "insensitive" } },
                    { dni: { equals: rawQuery, mode: "insensitive" } },
                    { dni: { contains: cleanDni, mode: "insensitive" } },
                ],
            },
            include: {
                minors: true,
                waivers: {
                    orderBy: { signedAt: "desc" },
                    take: 1,
                },
            },
        })

        if (!customer) {
            return { success: false, error: "Cliente no encontrado" }
        }

        // Verificar si tiene un deslinde válido y no vencido
        const now = new Date()
        const latestWaiver = customer.waivers[0]
        const hasValidWaiver = Boolean(
            latestWaiver && latestWaiver.isValid && new Date(latestWaiver.expiresAt) > now
        )

        return {
            success: true,
            customer: {
                id: customer.id,
                name: customer.fullName,
                dni: customer.dni,
                phone: customer.phone,
                email: customer.email,
                hasWaiver: hasValidWaiver,
                minors: customer.minors,
            },
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}

// 3. Crear cliente de forma rápida (Usado en el POS)
export interface QuickCustomerInput {
    fullName: string
    dni: string
    phone: string
    email?: string
}

export async function createQuickCustomer(data: QuickCustomerInput) {
    try {
        const cleanDni = cleanDniString(data.dni)

        // Verificar si existe el cliente buscando por ambas variantes de DNI
        const existing = await prisma.customer.findFirst({
            where: {
                OR: [
                    { dni: cleanDni },
                    { dni: data.dni.trim() },
                ],
            },
        })

        if (existing) {
            return { success: false, error: "Ya existe un cliente registrado con este DNI." }
        }

        const newCustomer = await prisma.customer.create({
            data: {
                fullName: data.fullName,
                dni: cleanDni || data.dni.trim(), // Guarda siempre la versión limpia del DNI
                phone: data.phone,
                email: data.email || `${cleanDni || "cliente"}@pokido.temp`,
            },
        })

        return {
            success: true,
            customer: {
                id: newCustomer.id,
                name: newCustomer.fullName,
                dni: newCustomer.dni,
                phone: newCustomer.phone,
                email: newCustomer.email,
                hasWaiver: false,
            },
        }
    } catch (error: any) {
        return { success: false, error: error.message }
    }
}