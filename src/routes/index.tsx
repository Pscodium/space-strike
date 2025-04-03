import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from '../views/Home';
import Game from '../views/Game';
import Settings from '../views/Settings';

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/game" element={<Game />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
};

export default AppRoutes;