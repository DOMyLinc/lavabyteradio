import { Radio, Music } from "lucide-react";
import type { Station } from "@shared/schema";

interface NowPlayingProps {
  station: Station | null;
  isPlaying: boolean;
  isLoading?: boolean;
}

export function NowPlaying({ station, isPlaying, isLoading = false }: NowPlayingProps) {
  if (!station) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <Radio className="w-8 h-8 text-muted-foreground mb-2 opacity-50" />
        <p className="text-sm text-muted-foreground">Select a station to play</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 bg-black/40 rounded-md" data-testid="now-playing-container">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-2 h-2 rounded-full ${isPlaying ? "bg-lava-400 animate-led-blink shadow-led" : "bg-neutral-600"}`} />
        <span className="text-[10px] font-mono uppercase tracking-widest text-lava-300">
          {isLoading ? "LOADING..." : isPlaying ? "NOW PLAYING" : "PAUSED"}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-1">
        <div className="w-16 h-16 rounded-md bg-neutral-800 flex items-center justify-center overflow-hidden flex-shrink-0 border border-neutral-700">
          {station.logoUrl ? (
            <img
              src={station.logoUrl}
              alt={station.name}
              className="w-full h-full object-cover"
              data-testid="station-logo"
            />
          ) : (
            <Music className="w-8 h-8 text-lava-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="overflow-hidden">
            <h3 
              className={`text-lg font-semibold text-lava-100 truncate ${isPlaying ? "led-text" : ""}`}
              data-testid="now-playing-station"
            >
              {station.name}
            </h3>
          </div>
          {station.genre && (
            <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">
              {station.genre}
            </p>
          )}
          {station.description && (
            <p className="text-sm text-neutral-400 mt-1 line-clamp-2">
              {station.description}
            </p>
          )}
        </div>
      </div>

      {isPlaying && (
        <div className="flex items-center gap-1 mt-3 justify-center" data-testid="visualizer-small">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 bg-lava-400 rounded-full animate-lava-bubble"
              style={{
                height: `${12 + (i % 3) * 6}px`,
                animationDelay: `${i * 0.1}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
