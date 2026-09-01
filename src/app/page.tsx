import { Navbar } from "@/app/components/landing/Navbar"
import { HeroSection } from "@/app/components/landing/HeroSection"
import { AttractionsSection } from "@/app/components/landing/AttractionsSection"
import { PricingSection } from "@/app/components/landing/PricingSection"
import { WaiverSection } from "@/app/components/landing/WaiverSection"
import { Footer } from "@/app/components/landing/Footer"

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-pokido-purple selection:text-white">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <AttractionsSection />
        <PricingSection />
        <WaiverSection />
      </main>
      <Footer />
    </div>
  )
}