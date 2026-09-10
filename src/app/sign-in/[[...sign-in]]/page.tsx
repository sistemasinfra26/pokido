import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
            <SignIn
                appearance={{
                    elements: {
                        formButtonPrimary: "bg-pokido-purple hover:bg-pokido-purple/90 text-white font-bold text-xs rounded-xl",
                        card: "bg-white border border-slate-200 shadow-sm rounded-3xl",
                        headerTitle: "text-slate-900 font-black",
                        headerSubtitle: "text-slate-500 font-medium text-xs",
                    },
                }}
            />
        </div>
    )
}