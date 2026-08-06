"use client";

import { useEffect, useRef } from "react";
import { Chip } from "@heroui/react";

export function Hero3DLogo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;

    // Generate subtle floating ambient particles
    const particles = Array.from({ length: 25 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 1.8 + 0.6,
      speedY: -(Math.random() * 0.3 + 0.1),
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const render = () => {
      angle += 0.008;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 + 10;

      // Draw reflective ground grid / floor (isometric 35 deg projection)
      ctx.save();
      ctx.translate(centerX, centerY + 80);
      ctx.scale(1, 0.45); // Flattening to simulate ~35 degree camera tilt
      ctx.strokeStyle = "rgba(121, 40, 202, 0.15)";
      ctx.lineWidth = 1;
      const gridSize = 160;
      const step = 20;
      for (let i = -gridSize; i <= gridSize; i += step) {
        ctx.beginPath();
        ctx.moveTo(i, -gridSize);
        ctx.lineTo(i, gridSize);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-gridSize, i);
        ctx.lineTo(gridSize, i);
        ctx.stroke();
      }
      ctx.restore();

      // Reflective ground light glow
      const floorGlow = ctx.createRadialGradient(centerX, centerY + 80, 10, centerX, centerY + 80, 140);
      floorGlow.addColorStop(0, "rgba(159, 85, 255, 0.25)");
      floorGlow.addColorStop(1, "rgba(121, 40, 202, 0)");
      ctx.fillStyle = floorGlow;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + 80, 150, 45, 0, 0, Math.PI * 2);
      ctx.fill();

      // Isometric subtle movement hover
      const floatY = Math.sin(angle) * 4;

      // Draw reflective shadow under the logo
      const shadowGradient = ctx.createRadialGradient(
        centerX,
        centerY + 85,
        5,
        centerX,
        centerY + 85,
        70
      );
      shadowGradient.addColorStop(0, "rgba(121, 40, 202, 0.4)");
      shadowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = shadowGradient;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY + 85, 70, 24, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw isometric 3D-styled TIP Emblem (temporary placeholder for Spline 3D embed)
      ctx.save();
      ctx.translate(centerX, centerY - 10 + floatY);

      // Outer hexagonal infrastructure frame
      ctx.beginPath();
      const radius = 64;
      for (let i = 0; i < 6; i++) {
        const rad = (Math.PI / 3) * i - Math.PI / 6;
        const x = radius * Math.cos(rad);
        const y = radius * 0.75 * Math.sin(rad); // tilted projection
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      const hexGradient = ctx.createLinearGradient(-radius, -radius, radius, radius);
      hexGradient.addColorStop(0, "rgba(159, 85, 255, 0.9)");
      hexGradient.addColorStop(0.5, "rgba(121, 40, 202, 0.85)");
      hexGradient.addColorStop(1, "rgba(76, 29, 149, 0.9)");
      ctx.fillStyle = hexGradient;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Inner glowing core
      ctx.beginPath();
      const innerRadius = 38;
      for (let i = 0; i < 6; i++) {
        const rad = (Math.PI / 3) * i - Math.PI / 6;
        const x = innerRadius * Math.cos(rad);
        const y = innerRadius * 0.75 * Math.sin(rad);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fillStyle = "#0a0a0c";
      ctx.fill();
      ctx.strokeStyle = "rgba(159, 85, 255, 0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // "T" Symbol in isometric view
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("T", 0, 2);
      ctx.restore();

      // Ambient particles
      particles.forEach((p) => {
        p.y += p.speedY;
        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
        ctx.fillStyle = `rgba(159, 85, 255, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square flex items-center justify-center select-none">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        aria-label="3D Tagwise Protocol Emblem"
        className="w-full h-full object-contain pointer-events-none"
      />
      <div className="absolute top-4 right-4 z-10">
        <Chip
          size="sm"
          variant="soft"
          color="accent"
          className="text-[10px] bg-secondary/15 font-mono border border-secondary/20 shadow-sm rounded-full"
        >
          3D SPLINE PLACEHOLDER
        </Chip>
      </div>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center">
        <span className="text-[11px] font-mono tracking-widest text-muted uppercase">
          35° Isometric Surface Projection
        </span>
      </div>
    </div>
  );
}
