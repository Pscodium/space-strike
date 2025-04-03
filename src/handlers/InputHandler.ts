/* eslint-disable prefer-const */
import { Vector3 } from '../store/gameSlice';

/**
 * Process keyboard inputs and convert them to movement directions
 */
export const processMovementKeys = (keys: Record<string, boolean>): Vector3 => {
    let x = 0;
    let y = 0;
    let z = 0;
    
    console.log("Processing movement keys:", keys);
    
    // Forward/backward (Y axis in our coordinate system)
    if (keys['w']) y += 1;
    if (keys['s']) y -= 1;
    
    // Left/right (X axis)
    if (keys['a']) x -= 1;
    if (keys['d']) x += 1;
  
  // Here you could add additional controls for Z axis if needed
  // e.g., if (keys['q']) z -= 1; if (keys['e']) z += 1;
  
  // Normalize for diagonal movement to avoid speed boost
  if (x !== 0 && y !== 0) {
    const length = Math.sqrt(x * x + y * y);
    x /= length;
    y /= length;
  }
  
  return { x, y, z };
};

/**
 * Process keyboard inputs for rotation
 */
export const processRotationKeys = (keys: Record<string, boolean>): Vector3 => {
  let x = 0;
  let y = 0;
  let z = 0;
  
  // Roll (Z rotation)
  if (keys['q']) z += 1;
  if (keys['e']) z -= 1;
  
  // Additional rotation controls could be added here
  // e.g., arrow keys for pitch and yaw
  
  return { x, y, z };
};

/**
 * Check if the fire button is pressed
 */
export const isFirePressed = (keys: Record<string, boolean>): boolean => {
    return keys[' ']; // Spacebar
};

/**
 * Check if the pause button is pressed
 */
export const isPausePressed = (keys: Record<string, boolean>): boolean => {
  return keys['Escape'];
};

/**
 * Handle touch inputs for mobile devices
 */
export const processTouchInput = (
  touchX: number,
  touchY: number,
  screenWidth: number,
  screenHeight: number
): Vector3 => {
  // Convert touch position to normalized direction
  // Center of screen is (0,0), edges are (-1,-1) to (1,1)
  const x = (touchX / screenWidth) * 2 - 1;
  const y = (touchY / screenHeight) * 2 - 1;
  
  return { x, y, z: 0 };
};