
import React from 'react';
import { MatchStatus } from '../types';

interface ResultModalProps {
  status: MatchStatus;
  onRetry: () => void;
  onExit: () => void;
}

const ResultModal: React.FC<ResultModalProps> = ({ status, onRetry, onExit }) => {
  const isVictory = status === 'VICTORY';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[48px] p-12 max-w-sm w-full text-center shadow-2xl transform animate-in zoom-in-95 duration-300">
        <div className={`w-24 h-24 mx-auto mb-8 rounded-[32px] flex items-center justify-center text-4xl shadow-2xl border ${isVictory ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30 shadow-cyan-500/20' : 'bg-red-500/20 text-red-400 border-red-500/30 shadow-red-500/20'}`}>
          <i className={`fas ${isVictory ? 'fa-crown' : 'fa-skull'}`}></i>
        </div>
        
        <h2 className={`text-5xl font-black italic tracking-tighter mb-4 ${isVictory ? 'text-cyan-400' : 'text-red-400'}`}>
          {isVictory ? 'VICTORY!' : 'CUT DOWN!'}
        </h2>
        
        <p className="text-white/40 font-medium mb-12 leading-relaxed tracking-wide text-sm">
          {isVictory 
            ? 'The night sky belongs to you. Every opponent string has snapped.' 
            : 'The darkness claims your kite. Return stronger for the next flight.'}
        </p>

        <div className="flex flex-col gap-4 pointer-events-auto">
          <button 
            onClick={onRetry}
            className={`w-full py-5 rounded-2xl font-black text-lg tracking-widest shadow-2xl transition-all active:scale-95 ${isVictory ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20' : 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20'}`}
          >
            REMATCH
          </button>
          <button 
            onClick={onExit}
            className="w-full py-5 rounded-2xl font-black text-white/40 hover:text-white transition-colors tracking-widest text-sm"
          >
            QUIT TO MENU
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
