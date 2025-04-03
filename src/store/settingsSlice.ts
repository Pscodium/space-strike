/* eslint-disable @typescript-eslint/no-unused-vars */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SettingsState {
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
}

const initialState: SettingsState = {
  shipSpeed: 5,
  shipTorque: 0.05,
  fireSpeed: 10,
  fireRate: 1.5,
  fireStrength: 1,
  horizontalSpeed: 3,
  difficulty: 'medium',
  soundEnabled: true,
  musicVolume: 0.7,
  sfxVolume: 0.8,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateShipSpeed: (state, action: PayloadAction<number>) => {
      state.shipSpeed = action.payload;
    },
    updateShipTorque: (state, action: PayloadAction<number>) => {
      state.shipTorque = action.payload;
    },
    updateFireSpeed: (state, action: PayloadAction<number>) => {
      state.fireSpeed = action.payload;
    },
    updateFireRate: (state, action: PayloadAction<number>) => {
        state.fireRate = action.payload;
    },
    updateFireStrength: (state, action: PayloadAction<number>) => {
      state.fireStrength = action.payload;
    },
    updateHorizontalSpeed: (state, action: PayloadAction<number>) => {
      state.horizontalSpeed = action.payload;
    },
    updateDifficulty: (state, action: PayloadAction<'easy' | 'medium' | 'hard'>) => {
      state.difficulty = action.payload;
    },
    toggleSound: (state) => {
      state.soundEnabled = !state.soundEnabled;
    },
    updateMusicVolume: (state, action: PayloadAction<number>) => {
      state.musicVolume = action.payload;
    },
    updateSfxVolume: (state, action: PayloadAction<number>) => {
      state.sfxVolume = action.payload;
    },
    resetToDefaults: (state) => {
      return initialState;
    },
  },
});

export const {
  updateShipSpeed,
  updateShipTorque,
  updateFireSpeed,
  updateFireRate,
  updateFireStrength,
  updateHorizontalSpeed,
  updateDifficulty,
  toggleSound,
  updateMusicVolume,
  updateSfxVolume,
  resetToDefaults,
} = settingsSlice.actions;

export default settingsSlice.reducer;