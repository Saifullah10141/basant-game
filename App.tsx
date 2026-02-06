
import React, { useState, useEffect } from 'react';
import { GameMode } from './types';
import MainMenu from './components/MainMenu';
import GameView from './components/GameView';

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>(GameMode.MENU);
  const [roomId, setRoomId] = useState<string | null>(null);

  const handleStartPractice = () => {
    setMode(GameMode.PRACTICE);
  };

  const handleJoinMultiplayer = (id: string) => {
    setRoomId(id);
    setMode(GameMode.MULTIPLAYER);
  };

  const handleReturnToMenu = () => {
    setMode(GameMode.MENU);
    setRoomId(null);
  };

  return (
    <div className="relative w-full h-screen bg-sky-400 overflow-hidden font-sans">
      {mode === GameMode.MENU ? (
        <MainMenu 
          onStartPractice={handleStartPractice} 
          onJoinMultiplayer={handleJoinMultiplayer} 
        />
      ) : (
        <GameView 
          mode={mode} 
          roomId={roomId} 
          onExit={handleReturnToMenu} 
        />
      )}
    </div>
  );
};

export default App;
