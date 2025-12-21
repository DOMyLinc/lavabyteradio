import { useState, useRef, useEffect, useCallback } from "react";
import { List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PowerButton } from "./PowerButton";
import { PlayButton } from "./PlayButton";
import { VolumeKnob } from "./VolumeKnob";
import { PresetButtons } from "./PresetButtons";
import { StationDial } from "./StationDial";
import { NowPlaying } from "./NowPlaying";
import { PopOutDisplay } from "./PopOutDisplay";
import { StationList } from "./StationList";
import type { Station } from "@shared/schema";

interface StereoUnitProps {
  stations: Station[];
  isLoading: boolean;
}

export function StereoUnit({ stations, isLoading }: StereoUnitProps) {
  const [isPoweredOn, setIsPoweredOn] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [currentStation, setCurrentStation] = useState<Station | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [isDisplayExpanded, setIsDisplayExpanded] = useState(true);
  const [isStationListOpen, setIsStationListOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (stations.length > 0 && !currentStation) {
      const firstPreset = stations.find((s) => s.presetNumber === 1 && s.isActive);
      if (firstPreset) {
        setCurrentStation(firstPreset);
      } else {
        const firstActive = stations.find((s) => s.isActive);
        if (firstActive) {
          setCurrentStation(firstActive);
        }
      }
    }
  }, [stations, currentStation]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "none";
    }

    const audio = audioRef.current;

    const handleLoadStart = () => setIsStreamLoading(true);
    const handleCanPlay = () => setIsStreamLoading(false);
    const handleError = () => {
      setIsStreamLoading(false);
      setIsPlaying(false);
    };
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playStation = useCallback(async (station: Station) => {
    if (!audioRef.current || !isPoweredOn) return;

    const audio = audioRef.current;

    if (audio.src !== station.streamUrl) {
      audio.src = station.streamUrl;
    }

    try {
      setIsStreamLoading(true);
      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Failed to play station:", error);
      setIsPlaying(false);
    } finally {
      setIsStreamLoading(false);
    }
  }, [isPoweredOn]);

  const pausePlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleSelectStation = useCallback((station: Station) => {
    setCurrentStation(station);
    if (isPoweredOn && isPlaying) {
      playStation(station);
    }
  }, [isPoweredOn, isPlaying, playStation]);

  const handlePlayToggle = useCallback(() => {
    if (!currentStation || !isPoweredOn) return;

    if (isPlaying) {
      pausePlayback();
    } else {
      playStation(currentStation);
    }
  }, [currentStation, isPoweredOn, isPlaying, playStation, pausePlayback]);

  const handlePowerToggle = useCallback(() => {
    if (isPoweredOn) {
      pausePlayback();
    }
    setIsPoweredOn(!isPoweredOn);
  }, [isPoweredOn, pausePlayback]);

  const activeStations = stations.filter((s) => s.isActive);

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <PopOutDisplay
        station={currentStation}
        isPlaying={isPlaying && isPoweredOn}
        isExpanded={isDisplayExpanded && isPoweredOn}
        onToggle={() => setIsDisplayExpanded(!isDisplayExpanded)}
      />

      <div
        className={`
          relative mt-4 p-6 rounded-xl
          bg-gradient-to-b from-neutral-800 via-neutral-900 to-black
          border border-neutral-700
          shadow-stereo
          transition-opacity duration-500
          ${isPoweredOn ? "opacity-100" : "opacity-80"}
        `}
        data-testid="stereo-unit"
      >
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <PowerButton isPoweredOn={isPoweredOn} onToggle={handlePowerToggle} />
              <div className="flex flex-col">
                <span className="text-xs font-mono uppercase tracking-widest text-lava-400">
                  Lava Bytes
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  Radio
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsStationListOpen(true)}
              disabled={!isPoweredOn}
              className="text-muted-foreground hover:text-foreground"
              data-testid="open-station-list"
            >
              <List className="w-4 h-4 mr-2" />
              Stations
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-stretch">
            <div className="flex-1 w-full lg:w-auto min-w-0">
              <NowPlaying
                station={currentStation}
                isPlaying={isPlaying && isPoweredOn}
                isLoading={isStreamLoading}
              />
            </div>

            <div className="flex flex-row lg:flex-col items-center gap-4 lg:gap-6">
              <PlayButton
                isPlaying={isPlaying}
                isLoading={isStreamLoading}
                onToggle={handlePlayToggle}
                disabled={!isPoweredOn || !currentStation}
              />
              <VolumeKnob
                volume={volume}
                onChange={setVolume}
                disabled={!isPoweredOn}
              />
            </div>

            <div className="flex flex-col items-center gap-4">
              <PresetButtons
                stations={activeStations}
                currentStationId={currentStation?.id ?? null}
                onSelectStation={handleSelectStation}
                disabled={!isPoweredOn}
              />
            </div>
          </div>

          <StationDial
            stations={activeStations}
            currentStationId={currentStation?.id ?? null}
            onSelectStation={handleSelectStation}
            disabled={!isPoweredOn}
          />
        </div>

        {!isPoweredOn && (
          <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center z-20">
            <p className="text-neutral-500 text-sm font-mono uppercase tracking-wider">
              Power Off
            </p>
          </div>
        )}
      </div>

      <StationList
        stations={activeStations}
        currentStationId={currentStation?.id ?? null}
        onSelectStation={handleSelectStation}
        onClose={() => setIsStationListOpen(false)}
        isOpen={isStationListOpen}
      />
    </div>
  );
}
