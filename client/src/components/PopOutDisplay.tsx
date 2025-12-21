import { Music, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Station } from "@shared/schema";

interface PopOutDisplayProps {
  station: Station | null;
  isPlaying: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

export function PopOutDisplay({
  station,
  isPlaying,
  isExpanded,
  onToggle,
}: PopOutDisplayProps) {
  return (
    <div className="w-full">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground mb-2"
        data-testid="toggle-display"
      >
        {isExpanded ? (
          <>
            <ChevronDown className="w-4 h-4" />
            <span>Hide Display</span>
          </>
        ) : (
          <>
            <ChevronUp className="w-4 h-4" />
            <span>Show Display</span>
          </>
        )}
      </Button>

      <div
        className={`
          overflow-hidden transition-all duration-500 ease-out
          ${isExpanded ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"}
        `}
        data-testid="pop-out-display"
      >
        <div className="relative aspect-video w-full max-w-2xl mx-auto bg-black rounded-lg border-4 border-neutral-800 overflow-hidden shadow-stereo">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-black to-neutral-900" />

          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neutral-700 to-transparent opacity-50" />

          {station ? (
            <div className="relative z-10 flex flex-col items-center justify-center h-full p-6">
              <div className={`
                w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden mb-4
                border-2 border-neutral-700 shadow-xl
                ${isPlaying ? "animate-glow-pulse" : ""}
              `}>
                {station.logoUrl ? (
                  <img
                    src={station.logoUrl}
                    alt={station.name}
                    className="w-full h-full object-cover"
                    data-testid="display-station-logo"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-lava-700 to-lava-900 flex items-center justify-center">
                    <Music className="w-16 h-16 text-lava-300" />
                  </div>
                )}
              </div>

              <h2 className={`
                text-2xl md:text-3xl font-display font-bold text-center
                ${isPlaying ? "text-lava-200 led-text" : "text-neutral-400"}
              `}>
                {station.name}
              </h2>

              {station.genre && (
                <span className="text-sm text-lava-400 uppercase tracking-widest mt-2">
                  {station.genre}
                </span>
              )}

              {station.description && (
                <p className="text-sm text-neutral-400 text-center mt-3 max-w-md line-clamp-2">
                  {station.description}
                </p>
              )}

              {isPlaying && (
                <div className="flex items-end gap-1 mt-6 h-8" data-testid="visualizer-large">
                  {[...Array(12)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 md:w-1.5 bg-gradient-to-t from-lava-600 to-lava-400 rounded-full animate-lava-bubble"
                      style={{
                        height: `${16 + (i % 4) * 5}px`,
                        animationDelay: `${i * 0.05}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="relative z-10 flex flex-col items-center justify-center h-full p-6">
              <div className="w-24 h-24 rounded-lg bg-neutral-800/50 flex items-center justify-center mb-4 border border-neutral-700">
                <Music className="w-12 h-12 text-neutral-600" />
              </div>
              <p className="text-neutral-500 text-lg">No Station Selected</p>
              <p className="text-neutral-600 text-sm mt-2">Select a station to begin listening</p>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
