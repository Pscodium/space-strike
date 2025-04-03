import { Vector3 } from '../store/gameSlice';

// Define bounded area for the game
const GAME_BOUNDS = {
  x: { min: -15, max: 15 },
  y: { min: -20, max: 20 },
  z: { min: -5, max: 5 }
};

/**
 * Apply physics to update object position based on velocity
 */
export const updatePosition = (
  position: Vector3,
  velocity: Vector3,
  deltaTime: number
): Vector3 => {
  return {
    x: position.x + velocity.x * deltaTime,
    y: position.y + velocity.y * deltaTime,
    z: position.z + velocity.z * deltaTime
  };
};

/**
 * Apply drag to gradually slow down objects
 */
export const applyDrag = (
  velocity: Vector3,
  dragFactor: number = 0.95
): Vector3 => {
  return {
    x: velocity.x * dragFactor,
    y: velocity.y * dragFactor,
    z: velocity.z * dragFactor
  };
};

/**
 * Ensure objects stay within the game boundaries
 */
export const enforceWorldBounds = (position: Vector3): Vector3 => {
  return {
    x: Math.max(GAME_BOUNDS.x.min, Math.min(GAME_BOUNDS.x.max, position.x)),
    y: Math.max(GAME_BOUNDS.y.min, Math.min(GAME_BOUNDS.y.max, position.y)),
    z: Math.max(GAME_BOUNDS.z.min, Math.min(GAME_BOUNDS.z.max, position.z))
  };
};

/**
 * Check if object is out of bounds and should be removed
 */
export const isOutOfBounds = (position: Vector3, margin: number = 5): boolean => {
  return (
    position.x < GAME_BOUNDS.x.min - margin ||
    position.x > GAME_BOUNDS.x.max + margin ||
    position.y < GAME_BOUNDS.y.min - margin ||
    position.y > GAME_BOUNDS.y.max + margin ||
    position.z < GAME_BOUNDS.z.min - margin ||
    position.z > GAME_BOUNDS.z.max + margin
  );
};

/**
 * Calculate velocity based on thrust and direction
 */
export const calculateVelocity = (
  direction: Vector3,
  thrust: number
): Vector3 => {
  // Normalize the direction vector
  const length = Math.sqrt(
    direction.x * direction.x + 
    direction.y * direction.y + 
    direction.z * direction.z
  );
  
  if (length === 0) return { x: 0, y: 0, z: 0 };
  
  const normalized = {
    x: direction.x / length,
    y: direction.y / length,
    z: direction.z / length
  };
  
  return {
    x: normalized.x * thrust,
    y: normalized.y * thrust,
    z: normalized.z * thrust
  };
};

/**
 * Physics utility to check if an object is moving too slow and can be considered stopped
 */
export const isStopped = (velocity: Vector3, threshold: number = 0.01): boolean => {
  const speedSquared = 
    velocity.x * velocity.x + 
    velocity.y * velocity.y + 
    velocity.z * velocity.z;
  
  return speedSquared < threshold * threshold;
};

/**
 * Calculate a position with a random offset, useful for spawning entities
 */
export const randomizePosition = (
  basePosition: Vector3,
  range: Vector3
): Vector3 => {
  return {
    x: basePosition.x + (Math.random() * 2 - 1) * range.x,
    y: basePosition.y + (Math.random() * 2 - 1) * range.y,
    z: basePosition.z + (Math.random() * 2 - 1) * range.z
  };
};