import React from 'react';
import { useSettings } from '../../context/SettingsContext';

interface SettingsPanelProps {
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const {
    shipSpeed,
    shipTorque,
    fireSpeed,
    fireRate,
    fireStrength,
    horizontalSpeed,
    difficulty,
    soundEnabled,
    musicVolume,
    sfxVolume,
    setShipSpeed,
    setShipTorque,
    setFireSpeed,
    setFireRate,
    setFireStrength,
    setHorizontalSpeed,
    setDifficulty,
    toggleSoundEnabled,
    setMusicVolume,
    setSfxVolume,
    resetSettings,
  } = useSettings();

  // Handle slider change
  const handleSliderChange = (
    setter: (value: number) => void,
    min: number,
    max: number
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setter(Math.max(min, Math.min(max, value)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Game Settings</h2>
          <button
            className="text-gray-400 hover:text-white"
            onClick={onClose}
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Ship Controls */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Ship Controls</h3>
          
          <div className="mb-2">
            <label className="block text-sm mb-1">
              Ship Speed: {shipSpeed.toFixed(1)}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.1"
              value={shipSpeed}
              onChange={handleSliderChange(setShipSpeed, 1, 10)}
              className="w-full"
            />
          </div>
          
          <div className="mb-2">
            <label className="block text-sm mb-1">
              Rotation Speed: {shipTorque.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.01"
              max="0.2"
              step="0.01"
              value={shipTorque}
              onChange={handleSliderChange(setShipTorque, 0.01, 0.2)}
              className="w-full"
            />
          </div>
          
          <div className="mb-2">
            <label className="block text-sm mb-1">
              Horizontal Speed: {horizontalSpeed.toFixed(1)}
            </label>
            <input
              type="range"
              min="1"
              max="8"
              step="0.1"
              value={horizontalSpeed}
              onChange={handleSliderChange(setHorizontalSpeed, 1, 8)}
              className="w-full"
            />
          </div>
        </div>
        
        {/* Weapons */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Weapons</h3>
          
          <div className="mb-2">
            <label className="block text-sm mb-1">
              Fire Speed: {fireSpeed.toFixed(1)}
            </label>
            <input
              type="range"
              min="5"
              max="20"
              step="0.5"
              value={fireSpeed}
              onChange={handleSliderChange(setFireSpeed, 5, 20)}
              className="w-full"
            />
          </div>

          <div className="mb-2">
            <label className="block text-sm mb-1">
              Fire Rate: {(1/fireRate).toFixed(1)} shots/sec
            </label>
            <input
              type="range"
              min="0.05"
              max="0.5"
              step="0.01"
              value={fireRate}
              onChange={handleSliderChange(setFireRate, 0.05, 0.5)}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-400">
              <span>Slower</span>
              <span>Faster</span>
            </div>
          </div>
          
          <div className="mb-2">
            <label className="block text-sm mb-1">
              Fire Strength: {fireStrength.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.1"
              value={fireStrength}
              onChange={handleSliderChange(setFireStrength, 0.5, 5)}
              className="w-full"
            />
          </div>
        </div>
        
        {/* Game Settings */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Game Settings</h3>
          
          <div className="mb-2">
            <label className="block text-sm mb-1">Difficulty</label>
            <div className="flex space-x-2">
              {['easy', 'medium', 'hard'].map((level) => (
                <button
                  key={level}
                  className={`py-1 px-3 text-sm rounded ${
                    difficulty === level
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                  onClick={() => 
                    setDifficulty(level as 'easy' | 'medium' | 'hard')
                  }
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Sound Settings */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Sound</h3>
          
          <div className="mb-2">
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={toggleSoundEnabled}
                className="mr-2"
              />
              Sound Enabled
            </label>
          </div>
          
          <div className="mb-2">
            <label className="block text-sm mb-1">
              Music: {Math.round(musicVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={musicVolume}
              onChange={handleSliderChange(setMusicVolume, 0, 1)}
              className="w-full"
              disabled={!soundEnabled}
            />
          </div>
          
          <div className="mb-2">
            <label className="block text-sm mb-1">
              SFX: {Math.round(sfxVolume * 100)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={sfxVolume}
              onChange={handleSliderChange(setSfxVolume, 0, 1)}
              className="w-full"
              disabled={!soundEnabled}
            />
          </div>
        </div>
        
        {/* Buttons */}
        <div className="flex justify-between mt-4">
          <button
            className="bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded text-sm"
            onClick={resetSettings}
          >
            Reset to Defaults
          </button>
          
          <button
            className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded text-sm"
            onClick={onClose}
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;