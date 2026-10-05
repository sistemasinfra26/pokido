"use server"

import { MercadoPagoConfig, Preference } from "mercadopago"
import { prisma } from "@/lib/prisma"

// Inicializar el cliente de Mercado Pago con las credenciales del servidor
const client = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN || "",
})

export async function createMercadoPagoPreference(orderId: string) {
    try {
        if (!process.env.MP_ACCESS_TOKEN) {
            return { success: false, error: "La configuración de Mercado Pago no está definida en las variables de entorno." }
        }

        // 1. Obtener la orden con sus datos, cliente, tickets o reserva de cumpleaños
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                customer: true,
                items: true,
                tickets: {
                    include: {
                        ticketType: true,
                        minor: true,
                    },
                },
            },
        })

        if (!order || !order.customer) {
            return { success: false, error: "La orden especificada no existe o no tiene un cliente asociado." }
        }

        // 2. Mapear los ítems cobrados
        let preferenceItems = order.tickets.map((ticket) => ({
            id: ticket.id,
            title: `Pase Pokiddo Park - ${ticket.ticketType?.name || "Entrada"} (${ticket.minor?.fullName || "Menor"})`,
            unit_price: Number(ticket.price),
            quantity: 1,
            currency_id: "ARS",
        }))

        // Si es una reserva de cumpleaños o venta general sin tickets individuales
        if (preferenceItems.length === 0 && order.items.length > 0) {
            preferenceItems = order.items.map((item) => ({
                id: item.id,
                title: item.description || `Orden Pokiddo Park #${order.orderNumber}`,
                unit_price: Number(item.unitPrice),
                quantity: item.quantity,
                currency_id: "ARS",
            }))
        }

        // Fallback global si no hay ítems detallados
        if (preferenceItems.length === 0) {
            preferenceItems = [
                {
                    id: order.id,
                    title: `Reserva Pokiddo Park - Orden ${order.orderNumber}`,
                    unit_price: Number(order.total),
                    quantity: 1,
                    currency_id: "ARS",
                },
            ]
        }

        // 3. Determinar la URL base dinámica para los retornos de manera segura
        const rawBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        const baseUrl = rawBaseUrl.startsWith("http") ? rawBaseUrl.replace(/\/$/, "") : `https://${rawBaseUrl.replace(/\/$/, "")}`

        const successUrl = `${baseUrl}/reserva/confirmacion?order=${order.orderNumber}&status=approved`
        const failureUrl = `${baseUrl}/reserva?status=rejected`
        const pendingUrl = `${baseUrl}/reserva/confirmacion?order=${order.orderNumber}&status=pending`

        // 4. Instanciar el servicio de Preferencias
        const preferenceApi = new Preference(client)

        const preferenceResponse = await preferenceApi.create({
            body: {
                items: preferenceItems,
                payer: {
                    name: order.customer.fullName,
                    email: order.customer.email || "cliente@pokiddopark.com",
                    phone: {
                        number: order.customer.phone || "",
                    },
                    identification: {
                        type: "DNI",
                        number: order.customer.dni || "",
                    },
                },
                external_reference: order.orderNumber, // 🔑 Vínculo con el webhook
                back_urls: {
                    success: successUrl,
                    failure: failureUrl,
                    pending: pendingUrl,
                },
                auto_return: "approved",
                notification_url: `${baseUrl}/api/webhooks/mercadopago`, // 🔑 URL pública del webhook
            },
        })

        // 5. Guardar la preferencia creada en el registro de la orden
        await prisma.order.update({
            where: { id: order.id },
            data: {
                mpPreferenceId: preferenceResponse.id,
            },
        })

        // Retornar la URL de redirección
        const initPoint = process.env.NODE_ENV === "production"
            ? preferenceResponse.init_point
            : (preferenceResponse.sandbox_init_point || preferenceResponse.init_point)

        return {
            success: true,
            initPoint,
            preferenceId: preferenceResponse.id,
        }
    } catch (error: any) {
        console.error("Error al crear la preferencia de Mercado Pago:", error)
        return {
            success: false,
            error: error?.message || "Ocurrió un error inesperado al conectar con Mercado Pago.",
        }
    }
}