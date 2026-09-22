import { getAllAreas } from "../catalog/repository";
import { recordEvent } from "../persistence/repositories/analytics";
import { Hero } from "../components/landing/Hero";
import { ServiceGrid } from "../components/landing/ServiceGrid";
import { WhatsAppButton } from "../components/shared/WhatsAppButton";

export default async function LandingPage() {
  const areas = getAllAreas();

  await recordEvent("landing_view", { channel: "web" });

  return (
    <main className="min-h-screen bg-gradient-to-b from-navy-900 to-navy-700 pb-16">
      <Hero />
      <ServiceGrid areas={areas} />

      <div className="mt-10 flex justify-center">
        <WhatsAppButton label="Hablar con un abogado" />
      </div>
    </main>
  );
}
