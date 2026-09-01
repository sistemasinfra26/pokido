import { Sidebar } from "./components/Sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-slate-950 font-sans">
            <Sidebar />
            <main className="flex-1 overflow-x-hidden pt-16 lg:pt-0">
                {children}
            </main>
        </div>
    )
}