/* eslint-disable react-hooks/exhaustive-deps */
import React, { createContext, useCallback, useContext, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import * as THREE from 'three';
import {
  startGame,
  pauseGame,
  resumeGame,
  endGame,
  updatePlayer,
  addProjectile,
  removeProjectile,
  updateProjectiles,
  addEnemy,
  removeEnemy,
  updateEnemies,
  incrementScore,
  nextLevel,
  Player,
  Enemy,
  Projectile,
} from '../store/gameSlice';
import { useSettings } from './SettingsContext';
import { v4 as uuidv4 } from 'uuid';

// Game context interface
interface GameContextType {
  isRunning: boolean;
  isPaused: boolean;
  level: number;
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  score: number;
  highScore: number;
  gameOver: boolean;
  scene: React.MutableRefObject<THREE.Scene | null>;
  renderer: React.MutableRefObject<THREE.WebGLRenderer | null>;
  camera: React.MutableRefObject<THREE.PerspectiveCamera | null>;
  start: () => void;
  pause: () => void;
  resume: () => void;
  end: () => void;
  fireProjectile: () => void;
  movePlayer: (direction: { x?: number; y?: number; z?: number }) => void;
  rotatePlayer: (rotation: { x?: number; y?: number; z?: number }) => void;
  updateGameState: (deltaTime: number) => void;
}

// Create context
const GameContext = createContext<GameContextType | undefined>(undefined);

// Provider component
export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const gameState = useSelector((state: RootState) => state.game);
  const { shipSpeed, shipTorque, fireSpeed, fireStrength, fireRate } = useSettings();
  
  // Three.js refs
  const scene = useRef<THREE.Scene | null>(null);
  const renderer = useRef<THREE.WebGLRenderer | null>(null);
  const camera = useRef<THREE.PerspectiveCamera | null>(null);

  // Game actions
  const start = useCallback(() => dispatch(startGame()), [dispatch]);
  const pause = useCallback(() => dispatch(pauseGame()), [dispatch]);
  const resume = useCallback(() => dispatch(resumeGame()), [dispatch]);
  const end = useCallback(() => dispatch(endGame()), [dispatch]);

  // Player actions
  const movePlayer = useCallback((direction: { x?: number; y?: number; z?: number }) => {
    const { x = 0, y = 0, z = 0 } = direction;
    
    const newVelocity = {
      x: x * shipSpeed,
      y: y * shipSpeed,
      z: z * shipSpeed,
    };
    
    dispatch(updatePlayer({
      velocity: newVelocity
    }));
  }, [dispatch, shipSpeed]);

  const rotatePlayer = useCallback((rotation: { x?: number; y?: number; z?: number }) => {
    const { x = 0, y = 0, z = 0 } = rotation;
    dispatch(updatePlayer({
      rotation: {
        x: gameState.player.rotation.x + x * shipTorque,
        y: gameState.player.rotation.y + y * shipTorque,
        z: gameState.player.rotation.z + z * shipTorque,
      }
    }));
  }, [dispatch, gameState.player.rotation, shipTorque]);

  // Fire projectile
  const fireProjectile = useCallback(() => {
    // Calculate projectile direction based on player rotation
    console.log("Firing projectile from position:", gameState.player.position, fireRate);
    
    const direction = new THREE.Vector3(0, 1, 0);
    const playerRotation = new THREE.Euler(
      gameState.player.rotation.x,
      gameState.player.rotation.y,
      gameState.player.rotation.z,
      'XYZ'
    );
    direction.applyEuler(playerRotation);
    
    const projectile: Projectile = {
      id: uuidv4(),
      position: { ...gameState.player.position },
      rotation: { ...gameState.player.rotation },
      velocity: {
        x: direction.x * fireSpeed,
        y: direction.y * fireSpeed,
        z: direction.z * fireSpeed,
      },
      rate: fireRate,
      active: true,
      owner: 'player',
      damage: fireStrength,
      lifetime: 2000, // 2 seconds lifetime
    };
    
    dispatch(addProjectile(projectile));
  }, [dispatch, fireSpeed, fireRate, fireStrength, gameState.player.position, gameState.player.rotation]);

  // Game loop update function
  const updateGameState = useCallback((deltaTime: number) => {
    if (!gameState.isRunning || gameState.isPaused) return;
    
    // Update player position based on velocity
    const updatedPlayer = { 
      ...gameState.player,
      position: {
        x: gameState.player.position.x + gameState.player.velocity.x * deltaTime,
        y: gameState.player.position.y + gameState.player.velocity.y * deltaTime,
        z: gameState.player.position.z + gameState.player.velocity.z * deltaTime
      },
      velocity: {
        x: gameState.player.velocity.x * 0.95,
        y: gameState.player.velocity.y * 0.95,
        z: gameState.player.velocity.z * 0.95
      }
    };
    
    dispatch(updatePlayer(updatedPlayer));
    
    // Update projectiles
    const updatedProjectiles = gameState.projectiles.map(projectile => {
      return {
        ...projectile,
        position: {
          x: projectile.position.x + projectile.velocity.x * deltaTime,
          y: projectile.position.y + projectile.velocity.y * deltaTime,
          z: projectile.position.z + projectile.velocity.z * deltaTime
        },
        lifetime: projectile.lifetime - deltaTime * 1000
      };
    }).filter(p => p.lifetime > 0 && p.active); // Remove expired projectiles
    
    dispatch(updateProjectiles(updatedProjectiles));
    
    // Update enemies (simplified for now)
    // In a real game, we would have more complex enemy AI and movement patterns
    const updatedEnemies = gameState.enemies.map(enemy => {
      return {
        ...enemy,
        position: {
          x: enemy.position.x,
          y: enemy.position.y - 0.5 * deltaTime,
          z: enemy.position.z
        }
      };
    }).filter(e => e.position.y > -10 && e.active); // Remove enemies that are too far below
    
    dispatch(updateEnemies(updatedEnemies));
    
    // Check for collisions between projectiles and enemies
    // This is a simple version, in a real game we would use a physics engine
    checkCollisions();
  }, [
    gameState.isRunning, 
    gameState.isPaused, 
    gameState.player, 
    gameState.projectiles, 
    gameState.enemies, 
    dispatch
  ]);
  
  // Collision detection
  const checkCollisions = useCallback(() => {
    const { projectiles, enemies } = gameState;
    
    for (const projectile of projectiles) {
      if (!projectile.active || projectile.owner !== 'player') continue;
      
      for (const enemy of enemies) {
        if (!enemy.active) continue;
        
        // Simple distance-based collision detection
        const distance = Math.sqrt(
          Math.pow(projectile.position.x - enemy.position.x, 2) +
          Math.pow(projectile.position.y - enemy.position.y, 2) +
          Math.pow(projectile.position.z - enemy.position.z, 2)
        );
        
        // If distance is less than the sum of their radii, there's a collision
        // Assuming both are spheres with radius 1
        if (distance < 2) {
          // Mark projectile as inactive
          dispatch(removeProjectile(projectile.id));
          
          // Reduce enemy health
          const updatedEnemy = { ...enemy, health: enemy.health - projectile.damage };
          
          if (updatedEnemy.health <= 0) {
            // Enemy destroyed
            dispatch(removeEnemy(enemy.id));
            dispatch(incrementScore(enemy.points));
          } else {
            // Enemy damaged
            dispatch(updateEnemies([...enemies.filter(e => e.id !== enemy.id), updatedEnemy]));
          }
          
          break; // Projectile can only hit one enemy
        }
      }
    }
  }, [gameState, dispatch]);

  const checkPlayerCollisionOnEnemy = useCallback(() => {

  })

  // Context value
  const value: GameContextType = {
    ...gameState,
    scene,
    renderer,
    camera,
    start,
    pause,
    resume,
    end,
    fireProjectile,
    movePlayer,
    rotatePlayer,
    updateGameState,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

// Custom hook for using the game context
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};