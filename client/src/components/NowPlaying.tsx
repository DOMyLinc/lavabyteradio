import { Radio, Music, Play, Pause } from "lucide-react";
import type { Station } from "@shared/schema";

interface NowPlayingProps {
  station: Station | null;
  isPlaying: boolean;
  isLoading?: boolean;
  onPlayToggle?: () => void;
  disabled?: boolean;
  compact?: boolean;
}

export function NowPlaying({ station, isPlaying, isLoading = false, onPlayToggle, disabled = false, compact = false }: NowPlayingProps) {
  if (!station) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <Radio className={`${compact ? "w-6 h-6" : "w-8 h-8"} text-muted-foreground mb-2 opacity-50`} />
        <p className={`${compact ? "text-xs" : "text-sm"} text-muted-foreground`}>Select a station to play</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3 h-full" data-testid="now-playing-container">
        <button
          onClick={onPlayToggle}
          disabled={disabled}
          className={`
            w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0
            transition-all duration-150
            ${disabled 
              ? "bg-gradient-to-b from-zinc-700 to-zinc-900 border border-zinc-600 opacity-50 cursor-not-allowed"
              : "bg-gradient-to-b from-lava-500 to-lava-700 border border-lava-400/50 shadow-[0_2px_8px_rgba(255,100,50,0.3)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
            }
          `}
          data-testid="button-play"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-6 h-6 text-white" fill="white" />
          ) : (
            <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            {station.logoUrl ? (
              <img
                src={station.logoUrl}
                alt={station.name}
                className="w-8 h-8 rounded object-cover border border-zinc-700"
                data-testid="station-logo"
              />
            ) : (
              <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center border border-zinc-700">
                <Music className="w-4 h-4 text-lava-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 
                className={`text-sm font-semibold text-zinc-100 truncate ${isPlaying ? "led-text" : ""}`}
                data-testid="now-playing-station"
              >
                {station.name}
              </h3>
              {station.genre && (
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider truncate">
                  {station.genre}
                </p>
              )}
            </div>
          </div>
          {station.description && (
            <p className="text-xs text-zinc-400 line-clamp-1 mt-1">
              {station.description}
            </p>
          )}
        </div>

        {isPlaying && (
          <div className="flex items-center gap-0.5 flex-shrink-0" data-testid="visualizer-small">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 bg-lava-400 rounded-full animate-lava-bubble"
                style={{
                  height: `${8 + (i % 3) * 4}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}
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
