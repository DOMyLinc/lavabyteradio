import { useRef, useCallback, useState, useEffect } from "react";
import type { Station } from "@shared/schema";

interface StationDialProps {
  stations: Station[];
  currentStationId: number | null;
  onSelectStation: (station: Station) => void;
  disabled?: boolean;
}

export function StationDial({
  stations,
  currentStationId,
  onSelectStation,
  disabled = false,
}: StationDialProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const startXRef = useRef(0);
  const startScrollRef = useRef(0);

  const activeStations = stations.filter((s) => s.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  const currentIndex = activeStations.findIndex((s) => s.id === currentStationId);

  useEffect(() => {
    if (currentIndex >= 0 && containerRef.current) {
      const itemWidth = 120;
      const containerWidth = containerRef.current.offsetWidth;
      const targetScroll = currentIndex * itemWidth - containerWidth / 2 + itemWidth / 2;
      setScrollPosition(Math.max(0, targetScroll));
    }
  }, [currentIndex]);

  const handleStart = useCallback((clientX: number) => {
    if (disabled) return;
    setIsDragging(true);
    startXRef.current = clientX;
    startScrollRef.current = scrollPosition;
  }, [disabled, scrollPosition]);

  const handleMove = useCallback((clientX: number) => {
    if (!isDragging || disabled) return;
    const diff = startXRef.current - clientX;
    const maxScroll = Math.max(0, activeStations.length * 120 - (containerRef.current?.offsetWidth || 0));
    setScrollPosition(Math.max(0, Math.min(maxScroll, startScrollRef.current + diff)));
  }, [isDragging, disabled, activeStations.length]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, handleMove, handleEnd]);

  const handleStationClick = (station: Station) => {
    if (!isDragging) {
      onSelectStation(station);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between px-2">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
          Station Dial
        </span>
        <span className="text-xs font-mono text-lava-400">
          {activeStations.length} stations
        </span>
      </div>

      <div
        ref={containerRef}
        className={`
          relative h-20 bg-gradient-to-b from-neutral-900 to-black
          rounded-md border border-neutral-800 overflow-hidden
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-grab"}
          ${isDragging ? "cursor-grabbing" : ""}
        `}
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => {
          if (e.touches[0]) handleStart(e.touches[0].clientX);
        }}
        data-testid="station-dial"
        role="listbox"
        aria-label="Station selector dial"
      >
        <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-r from-black via-transparent to-black" />

        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-lava-400 z-20 shadow-led" />

        <div className="absolute left-1/2 top-0 -translate-x-1/2 z-20">
          <div className="w-0 h-0 border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent border-t-lava-400" style={{ borderTopWidth: "8px" }} />
        </div>

        <div
          className="flex items-center h-full transition-transform duration-100"
          style={{ transform: `translateX(-${scrollPosition}px)` }}
        >
          <div className="w-[50%] flex-shrink-0" />

          {activeStations.map((station) => {
            const isActive = station.id === currentStationId;
            return (
              <button
                key={station.id}
                onClick={() => handleStationClick(station)}
                className={`
                  flex-shrink-0 w-[120px] h-full flex flex-col items-center justify-center
                  border-r border-neutral-800 transition-all duration-200
                  ${isActive ? "bg-lava-900/30" : "hover:bg-neutral-800/50"}
                  ${disabled ? "" : "pointer-events-auto"}
                `}
                data-testid={`dial-station-${station.id}`}
                role="option"
                aria-selected={isActive}
              >
                <div className={`
                  w-1 h-1 rounded-full mb-2
                  ${isActive ? "bg-lava-400 shadow-led animate-led-blink" : "bg-neutral-600"}
                `} />
                <span className={`
                  text-xs font-medium text-center px-2 truncate max-w-full
                  ${isActive ? "text-lava-300 led-text" : "text-neutral-400"}
                `}>
                  {station.name}
                </span>
                {station.genre && (
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">
                    {station.genre}
                  </span>
                )}
              </button>
            );
          })}

          <div className="w-[50%] flex-shrink-0" />
        </div>
      </div>

      <div className="flex justify-center gap-1 mt-1">
        {activeStations.map((station, index) => (
          <button
            key={station.id}
            onClick={() => onSelectStation(station)}
            className={`
              w-2 h-2 rounded-full transition-all duration-200
              ${station.id === currentStationId
                ? "bg-lava-400 shadow-led"
                : "bg-neutral-700 hover:bg-neutral-600"
              }
            `}
            aria-label={`Go to ${station.name}`}
            data-testid={`dial-dot-${index}`}
          />
        ))}
      </div>
    </div>
  );
}
