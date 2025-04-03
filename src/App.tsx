import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import { SettingsProvider } from './context/SettingsContext';
import { GameProvider } from './context/GameContext';

const App: React.FC = () => {
  return (
    <Router>
      <SettingsProvider>
        <GameProvider>
          <AppRoutes />
        </GameProvider>
      </SettingsProvider>
    </Router>
  );
};

export default App;