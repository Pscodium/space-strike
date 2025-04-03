import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

const Settings: React.FC = () => {
  const navigate = useNavigate();
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
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Game Settings</h1>
        
        {/* Ship Controls */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
            Ship Controls
          </h2>
          
          <div className="mb-4">
            <label className="block mb-2">
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
            <div className="flex justify-between text-sm text-gray-400">
              <span>Slow</span>
              <span>Fast</span>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2">
              Ship Torque (Rotation Speed): {shipTorque.toFixed(2)}
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
            <div className="flex justify-between text-sm text-gray-400">
              <span>Slow Turn</span>
              <span>Fast Turn</span>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2">
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
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
            Weapons
          </h2>
          
          <div className="mb-4">
            <label className="block mb-2">
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
            <div className="flex justify-between text-sm text-gray-400">
              <span>Slow</span>
              <span>Fast</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block mb-2">
              Fire Rate: {fireRate.toFixed(1)}
            </label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={fireRate}
              onChange={handleSliderChange(setFireRate, 0.1, 5)}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-400">
              <span>Fast</span>
              <span>Slow</span>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2">
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
            <div className="flex justify-between text-sm text-gray-400">
              <span>Weak</span>
              <span>Strong</span>
            </div>
          </div>
        </div>
        
        {/* Game Settings */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
            Game Settings
          </h2>
          
          <div className="mb-4">
            <label className="block mb-2">Difficulty</label>
            <div className="flex space-x-4">
              {['easy', 'medium', 'hard'].map((level) => (
                <button
                  key={level}
                  className={`py-2 px-4 rounded ${
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
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
            Sound Settings
          </h2>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={toggleSoundEnabled}
                className="mr-2"
              />
              Sound Enabled
            </label>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2">
              Music Volume: {Math.round(musicVolume * 100)}%
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
          
          <div className="mb-4">
            <label className="block mb-2">
              SFX Volume: {Math.round(sfxVolume * 100)}%
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
        <div className="flex justify-between mt-8">
          <button
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            onClick={resetSettings}
          >
            Reset to Defaults
          </button>
          
          <div>
            <button
              className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded mr-2"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
            
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              onClick={() => navigate('/')}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;