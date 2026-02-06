
import React, { useRef, useEffect } from 'react';
import { Kite, PechaState, Vector2D } from '../types';
import { GAME_CONSTANTS } from '../constants';

interface GameCanvasProps {
  kites: Kite[];
  pecha: PechaState;
  wind: Vector2D;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ kites, pecha, wind }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<{x: number, y: number, size: number}[]>([]);

  // Pre-generate stars
  useEffect(() => {
    const stars = [];
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * GAME_CONSTANTS.CANVAS_WIDTH,
        y: Math.random() * GAME_CONSTANTS.CANVAS_HEIGHT,
        size: Math.random() * 1.5
      });
    }
    starsRef.current = stars;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // 1. Draw Night Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, GAME_CONSTANTS.COLORS.SKY_TOP);
      skyGrad.addColorStop(1, GAME_CONSTANTS.COLORS.SKY_BOTTOM);
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw Stars
      ctx.fillStyle = 'white';
      starsRef.current.forEach(star => {
        const opacity = 0.2 + Math.random() * 0.8;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // 3. Draw City Silhouette (Background)
      ctx.fillStyle = 'rgba(2, 6, 23, 0.8)';
      for (let i = 0; i < canvas.width; i += 60) {
        const h = 40 + Math.random() * 60;
        ctx.fillRect(i, canvas.height - h, 55, h);
      }

      // 4. Draw Strings and Kites
      kites.forEach(kite => {
        // Find anchor based on player/AI/enemy
        let anchorX = canvas.width / 2;
        if (kite.isAI) {
           const idNum = parseInt(kite.id.split('-')[1] || '0');
           anchorX = (canvas.width / 6) * (idNum + 1);
        } else if (kite.id !== 'player') {
           anchorX = canvas.width * 0.1;
        }
        
        const anchorY = GAME_CONSTANTS.STRING_ANCHOR_Y;

        // Draw String with Glow
        ctx.beginPath();
        ctx.moveTo(anchorX, anchorY);
        
        if (!kite.isCut) {
          const midX = (anchorX + kite.pos.x) / 2 + wind.x * 150;
          const midY = (anchorY + kite.pos.y) / 2 + wind.y * 150;
          ctx.quadraticCurveTo(midX, midY, kite.pos.x, kite.pos.y);
          ctx.strokeStyle = 'rgba(255,255,255,0.2)';
          ctx.lineWidth = 1.2;
          ctx.shadowBlur = 4;
          ctx.shadowColor = 'white';
        } else {
          ctx.moveTo(anchorX, anchorY);
          ctx.lineTo(anchorX + (Math.random() - 0.5) * 30, anchorY - 120);
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          ctx.lineWidth = 0.5;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw Kite
        ctx.save();
        ctx.translate(kite.pos.x, kite.pos.y);
        ctx.rotate(kite.angle);

        // Neon Glow effect
        ctx.shadowBlur = kite.attackActive ? 25 : 12;
        ctx.shadowColor = kite.color;

        // Diamond Shape
        ctx.beginPath();
        ctx.moveTo(0, -GAME_CONSTANTS.KITE_SIZE / 2);
        ctx.lineTo(GAME_CONSTANTS.KITE_SIZE / 2, 0);
        ctx.lineTo(0, GAME_CONSTANTS.KITE_SIZE / 2);
        ctx.lineTo(-GAME_CONSTANTS.KITE_SIZE / 2, 0);
        ctx.closePath();
        
        ctx.fillStyle = kite.color;
        ctx.fill();

        // High contrast borders
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Tail (Neon ribbon)
        ctx.beginPath();
        ctx.moveTo(0, GAME_CONSTANTS.KITE_SIZE / 2);
        ctx.bezierCurveTo(-10, GAME_CONSTANTS.KITE_SIZE + 10, 10, GAME_CONSTANTS.KITE_SIZE + 20, 0, GAME_CONSTANTS.KITE_SIZE + 35);
        ctx.strokeStyle = kite.color;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
        
        // Name Label
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = 'black 10px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(kite.name, kite.pos.x, kite.pos.y - GAME_CONSTANTS.KITE_SIZE);
      });

      // 5. Pecha Visuals (Brighter sparks)
      if (pecha.isIntersecting && pecha.intersectPoint) {
        const p = pecha.intersectPoint;
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 15);
        gradient.addColorStop(0, 'white');
        gradient.addColorStop(0.4, 'rgba(255, 255, 0, 0.8)');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          const angle = Math.random() * Math.PI * 2;
          const len = 15 + Math.random() * 25;
          ctx.lineTo(p.x + Math.cos(angle) * len, p.y + Math.sin(angle) * len);
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    };

    render();
  }, [kites, pecha, wind]);

  return (
    <canvas 
      ref={canvasRef} 
      width={GAME_CONSTANTS.CANVAS_WIDTH} 
      height={GAME_CONSTANTS.CANVAS_HEIGHT} 
    />
  );
};

export default GameCanvas;
