
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameMode, Kite, PechaState, MatchStatus } from '../types';
import { GAME_CONSTANTS, INITIAL_WIND } from '../constants';
import GameCanvas from './GameCanvas';
import VirtualJoystick from './VirtualJoystick';
import UIOverlay from './UIOverlay';
import ResultModal from './ResultModal';
import { updateKitePhysics, checkCollisions, handlePechaLogic } from '../services/gameLogic';

// Declare PeerJS globally since it's loaded via CDN
declare const Peer: any;

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
  const [actualRoomId, setActualRoomId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Initializing...');

  const peerRef = useRef<any>(null);
  const connectionsRef = useRef<Map<string, any>>(new Map());
  const requestRef = useRef<number>(0);
  const playerIdRef = useRef<string>(`p-${Math.random().toString(36).substr(2, 5)}`);
  const isHostRef = useRef<boolean>(roomId === 'HOST_NEW');

  // Authoritative Host Loop
  const hostLoop = useCallback((time: number) => {
    setKites(prevKites => {
      // 1. Physics update for everyone
      let nextKites = prevKites.map(k => updateKitePhysics(k, wind));

      // 2. AI behaviors
      nextKites = nextKites.map(k => {
        if (k.isAI && !k.isCut) {
          const target = nextKites.find(p => !p.isAI && !p.isCut);
          if (target) {
            const dist = Math.hypot(target.pos.x - k.pos.x, target.pos.y - k.pos.y);
            
            // AI now hovers BELOW the player (target.pos.y + 120) instead of above
            if (dist < 300) {
              k.targetPos = { 
                x: target.pos.x + Math.sin(time / 800) * 50, 
                y: target.pos.y + 120 
              };
            } else {
              // Idle/Patrol behavior - significantly lower than before
              const seed = parseInt(k.id.replace(/[^0-9]/g, '') || '0');
              k.targetPos = {
                x: (GAME_CONSTANTS.CANVAS_WIDTH / 5) * ((seed % 4) + 1) + Math.sin(time / 2000) * 100,
                y: GAME_CONSTANTS.CANVAS_HEIGHT * 0.5 + Math.cos(time / 1500) * 50
              };
            }
          }
        }
        return k;
      });

      // 3. Pecha calculation
      const collisionResult = checkCollisions(nextKites);
      const { updatedKites, updatedPecha, cutMessage } = handlePechaLogic(nextKites, pecha, collisionResult, time);
      
      if (cutMessage) setStatusMessage(cutMessage);
      setPecha(updatedPecha);

      // Broadcast to all connected guests
      const broadcastData = {
        type: 'SYNC',
        kites: updatedKites,
        pecha: updatedPecha,
        wind: wind,
        message: cutMessage
      };
      
      connectionsRef.current.forEach(conn => {
        if (conn.open) conn.send(broadcastData);
      });

      return updatedKites;
    });
  }, [pecha, wind]);

  // PeerJS Initialization (omitted logic for brevity, matches original)
  useEffect(() => {
    if (mode !== GameMode.MULTIPLAYER) return;
    const peer = new Peer(isHostRef.current ? undefined : undefined, { debug: 1 });
    peerRef.current = peer;
    peer.on('open', (id: string) => {
      if (isHostRef.current) {
        setActualRoomId(id.substr(0, 5).toUpperCase());
        setConnectionStatus('Waiting for challengers...');
      } else {
        setActualRoomId(roomId);
        const conn = peer.connect(roomId?.toLowerCase() || '');
        setConnectionStatus('Connecting to host...');
        conn.on('open', () => {
          setConnectionStatus('Connected to Battle');
          connectionsRef.current.set('host', conn);
        });
        conn.on('data', (data: any) => {
          if (data.type === 'SYNC') {
            setKites(data.kites);
            setPecha(data.pecha);
            setWind(data.wind);
            if (data.message) setStatusMessage(data.message);
          }
        });
        conn.on('close', () => {
          setConnectionStatus('Host disconnected');
          setMatchStatus('DEFEAT');
        });
      }
    });
    if (isHostRef.current) {
      peer.on('connection', (conn: any) => {
        setConnectionStatus('Opponent joined!');
        connectionsRef.current.set(conn.peer, conn);
        conn.on('data', (data: any) => {
          if (data.type === 'INPUT') {
            setKites(prev => prev.map(k => {
              if (k.id === data.playerId) {
                return { ...k, ...data };
              }
              return k;
            }));
          }
        });
        conn.on('close', () => {
          connectionsRef.current.delete(conn.peer);
          setKites(prev => prev.filter(k => k.id !== conn.peer));
        });
      });
    }
    return () => { peer.destroy(); };
  }, [mode, roomId]);

  // Initial Kite Setup - HEIGHTS ADJUSTED
  useEffect(() => {
    const localKite: Kite = {
      id: playerIdRef.current,
      name: isHostRef.current ? 'HOST' : 'YOU',
      color: GAME_CONSTANTS.COLORS.PLAYER,
      pos: { x: GAME_CONSTANTS.CANVAS_WIDTH / 2, y: GAME_CONSTANTS.CANVAS_HEIGHT * 0.3 }, // Higher starting point (30%)
      vel: { x: 0, y: 0 },
      targetPos: { x: GAME_CONSTANTS.CANVAS_WIDTH / 2, y: GAME_CONSTANTS.CANVAS_HEIGHT * 0.3 },
      tension: 10,
      isCut: false,
      isAI: false,
      angle: 0,
      attackActive: false,
      attackCooldown: 0,
      attackEndTime: 0,
      score: 0
    };

    if (isHostRef.current || mode === GameMode.PRACTICE) {
      let initialKites = [localKite];
      if (mode === GameMode.PRACTICE) {
        for (let i = 0; i < 4; i++) {
          initialKites.push({
            id: `ai-${i}`,
            name: `BOT ${String.fromCharCode(65+i)}`,
            color: GAME_CONSTANTS.COLORS.NEON[i % GAME_CONSTANTS.COLORS.NEON.length],
            pos: { x: (GAME_CONSTANTS.CANVAS_WIDTH / 5) * (i + 1), y: GAME_CONSTANTS.CANVAS_HEIGHT * 0.6 }, // Lower starting point (60%)
            vel: { x: 0, y: 0 },
            targetPos: { x: (GAME_CONSTANTS.CANVAS_WIDTH / 5) * (i + 1), y: GAME_CONSTANTS.CANVAS_HEIGHT * 0.6 },
            tension: 5,
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
    }
  }, [mode]);

  // Game Loop
  const animate = useCallback((time: number) => {
    if (matchStatus !== 'PLAYING') {
      requestRef.current = requestAnimationFrame(animate);
      return;
    }
    if (mode === GameMode.PRACTICE || (mode === GameMode.MULTIPLAYER && isHostRef.current)) {
      hostLoop(time);
      const local = kites.find(k => k.id === playerIdRef.current);
      if (local?.isCut) setMatchStatus('DEFEAT');
      if (mode === GameMode.PRACTICE) {
        const botsAlive = kites.some(k => k.isAI && !k.isCut);
        if (!botsAlive && kites.length > 1) setMatchStatus('VICTORY');
      }
      setWind(prev => ({
        x: prev.x + (Math.random() - 0.5) * 0.003,
        y: prev.y + (Math.random() - 0.5) * 0.001
      }));
    }
    requestRef.current = requestAnimationFrame(animate);
  }, [hostLoop, matchStatus, mode, kites]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [animate]);

  const handleJoystickMove = (move: { x: number, y: number }) => {
    if (matchStatus !== 'PLAYING') return;
    setKites(prev => {
      const local = prev.find(k => k.id === playerIdRef.current);
      if (!local || local.isCut) return prev;
      const newTarget = {
        x: Math.max(30, Math.min(GAME_CONSTANTS.CANVAS_WIDTH - 30, local.pos.x + move.x * 40)),
        y: Math.max(20, Math.min(GAME_CONSTANTS.CANVAS_HEIGHT - 100, local.pos.y + move.y * 40)) // Higher ceiling (20px)
      };
      if (!isHostRef.current && mode === GameMode.MULTIPLAYER) {
        const hostConn = connectionsRef.current.get('host');
        if (hostConn && hostConn.open) {
          hostConn.send({ type: 'INPUT', playerId: playerIdRef.current, targetPos: newTarget });
        }
      }
      return prev.map(k => k.id === playerIdRef.current ? { ...k, targetPos: newTarget } : k);
    });
  };

  const handleAttack = () => {
    if (matchStatus !== 'PLAYING') return;
    const now = performance.now();
    setKites(prev => {
      const local = prev.find(k => k.id === playerIdRef.current);
      if (!local || local.isCut || now < local.attackCooldown) return prev;
      const attackData = {
        attackActive: true,
        attackEndTime: now + GAME_CONSTANTS.ATTACK_DURATION,
        attackCooldown: now + GAME_CONSTANTS.ATTACK_COOLDOWN
      };
      if (!isHostRef.current && mode === GameMode.MULTIPLAYER) {
        const hostConn = connectionsRef.current.get('host');
        if (hostConn && hostConn.open) {
          hostConn.send({ type: 'INPUT', playerId: playerIdRef.current, ...attackData });
        }
      }
      return prev.map(k => k.id === playerIdRef.current ? { ...k, ...attackData } : k);
    });
  };

  return (
    <div className="absolute inset-0 bg-[#020617] overflow-hidden touch-none select-none">
      <GameCanvas kites={kites} pecha={pecha} wind={wind} />
      <UIOverlay kites={kites} message={statusMessage} onExit={onExit} wind={wind} roomId={actualRoomId} isAlone={mode === GameMode.MULTIPLAYER && kites.length <= 1} />
      {mode === GameMode.MULTIPLAYER && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2 pointer-events-none">
          <div className={`w-2 h-2 rounded-full ${connectionStatus.includes('Connected') ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{connectionStatus}</span>
        </div>
      )}
      {matchStatus !== 'PLAYING' && <ResultModal status={matchStatus} onRetry={() => window.location.reload()} onExit={onExit} />}
      <div className="absolute bottom-10 left-10"><VirtualJoystick onMove={handleJoystickMove} /></div>
      <div className="absolute bottom-10 right-10 flex flex-col items-center gap-2">
        <button onPointerDown={handleAttack} className={`w-24 h-24 rounded-full border-4 flex items-center justify-center transition-all active:scale-90 shadow-2xl pointer-events-auto ${kites.find(k => k.id === playerIdRef.current)?.attackActive ? 'bg-cyan-500 border-white shadow-[0_0_40px_rgba(6,182,212,0.6)] animate-pulse' : 'bg-white/5 border-white/20 backdrop-blur-xl'}`}><i className="fas fa-bolt text-3xl text-white"></i></button>
        <div className="text-white text-[10px] font-black tracking-widest opacity-40 uppercase">Boost (Space)</div>
      </div>
    </div>
  );
};

export default GameView;
