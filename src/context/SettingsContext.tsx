import React, { createContext, useContext } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  updateShipSpeed,
  updateShipTorque,
  updateFireSpeed,
  updateFireStrength,
  updateHorizontalSpeed,
  updateDifficulty,
  toggleSound,
  updateMusicVolume,
  updateSfxVolume,
  resetToDefaults,
  updateFireRate,
} from '../store/settingsSlice';

// Context interface
interface SettingsContextType {
  shipSpeed: number;
  shipTorque: number;
  fireSpeed: number;
  fireRate: number;
  fireStrength: number;
  horizontalSpeed: number;
  difficulty: 'easy' | 'medium' | 'hard';
  soundEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  setShipSpeed: (value: number) => void;
  setShipTorque: (value: number) => void;
  setFireSpeed: (value: number) => void;
  setFireRate: (value: number) => void;
  setFireStrength: (value: number) => void;
  setHorizontalSpeed: (value: number) => void;
  setDifficulty: (value: 'easy' | 'medium' | 'hard') => void;
  toggleSoundEnabled: () => void;
  setMusicVolume: (value: number) => void;
  setSfxVolume: (value: number) => void;
  resetSettings: () => void;
}

// Create context with default value
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider component
export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);

  const setShipSpeed = (value: number) => dispatch(updateShipSpeed(value));
  const setShipTorque = (value: number) => dispatch(updateShipTorque(value));
  const setFireSpeed = (value: number) => dispatch(updateFireSpeed(value));
  const setFireRate =  (value: number) => dispatch(updateFireRate(value));
  const setFireStrength = (value: number) => dispatch(updateFireStrength(value));
  const setHorizontalSpeed = (value: number) => dispatch(updateHorizontalSpeed(value));
  const setDifficulty = (value: 'easy' | 'medium' | 'hard') => dispatch(updateDifficulty(value));
  const toggleSoundEnabled = () => dispatch(toggleSound());
  const setMusicVolume = (value: number) => dispatch(updateMusicVolume(value));
  const setSfxVolume = (value: number) => dispatch(updateSfxVolume(value));
  const resetSettings = () => dispatch(resetToDefaults());

  const value: SettingsContextType = {
    ...settings,
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
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook for using the settings context
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};