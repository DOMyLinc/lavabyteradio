import { useRef, useEffect, useCallback, useState, type RefObject } from "react";

interface EQSettings {
  bass: number;
  mid: number;
  treble: number;
}

interface AudioProcessorState {
  analyser: AnalyserNode | null;
  isConnected: boolean;
}

type MediaElementRef = RefObject<HTMLAudioElement | null> | RefObject<HTMLVideoElement | null>;

export function useAudioProcessor() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bassFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null);
  const connectedElementRef = useRef<HTMLAudioElement | HTMLVideoElement | null>(null);
  
  const [state, setState] = useState<AudioProcessorState>({
    analyser: null,
    isConnected: false,
  });

  const connect = useCallback((elementRef: MediaElementRef) => {
    const audioElement = elementRef.current;
    if (!audioElement || connectedElementRef.current === audioElement) {
      return;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
      sourceRef.current = null;
      analyserRef.current = null;
      bassFilterRef.current = null;
      midFilterRef.current = null;
      trebleFilterRef.current = null;
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const source = audioContext.createMediaElementSource(audioElement);
      
      const bassFilter = audioContext.createBiquadFilter();
      bassFilter.type = "lowshelf";
      bassFilter.frequency.value = 200;
      bassFilter.gain.value = 0;
      
      const midFilter = audioContext.createBiquadFilter();
      midFilter.type = "peaking";
      midFilter.frequency.value = 1000;
      midFilter.Q.value = 0.5;
      midFilter.gain.value = 0;
      
      const trebleFilter = audioContext.createBiquadFilter();
      trebleFilter.type = "highshelf";
      trebleFilter.frequency.value = 3000;
      trebleFilter.gain.value = 0;
      
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      source.connect(bassFilter);
      bassFilter.connect(midFilter);
      midFilter.connect(trebleFilter);
      trebleFilter.connect(analyser);
      analyser.connect(audioContext.destination);
      
      audioContextRef.current = audioContext;
      sourceRef.current = source;
      analyserRef.current = analyser;
      bassFilterRef.current = bassFilter;
      midFilterRef.current = midFilter;
      trebleFilterRef.current = trebleFilter;
      connectedElementRef.current = audioElement;

      setState({
        analyser,
        isConnected: true,
      });
    } catch (error) {
      console.warn("useAudioProcessor: Could not create audio context", error);
      setState({
        analyser: null,
        isConnected: false,
      });
    }
  }, []);

  const updateEQ = useCallback((settings: EQSettings) => {
    if (bassFilterRef.current) {
      bassFilterRef.current.gain.value = settings.bass * 2;
    }
    if (midFilterRef.current) {
      midFilterRef.current.gain.value = settings.mid * 2;
    }
    if (trebleFilterRef.current) {
      trebleFilterRef.current.gain.value = settings.treble * 2;
    }
  }, []);

  const resume = useCallback(async () => {
    if (audioContextRef.current?.state === "suspended") {
      await audioContextRef.current.resume();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    analyser: state.analyser,
    isConnected: state.isConnected,
    connect,
    updateEQ,
    resume,
  };
}
