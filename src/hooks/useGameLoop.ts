import { useEffect, useRef, useCallback } from 'react';

type GameLoopCallback = (deltaTime: number) => void;

/**
 * A hook for creating a game loop with consistent timing
 * @param callback The function to call on each frame
 * @param isActive Whether the game loop is active
 */
const useGameLoop = (callback: GameLoopCallback, isActive: boolean = true) => {
  // Reference to the animation frame
  const requestRef = useRef<number>();
  
  // Reference to the previous time
  const previousTimeRef = useRef<number>();

  // The animation loop
  const animate = useCallback((time: number) => {
    if (previousTimeRef.current !== undefined) {
      // Calculate delta time in seconds
      const deltaTime = (time - previousTimeRef.current) / 1000;
      
      // Limit delta time to avoid huge jumps if tab was inactive
      const cappedDeltaTime = Math.min(deltaTime, 0.1);
      
      // Call the provided callback with the delta time
      callback(cappedDeltaTime);
    }
    
    // Store current time for next frame
    previousTimeRef.current = time;
    
    // Continue the loop
    requestRef.current = requestAnimationFrame(animate);
  }, [callback]);

  useEffect(() => {
    console.log("Game loop status changed:", { isActive });
    
    // Start the game loop if active
    if (isActive) {
      console.log("Starting game loop");
      requestRef.current = requestAnimationFrame(animate);
    } else {
      // If game loop becomes inactive, clear the previous time reference
      previousTimeRef.current = undefined;
    }
    
    // Clean up
    return () => {
      if (requestRef.current) {
        console.log("Cleaning up game loop");
        cancelAnimationFrame(requestRef.current);
        previousTimeRef.current = undefined;
      }
    };
  }, [isActive, animate]);

  return {
    isActive
  };
};

export default useGameLoop;