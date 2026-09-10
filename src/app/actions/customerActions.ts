"use server"

import { prisma } from "@/lib/prisma"

// Helper para limpiar cualquier formato de DNI/RUT
function cleanDniString(val: string): string {
    return val.replace(/[^0-9kK]/g, "").trim()
}

// 1. Obtener la lista completa de clientes con sus menores, estado de waiver Y TICKETS ACTIVOS
export async function getCustomersList() {
    try {
        const customers = await prisma.customer.findMany({
            include: {
                minors: {
                    include: {
                        tickets: {
                            where: {
                                status: "ACTIVE",
                            },
                            orderBy: {
                                createdAt: "desc",
                            },
                            take: 1,
                        },
                    },
                },
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

                const activeTicket = m.tickets[0]

                return {
                    id: m.id,
                    fullName: m.fullName,
                    age: age > 0 ? age : 0,
                    qrCode: activeTicket?.qrCode || undefined,
                    activeTicket: activeTicket
                        ? {
                            id: activeTicket.id,
                            qrCode: activeTicket.qrCode,
                            price: Number(activeTicket.price), // 🔑 Decimal a Number
                            startTime: activeTicket.startTime?.toISOString() ?? null,
                            endTime: activeTicket.endTime?.toISOString() ?? null,
                        }
                        : null,
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

// 2. Buscar cliente por DNI/Nombre y devolver TODOS sus menores a cargo (Sin objetos Decimal)
export async function findCustomerByDni(dniQuery: string) {
    try {
        const rawQuery = dniQuery.trim()
        const cleanDni = cleanDniString(rawQuery)

        if (!rawQuery && !cleanDni) {
            return { success: false, customer: null, error: "Consulta de búsqueda vacía" }
        }

        const customer = await prisma.customer.findFirst({
            where: {
                OR: [
                    { dni: { equals: cleanDni, mode: "insensitive" } },
                    { dni: { equals: rawQuery, mode: "insensitive" } },
                    { fullName: { contains: rawQuery, mode: "insensitive" } },
                ],
            },
            include: {
                minors: {
                    include: {
                        tickets: {
                            where: { status: "ACTIVE" },
                            orderBy: { createdAt: "desc" },
                            take: 1,
                        },
                    },
                    orderBy: {
                        fullName: "asc",
                    },
                },
                waivers: {
                    orderBy: { signedAt: "desc" },
                    take: 1,
                },
            },
        })

        if (!customer) {
            return { success: false, customer: null, error: "Cliente no encontrado" }
        }

        const now = new Date()
        const latestWaiver = customer.waivers[0]
        const hasValidWaiver = Boolean(
            latestWaiver && latestWaiver.isValid && new Date(latestWaiver.expiresAt) > now
        )

        // 🔑 SANITIZADO ESTRICTO: Reconstrucción manual sin spreading genérico (...m)
        const formattedMinors = customer.minors.map((m) => {
            const birthYear = new Date(m.birthDate).getFullYear()
            const age = now.getFullYear() - birthYear
            const activeTicket = m.tickets[0]

            return {
                id: m.id,
                fullName: m.fullName,
                age: age > 0 ? age : 0,
                birthDate: m.birthDate ? m.birthDate.toISOString() : null,
                qrCode: activeTicket?.qrCode || undefined,
                activeTicket: activeTicket
                    ? {
                        id: activeTicket.id,
                        qrCode: activeTicket.qrCode,
                        price: Number(activeTicket.price),
                        // 🔑 FIX: Agregamos verificación segura para fechas nulas
                        startTime: activeTicket.startTime ? activeTicket.startTime.toISOString() : null,
                        endTime: activeTicket.endTime ? activeTicket.endTime.toISOString() : null,
                        status: activeTicket.status,
                    }
                    : null,
            }
        })

        return {
            success: true,
            customer: {
                id: customer.id,
                name: customer.fullName,
                dni: customer.dni,
                phone: customer.phone || "",
                email: customer.email || "",
                hasWaiver: hasValidWaiver,
                minors: formattedMinors, // 👈 Soporta múltiples menores sin Decimal
            },
        }
    } catch (error: any) {
        console.error("Error en findCustomerByDni:", error)
        return { success: false, customer: null, error: error.message }
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
        const finalDni = cleanDni || data.dni.trim()

        if (!finalDni) {
            return { success: false, error: "El DNI ingresado no es válido." }
        }

        const existing = await prisma.customer.findFirst({
            where: {
                OR: [
                    { dni: finalDni },
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
                dni: finalDni,
                phone: data.phone,
                email: data.email || `${finalDni}@pokido.temp`,
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
                minors: [],
            },
        }
    } catch (error: any) {
        console.error("Error al crear cliente rápido:", error)
        return { success: false, error: error.message }
    }
}

// 4. NUEVA ACTION: Adjuntar un nuevo menor a un tutor existente
export async function addMinorToCustomer(customerId: string, minorData: { fullName: string; age: number }) {
    try {
        if (!customerId) {
            return { success: false, error: "ID de tutor invalido." }
        }

        if (!minorData.fullName.trim()) {
            return { success: false, error: "El nombre del menor es obligatorio." }
        }

        const birthDate = new Date()
        birthDate.setFullYear(birthDate.getFullYear() - (minorData.age || 0))

        const newMinor = await prisma.minor.create({
            data: {
                customerId,
                fullName: minorData.fullName.trim(),
                birthDate,
            },
        })

        return {
            success: true,
            minor: {
                id: newMinor.id,
                fullName: newMinor.fullName,
                age: minorData.age || 0,
                birthDate: newMinor.birthDate.toISOString(),
                qrCode: undefined,
                activeTicket: null,
            },
        }
    } catch (error: any) {
        console.error("Error al agregar menor al cliente:", error)
        return { success: false, error: error.message }
    }
}

// 5. NUEVA ACTION: Consultar todos los menores de un tutor específico
export async function getMinorsByCustomerId(customerId: string) {
    try {
        const minors = await prisma.minor.findMany({
            where: { customerId },
            include: {
                tickets: {
                    where: { status: "ACTIVE" },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
            orderBy: { fullName: "asc" },
        })

        const now = new Date()
        const formattedMinors = minors.map((m) => {
            const birthYear = new Date(m.birthDate).getFullYear()
            const age = now.getFullYear() - birthYear
            const activeTicket = m.tickets[0]

            return {
                id: m.id,
                fullName: m.fullName,
                age: age > 0 ? age : 0,
                qrCode: activeTicket?.qrCode || undefined,
                activeTicket: activeTicket
                    ? {
                        id: activeTicket.id,
                        qrCode: activeTicket.qrCode,
                        price: Number(activeTicket.price),
                        startTime: activeTicket.startTime?.toISOString() ?? null,
                        endTime: activeTicket.endTime?.toISOString() ?? null,
                    }
                    : null,
            }
        })

        return { success: true, minors: formattedMinors }
    } catch (error: any) {
        return { success: false, error: error.message, minors: [] }
    }
}