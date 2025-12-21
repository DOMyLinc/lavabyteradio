import { useEffect, useRef } from "react";

export function LavaBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener("resize", resize);

    interface Blob {
      x: number;
      y: number;
      radius: number;
      speedY: number;
      speedX: number;
      hue: number;
    }

    const blobs: Blob[] = [];
    for (let i = 0; i < 8; i++) {
      blobs.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 200,
        radius: 80 + Math.random() * 120,
        speedY: 0.3 + Math.random() * 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        hue: 15 + Math.random() * 20,
      });
    }

    const animate = () => {
      time += 0.01;

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "hsl(15, 15%, 4%)");
      gradient.addColorStop(0.5, "hsl(10, 20%, 6%)");
      gradient.addColorStop(1, "hsl(5, 25%, 8%)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      blobs.forEach((blob) => {
        blob.y -= blob.speedY;
        blob.x += blob.speedX + Math.sin(time + blob.y * 0.01) * 0.2;

        if (blob.y < -blob.radius * 2) {
          blob.y = canvas.height + blob.radius;
          blob.x = Math.random() * canvas.width;
        }

        const pulseRadius = blob.radius + Math.sin(time * 2 + blob.x * 0.01) * 10;

        const blobGradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, pulseRadius
        );
        blobGradient.addColorStop(0, `hsla(${blob.hue}, 100%, 55%, 0.8)`);
        blobGradient.addColorStop(0.3, `hsla(${blob.hue + 5}, 95%, 45%, 0.5)`);
        blobGradient.addColorStop(0.6, `hsla(${blob.hue + 10}, 90%, 35%, 0.3)`);
        blobGradient.addColorStop(1, `hsla(${blob.hue + 15}, 85%, 25%, 0)`);

        ctx.beginPath();
        ctx.arc(blob.x, blob.y, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = blobGradient;
        ctx.fill();
      });

      for (let i = 0; i < 3; i++) {
        const waveY = canvas.height - 100 + Math.sin(time + i) * 30;
        const waveGradient = ctx.createLinearGradient(0, waveY, 0, canvas.height);
        waveGradient.addColorStop(0, `hsla(20, 100%, 50%, ${0.1 - i * 0.03})`);
        waveGradient.addColorStop(0.5, `hsla(15, 100%, 40%, ${0.15 - i * 0.04})`);
        waveGradient.addColorStop(1, `hsla(10, 100%, 30%, ${0.2 - i * 0.05})`);

        ctx.beginPath();
        ctx.moveTo(0, canvas.height);
        for (let x = 0; x <= canvas.width; x += 10) {
          const y = waveY + Math.sin((x * 0.01) + time * 2 + i) * 20;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(canvas.width, canvas.height);
        ctx.closePath();
        ctx.fillStyle = waveGradient;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      data-testid="lava-background"
    />
  );
}
