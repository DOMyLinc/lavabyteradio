import { useRef, useState, useCallback, useEffect } from "react";

interface VolumeKnobProps {
  volume: number;
  onChange: (volume: number) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function VolumeKnob({ volume, onChange, disabled = false, compact = false }: VolumeKnobProps) {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startAngleRef = useRef(0);
  const startVolumeRef = useRef(0);

  const getAngleFromEvent = useCallback((clientX: number, clientY: number) => {
    if (!knobRef.current) return 0;
    const rect = knobRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    return Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
  }, []);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (disabled) return;
    setIsDragging(true);
    startAngleRef.current = getAngleFromEvent(clientX, clientY);
    startVolumeRef.current = volume;
  }, [disabled, getAngleFromEvent, volume]);

  const handleMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || disabled) return;
    const currentAngle = getAngleFromEvent(clientX, clientY);
    let angleDiff = currentAngle - startAngleRef.current;

    if (angleDiff > 180) angleDiff -= 360;
    if (angleDiff < -180) angleDiff += 360;

    const volumeChange = angleDiff / 270;
    let newVolume = startVolumeRef.current + volumeChange;
    newVolume = Math.max(0, Math.min(1, newVolume));
    onChange(newVolume);
  }, [isDragging, disabled, getAngleFromEvent, onChange]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) handleMove(e.touches[0].clientX, e.touches[0].clientY);
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

  const rotation = -135 + (volume * 270);
  const displayVolume = Math.round(volume * 100);

  if (compact) {
    return (
      <div
        ref={knobRef}
        tabIndex={disabled ? -1 : 0}
        className={`
          relative w-full h-full rounded-full cursor-pointer select-none
          bg-gradient-to-b from-zinc-500 to-zinc-800
          shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_2px_rgba(0,0,0,0.4)]
          ${isDragging ? "ring-1 ring-lava-400" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          transition-shadow duration-200
          focus:outline-none focus:ring-1 focus:ring-lava-400
        `}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          if (e.touches[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "ArrowUp" || e.key === "ArrowRight") {
            e.preventDefault();
            onChange(Math.min(1, volume + 0.05));
          } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
            e.preventDefault();
            onChange(Math.max(0, volume - 0.05));
          }
        }}
        data-testid="volume-knob"
        role="slider"
        aria-label="Volume control"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={displayVolume}
      >
        <div className="absolute inset-1 rounded-full bg-gradient-to-b from-zinc-600 to-zinc-900 flex items-center justify-center">
          <div
            className="absolute w-0.5 h-4 bg-lava-400 rounded-full shadow-[0_0_4px_rgba(255,100,50,0.5)]"
            style={{ 
              transform: `rotate(${rotation}deg)`,
              transformOrigin: "center 16px",
              top: "3px",
              left: "calc(50% - 1px)"
            }}
          />
        </div>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const angle = -135 + (i * 33.75);
          return (
            <div
              key={i}
              className="absolute w-px h-1 bg-zinc-400"
              style={{
                left: "50%",
                top: "0",
                transformOrigin: "center 24px",
                transform: `translateX(-50%) rotate(${angle}deg)`,
              }}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={knobRef}
        tabIndex={disabled ? -1 : 0}
        className={`
          relative w-20 h-20 rounded-full cursor-pointer select-none
          bg-gradient-to-b from-neutral-700 to-neutral-900
          border-4 border-neutral-800
          shadow-[0_4px_12px_rgba(0,0,0,0.5),inset_0_2px_4px_rgba(255,255,255,0.1)]
          ${isDragging ? "ring-2 ring-lava-400" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
          transition-shadow duration-200
          focus:outline-none focus:ring-2 focus:ring-lava-400
        `}
        onMouseDown={(e) => handleStart(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          if (e.touches[0]) handleStart(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "ArrowUp" || e.key === "ArrowRight") {
            e.preventDefault();
            onChange(Math.min(1, volume + 0.05));
          } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
            e.preventDefault();
            onChange(Math.max(0, volume - 0.05));
          }
        }}
        data-testid="volume-knob"
        role="slider"
        aria-label="Volume control"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={displayVolume}
      >
        <div className="absolute inset-2 rounded-full bg-gradient-to-b from-neutral-600 to-neutral-800 flex items-center justify-center">
          <div
            className="absolute w-1 h-6 bg-lava-400 rounded-full shadow-led"
            style={{ transform: `rotate(${rotation}deg) translateY(-12px)` }}
          />
          <span className="text-xs font-mono text-lava-300 font-semibold led-text">
            {displayVolume}
          </span>
        </div>

        {Array.from({ length: 11 }).map((_, i) => {
          const angle = -135 + (i * 27);
          return (
            <div
              key={i}
              className="absolute w-0.5 h-2 bg-neutral-500"
              style={{
                left: "50%",
                top: "0",
                transformOrigin: "center 40px",
                transform: `translateX(-50%) rotate(${angle}deg)`,
              }}
            />
          );
        })}
      </div>

      <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">VOL</span>
    </div>
  );
}
