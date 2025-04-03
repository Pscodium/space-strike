import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGame } from '../context/GameContext';
import useThreeJS from '../hooks/useThreeJS';

interface GameCanvasProps {
  width?: string;
  height?: string;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  width = '100%', 
  height = '100%' 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { render } = useThreeJS({ containerRef });
  const { isRunning, isPaused } = useGame();
  
  // Set up a render loop
  useEffect(() => {
    if (!isRunning || isPaused) return;
    
    // Start an animation loop
    const animate = () => {
      if (!isRunning || isPaused) return;
      
      render();
      requestAnimationFrame(animate);
    };
    
    const animationId = requestAnimationFrame(animate);
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isRunning, isPaused, render]);
  
  return (
    <div
      ref={containerRef}
      style={{ width, height }}
      className="bg-black"
    />
  );
};

export default GameCanvas;