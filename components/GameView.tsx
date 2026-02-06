
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

      // 2. AI behaviors (Only in Practice mode)
      if (mode === GameMode.PRACTICE) {
        nextKites = nextKites.map(k => {
          if (k.isAI && !k.isCut) {
            const target = nextKites.find(p => !p.isAI && !p.isCut);
            if (target) {
              const dist = Math.hypot(target.pos.x - k.pos.x, target.pos.y - k.pos.y);
              if (dist < 400) {
                k.targetPos = { x: target.pos.x, y: target.pos.y - 120 };
              }
            }
          }
          return k;
        });
      }

      // 3. Pecha calculation
      const collisionResult = checkCollisions(nextKites);
      const { updatedKites, updatedPecha, cutMessage } = handlePechaLogic(nextKites, pecha, collisionResult, time);
      
      if (cutMessage) setStatusMessage(cutMessage);
      setPecha(updatedPecha);

      // Broadcast to all connected guests
      if (mode === GameMode.MULTIPLAYER) {
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
      }

      return updatedKites;
    });
  }, [pecha, wind, mode]);

  // PeerJS Initialization
  useEffect(() => {
    if (mode !== GameMode.MULTIPLAYER) return;

    // Helper to generate a clean short ID for the Host
    const generateId = () => Math.random().toString(36).substring(2, 7).toUpperCase();
    const hostId = isHostRef.current ? generateId() : undefined;

    const peer = new Peer(hostId, {
      debug: 1,
      config: {
        'iceServers': [
          { url: 'stun:stun.l.google.com:19302' },
          { url: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peerRef.current = peer;

    peer.on('open', (id: string) => {
      console.log('Peer connected with ID:', id);
      setActualRoomId(id.toUpperCase());
      
      if (isHostRef.current) {
        setConnectionStatus('Waiting for challengers...');
      } else {
        const targetId = roomId?.toUpperCase() || '';
        setConnectionStatus(`Connecting to ${targetId}...`);
        const conn = peer.connect(targetId);
        
        conn.on('open', () => {
          setConnectionStatus('Connected to Battle');
          connectionsRef.current.set('host', conn);
          // Send join signal to host
          conn.send({ type: 'JOIN', playerId: playerIdRef.current });
        });

        conn.on('data', (data: any) => {
          if (data.type === 'SYNC') {
            setKites(data.kites);
            setPecha(data.pecha);
            setWind(data.wind);
            if (data.message) setStatusMessage(data.message);
          }
        });

        conn.on('error', (err: any) => {
          setConnectionStatus('Connection Failed');
          console.error("Conn Error:", err);
        });

        conn.on('close', () => {
          setConnectionStatus('Host disconnected');
          setMatchStatus('DEFEAT');
        });
      }
    });

    peer.on('error', (err: any) => {
      console.error('PeerJS Error:', err.type, err);
      if (err.type === 'peer-unavailable') {
        setConnectionStatus('Room not found (Check ID)');
      } else if (err.type === 'unavailable-id') {
        // If Host ID is taken, retry once
        if (isHostRef.current) window.location.reload();
      } else {
        setConnectionStatus(`Error: ${err.type}`);
      }
    });

    if (isHostRef.current) {
      peer.on('connection', (conn: any) => {
        setConnectionStatus('Opponent joined!');
        connectionsRef.current.set(conn.peer, conn);

        conn.on('data', (data: any) => {
          if (data.type === 'JOIN') {
            // Initialize guest kite on host side
            const guestKite: Kite = {
              id: data.playerId,
              name: `GUEST`,
              color: GAME_CONSTANTS.COLORS.NEON[connectionsRef.current.size % 5],
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
            setKites(prev => [...prev, guestKite]);
          }

          if (data.type === 'INPUT') {
            setKites(prev => prev.map(k => {
              if (k.id === data.playerId) {
                return { 
                  ...k, 
                  targetPos: data.targetPos || k.targetPos,
                  attackActive: data.attackActive !== undefined ? data.attackActive : k.attackActive,
                  attackEndTime: data.attackEndTime || k.attackEndTime,
                  attackCooldown: data.attackCooldown || k.attackCooldown
                };
              }
              return k;
            }));
          }
        });

        conn.on('close', () => {
          connectionsRef.current.delete(conn.peer);
          setKites(prev => prev.filter(k => k.id !== conn.peer));
          if (connectionsRef.current.size === 0) setConnectionStatus('Waiting for challengers...');
        });
      });
    }

    return () => {
      peer.destroy();
    };
  }, [mode, roomId]);

  // Initial Kite Setup
  useEffect(() => {
    const localKite: Kite = {
      id: playerIdRef.current,
      name: isHostRef.current ? 'HOST' : 'GUEST',
      color: isHostRef.current ? GAME_CONSTANTS.COLORS.PLAYER : GAME_CONSTANTS.COLORS.NEON[1],
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

    if (isHostRef.current || mode === GameMode.PRACTICE) {
      let initialKites = [localKite];
      if (mode === GameMode.PRACTICE) {
        for (let i = 0; i < 4; i++) {
          initialKites.push({
            id: `ai-${i}`,
            name: `BOT ${String.fromCharCode(65+i)}`,
            color: GAME_CONSTANTS.COLORS.NEON[i % GAME_CONSTANTS.COLORS.NEON.length],
            pos: { x: (GAME_CONSTANTS.CANVAS_WIDTH / 5) * (i + 1), y: 200 },
            vel: { x: 0, y: 0 },
            targetPos: { x: (GAME_CONSTANTS.CANVAS_WIDTH / 5) * (i + 1), y: 200 },
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
      
      // Check for win/loss locally
      const local = kites.find(k => k.id === playerIdRef.current);
      if (local?.isCut) setMatchStatus('DEFEAT');
      
      setWind(prev => ({
        x: prev.x + (Math.random() - 0.5) * 0.003,
        y: prev.y + (Math.random() - 0.5) * 0.001
      }));
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [hostLoop, matchStatus, mode, kites, wind]);

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
        x: Math.max(30, Math.min(GAME_CONSTANTS.CANVAS_WIDTH - 30, local.pos.x + move.x * 35)),
        y: Math.max(30, Math.min(GAME_CONSTANTS.CANVAS_HEIGHT - 100, local.pos.y + move.y * 35))
      };

      // If we are a guest, send input to host
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
          hostConn.send({ 
            type: 'INPUT', 
            playerId: playerIdRef.current, 
            ...attackData 
          });
        }
      }

      return prev.map(k => k.id === playerIdRef.current ? { ...k, ...attackData } : k);
    });
  };

  return (
    <div className="absolute inset-0 bg-[#020617] overflow-hidden touch-none select-none">
      <GameCanvas kites={kites} pecha={pecha} wind={wind} />
      
      <UIOverlay 
        kites={kites} 
        message={statusMessage} 
        onExit={onExit} 
        wind={wind}
        roomId={actualRoomId}
        isAlone={mode === GameMode.MULTIPLAYER && isHostRef.current && connectionsRef.current.size === 0}
      />

      {/* Connection Status Indicator */}
      {mode === GameMode.MULTIPLAYER && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/5 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2 pointer-events-none z-50">
          <div className={`w-2 h-2 rounded-full ${connectionStatus.includes('Connected') || connectionStatus.includes('joined') ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`}></div>
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{connectionStatus}</span>
        </div>
      )}

      {matchStatus !== 'PLAYING' && (
        <ResultModal status={matchStatus} onRetry={() => window.location.reload()} onExit={onExit} />
      )}

      <div className="absolute bottom-10 left-10 z-40">
        <VirtualJoystick onMove={handleJoystickMove} />
      </div>

      <div className="absolute bottom-10 right-10 flex flex-col items-center gap-2 z-40">
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
