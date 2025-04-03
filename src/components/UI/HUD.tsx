import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import SettingsPanel from './SettingsPanel';

const HUD: React.FC = () => {
  const { score, level, player, pause } = useGame();
  const [showSettings, setShowSettings] = useState(false);
  
  const handleOpenSettings = () => {
    pause();
    setShowSettings(true);
  };
  
  const handleCloseSettings = () => {
    setShowSettings(false);
  };
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top HUD */}
      <div className="flex justify-between p-4 text-white">
        <div>
          <p className="text-xl font-bold">Score: {score}</p>
          <p>Level: {level}</p>
        </div>
        
        <div className="pointer-events-auto">
          <button
            className="bg-gray-800 bg-opacity-50 hover:bg-opacity-70 rounded-full p-2"
            onClick={handleOpenSettings}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 001.52 1.261c1.756.424 1.756 2.924 0 3.35a1.724 1.724 0 00-1.52 1.261c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.52-1.261c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.52-1.261zM19 12l-7 7-7-7m14 0l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Bottom HUD - Health and Lives */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="flex items-center justify-between text-white">
          {/* Health Bar */}
          <div className="flex items-center">
            <span className="mr-2">Health:</span>
            <div className="w-48 h-4 bg-gray-800 rounded overflow-hidden">
              <div 
                className="h-full bg-green-600"
                style={{ width: `${player.health}%` }}
              />
            </div>
          </div>
          
          {/* Lives */}
          <div className="flex items-center">
            <span className="mr-2">Lives:</span>
            <div className="flex">
              {[...Array(player.lives)].map((_, index) => (
                <div 
                  key={index}
                  className="w-6 h-6 mr-1 text-red-500"
                >
                  ❤️
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Settings Panel */}
      {showSettings && <SettingsPanel onClose={handleCloseSettings} />}
    </div>
  );
};

export default HUD;