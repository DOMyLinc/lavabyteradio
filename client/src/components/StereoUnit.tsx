import { useState, useRef, useEffect, useCallback } from "react";
import { SkipBack, SkipForward, Home, Settings, List, Power, Volume2 } from "lucide-react";
import Hls from "hls.js";
import { VolumeKnob } from "./VolumeKnob";
import { NowPlaying } from "./NowPlaying";
import { StationList } from "./StationList";
import { PresetButtons } from "./PresetButtons";
import { useToast } from "@/hooks/use-toast";
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
  const [isStationListOpen, setIsStationListOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const { toast } = useToast();

  const hasVideo = currentStation?.videoStreamUrl;

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
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, []);

  const cleanupVideo = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
  }, []);

  const setupVideoHls = useCallback((video: HTMLVideoElement, url: string) => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (url.includes(".m3u8") && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsStreamLoading(false);
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          console.error("HLS fatal error:", data);
          hls.destroy();
          hlsRef.current = null;
          if (videoRef.current) {
            videoRef.current.pause();
            videoRef.current.removeAttribute("src");
            videoRef.current.load();
          }
          setIsStreamLoading(false);
          setIsPlaying(false);
          toast({
            title: "Stream Error",
            description: "Failed to load video stream. Please try again.",
            variant: "destructive",
          });
        }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
    } else {
      video.src = url;
    }
  }, [toast]);

  const playStation = useCallback(async (station: Station) => {
    if (!isPoweredOn) return;

    setIsStreamLoading(true);

    if (station.videoStreamUrl && videoRef.current) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      const video = videoRef.current;
      setupVideoHls(video, station.videoStreamUrl);

      try {
        await video.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Failed to play video:", error);
        setIsPlaying(false);
        toast({
          title: "Playback Error",
          description: "Failed to start video playback.",
          variant: "destructive",
        });
      } finally {
        setIsStreamLoading(false);
      }
    } else if (audioRef.current) {
      cleanupVideo();

      const audio = audioRef.current;
      if (audio.src !== station.streamUrl) {
        audio.src = station.streamUrl;
      }

      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Failed to play station:", error);
        setIsPlaying(false);
        toast({
          title: "Playback Error",
          description: "Failed to play this station.",
          variant: "destructive",
        });
      } finally {
        setIsStreamLoading(false);
      }
    }
  }, [isPoweredOn, setupVideoHls, cleanupVideo, toast]);

  const pausePlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
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

  const handlePrevStation = useCallback(() => {
    if (!isPoweredOn) return;
    const activeStations = stations.filter(s => s.isActive);
    if (activeStations.length === 0) return;
    
    const currentIndex = currentStation ? activeStations.findIndex(s => s.id === currentStation.id) : -1;
    const prevIndex = currentIndex <= 0 ? activeStations.length - 1 : currentIndex - 1;
    const prevStation = activeStations[prevIndex];
    if (prevStation) {
      setCurrentStation(prevStation);
      if (isPlaying) playStation(prevStation);
    }
  }, [isPoweredOn, stations, currentStation, isPlaying, playStation]);

  const handleNextStation = useCallback(() => {
    if (!isPoweredOn) return;
    const activeStations = stations.filter(s => s.isActive);
    if (activeStations.length === 0) return;
    
    const currentIndex = currentStation ? activeStations.findIndex(s => s.id === currentStation.id) : -1;
    const nextIndex = currentIndex >= activeStations.length - 1 ? 0 : currentIndex + 1;
    const nextStation = activeStations[nextIndex];
    if (nextStation) {
      setCurrentStation(nextStation);
      if (isPlaying) playStation(nextStation);
    }
  }, [isPoweredOn, stations, currentStation, isPlaying, playStation]);

  const activeStations = stations.filter((s) => s.isActive);

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div
        className="relative rounded-lg overflow-hidden"
        style={{ aspectRatio: "7 / 4" }}
        data-testid="stereo-unit"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 rounded-lg" />
        <div className="absolute inset-[3px] bg-gradient-to-b from-neutral-900 via-black to-neutral-950 rounded-md" />
        <div className="absolute inset-0 rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_0_rgba(0,0,0,0.5)]" />

        <div className="relative z-10 flex h-full">
          <div className="w-20 flex flex-col items-center justify-between py-3 px-2 border-r border-zinc-800">
            <button
              onClick={handlePowerToggle}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center
                bg-gradient-to-b from-zinc-700 to-zinc-900
                border-2 border-zinc-600
                shadow-[0_2px_4px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)]
                transition-all duration-150
                active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]
              `}
              data-testid="button-power"
              aria-label="Power"
            >
              <Power className={`w-5 h-5 ${isPoweredOn ? "text-lava-400" : "text-zinc-500"}`} />
            </button>

            <div className="flex flex-col gap-2">
              <button
                onClick={handlePrevStation}
                disabled={!isPoweredOn}
                className={`
                  w-9 h-9 rounded-md flex items-center justify-center
                  bg-gradient-to-b from-zinc-700 to-zinc-900
                  border border-zinc-600
                  shadow-[0_2px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]
                  transition-all duration-150
                  ${isPoweredOn ? "active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]" : "opacity-50"}
                `}
                data-testid="button-prev"
                aria-label="Previous station"
              >
                <SkipBack className="w-4 h-4 text-zinc-300" />
              </button>
              <button
                onClick={handleNextStation}
                disabled={!isPoweredOn}
                className={`
                  w-9 h-9 rounded-md flex items-center justify-center
                  bg-gradient-to-b from-zinc-700 to-zinc-900
                  border border-zinc-600
                  shadow-[0_2px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]
                  transition-all duration-150
                  ${isPoweredOn ? "active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]" : "opacity-50"}
                `}
                data-testid="button-next"
                aria-label="Next station"
              >
                <SkipForward className="w-4 h-4 text-zinc-300" />
              </button>
            </div>

            <div className="flex flex-col items-center">
              <div 
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  bg-gradient-to-b from-zinc-600 to-zinc-900
                  border-2 border-zinc-500
                  shadow-[0_3px_6px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.15)]
                  ${isPoweredOn ? "" : "opacity-50"}
                `}
              >
                <VolumeKnob
                  volume={volume}
                  onChange={setVolume}
                  disabled={!isPoweredOn}
                  compact
                />
              </div>
              <span className="text-[8px] font-mono text-zinc-500 mt-1 tracking-wider">VOL</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col relative">
            <div 
              className={`
                absolute inset-2 rounded-md overflow-hidden
                bg-gradient-to-br from-zinc-950 via-black to-zinc-950
                border border-zinc-800
                shadow-[inset_0_2px_8px_rgba(0,0,0,0.8)]
                transition-opacity duration-300
                ${isPoweredOn ? "opacity-100" : "opacity-30"}
              `}
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,100,50,0.03)_0%,transparent_70%)]" />
              
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800/50">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsStationListOpen(true)}
                      disabled={!isPoweredOn}
                      className={`
                        w-7 h-7 rounded flex items-center justify-center
                        bg-zinc-900/50 border border-zinc-700/50
                        ${isPoweredOn ? "hover:bg-zinc-800/50" : "opacity-50"}
                        transition-colors
                      `}
                      data-testid="button-home"
                      aria-label="Station list"
                    >
                      <Home className="w-4 h-4 text-zinc-400" />
                    </button>
                    <div className="h-4 w-px bg-zinc-700" />
                    <span className="text-[10px] font-mono text-lava-400 tracking-widest">LAVA BYTES RADIO</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${isPlaying ? "bg-lava-400 animate-pulse" : "bg-zinc-600"}`} />
                    <span className="text-[9px] font-mono text-zinc-500">
                      {isStreamLoading ? "LOADING" : isPlaying ? "PLAYING" : "READY"}
                    </span>
                  </div>
                </div>

                <div className="flex-1 p-3 overflow-hidden">
                  <NowPlaying
                    station={currentStation}
                    isPlaying={isPlaying && isPoweredOn}
                    isLoading={isStreamLoading}
                    onPlayToggle={handlePlayToggle}
                    disabled={!isPoweredOn || !currentStation}
                    compact
                    videoRef={videoRef}
                    hasVideo={!!hasVideo}
                  />
                </div>

                <div className="px-3 pb-3">
                  <PresetButtons
                    stations={activeStations}
                    currentStationId={currentStation?.id ?? null}
                    onSelectStation={handleSelectStation}
                    disabled={!isPoweredOn}
                    compact
                  />
                </div>

                <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800/50 bg-zinc-900/30">
                  <button
                    onClick={() => setIsStationListOpen(true)}
                    disabled={!isPoweredOn}
                    className={`
                      flex items-center gap-1.5 px-2 py-1 rounded
                      text-[10px] font-mono text-zinc-400 uppercase tracking-wider
                      ${isPoweredOn ? "hover:bg-zinc-800/50 hover:text-zinc-300" : "opacity-50"}
                      transition-colors
                    `}
                    data-testid="open-station-list"
                  >
                    <List className="w-3 h-3" />
                    Stations
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      disabled={!isPoweredOn}
                      className={`
                        flex items-center gap-1 px-2 py-1 rounded
                        text-[10px] font-mono text-zinc-400 uppercase tracking-wider
                        ${isPoweredOn ? "hover:bg-zinc-800/50 hover:text-zinc-300" : "opacity-50"}
                        transition-colors
                      `}
                      data-testid="button-audio"
                    >
                      <Volume2 className="w-3 h-3" />
                      Audio
                    </button>
                    <button
                      disabled={!isPoweredOn}
                      className={`
                        flex items-center gap-1 px-2 py-1 rounded
                        text-[10px] font-mono text-zinc-400 uppercase tracking-wider
                        ${isPoweredOn ? "hover:bg-zinc-800/50 hover:text-zinc-300" : "opacity-50"}
                        transition-colors
                      `}
                      data-testid="button-settings"
                    >
                      <Settings className="w-3 h-3" />
                      Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {!isPoweredOn && (
              <div className="absolute inset-2 rounded-md flex items-center justify-center bg-black/80 z-20">
                <p className="text-zinc-600 text-xs font-mono uppercase tracking-widest">
                  Power Off
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="absolute top-2 right-2 flex gap-1">
          <div className="w-1 h-1 rounded-full bg-zinc-600" />
          <div className="w-1 h-1 rounded-full bg-zinc-600" />
        </div>
        <div className="absolute bottom-2 left-2 text-[6px] font-mono text-zinc-600 tracking-widest">
          LAVA BYTES
        </div>
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
