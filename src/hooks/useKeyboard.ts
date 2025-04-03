import { useEffect, useState, useRef } from 'react';

// Define a type for the key states
type KeyState = {
  [key: string]: boolean;
};

/**
 * A hook for handling keyboard input in the game
 */
const useKeyboard = () => {
  // States for tracking pressed keys
  const [keys, setKeys] = useState<KeyState>({
    w: false, // Move forward
    a: false, // Move left
    s: false, // Move backward
    d: false, // Move right
    ' ': false, // Spacebar (fire)
    Escape: false, // Pause/Resume
  });
  
  // Keep a ref to ensure event handler closure has access to latest keys
  const keysRef = useRef(keys);
  keysRef.current = keys;

  useEffect(() => {
    // Handle key down events
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keysRef.current || (key === ' ' && ' ' in keysRef.current)) {
        setKeys((prevKeys) => ({
          ...prevKeys,
          [key === ' ' ? ' ' : key]: true,
        }));
        
        // Prevent default browser behavior for game keys
        if (['w', 'a', 's', 'd', ' '].includes(key)) {
          e.preventDefault();
        }
      }
    };

    // Handle key up events
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keysRef.current || (key === ' ' && ' ' in keysRef.current)) {
        setKeys((prevKeys) => ({
          ...prevKeys,
          [key === ' ' ? ' ' : key]: false,
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Clean up event listeners on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []); // Empty dependency array so this only runs once

  // Return the key states
  return keys;
};

export default useKeyboard;