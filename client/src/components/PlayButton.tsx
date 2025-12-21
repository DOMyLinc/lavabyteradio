import { Play, Pause, Loader2 } from "lucide-react";

interface PlayButtonProps {
  isPlaying: boolean;
  isLoading: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function PlayButton({ isPlaying, isLoading, onToggle, disabled = false }: PlayButtonProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled || isLoading}
      className={`
        relative w-16 h-16 rounded-full flex items-center justify-center
        transition-all duration-200
        ${isPlaying
          ? "bg-lava-500 shadow-[0_0_24px_hsl(var(--lava-glow)/0.6)]"
          : "bg-neutral-800 hover:bg-neutral-700"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        border-2 border-neutral-700
        shadow-stereo-button
        active:stereo-pressed
      `}
      data-testid="play-button"
      aria-label={isPlaying ? "Pause" : "Play"}
    >
      {isLoading ? (
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      ) : isPlaying ? (
        <Pause className="w-8 h-8 text-white" />
      ) : (
        <Play className="w-8 h-8 text-white ml-1" />
      )}

      {isPlaying && !isLoading && (
        <div className="absolute inset-0 rounded-full animate-glow-pulse pointer-events-none" />
      )}
    </button>
  );
}
