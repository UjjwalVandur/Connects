import React, { useEffect, useRef } from "react";

/**
 * Pure HTML5 Canvas 2D animated dot-matrix background.
 * Achieves the same visual as the Aceternity CanvasRevealEffect
 * without needing @react-three/fiber (which conflicts with CRA's webpack 5).
 *
 * Props:
 *   colors   - array of [r,g,b] arrays, e.g. [[0,229,255],[0,119,255]]
 *   dotSize  - radius of each dot (default 2)
 *   spacing  - grid spacing px (default 22)
 *   speed    - animation speed multiplier (default 1)
 *   reverse  - bool, reverses the reveal direction
 */
const CanvasRevealEffect = ({
  colors = [[0, 229, 255]],
  dotSize = 2,
  spacing = 22,
  speed = 1,
  reverse = false,
}) => {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = 0, height = 0;
    let dots = [];
    let startTime = null;

    const resize = () => {
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width;
      canvas.height = height;
      buildDots();
    };

    // Seeded pseudo-random per dot
    const hash = (x, y) => {
      let n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
      return n - Math.floor(n);
    };

    const buildDots = () => {
      dots = [];
      const cx = width / 2;
      const cy = height / 2;
      const maxDist = Math.sqrt(cx * cx + cy * cy);

      for (let x = 0; x < width; x += spacing) {
        for (let y = 0; y < height; y += spacing) {
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          const norm = dist / maxDist; // 0 = center, 1 = corner
          const rng = hash(x, y);
          // timing offset: 0 at centre (or edge if reverse), scales outward
          const offset = reverse
            ? (1 - norm) * 0.8 + rng * 0.2
            : norm * 0.8 + rng * 0.2;
          const colorIdx = Math.floor(rng * colors.length);
          dots.push({ x, y, offset, colorIdx, rng });
        }
      }
    };

    const draw = (timestamp) => {
      if (startTime === null) startTime = timestamp;
      const elapsed = (timestamp - startTime) / 1000; // seconds
      const t = elapsed * speed * 0.5;

      ctx.clearRect(0, 0, width, height);

      for (const dot of dots) {
        const progress = t - dot.offset;
        if (progress < 0) continue;

        // Opacity: fades in quickly after offset, then pulses slightly
        const fadeIn = Math.min(1, progress * 4);
        const pulse = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin(elapsed * 2 + dot.rng * 6.28));
        const alpha = fadeIn * pulse * (0.2 + dot.rng * 0.6);

        const [r, g, b] = colors[dot.colorIdx];
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [colors, dotSize, spacing, speed, reverse]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        display: "block",
      }}
    />
  );
};

export default CanvasRevealEffect;
