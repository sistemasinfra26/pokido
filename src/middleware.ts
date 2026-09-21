import { clerkMiddleware, createRouteMatcher, createClerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isDashboardRoute = createRouteMatcher(["/dashboard(.*)"])

const ALLOWED_STAFF_ROLES = [
  "ADMIN",
  "MANAGER",
  "CASHIER",
  "STAFF",
  "SUPERADMIN",
  "ADMINISTRADOR",
  "admin",
  "manager",
  "cajera",
  "operador"
]

export default clerkMiddleware(async (auth, req) => {
  if (isDashboardRoute(req)) {
    const authObj = await auth()

    // 1. Si no hay sesión iniciada -> Sign In
    if (!authObj.userId) {
      return authObj.redirectToSignIn()
    }

    const sessionClaims = authObj.sessionClaims as any

    // 2. Intentar leer desde las cookies JWT
    let userRole =
      sessionClaims?.publicMetadata?.role ||
      sessionClaims?.public_metadata?.role ||
      sessionClaims?.metadata?.role ||
      ""

    // 3. 🔑 RESCATE: Si la cookie no trae el rol, consultar directamente a la API de Clerk
    if (!userRole && authObj.userId) {
      try {
        const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
        const user = await client.users.getUser(authObj.userId)
        userRole = (user.publicMetadata as any)?.role || ""
      } catch (err) {
        console.error("Error al consultar usuario en Clerk desde middleware:", err)
      }
    }

    const normalizedRole = typeof userRole === "string" ? userRole.trim() : ""
    const isStaffAuthorized = normalizedRole !== "" && ALLOWED_STAFF_ROLES.includes(normalizedRole)

    // 4. Si tras consultar la API de Clerk sigue sin tener rol de Staff -> Redirigir a reserva
    if (!isStaffAuthorized) {
      const redirectUrl = new URL("/reserva", req.url)
      redirectUrl.searchParams.set("error", "unauthorized_client")
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