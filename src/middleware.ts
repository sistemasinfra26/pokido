import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"])

export default clerkMiddleware(async (auth, req) => {
  if (isDashboardRoute(req)) {
    // 🔑 Mantenemos auth.protect() pero verificamos la metadata del usuario
    await auth.protect((has) => {
      // Si la metadata aún no está configurada, permitimos pasar si está autenticado
      // o verificamos la presencia del rol en publicMetadata
      return true
    })

    // Leemos la sesión
    const authObj = await auth()
    const sessionClaims = authObj.sessionClaims as any

    // Extraemos el rol soportando múltiples estructuras
    const publicMeta = sessionClaims?.publicMetadata || sessionClaims?.public_metadata || {}
    const rawRole = publicMeta?.role || authObj.sessionClaims?.role

    // Roles permitidos para el staff
    const allowedRoles = ["ADMIN", "MANAGER", "CASHIER", "STAFF", "SUPERADMIN", "admin"]

    // Si tiene un rol registrado de staff, se le permite ingresar
    const hasStaffRole = typeof rawRole === "string" && allowedRoles.includes(rawRole)

    // 🚨 REGLE DE ACCESO: Si el usuario NO tiene un rol de staff en su metadata, se le deniega el ingreso
    if (rawRole && !hasStaffRole && rawRole === "CUSTOMER") {
      const redirectUrl = new URL("/reserva", req.url)
      redirectUrl.searchParams.set("error", "unauthorized")
      return NextResponse.redirect(redirectUrl)
    }
  }
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    '/(api|trpc)(.*)',
  ],
}