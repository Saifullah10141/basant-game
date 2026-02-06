
import React from 'react';
import { Kite, Vector2D } from '../types';

interface UIOverlayProps {
  kites: Kite[];
  message: string | null;
  wind: Vector2D;
  roomId: string | null;
  isAlone?: boolean;
  onExit: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ kites, message, wind, roomId, isAlone, onExit }) => {
  const player = kites.find(k => !k.isAI && (k.id === 'player' || k.id.startsWith('local')));
  const cooldownPercent = player ? Math.max(0, (player.attackCooldown - performance.now()) / 45) : 0;

  return (
    <div className="absolute inset-0 pointer-events-none p-8 flex flex-col justify-between">
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-white/[0.03] backdrop-blur-2xl p-6 rounded-[32px] border border-white/10 text-white shadow-2xl min-w-[200px]">
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
            <h3 className="text-[10px] uppercase font-black tracking-[0.3em] opacity-30 text-cyan-400">Scores</h3>
            {roomId && (
              <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">ID: {roomId}</span>
            )}
          </div>
          <div className="space-y-3">
            {kites.map(k => (
              <div key={k.id} className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full ${k.isCut ? 'bg-red-500' : ''}`} style={{ backgroundColor: !k.isCut ? k.color : undefined }}></div>
                  <span className={`text-xs font-black tracking-wider ${k.id === player?.id ? 'text-white' : 'text-white/40'} ${k.isCut ? 'line-through opacity-20' : ''}`}>
                    {k.name}
                  </span>
                </div>
                <span className={`text-xs font-black ${k.isCut ? 'text-red-500/50' : 'text-white/80'}`}>{k.score}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col items-end gap-4 pointer-events-auto">
          <button 
            onClick={onExit} 
            className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-6 py-3 rounded-2xl text-[10px] font-black tracking-widest transition-all backdrop-blur-md uppercase"
          >
            Quit
          </button>
          <div className="bg-white/[0.03] backdrop-blur-xl px-5 py-4 rounded-[24px] border border-white/10 text-white flex items-center gap-4">
             <i className="fas fa-wind text-cyan-400 opacity-50"></i>
             <div className="text-xs" style={{ transform: `rotate(${Math.atan2(wind.y, wind.x)}rad)` }}>
               <i className="fas fa-location-arrow text-cyan-400"></i>
             </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        {isAlone && (
          <div className="bg-white/5 border border-white/10 backdrop-blur-md px-10 py-8 rounded-[40px] text-center shadow-2xl animate-pulse">
            <h2 className="text-cyan-400 font-black italic text-xl tracking-tighter mb-2">WAITING FOR OPPONENTS</h2>
            <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest mb-4">Share this code with friends:</p>
            <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/20 text-3xl font-black tracking-[0.3em] text-white">
              {roomId}
            </div>
          </div>
        )}
        {message && (
          <div className="bg-cyan-500 text-slate-950 px-10 py-4 rounded-3xl shadow-[0_0_40px_rgba(6,182,212,0.4)] animate-bounce border-2 border-white/20 font-black italic text-2xl tracking-tighter">
            {message}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center mb-4">
         {player && !player.isCut && (
           <div className="flex flex-col items-center gap-3">
             <div className="text-[10px] font-black tracking-[0.4em] text-white/20 uppercase">Charge</div>
             <div className="w-64 h-2 bg-white/5 rounded-full overflow-hidden border border-white/10">
               <div 
                 className={`h-full transition-all duration-300 rounded-full ${cooldownPercent <= 0 ? 'bg-cyan-400' : 'bg-white/20'}`} 
                 style={{ width: `${Math.min(100, 100 - cooldownPercent)}%` }}
               ></div>
             </div>
           </div>
         )}
      </div>
    </div>
  );
};

export default UIOverlay;
