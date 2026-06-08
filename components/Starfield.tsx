"use client";

import React, { useEffect, useRef } from "react";

export default function Starfield({ speedMultiplier = 1 }: { speedMultiplier?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;
    
    const stars: { x: number; y: number; size: number; speed: number }[] = [];

    const initStars = () => {
      stars.length = 0;
      for (let i = 0; i < 150; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 0.5,
          speed: Math.random() * 2 + 0.5,
        });
      }
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      initStars();
    };

    window.addEventListener("resize", resize);
    resize();

    const animate = () => {
      ctx.fillStyle = "#0A0A1E"; // Matching BG_COLOR
      ctx.fillRect(0, 0, width, height);
      
      ctx.fillStyle = "white";
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        
        star.y += star.speed * speedMultiplier;
        if (star.y > height) {
          star.y = 0;
          star.x = Math.random() * width;
        }
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [speedMultiplier]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
    />
  );
}
