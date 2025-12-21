import { Power } from "lucide-react";

interface PowerButtonProps {
  isPoweredOn: boolean;
  onToggle: () => void;
}

export function PowerButton({ isPoweredOn, onToggle }: PowerButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={`
        relative w-12 h-12 rounded-full flex items-center justify-center
        transition-all duration-300
        ${isPoweredOn
          ? "bg-lava-600 shadow-[0_0_16px_hsl(var(--lava-glow)/0.5)]"
          : "bg-neutral-900 hover:bg-neutral-800"
        }
        border-2 border-neutral-700
        shadow-stereo-button
        active:stereo-pressed
      `}
      data-testid="power-button"
      aria-label={isPoweredOn ? "Power off" : "Power on"}
      aria-pressed={isPoweredOn}
    >
      <Power className={`w-5 h-5 ${isPoweredOn ? "text-white" : "text-neutral-500"}`} />
      {isPoweredOn && (
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-lava-400 animate-led-blink shadow-led" />
      )}
    </button>
  );
}
