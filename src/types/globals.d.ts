export { }

export type UserRole = "admin" | "cajera" | "operador" | "customer"

declare global {
    interface CustomJwtSessionClaims {
        metadata?: {
            role?: UserRole
        }
    }
}