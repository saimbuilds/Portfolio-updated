"use client";

import { useEffect, useRef } from "react";

export function SignalCanvas({ quiet = false }: { quiet?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0, height = 0, frame = 0, animation = 0;
    const mouse = { x: .5, y: .5 };
    const points = Array.from({ length: quiet ? 60 : 110 }, (_, index) => ({
      x: Math.random(), y: Math.random(), z: Math.random(), seed: index * .37,
    }));
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      width = rect.width; height = rect.height;
      canvas.width = width * dpr; canvas.height = height * dpr;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const move = (event: PointerEvent) => { mouse.x = event.clientX / window.innerWidth; mouse.y = event.clientY / window.innerHeight; };
    const draw = () => {
      context.clearRect(0, 0, width, height);
      frame += reduced ? 0 : .003;
      points.forEach((point, index) => {
        const drift = Math.sin(frame * 3 + point.seed) * 12;
        const x = point.x * width + (mouse.x - .5) * point.z * 55 + drift;
        const y = point.y * height + (mouse.y - .5) * point.z * 35;
        const radius = .45 + point.z * 1.25;
        context.beginPath(); context.arc(x, y, radius, 0, Math.PI * 2);
        context.fillStyle = index % 13 === 0 ? `rgba(184,255,75,${.25 + point.z * .5})` : `rgba(234,237,226,${.06 + point.z * .14})`;
        context.fill();
        if (index % 9 === 0) {
          const other = points[(index + 7) % points.length];
          context.beginPath(); context.moveTo(x, y); context.lineTo(other.x * width, other.y * height);
          context.strokeStyle = "rgba(184,255,75,.045)"; context.stroke();
        }
      });
      if (!reduced) animation = requestAnimationFrame(draw);
    };
    resize(); draw();
    window.addEventListener("resize", resize); window.addEventListener("pointermove", move);
    return () => { cancelAnimationFrame(animation); window.removeEventListener("resize", resize); window.removeEventListener("pointermove", move); };
  }, [quiet]);
  return <canvas ref={canvasRef} className="signal-canvas" aria-hidden="true" />;
}
