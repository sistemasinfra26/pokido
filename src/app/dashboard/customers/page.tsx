"use client"

import { useEffect, useState } from "react"
import { getCustomersList } from "@/app/actions/customerActions"
import { CustomersHeader } from "./components/CustomersHeader"
import { CustomersTable, CustomerData } from "./components/CustomersTable"
import { CustomerDetailModal } from "./components/CustomerDetailModal"

export default function CustomersPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [customers, setCustomers] = useState<CustomerData[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null)

    const loadCustomers = async () => {
        setLoading(true)
        const res = await getCustomersList()
        setLoading(false)

        if (res.success && res.data) {
            setCustomers(res.data)
        }
    }

    useEffect(() => {
        loadCustomers()
    }, [])

    const filteredCustomers = customers.filter(
        (c) =>
            c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.dni.includes(searchQuery) ||
            c.phone.includes(searchQuery)
    )

    if (loading) {
        return (
            <div className="p-6 bg-slate-100 min-h-screen flex items-center justify-center font-sans text-slate-500 font-bold">
                Cargando listado de clientes reales...
            </div>
        )
    }

    return (
        <div className="p-6 bg-slate-100 min-h-screen text-slate-800 font-sans space-y-6">
            <CustomersHeader
                totalCustomers={customers.length}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
            />

            <CustomersTable
                customers={filteredCustomers}
                onSelectCustomer={(cust) => setSelectedCustomer(cust)}
            />

            <CustomerDetailModal
                customer={selectedCustomer}
                onClose={() => setSelectedCustomer(null)}
            />
        </div>
    )
}