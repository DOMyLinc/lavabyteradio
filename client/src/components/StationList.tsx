import { X, Radio, Music, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Station } from "@shared/schema";

interface StationListProps {
  stations: Station[];
  currentStationId: number | null;
  onSelectStation: (station: Station) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function StationList({
  stations,
  currentStationId,
  onSelectStation,
  onClose,
  isOpen,
}: StationListProps) {
  const activeStations = stations.filter((s) => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder);

  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/60 backdrop-blur-sm
        animate-in fade-in duration-200
      `}
      onClick={onClose}
      data-testid="station-list-overlay"
    >
      <div
        className={`
          w-full max-w-md bg-card border border-card-border rounded-lg
          shadow-2xl overflow-hidden
          animate-in slide-in-from-bottom-4 duration-300
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 p-4 border-b border-border bg-neutral-900/80">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-lava-400" />
            <h2 className="text-lg font-semibold">Available Stations</h2>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            data-testid="close-station-list"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="p-2">
            {activeStations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Radio className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <p className="text-muted-foreground">No stations available</p>
              </div>
            ) : (
              <div className="space-y-1">
                {activeStations.map((station) => {
                  const isActive = station.id === currentStationId;
                  return (
                    <button
                      key={station.id}
                      onClick={() => {
                        onSelectStation(station);
                        onClose();
                      }}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-md
                        transition-all duration-150
                        ${isActive
                          ? "bg-lava-900/40 border border-lava-700/50"
                          : "hover:bg-neutral-800/50 border border-transparent"
                        }
                      `}
                      data-testid={`station-list-item-${station.id}`}
                    >
                      <div className={`
                        w-12 h-12 rounded-md flex items-center justify-center
                        flex-shrink-0 overflow-hidden
                        ${isActive ? "bg-lava-900" : "bg-neutral-800"}
                        border border-neutral-700
                      `}>
                        {station.logoUrl ? (
                          <img
                            src={station.logoUrl}
                            alt={station.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Music className={`w-6 h-6 ${isActive ? "text-lava-400" : "text-neutral-500"}`} />
                        )}
                      </div>

                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          {isActive && (
                            <div className="w-2 h-2 rounded-full bg-lava-400 animate-led-blink shadow-led" />
                          )}
                          <h3 className={`font-medium truncate ${isActive ? "text-lava-200" : "text-foreground"}`}>
                            {station.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {station.genre && (
                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                              {station.genre}
                            </span>
                          )}
                          {station.presetNumber && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-lava-900/60 text-lava-300 rounded font-mono">
                              P{station.presetNumber}
                            </span>
                          )}
                        </div>
                        {station.description && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {station.description}
                          </p>
                        )}
                      </div>

                      <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-lava-400" : "text-muted-foreground"}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
