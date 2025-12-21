import { useEffect, useCallback } from "react";

interface MediaSessionConfig {
  title: string;
  artist?: string;
  album?: string;
  artwork?: string;
  isPlaying: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onPreviousTrack?: () => void;
  onNextTrack?: () => void;
}

export function useMediaSession(config: MediaSessionConfig) {
  const { title, artist, album, artwork, isPlaying, onPlay, onPause, onPreviousTrack, onNextTrack } = config;

  const updateMetadata = useCallback(() => {
    if (!("mediaSession" in navigator)) return;

    const artworkArray = artwork
      ? [
          { src: artwork, sizes: "96x96", type: "image/png" },
          { src: artwork, sizes: "128x128", type: "image/png" },
          { src: artwork, sizes: "192x192", type: "image/png" },
          { src: artwork, sizes: "256x256", type: "image/png" },
          { src: artwork, sizes: "384x384", type: "image/png" },
          { src: artwork, sizes: "512x512", type: "image/png" },
        ]
      : [];

    navigator.mediaSession.metadata = new MediaMetadata({
      title: title || "Lava Bytes Radio",
      artist: artist || "Unknown Artist",
      album: album || "Lava Bytes Radio",
      artwork: artworkArray,
    });
  }, [title, artist, album, artwork]);

  const updatePlaybackState = useCallback(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    if (onPlay) {
      navigator.mediaSession.setActionHandler("play", onPlay);
    }
    if (onPause) {
      navigator.mediaSession.setActionHandler("pause", onPause);
    }
    if (onPreviousTrack) {
      navigator.mediaSession.setActionHandler("previoustrack", onPreviousTrack);
    }
    if (onNextTrack) {
      navigator.mediaSession.setActionHandler("nexttrack", onNextTrack);
    }

    return () => {
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
    };
  }, [onPlay, onPause, onPreviousTrack, onNextTrack]);

  useEffect(() => {
    updateMetadata();
  }, [updateMetadata]);

  useEffect(() => {
    updatePlaybackState();
  }, [updatePlaybackState]);

  return { updateMetadata, updatePlaybackState };
}

export function cacheAudioForOffline(url: string) {
  if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: "CACHE_AUDIO",
      url,
    });
  }
}
