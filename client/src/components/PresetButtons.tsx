import type { UnifiedStation } from "@/pages/RadioPlayer";

interface PresetButtonsProps {
  stations: UnifiedStation[];
  currentStationId: number | null;
  currentStationType: "external" | "user" | null;
  onSelectStation: (station: UnifiedStation) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function PresetButtons({
  stations,
  currentStationId,
  currentStationType,
  onSelectStation,
  disabled = false,
  compact = false,
}: PresetButtonsProps) {
  // Only external stations have presets
  const externalStations = stations.filter(s => s.type === "external");
  const presetStations = externalStations
    .filter((s) => s.presetNumber !== null && s.presetNumber >= 1 && s.presetNumber <= 5)
    .sort((a, b) => (a.presetNumber ?? 0) - (b.presetNumber ?? 0));

  const presetSlots = Array.from({ length: 5 }, (_, i) => {
    const presetNum = i + 1;
    return presetStations.find((s) => s.presetNumber === presetNum) || null;
  });

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] font-mono uppercase tracking-wider text-zinc-500 mr-1">
          Presets
        </span>
        {presetSlots.map((station, index) => {
          const presetNum = index + 1;
          const isActive = station && station.id === currentStationId && currentStationType === "external";
          const hasStation = station !== null;

          return (
            <button
              key={presetNum}
              onClick={() => station && onSelectStation(station)}
              disabled={disabled || !hasStation}
              className={`
                relative min-w-[2rem] h-7 px-2 rounded font-mono text-xs font-semibold
                transition-all duration-150
                ${isActive
                  ? "bg-lava-500 text-white shadow-[0_0_8px_hsl(var(--lava-glow)/0.5)]"
                  : hasStation
                    ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    : "bg-zinc-900 text-zinc-700 cursor-not-allowed"
                }
                ${!disabled && hasStation ? "active:shadow-[inset_0_1px_3px_rgba(0,0,0,0.4)]" : ""}
                border border-zinc-700
              `}
              data-testid={`preset-button-${presetNum}`}
              aria-label={station ? `Preset ${presetNum}: ${station.name}` : `Preset ${presetNum}: Empty`}
            >
              <span className="relative z-10">{presetNum}</span>
              {isActive && (
                <div className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-lava-300 animate-led-blink shadow-led" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground text-center">
        Presets
      </span>
      <div className="flex gap-2">
        {presetSlots.map((station, index) => {
          const presetNum = index + 1;
          const isActive = station && station.id === currentStationId && currentStationType === "external";
          const hasStation = station !== null;

          return (
            <button
              key={presetNum}
              onClick={() => station && onSelectStation(station)}
              disabled={disabled || !hasStation}
              className={`
                relative min-w-[3.5rem] h-10 px-3 rounded-md font-mono text-sm font-semibold
                transition-all duration-150
                ${isActive
                  ? "bg-lava-500 text-white shadow-[0_0_12px_hsl(var(--lava-glow)/0.6)]"
                  : hasStation
                    ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    : "bg-neutral-900 text-neutral-600 cursor-not-allowed"
                }
                ${!disabled && hasStation ? "active:stereo-pressed" : ""}
                border border-neutral-700
                shadow-stereo-button
              `}
              data-testid={`preset-button-${presetNum}`}
              aria-label={station ? `Preset ${presetNum}: ${station.name}` : `Preset ${presetNum}: Empty`}
            >
              <span className="relative z-10">{presetNum}</span>
              {isActive && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-lava-300 animate-led-blink shadow-led" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
