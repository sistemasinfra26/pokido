export interface TicketType {
    id: string
    name: string
    durationMinutes: number
    price: number
}

export interface PartyRoom {
    id: string
    name: string
    capacity: number
    recommendedFor?: string
    description?: string
    imageUrl?: string
    includes?: string[]
    isActive: boolean
}