
import React, { useState } from 'react';

interface MainMenuProps {
  onStartPractice: () => void;
  onJoinMultiplayer: (id: string) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStartPractice, onJoinMultiplayer }) => {
  const [roomInput, setRoomInput] = useState('');

  return (
    <div className="flex flex-col items-center justify-center h-full text-white bg-[#020617] p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 blur-[120px] rounded-full"></div>

      <div className="mb-12 text-center relative z-10">
        <h1 className="text-7xl font-black italic tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-2">BASANT</h1>
        <p className="text-xl opacity-60 font-medium tracking-[0.2em] uppercase">Midnight Championship</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl relative z-10">
        <div className="bg-white/[0.03] backdrop-blur-xl p-10 rounded-[40px] border border-white/10 flex flex-col items-center text-center shadow-2xl transition-all hover:bg-white/[0.05]">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/30">
            <i className="fas fa-bolt text-cyan-400 text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold mb-3">Solo Practice</h2>
          <p className="text-sm opacity-50 mb-8 leading-relaxed">Train against 4 AI masters in the night sky. Perfect for honing your Pecha skills.</p>
          <button 
            onClick={onStartPractice}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-4 px-8 rounded-2xl transition-all active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
          >
            ENTER ARENA
          </button>
        </div>

        <div className="bg-white/[0.03] backdrop-blur-xl p-10 rounded-[40px] border border-white/10 flex flex-col items-center text-center shadow-2xl transition-all hover:bg-white/[0.05]">
          <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/30">
            <i className="fas fa-globe text-purple-400 text-2xl"></i>
          </div>
          <h2 className="text-2xl font-bold mb-3">Live Battle</h2>
          <p className="text-sm opacity-50 mb-6 leading-relaxed">Join a room and battle up to 4 real players globally in real-time.</p>
          <div className="w-full flex flex-col gap-4">
            <input 
              type="text" 
              placeholder="ROOM ID" 
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
              className="w-full bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-4 outline-none focus:ring-2 focus:ring-purple-500 text-center uppercase tracking-widest font-black placeholder:text-white/20"
            />
            <div className="grid grid-cols-2 gap-3">
              <button 
                disabled={!roomInput}
                onClick={() => onJoinMultiplayer(roomInput)}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl transition-all active:scale-95"
              >
                JOIN
              </button>
              <button 
                onClick={() => onJoinMultiplayer(Math.random().toString(36).substring(2, 7).toUpperCase())}
                className="bg-white/10 hover:bg-white/20 text-white font-black py-4 rounded-2xl transition-all"
              >
                HOST
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] opacity-30">
        <div className="flex items-center gap-3">
          <i className="fas fa-keyboard text-lg"></i>
          <span>WASD / SPACE</span>
        </div>
        <div className="flex items-center gap-3">
          <i className="fas fa-hand-pointer text-lg"></i>
          <span>TOUCH CONTROLS</span>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
