import { useState, useRef, useEffect, useCallback } from "react";
import { SkipBack, SkipForward, Home, Settings, List, Power, Volume2, History, Sliders } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Hls from "hls.js";
import { VolumeKnob } from "./VolumeKnob";
import { NowPlaying } from "./NowPlaying";
import { StationList } from "./StationList";
import { PresetButtons } from "./PresetButtons";
import { RecentlyPlayed } from "./RecentlyPlayed";
import { AudioVisualizer } from "./AudioVisualizer";
import { Equalizer } from "./Equalizer";
import { ShareButton } from "./ShareButton";
import { OfflineIndicator } from "./OfflineIndicator";
import { useAudioProcessor } from "@/hooks/useAudioProcessor";
import { useMediaSession, cacheAudioForOffline } from "@/hooks/useMediaSession";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { UnifiedStation } from "@/pages/RadioPlayer";
import type { StationTrack, PlaybackHistory, InsertPlaybackHistory } from "@shared/schema";

interface StereoUnitProps {
  stations: UnifiedStation[];
  isLoading: boolean;
}

export function StereoUnit({ stations, isLoading }: StereoUnitProps) {
  const [isPoweredOn, setIsPoweredOn] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isStreamLoading, setIsStreamLoading] = useState(false);
  const [currentStation, setCurrentStation] = useState<UnifiedStation | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<StationTrack | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [isStationListOpen, setIsStationListOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isEqualizerOpen, setIsEqualizerOpen] = useState(false);
  const [pendingAutoplayStationId, setPendingAutoplayStationId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const { toast } = useToast();
  
  const { analyser, connect: connectAudioProcessor, updateEQ, resume: resumeAudioProcessor } = useAudioProcessor();
  
  const addToHistoryMutation = useMutation({
    mutationFn: async (entry: InsertPlaybackHistory) => {
      return apiRequest("POST", "/api/history", entry);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
    },
  });
  
  // Fetch tracks for user stations
  const { data: tracks = [] } = useQuery<StationTrack[]>({
    queryKey: ["/api/user-stations", currentStation?.id, "tracks"],
    enabled: currentStation?.type === "user",
  });

  const hasVideo = currentStation?.type === "external" && currentStation.videoStreamUrl;
  const isUserStation = currentStation?.type === "user";

  useEffect(() => {
    if (stations.length > 0 && !currentStation) {
      const firstPreset = stations.find((s) => s.type === "external" && s.presetNumber === 1 && s.isActive);
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
  
  // Reset track index when station changes
  useEffect(() => {
    setCurrentTrackIndex(0);
    setCurrentTrack(null);
  }, [currentStation?.id]);
  
  // Update current track when tracks are loaded or index changes
  useEffect(() => {
    if (tracks.length > 0 && currentStation?.type === "user") {
      setCurrentTrack(tracks[currentTrackIndex] || null);
    } else {
      setCurrentTrack(null);
    }
  }, [tracks, currentTrackIndex, currentStation]);

  // Play a track from a user station playlist
  const playTrack = useCallback(async (track: StationTrack, station?: UnifiedStation) => {
    if (!isPoweredOn || !audioRef.current) return;
    
    setIsStreamLoading(true);
    
    // Cleanup video if active
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute("src");
      videoRef.current.load();
    }
    
    const audio = audioRef.current;
    audio.crossOrigin = "anonymous";
    audio.src = track.mediaUrl;
    
    cacheAudioForOffline(track.mediaUrl);
    
    try {
      await audio.play();
      setIsPlaying(true);
      
      // Add to playback history
      const stationToUse = station || currentStation;
      if (stationToUse) {
        addToHistoryMutation.mutate({
          userStationId: stationToUse.type === "user" ? stationToUse.id : null,
          trackId: track.id,
          stationName: stationToUse.name,
          trackTitle: track.title,
          trackArtist: track.artist,
          logoUrl: stationToUse.logoUrl,
        });
      }
    } catch (error) {
      console.error("Failed to play track:", error);
      setIsPlaying(false);
      toast({
        title: "Playback Error",
        description: "Failed to play this track.",
        variant: "destructive",
      });
    } finally {
      setIsStreamLoading(false);
    }
  }, [isPoweredOn, toast, currentStation, addToHistoryMutation]);
  
  // Handle track ended - move to next track in playlist (looping) and play it
  const handleTrackEnded = useCallback(() => {
    if (currentStation?.type === "user" && tracks.length > 0) {
      const nextIndex = (currentTrackIndex + 1) % tracks.length;
      
      // For single-track playlists (or wraparound to same track), 
      // we need to call playTrack directly since index won't change
      if (nextIndex === currentTrackIndex || tracks.length === 1) {
        const trackToPlay = tracks[nextIndex];
        if (trackToPlay) {
          playTrack(trackToPlay);
        }
      } else {
        // For multi-track playlists, update index and let the effect handle playback
        setCurrentTrackIndex(nextIndex);
      }
    } else {
      setIsPlaying(false);
    }
  }, [currentStation, tracks, currentTrackIndex, playTrack]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "none";
      audioRef.current.crossOrigin = "anonymous";
    }

    const audio = audioRef.current;

    const handleLoadStart = () => setIsStreamLoading(true);
    const handleCanPlay = () => setIsStreamLoading(false);
    const handleError = () => {
      setIsStreamLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);
    audio.addEventListener("ended", handleTrackEnded);

    return () => {
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("ended", handleTrackEnded);
    };
  }, [handleTrackEnded]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (isPlaying) {
      if (audioRef.current) {
        connectAudioProcessor(audioRef);
      } else if (videoRef.current) {
        connectAudioProcessor(videoRef);
      }
      resumeAudioProcessor();
    }
  }, [isPlaying, connectAudioProcessor, resumeAudioProcessor]);

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

  const playStation = useCallback(async (station: UnifiedStation) => {
    if (!isPoweredOn) return;

    setIsStreamLoading(true);

    // For user stations, we play from the tracks playlist
    if (station.type === "user") {
      // Stop any currently playing audio/video immediately
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      cleanupVideo();
      
      // Set pending autoplay for this specific station ID
      // The effect below will start playback when tracks for this station load
      setPendingAutoplayStationId(station.id);
      setIsStreamLoading(true);
      return;
    }

    // External station with video
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
        
        // Add to playback history for external video station
        addToHistoryMutation.mutate({
          stationId: station.id,
          stationName: station.name,
          logoUrl: station.logoUrl,
        });
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
      // External station with audio stream
      cleanupVideo();

      const audio = audioRef.current;
      audio.crossOrigin = "anonymous";
      if (audio.src !== station.streamUrl) {
        audio.src = station.streamUrl;
      }

      try {
        await audio.play();
        setIsPlaying(true);
        
        // Add to playback history for external audio station
        addToHistoryMutation.mutate({
          stationId: station.id,
          stationName: station.name,
          logoUrl: station.logoUrl,
        });
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
  }, [isPoweredOn, setupVideoHls, cleanupVideo, toast, tracks, currentTrackIndex, playTrack, addToHistoryMutation]);
  
  // Auto-play next track when track index changes (for user stations - handles track transitions)
  // This fires when handleTrackEnded increments the index
  const prevTrackIndexRef = useRef<number | null>(null);
  useEffect(() => {
    // Only auto-advance if: playing, user station, index changed (not initial render), and track exists
    if (currentStation?.type === "user" && isPlaying && prevTrackIndexRef.current !== null && prevTrackIndexRef.current !== currentTrackIndex && tracks.length > 0) {
      const trackToPlay = tracks[currentTrackIndex];
      if (trackToPlay) {
        playTrack(trackToPlay);
      }
    }
    prevTrackIndexRef.current = currentTrackIndex;
  }, [currentTrackIndex, currentStation, isPlaying, tracks, playTrack]);
  
  // Start playing when tracks are loaded for the pending autoplay station
  useEffect(() => {
    // Only start playback when:
    // 1. We have a pending autoplay station ID
    // 2. The current station matches that ID (confirming the station switch completed)
    // 3. Tracks are loaded for this station
    // 4. Power is on
    if (
      pendingAutoplayStationId !== null &&
      currentStation?.type === "user" &&
      currentStation.id === pendingAutoplayStationId &&
      tracks.length > 0 &&
      isPoweredOn
    ) {
      setPendingAutoplayStationId(null);
      // Use currentTrackIndex to resume at correct position (usually 0 for new station)
      const trackToPlay = tracks[currentTrackIndex] || tracks[0];
      if (trackToPlay) {
        playTrack(trackToPlay);
      }
    }
  }, [pendingAutoplayStationId, currentStation, tracks, isPoweredOn, playTrack, currentTrackIndex]);

  const pausePlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
  }, []);

  const handleSelectStation = useCallback((station: UnifiedStation) => {
    setCurrentStation(station);
    setCurrentTrackIndex(0);
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

  useMediaSession({
    title: currentTrack?.title || currentStation?.name || "Lava Bytes Radio",
    artist: currentTrack?.artist ?? (currentStation?.type === "external" ? (currentStation.genre ?? undefined) : undefined),
    album: currentStation?.name || "Lava Bytes Radio",
    artwork: currentStation?.logoUrl ?? undefined,
    isPlaying,
    onPlay: handlePlayToggle,
    onPause: handlePlayToggle,
    onPreviousTrack: handlePrevStation,
    onNextTrack: handleNextStation,
  });

  const activeStations = stations.filter((s) => s.isActive);

  return (
    <>
      <OfflineIndicator />
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
                  <div className="flex gap-3 h-full">
                    <div className="flex-1 min-w-0">
                      <NowPlaying
                        station={currentStation}
                        isPlaying={isPlaying && isPoweredOn}
                        isLoading={isStreamLoading}
                        onPlayToggle={handlePlayToggle}
                        disabled={!isPoweredOn || !currentStation}
                        compact
                        videoRef={videoRef}
                        hasVideo={!!hasVideo}
                        currentTrack={currentTrack}
                      />
                    </div>
                    {!hasVideo && (
                      <div className="w-48 h-full flex flex-col items-center justify-center bg-black/30 rounded border border-zinc-800/50">
                        <AudioVisualizer
                          analyser={analyser}
                          isPlaying={isPlaying && isPoweredOn}
                          isPoweredOn={isPoweredOn}
                          width={180}
                          height={50}
                          barCount={32}
                        />
                        <span className="text-[7px] font-mono text-zinc-600 uppercase tracking-wider mt-1">Spectrum</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-3 pb-3">
                  <PresetButtons
                    stations={activeStations}
                    currentStationId={currentStation?.id ?? null}
                    currentStationType={currentStation?.type ?? null}
                    onSelectStation={handleSelectStation}
                    disabled={!isPoweredOn}
                    compact
                  />
                </div>

                <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800/50 bg-zinc-900/30">
                  <div className="flex items-center gap-2">
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
                    <button
                      onClick={() => setIsHistoryOpen(true)}
                      disabled={!isPoweredOn}
                      className={`
                        flex items-center gap-1.5 px-2 py-1 rounded
                        text-[10px] font-mono text-zinc-400 uppercase tracking-wider
                        ${isPoweredOn ? "hover:bg-zinc-800/50 hover:text-zinc-300" : "opacity-50"}
                        transition-colors
                      `}
                      data-testid="open-history"
                    >
                      <History className="w-3 h-3" />
                      History
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShareButton
                      station={currentStation}
                      disabled={!isPoweredOn}
                      compact
                    />
                    <button
                      onClick={() => setIsEqualizerOpen(true)}
                      disabled={!isPoweredOn}
                      className={`
                        flex items-center gap-1 px-2 py-1 rounded
                        text-[10px] font-mono text-zinc-400 uppercase tracking-wider
                        ${isPoweredOn ? "hover:bg-zinc-800/50 hover:text-zinc-300" : "opacity-50"}
                        transition-colors
                      `}
                      data-testid="button-equalizer"
                    >
                      <Sliders className="w-3 h-3" />
                      EQ
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
                
                <RecentlyPlayed
                  isOpen={isHistoryOpen}
                  onClose={() => setIsHistoryOpen(false)}
                  onSelectHistory={(entry) => {
                    setIsHistoryOpen(false);
                    // Find and select the station from history
                    if (entry.stationId) {
                      const station = stations.find(s => s.type === "external" && s.id === entry.stationId);
                      if (station) {
                        handleSelectStation(station);
                        if (isPoweredOn) playStation(station);
                      }
                    } else if (entry.userStationId) {
                      const station = stations.find(s => s.type === "user" && s.id === entry.userStationId);
                      if (station) {
                        handleSelectStation(station);
                        if (isPoweredOn) playStation(station);
                      }
                    }
                  }}
                />
                
                <Equalizer
                  isOpen={isEqualizerOpen}
                  onClose={() => setIsEqualizerOpen(false)}
                  isPoweredOn={isPoweredOn}
                  onEQChange={(settings) => updateEQ(settings)}
                />
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
        currentStationType={currentStation?.type ?? null}
        onSelectStation={handleSelectStation}
        onClose={() => setIsStationListOpen(false)}
        isOpen={isStationListOpen}
      />
    </div>
    </>
  );
}
