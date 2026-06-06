'use client';

import { useEffect, useRef } from 'react';

const DARK_COLORS = ['#ffffff', '#a5b4fc', '#c4b5fd', '#93c5fd', '#fca5a5', '#86efac', '#fcd34d'];
const LIGHT_COLORS = ['#1e1b4b', '#312e81', '#4338ca', '#1e3a5f', '#14532d', '#7c2d12', '#713f12'];

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  twinkleSpeed: number;
  color: string;
}

export function StarryBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    function isDark() {
      return document.documentElement.classList.contains('dark');
    }

    function getColors() {
      return isDark() ? DARK_COLORS : LIGHT_COLORS;
    }

    const isMobile = width < 768;
    const area = width * height;
    const GRAB_RADIUS = isMobile ? 80 : 150;
    const ATTRACT_RADIUS = isMobile ? 100 : 150;
    const stars: Star[] = [];
    const STAR_COUNT = isMobile ? Math.min(150, Math.max(60, Math.round(area / 3000))) : Math.min(250, Math.max(40, Math.round(area / 6000)));

    function createStar(x?: number, y?: number): Star {
      const colors = getColors();
      return {
        x: x ?? Math.random() * width,
        y: y ?? Math.random() * height,
        size: Math.random() * (isMobile ? 1.5 : 2) + 0.5,
        speed: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.6 + 0.2,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    }

    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push(createStar());
    }

    let mouseX = -1000;
    let mouseY = -1000;
    let frameCount = 0;

    function handleMouseMove(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }

    let attractEndTime = 0;

    function handleClick(e: MouseEvent) {
      mouseX = e.clientX;
      mouseY = e.clientY;
      attractEndTime = Date.now() + 2000; // Attract for 2 seconds
      for (let i = 0; i < 3; i++) {
        stars.push(createStar(
          e.clientX + (Math.random() - 0.5) * 50,
          e.clientY + (Math.random() - 0.5) * 50
        ));
      }
      if (stars.length > 300) stars.splice(0, stars.length - 300);
    }

    function handleResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = width;
      canvas!.height = height;
    }

    function handleTouch(e: TouchEvent) {
      const touch = e.touches[0];
      if (touch) {
        mouseX = touch.clientX;
        mouseY = touch.clientY;
        attractEndTime = Date.now() + 2000;
      }
    }

    function handleTouchEnd() {
      mouseX = -1000;
      mouseY = -1000;
    }

    let mouseIsDown = false;

    function handleMouseDown() { mouseIsDown = true; }
    function handleMouseUp() { mouseIsDown = false; }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('resize', handleResize);
    window.addEventListener('touchmove', handleTouch, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    function draw() {
      ctx!.clearRect(0, 0, width, height);

      // Update colors when theme changes
      const colors = getColors();
      for (const star of stars) {
        if (!colors.includes(star.color)) {
          star.color = colors[Math.floor(Math.random() * colors.length)];
        }
      }

      for (const star of stars) {
        // Twinkle
        star.opacity += Math.sin(Date.now() * star.twinkleSpeed) * 0.005;
        star.opacity = Math.max(0.1, Math.min(0.8, star.opacity));

        // Drift
        star.x += star.speed * 0.3;
        star.y += Math.sin(Date.now() * 0.001 + star.x * 0.01) * 0.15;

        // Attract toward mouse/touch (gentle, time-limited)
        const isAttracting = mouseX > 0 && mouseY > 0 && (mouseIsDown || Date.now() < attractEndTime);
        if (isAttracting) {
          const dx = mouseX - star.x;
          const dy = mouseY - star.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < ATTRACT_RADIUS && dist > 30) {
            star.x += dx * 0.003;
            star.y += dy * 0.003;
          }
        }



        // Wrap around
        if (star.x > width + 5) star.x = -5;
        if (star.x < -5) star.x = width + 5;
        if (star.y > height + 5) star.y = -5;
        if (star.y < -5) star.y = height + 5;

        // Draw star with color
        const { r, g, b } = hexToRgb(star.color);
        ctx!.beginPath();
        ctx!.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${star.opacity})`;
        ctx!.fill();
      }

      // Draw links near mouse (skip every other frame for performance)
      frameCount++;
      if (mouseX > 0 && mouseY > 0 && frameCount % 2 === 0) {
        // Find stars near mouse first
        const nearMouse: number[] = [];
        for (let i = 0; i < stars.length; i++) {
          const dist = Math.hypot(stars[i].x - mouseX, stars[i].y - mouseY);
          if (dist < GRAB_RADIUS) nearMouse.push(i);
        }
        // Connect each to nearest 2-3 neighbors
        for (const i of nearMouse) {
          const neighbors: { idx: number; dist: number }[] = [];
          for (const j of nearMouse) {
            if (j === i) continue;
            const dist = Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y);
            if (dist < 160) neighbors.push({ idx: j, dist });
          }
          neighbors.sort((a, b) => a.dist - b.dist);
          const { r, g, b } = hexToRgb(stars[i].color);
          for (const n of neighbors.slice(0, 3)) {
            ctx!.beginPath();
            ctx!.moveTo(stars[i].x, stars[i].y);
            ctx!.lineTo(stars[n.idx].x, stars[n.idx].y);
            ctx!.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.15 * (1 - n.dist / 160)})`;
            ctx!.lineWidth = 1;
            ctx!.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('touchmove', handleTouch);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    />
  );
}
