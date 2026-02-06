import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameMode, Kite, PechaState, MatchStatus } from '../types';
import { GAME_CONSTANTS, INITIAL_WIND } from '../constants';
import GameCanvas from './GameCanvas';
import VirtualJoystick from './VirtualJoystick';
import UIOverlay from './UIOverlay';
import ResultModal from './ResultModal';
import { updateKitePhysics, checkCollisions, handlePechaLogic } from '../services/gameLogic';

interface GameViewProps {
  mode: GameMode;
  roomId: string | null;
  onExit: () => void;
}

const GameView: React.FC<GameViewProps> = ({ mode, roomId, onExit }) => {
  const [kites, setKites] = useState<Kite[]>([]);
  const [matchStatus, setMatchStatus] = useState<MatchStatus>('PLAYING');
  const [pecha, setPecha] = useState<PechaState>({
    isIntersecting: false,
    contactStartTime: null,
    intersectPoint: null,
    kites: ['', '']
  });
  const [wind, setWind] = useState(INITIAL_WIND);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  const requestRef = useRef<number>(0);
  const playerIdRef = useRef<string>(`local-${Math.random().toString(36).substr(2, 5)}`);
  const kitesRef = useRef<Kite[]>([]);

  // Keep ref in sync for the interval without triggering re-runs
  useEffect(() => {
    kitesRef.current = kites;
  }, [kites]);

  // Multiplayer Polling
  useEffect(() => {
    if (mode !== GameMode.MULTIPLAYER || !roomId) return;

    const pollInterval = setInterval(async () => {
      const localPlayer = kitesRef.current.find(k => k.id === playerIdRef.current);
      if (!localPlayer) return;

      try {
        const res = await fetch('api/update.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room_id: roomId,
            player: { ...localPlayer, last_seen: Math.floor(Date.now() / 1000) }
          })
        });
        
        if (!res.ok) throw new Error('Server error');
        
        const data = await res.json();
        if (data.success) {
          const remotePlayers = Object.values(data.room.players) as Kite[];
          setKites(prev => {
            const currentLocal = prev.find(p => p.id === playerIdRef.current);
            return remotePlayers.map(rp => {
              if (rp.id === playerIdRef.current) return currentLocal || rp;
              return rp;
            });
          });
        }
      } catch (e) { 
        console.error("Sync error", e); 
      }
    }, 200);

    return () => {
      clearInterval(pollInterval);
      fetch(`api/leave.php?room_id=${roomId}&player_id=${playerIdRef.current}`).catch(() => {});
    };
  }, [mode, roomId]); // Removed kites from dependency to prevent interval spam

  // Initial Setup
  useEffect(() => {
    const playerKite: Kite = {
      id: playerIdRef.current,
      name: 'YOU',
      color: GAME_CONSTANTS.COLORS.PLAYER,
      pos: { x: GAME_CONSTANTS.CANVAS_WIDTH / 2, y: GAME_CONSTANTS.CANVAS_HEIGHT * 0.75 },
      vel: { x: 0, y: 0 },
      targetPos: { x: GAME_CONSTANTS.CANVAS_WIDTH / 2, y: GAME_CONSTANTS.CANVAS_HEIGHT * 0.75 },
      tension: 10,
      isCut: false,
      isAI: false,
      angle: 0,
      attackActive: false,
      attackCooldown: 0,
      attackEndTime: 0,
      score: 0
    };

    let initialKites = [playerKite];

    if (mode === GameMode.PRACTICE) {
      for (let i = 0; i < 4; i++) {
        const xPos = (GAME_CONSTANTS.CANVAS_WIDTH / 6) * (i + 1);
        initialKites.push({
          id: `ai-${i}`,
          name: `MASTER ${String.fromCharCode(65 + i)}`,
          color: GAME_CONSTANTS.COLORS.NEON[i % GAME_CONSTANTS.COLORS.NEON.length],
          pos: { x: xPos, y: GAME_CONSTANTS.CANVAS_HEIGHT * 0.3 },
          vel: { x: 0, y: 0 },
          targetPos: { x: xPos, y: GAME_CONSTANTS.CANVAS_HEIGHT * 0.3 },
          tension: 8 + i,
          isCut: false,
          isAI: true,
          angle: 0,
          attackActive: false,
          attackCooldown: 0,
          attackEndTime: 0,
          score: 0
        });
      }
    }

    setKites(initialKites);
  }, [mode]);

  const animate = useCallback((time: number) => {
    if (matchStatus === 'VICTORY' || matchStatus === 'DEFEAT') {
       requestRef.current = requestAnimationFrame(animate);
       return;
    }

    setKites(prevKites => {
      // Don't run simulation on remote players in multiplayer, just local and AI
      let nextKites = prevKites.map(k => {
        if (!k.isAI && k.id !== playerIdRef.current) return k; 
        return updateKitePhysics(k, wind);
      });

      // AI behaviors
      nextKites = nextKites.map(k => {
        if (k.isAI && !k.isCut) {
          const player = nextKites.find(p => p.id === playerIdRef.current);
          if (player && !player.isCut) {
            const dist = Math.hypot(player.pos.x - k.pos.x, player.pos.y - k.pos.y);
            if (dist < 400) {
              k.targetPos = { x: player.pos.x, y: player.pos.y - 120 };
            } else {
              const seed = parseInt(k.id.split('-')[1] || '0');
              k.targetPos = { 
                x: (GAME_CONSTANTS.CANVAS_WIDTH / 2) + Math.cos(time / 2000 + seed) * 300, 
                y: (GAME_CONSTANTS.CANVAS_HEIGHT * 0.25) + Math.sin(time / 1000 + seed) * 50
              };
            }
          }
        }
        return k;
      });

      const collisionResult = checkCollisions(nextKites);
      const { updatedKites, updatedPecha, cutMessage } = handlePechaLogic(nextKites, pecha, collisionResult, time);
      
      if (cutMessage) setStatusMessage(cutMessage);
      setPecha(updatedPecha);

      const player = updatedKites.find(k => k.id === playerIdRef.current);
      const activeEnemies = updatedKites.filter(k => k.id !== playerIdRef.current && !k.isCut);
      
      if (player?.isCut) setMatchStatus('DEFEAT');
      else if (mode === GameMode.PRACTICE && activeEnemies.length === 0) setMatchStatus('VICTORY');

      return updatedKites;
    });

    setWind(prev => ({
      x: prev.x + (Math.random() - 0.5) * 0.003,
      y: prev.y + (Math.random() - 0.5) * 0.001
    }));

    requestRef.current = requestAnimationFrame(animate);
  }, [pecha, wind, matchStatus, mode]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  const handleJoystickMove = (move: { x: number, y: number }) => {
    if (matchStatus !== 'PLAYING') return;
    setKites(prev => prev.map(k => {
      if (k.id === playerIdRef.current && !k.isCut) {
        return {
          ...k,
          targetPos: {
            x: Math.max(30, Math.min(GAME_CONSTANTS.CANVAS_WIDTH - 30, k.pos.x + move.x * 30)),
            y: Math.max(30, Math.min(GAME_CONSTANTS.CANVAS_HEIGHT - 60, k.pos.y + move.y * 30))
          }
        };
      }
      return k;
    }));
  };

  const handleAttack = () => {
    if (matchStatus !== 'PLAYING') return;
    setKites(prev => prev.map(k => {
      if (k.id === playerIdRef.current && !k.isCut && performance.now() > k.attackCooldown) {
        return {
          ...k,
          attackActive: true,
          attackEndTime: performance.now() + GAME_CONSTANTS.ATTACK_DURATION,
          attackCooldown: performance.now() + GAME_CONSTANTS.ATTACK_COOLDOWN
        };
      }
      return k;
    }));
  };

  return (
    <div className="absolute inset-0 bg-[#020617] overflow-hidden touch-none select-none">
      <GameCanvas kites={kites} pecha={pecha} wind={wind} />
      
      <UIOverlay 
        kites={kites} 
        message={statusMessage} 
        onExit={onExit} 
        wind={wind}
        roomId={roomId}
        isAlone={mode === GameMode.MULTIPLAYER && kites.length <= 1}
      />

      {matchStatus !== 'PLAYING' && (
        <ResultModal status={matchStatus} onRetry={() => window.location.reload()} onExit={onExit} />
      )}

      <div className="absolute bottom-10 left-10">
        <VirtualJoystick onMove={handleJoystickMove} />
      </div>

      <div className="absolute bottom-10 right-10 flex flex-col items-center gap-2">
        <button 
          onPointerDown={handleAttack}
          className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 shadow-2xl pointer-events-auto
            ${kites.find(k => k.id === playerIdRef.current)?.attackActive 
              ? 'bg-cyan-500 border-white shadow-[0_0_40px_rgba(6,182,212,0.6)] animate-pulse' 
              : 'bg-white/5 border-white/20 backdrop-blur-xl'}`}
        >
          <i className="fas fa-bolt text-3xl text-white"></i>
        </button>
        <div className="text-white text-[10px] font-black tracking-widest opacity-40 uppercase">Boost (Space)</div>
      </div>
    </div>
  );
};

export default GameView;