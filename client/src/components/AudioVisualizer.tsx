import { useRef, useEffect, useCallback } from "react";

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  isPoweredOn: boolean;
  width?: number;
  height?: number;
  barCount?: number;
  barColor?: string;
  barGap?: number;
}

export function AudioVisualizer({
  analyser,
  isPlaying,
  isPoweredOn,
  width = 200,
  height = 60,
  barCount = 32,
  barColor = "hsl(22, 95%, 52%)",
  barGap = 2,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width - (barCount - 1) * barGap) / barCount;
    const step = Math.floor(bufferLength / barCount);

    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * step;
      const value = dataArray[dataIndex] || 0;
      const barHeight = (value / 255) * canvas.height * 0.9;
      const x = i * (barWidth + barGap);
      const y = canvas.height - barHeight;

      const gradient = ctx.createLinearGradient(x, canvas.height, x, y);
      gradient.addColorStop(0, barColor);
      gradient.addColorStop(0.5, "hsl(28, 90%, 55%)");
      gradient.addColorStop(1, "hsl(35, 85%, 65%)");

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.fillRect(x, y, barWidth, 2);
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [barCount, barGap, barColor]);

  const drawIdle = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width - (barCount - 1) * barGap) / barCount;

    for (let i = 0; i < barCount; i++) {
      const barHeight = 3;
      const x = i * (barWidth + barGap);
      const y = canvas.height - barHeight;

      ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }, [barCount, barGap]);

  useEffect(() => {
    if (!analyser || !isPoweredOn) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      drawIdle();
      return;
    }

    if (isPlaying) {
      draw();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      drawIdle();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [analyser, isPlaying, isPoweredOn, draw, drawIdle]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded"
      style={{ width: "100%", height: "100%" }}
      data-testid="audio-visualizer"
    />
  );
}
