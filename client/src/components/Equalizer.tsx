import { useState } from "react";
import { Music2, Guitar, Mic2, Drum, Piano, Music, Headphones } from "lucide-react";

interface EqualizerPreset {
  name: string;
  icon: React.ReactNode;
  bass: number;
  mid: number;
  treble: number;
}

const EQ_PRESETS: EqualizerPreset[] = [
  { name: "Flat", icon: <Headphones className="w-3 h-3" />, bass: 0, mid: 0, treble: 0 },
  { name: "Rock", icon: <Guitar className="w-3 h-3" />, bass: 4, mid: -1, treble: 3 },
  { name: "Jazz", icon: <Piano className="w-3 h-3" />, bass: 2, mid: 3, treble: 2 },
  { name: "Pop", icon: <Mic2 className="w-3 h-3" />, bass: 1, mid: 2, treble: 4 },
  { name: "Metal", icon: <Drum className="w-3 h-3" />, bass: 5, mid: 0, treble: 4 },
  { name: "Country", icon: <Music className="w-3 h-3" />, bass: 2, mid: 4, treble: 3 },
  { name: "Classical", icon: <Music2 className="w-3 h-3" />, bass: 0, mid: 2, treble: 1 },
];

interface EQSettings {
  bass: number;
  mid: number;
  treble: number;
}

interface EqualizerProps {
  isOpen: boolean;
  onClose: () => void;
  isPoweredOn: boolean;
  onEQChange?: (settings: EQSettings) => void;
}

export function Equalizer({ isOpen, onClose, isPoweredOn, onEQChange }: EqualizerProps) {
  const [activePreset, setActivePreset] = useState<string>("Flat");
  const [customBass, setCustomBass] = useState(0);
  const [customMid, setCustomMid] = useState(0);
  const [customTreble, setCustomTreble] = useState(0);

  const handlePresetSelect = (preset: EqualizerPreset) => {
    setActivePreset(preset.name);
    setCustomBass(preset.bass);
    setCustomMid(preset.mid);
    setCustomTreble(preset.treble);
    onEQChange?.({ bass: preset.bass, mid: preset.mid, treble: preset.treble });
  };
  
  const handleSliderChange = (type: "bass" | "mid" | "treble", value: number) => {
    if (type === "bass") setCustomBass(value);
    else if (type === "mid") setCustomMid(value);
    else setCustomTreble(value);
    setActivePreset("Custom");
    
    const newSettings = {
      bass: type === "bass" ? value : customBass,
      mid: type === "mid" ? value : customMid,
      treble: type === "treble" ? value : customTreble,
    };
    onEQChange?.(newSettings);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 rounded-md">
      <div className="w-full max-w-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-lava-400 animate-pulse" />
            <h3 className="text-xs font-mono text-lava-400 uppercase tracking-widest">Equalizer</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 text-xs font-mono uppercase tracking-wider"
            data-testid="close-equalizer"
          >
            Close
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1.5 mb-4">
          {EQ_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => handlePresetSelect(preset)}
              disabled={!isPoweredOn}
              className={`
                flex flex-col items-center gap-1 px-2 py-2 rounded
                transition-all duration-150
                ${activePreset === preset.name
                  ? "bg-lava-500/30 border border-lava-400/50 text-lava-300"
                  : "bg-zinc-800/50 border border-zinc-700/50 text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-300"
                }
                ${!isPoweredOn ? "opacity-50 cursor-not-allowed" : ""}
              `}
              data-testid={`eq-preset-${preset.name.toLowerCase()}`}
            >
              {preset.icon}
              <span className="text-[8px] font-mono uppercase tracking-wider">{preset.name}</span>
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-6 mt-4">
          <div className="flex flex-col items-center gap-2">
            <div className="relative h-24 w-6 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
              <div
                className="absolute bottom-0 w-full bg-gradient-to-t from-lava-600 to-lava-400 transition-all duration-300"
                style={{ height: `${((customBass + 6) / 12) * 100}%` }}
              />
              <input
                type="range"
                min="-6"
                max="6"
                value={customBass}
                onChange={(e) => handleSliderChange("bass", parseInt(e.target.value))}
                disabled={!isPoweredOn}
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ writingMode: "vertical-lr", direction: "rtl" }}
                data-testid="eq-bass-slider"
              />
            </div>
            <span className="text-[8px] font-mono text-zinc-500 uppercase">Bass</span>
            <span className="text-[10px] font-mono text-lava-400">{customBass > 0 ? `+${customBass}` : customBass}</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="relative h-24 w-6 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
              <div
                className="absolute bottom-0 w-full bg-gradient-to-t from-lava-600 to-lava-400 transition-all duration-300"
                style={{ height: `${((customMid + 6) / 12) * 100}%` }}
              />
              <input
                type="range"
                min="-6"
                max="6"
                value={customMid}
                onChange={(e) => handleSliderChange("mid", parseInt(e.target.value))}
                disabled={!isPoweredOn}
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ writingMode: "vertical-lr", direction: "rtl" }}
                data-testid="eq-mid-slider"
              />
            </div>
            <span className="text-[8px] font-mono text-zinc-500 uppercase">Mid</span>
            <span className="text-[10px] font-mono text-lava-400">{customMid > 0 ? `+${customMid}` : customMid}</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="relative h-24 w-6 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
              <div
                className="absolute bottom-0 w-full bg-gradient-to-t from-lava-600 to-lava-400 transition-all duration-300"
                style={{ height: `${((customTreble + 6) / 12) * 100}%` }}
              />
              <input
                type="range"
                min="-6"
                max="6"
                value={customTreble}
                onChange={(e) => handleSliderChange("treble", parseInt(e.target.value))}
                disabled={!isPoweredOn}
                className="absolute inset-0 opacity-0 cursor-pointer"
                style={{ writingMode: "vertical-lr", direction: "rtl" }}
                data-testid="eq-treble-slider"
              />
            </div>
            <span className="text-[8px] font-mono text-zinc-500 uppercase">Treble</span>
            <span className="text-[10px] font-mono text-lava-400">{customTreble > 0 ? `+${customTreble}` : customTreble}</span>
          </div>
        </div>

        <div className="mt-4 text-center">
          <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">
            {activePreset === "Custom" ? "Custom Settings" : `${activePreset} Mode`}
          </span>
        </div>
      </div>
    </div>
  );
}
