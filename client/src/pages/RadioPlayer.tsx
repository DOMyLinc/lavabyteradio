import { useQuery } from "@tanstack/react-query";
import { LavaBackground } from "@/components/LavaBackground";
import { StereoUnit } from "@/components/StereoUnit";
import { Loader2 } from "lucide-react";
import type { Station } from "@shared/schema";
import mascotImage from "@assets/588496392_1194040775959608_6497226853787014568_n_1766326274153.jpg";

export default function RadioPlayer() {
  const { data: stations = [], isLoading, error } = useQuery<Station[]>({
    queryKey: ["/api/stations"],
  });

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <LavaBackground />

      <header className="relative z-10 flex items-center justify-between gap-4 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-lava-500 shadow-lava-glow">
            <img
              src={mascotImage}
              alt="Lava Bytes Mascot"
              className="w-full h-full object-cover"
              data-testid="mascot-logo"
            />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold text-lava-200 led-text">
              Lava Bytes Radio
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              Online Radio Experience
            </p>
          </div>
        </div>

        <a
          href="/admin"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          data-testid="admin-link"
        >
          Admin
        </a>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 md:p-8 relative z-10">
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-lava-400 animate-spin" />
            <p className="text-muted-foreground">Loading stations...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
              <span className="text-2xl">!</span>
            </div>
            <p className="text-destructive">Failed to load stations</p>
            <p className="text-sm text-muted-foreground">
              Please try refreshing the page
            </p>
          </div>
        ) : (
          <StereoUnit stations={stations} isLoading={isLoading} />
        )}
      </main>

      <footer className="relative z-10 text-center p-4 text-xs text-muted-foreground">
        <p>Lava Bytes Radio - Streaming Online Radio</p>
      </footer>
    </div>
  );
}
