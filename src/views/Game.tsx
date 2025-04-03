import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import * as THREE from 'three';
import { useSettings } from '@/context/SettingsContext';
import { endGame as reduxEndGame, incrementScore } from '@/store/gameSlice';
import { updateHighScore, incrementGamesPlayed } from '@/utils/gameStorage';
import GameController from '@/controllers/gameController';

const Game: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Get settings from context
    const {
        shipSpeed,
        shipTorque,
        fireSpeed,
        fireStrength,
        horizontalSpeed,
        fireRate = 0.2,
        difficulty,
    } = useSettings();

    // Game state
    const [score, setScore] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [playerHealth, setPlayerHealth] = useState(100);
    const [playerLives, setPlayerLives] = useState(3);
    const [gameOver, setGameOver] = useState(false);

    // Refs for animation
    const requestRef = useRef<number>();
    const previousTimeRef = useRef<number>();

    // Refs for Three.js
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const gameControllerRef = useRef<GameController | null>(null);

    // Player state
    const playerRef = useRef({
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        shipControl: null as any,
        lastFireTime: 0,
        isInvincible: false,
    });

    // Game objects
    const projectilesRef = useRef<any[]>([]);
    const enemiesRef = useRef<any[]>([]);
    const effectsRef = useRef<any[]>([]);

    // Key states
    const keysRef = useRef({
        w: false,
        a: false,
        s: false,
        d: false,
        ' ': false,
        q: false,
        e: false,
    });

    // Track if game has been started
    const hasGameStarted = useRef(false);

    // Initialize Three.js
    useEffect(() => {
        if (!containerRef.current) return;

        // Create scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000020);
        sceneRef.current = scene;

        // Create camera
        const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
        const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        camera.position.set(0, -10, 15);
        camera.lookAt(0, 0, 0);
        cameraRef.current = camera;

        // Create renderer
        const renderer = new THREE.WebGLRenderer({
            antialias: false,
            powerPreference: 'high-performance',
            precision: 'mediump',
        });
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        renderer.setPixelRatio(1);
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // Create game controller
        const gameController = new GameController(scene);
        gameControllerRef.current = gameController;

        // Setup basic scene (lights and grid)
        const sceneSetup = gameController.setupBasicScene();

        // Create player ship
        const playerShip = gameController.createPlayerShip(
            new THREE.Vector3(0, 0, 0),
            new THREE.Euler(0, 0, 0),
            false // Set to true for debugging hitboxes
        );
        playerRef.current.shipControl = playerShip;

        // Initial render
        renderer.render(scene, camera);

        // Start the game
        startGame();

        // Increment games played only once
        if (!hasGameStarted.current) {
            incrementGamesPlayed();
            hasGameStarted.current = true;
        }

        // Handle window resize
        const handleResize = () => {
            if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;

            const width = containerRef.current.clientWidth;
            const height = containerRef.current.clientHeight;

            cameraRef.current.aspect = width / height;
            cameraRef.current.updateProjectionMatrix();

            rendererRef.current.setSize(width, height);
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (containerRef.current && rendererRef.current) {
                containerRef.current.removeChild(rendererRef.current.domElement);
            }
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }

            // Dispose of player ship
            if (playerRef.current.shipControl) {
                playerRef.current.shipControl.dispose();
            }

            // Dispose of projectiles
            projectilesRef.current.forEach(p => p.dispose());
            
            // Dispose of enemies
            enemiesRef.current.forEach(e => e.dispose());
            
            // Dispose of effects
            effectsRef.current.forEach(e => e.disposeAll && e.disposeAll());
            
            // Dispose of scene setup
            sceneSetup.dispose();
        };
    }, []);

    // Set up keyboard controls
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key in keysRef.current) {
                keysRef.current[key as keyof typeof keysRef.current] = true;

                if (['w', 'a', 's', 'd', ' '].includes(key)) {
                    e.preventDefault();
                }
            }

            // Rotation controls
            if (key === 'q') rotatePlayer(1);
            if (key === 'e') rotatePlayer(-1);

            // Pause game on Escape
            if (key === 'escape') {
                setIsPaused((prev) => !prev);
                e.preventDefault();
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            const key = e.key.toLowerCase();
            if (key in keysRef.current) {
                keysRef.current[key as keyof typeof keysRef.current] = false;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Add rotation functionality
    const rotatePlayer = (direction: number) => {
        playerRef.current.rotation.z += direction * shipTorque;
    };

    // Fire projectile
    const fireProjectile = () => {
        if (!gameControllerRef.current || !playerRef.current.shipControl) return;

        const direction = new THREE.Vector3(0, 1, 0);
        direction.applyEuler(playerRef.current.rotation);

        const projectile = gameControllerRef.current.createProjectile(
            playerRef.current.position.clone(),
            direction,
            fireSpeed,
            fireStrength
        );

        projectilesRef.current.push(projectile);
    };

    // Spawn enemy
    const spawnEnemy = () => {
        if (!gameControllerRef.current) return;

        // Adjust enemy properties based on difficulty
        let enemyHealth = 10;
        let enemySpeed = 2;
        let enemyPoints = 100;

        switch (difficulty) {
            case 'easy':
                enemyHealth = 5;
                enemySpeed = 1.5;
                enemyPoints = 50;
                break;
            case 'medium':
                enemyHealth = 10;
                enemySpeed = 2;
                enemyPoints = 100;
                break;
            case 'hard':
                enemyHealth = 15;
                enemySpeed = 3;
                enemyPoints = 150;
                break;
        }

        // Position randomly at top of screen
        const randomX = Math.random() * 20 - 10; // -10 to 10
        const position = new THREE.Vector3(randomX, 20, 0);
        const velocity = new THREE.Vector3(0, -enemySpeed, 0);

        const enemy = gameControllerRef.current.createEnemy(
            position,
            velocity,
            enemyHealth,
            enemyPoints,
            false // set to true for debugging hitboxes
        );

        enemiesRef.current.push(enemy);
    };

    // Player damage function
    const damagePlayer = (amount: number) => {
        // Skip if player is invincible or game is over
        if (playerRef.current.isInvincible || gameOver) {
            return;
        }
    
        // Calculate new health
        setPlayerHealth((prevHealth) => {
            const newHealth = Math.max(0, prevHealth - amount);
            
            // If health reaches zero, reduce lives
            if (newHealth === 0) {
                setPlayerLives((prevLives) => {
                    const newLives = prevLives - 1;
    
                    if (newLives <= 0) {
                        setTimeout(endGame, 50);
                    } else {
                        // Restore health after losing a life
                        setTimeout(() => {
                            setPlayerHealth(100);
                        }, 500);
                    }
    
                    return newLives;
                });
            }
    
            return newHealth;
        });

        // Set invincibility for a short time
        playerRef.current.isInvincible = true;
        setTimeout(() => {
            playerRef.current.isInvincible = false;
        }, 1000);

        // Visual feedback for damage
        if (playerRef.current.shipControl) {
            const shipControl = playerRef.current.shipControl;
            const originalMaterial = shipControl.mesh.material.clone();
            shipControl.setMaterial(new THREE.MeshBasicMaterial({ color: 0xff0000 }));

            // Blinking effect
            let visible = false;
            const blinkInterval = setInterval(() => {
                if (playerRef.current.shipControl && playerRef.current.isInvincible) {
                    shipControl.setVisible(visible);
                    visible = !visible;
                } else {
                    clearInterval(blinkInterval);
                    if (playerRef.current.shipControl) {
                        shipControl.setVisible(true);
                        shipControl.setMaterial(originalMaterial);
                    }
                }
            }, 200);
        }
    };

    // End game function
    const endGame = () => {
        setGameOver(true);
        setIsPaused(true);
        setPlayerLives(0);

        // Make sure player is visible
        if (playerRef.current.shipControl) {
            playerRef.current.shipControl.setVisible(true);
        }

        // Update Redux and localStorage
        dispatch(reduxEndGame());
        updateHighScore(score);
    };

    // Start game loop
    const startGame = () => {
        // Determine spawn interval based on difficulty
        let spawnInterval = 2000; // Default: 2 seconds (medium)

        switch (difficulty) {
            case 'easy':
                spawnInterval = 3000; // 3 seconds
                break;
            case 'medium':
                spawnInterval = 2000; // 2 seconds
                break;
            case 'hard':
                spawnInterval = 1000; // 1 second
                break;
        }

        // Set up enemy spawning
        const enemySpawnTimer = setInterval(() => {
            if (!isPaused && !gameOver) {
                spawnEnemy();
            }
        }, spawnInterval);

        // Start animation loop
        const animate = (time: number) => {
            if (previousTimeRef.current === undefined) {
                previousTimeRef.current = time;
            }

            const deltaTime = Math.min((time - previousTimeRef.current) / 1000, 0.1);
            previousTimeRef.current = time;

            if (!isPaused) {
                updateGame(deltaTime);
                renderScene();
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
            clearInterval(enemySpawnTimer);
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    };

    // Update game state
    const updateGame = (deltaTime: number) => {
        // Process player input
        const keys = keysRef.current;

        // Movement
        let moveX = 0;
        let moveY = 0;

        if (keys.w) moveY += 1;
        if (keys.s) moveY -= 1;
        if (keys.a) moveX -= 1;
        if (keys.d) moveX += 1;

        // Normalize diagonal movement
        if (moveX !== 0 && moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= length;
            moveY /= length;
        }

        // Apply movement to velocity
        playerRef.current.velocity.x = moveX * horizontalSpeed;
        playerRef.current.velocity.y = moveY * shipSpeed;

        // Apply velocity to position
        playerRef.current.position.x += playerRef.current.velocity.x * deltaTime;
        playerRef.current.position.y += playerRef.current.velocity.y * deltaTime;

        // Apply friction
        playerRef.current.velocity.multiplyScalar(0.95);

        // Keep player in bounds
        playerRef.current.position.x = Math.max(-15, Math.min(15, playerRef.current.position.x));
        playerRef.current.position.y = Math.max(-15, Math.min(15, playerRef.current.position.y));

        // Update player mesh
        if (playerRef.current.shipControl) {
            playerRef.current.shipControl.updatePosition(playerRef.current.position);
            playerRef.current.shipControl.updateRotation(playerRef.current.rotation);
        }

        // Fire weapon
        if (keys[' ']) {
            const now = Date.now();
            if (!playerRef.current.lastFireTime || now - playerRef.current.lastFireTime > fireRate * 100) {
                fireProjectile();
                playerRef.current.lastFireTime = now;
            }
        }

        // Update projectiles
        updateProjectiles(deltaTime);
        
        // Update enemies and check collisions
        updateEnemies(deltaTime);
        
        // Update effects (explosions, particles, etc.)
        updateEffects(deltaTime);
    };
    
    // Update visual effects (explosions, particles)
    const updateEffects = (deltaTime: number) => {
        if (!sceneRef.current) return;
        
        const effects = effectsRef.current;
        
        for (let i = effects.length - 1; i >= 0; i--) {
            const effect = effects[i];
            
            // Update each particle in the effect
            for (let j = effect.particles.length - 1; j >= 0; j--) {
                const particle = effect.particles[j];
                
                // Update position
                if ((particle as any).velocity) {
                    particle.position.add((particle as any).velocity.clone().multiplyScalar(deltaTime));
                }
                
                // Update lifetime
                (particle as any).lifetime -= deltaTime * 1000;
                
                // Update opacity for fade out
                if (particle.material instanceof THREE.Material) {
                    particle.material.opacity = Math.min(1, (particle as any).lifetime / 500);
                }
                
                // Remove expired particles
                if ((particle as any).lifetime <= 0) {
                    sceneRef.current.remove(particle);
                    effect.particles.splice(j, 1);
                    
                    // Dispose geometry and material
                    (particle.geometry as THREE.BufferGeometry).dispose();
                    if (particle.material instanceof THREE.Material) {
                        particle.material.dispose();
                    }
                }
            }
            
            // Remove effect if all particles are gone
            if (effect.particles.length === 0) {
                effects.splice(i, 1);
            }
        }
    };
    
    // Update projectiles
    const updateProjectiles = (deltaTime: number) => {
        const projectiles = projectilesRef.current;
        
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];
            
            // Update position
            projectile.mesh.position.add(
                projectile.velocity.clone().multiplyScalar(deltaTime)
            );
            
            // Update lifetime
            projectile.lifetime -= deltaTime * 1000;
            
            // Remove expired projectiles
            if (
                projectile.lifetime <= 0 || 
                Math.abs(projectile.mesh.position.x) > 20 || 
                Math.abs(projectile.mesh.position.y) > 20
            ) {
                projectile.dispose();
                projectiles.splice(i, 1);
            }
        }
    };
    
    // Update enemies
    const updateEnemies = (deltaTime: number) => {
        if (!gameControllerRef.current) return;
        
        const enemies = enemiesRef.current;
        const projectiles = projectilesRef.current;
        
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];
            
            // Update position
            enemy.mesh.position.add(
                enemy.velocity.clone().multiplyScalar(deltaTime)
            );
            
            // Check if enemy reached bottom of screen
            if (enemy.mesh.position.y < -15) {
                // Apply damage based on difficulty
                let bottomDamage = 20;
                switch (difficulty) {
                    case 'easy': bottomDamage = 10; break;
                    case 'medium': bottomDamage = 20; break;
                    case 'hard': bottomDamage = 30; break;
                }
                
                if (!gameOver) {
                    damagePlayer(bottomDamage);
                }
                
                // Remove enemy
                enemy.dispose();
                enemies.splice(i, 1);
                continue;
            }
            
            // Check collision with player
            if (
                playerRef.current.shipControl && 
                !playerRef.current.isInvincible && 
                !gameOver
            ) {
                const collision = gameControllerRef.current.checkCollision(
                    enemy.mesh,
                    playerRef.current.shipControl.mesh,
                    1.0,  // Enemy radius
                    1.5   // Player radius
                );
                
                if (collision) {
                    // Apply damage based on difficulty
                    let collisionDamage = 30;
                    switch (difficulty) {
                        case 'easy': collisionDamage = 20; break;
                        case 'medium': collisionDamage = 30; break;
                        case 'hard': collisionDamage = 50; break;
                    }
                    
                    damagePlayer(collisionDamage);
                    
                    // Remove enemy
                    enemy.dispose();
                    enemies.splice(i, 1);
                    continue;
                }
            }
            
            // Check collision with projectiles
            for (let j = projectiles.length - 1; j >= 0; j--) {
                const projectile = projectiles[j];
                
                const collision = gameControllerRef.current.checkCollision(
                    projectile.mesh,
                    enemy.mesh,
                    0.2,  // Projectile radius
                    0.8   // Enemy radius
                );
                
                if (collision) {
                    // Apply damage to enemy
                    const destroyed = enemy.takeDamage(projectile.damage);
                    
                    // Remove projectile
                    projectile.dispose();
                    projectiles.splice(j, 1);
                    
                    // If enemy is destroyed
                    if (destroyed) {
                        // Create explosion
                        if (gameControllerRef.current) {
                            const explosion = gameControllerRef.current.createExplosion(
                                enemy.mesh.position.clone()
                            );
                            effectsRef.current.push(explosion);
                        }
                        
                        // Update score
                        setScore((prev) => prev + enemy.points);
                        dispatch(incrementScore(enemy.points));
                        
                        // Remove enemy
                        enemy.dispose();
                        enemies.splice(i, 1);
                        break;
                    }
                }
            }
        }
    };

    // Render scene
    const renderScene = () => {
        if (sceneRef.current && cameraRef.current && rendererRef.current) {
            rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
    };
    
    // Debug function to apply direct damage (for testing)
    const applyDirectDamage = (damage: number) => {
        if (gameOver) return;
        damagePlayer(damage);
    };

    return (
        <div className='w-full h-screen relative bg-black'>
            {/* Three.js container */}
            <div ref={containerRef} className='w-full h-full absolute top-0 left-0' />
            
            {/* HUD overlay */}
            <div className='absolute top-0 left-0 w-full p-4 text-white flex justify-between'>
                <div>
                    <p className='text-xl font-bold'>Score: {score}</p>
                    <p>Level: 1</p>
                    <p>Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}</p>

                    {/* Debug controls - remove in production */}
                    <div className='mt-2 flex space-x-2'>
                        <button className='bg-red-500 px-2 py-1 text-xs rounded' onClick={() => applyDirectDamage(10)}>
                            Take 10 Damage
                        </button>
                    </div>
                </div>
                <div>
                    <div className='flex items-center'>
                        <span className='mr-2'>Health:</span>
                        <div className='w-32 h-4 bg-gray-800 rounded overflow-hidden'>
                            <div className='h-full bg-green-600' style={{ width: `${playerHealth}%` }} />
                        </div>
                        <span className='ml-2'>{playerHealth}</span>
                    </div>
                    <div className='flex items-center mt-1'>
                        <span className='mr-2'>Lives:</span>
                        {Array.from({ length: Math.max(0, playerLives) }).map((_, i) => (
                            <span key={i} className='text-red-500 mx-1'>
                                ❤️
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* Pause Menu */}
            {isPaused && !gameOver && (
                <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-70'>
                    <div className='bg-gray-800 p-8 rounded-lg text-white text-center'>
                        <h2 className='text-2xl font-bold mb-4'>Paused</h2>
                        <button 
                            className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mr-2' 
                            onClick={() => setIsPaused(false)}
                        >
                            Resume
                        </button>
                        <button 
                            className='bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded' 
                            onClick={() => navigate('/')}
                        >
                            Quit
                        </button>
                    </div>
                </div>
            )}

            {/* Game Over Screen */}
            {gameOver && (
                <div className='absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50'>
                    <div className='bg-gray-800 p-8 rounded-lg text-white text-center'>
                        <h2 className='text-3xl font-bold mb-4'>Game Over</h2>
                        <p className='text-xl mb-4'>Final Score: {score}</p>
                        <button 
                            className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mr-2' 
                            onClick={() => navigate('/')}
                        >
                            Main Menu
                        </button>
                        <button 
                            className='bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded' 
                            onClick={() => window.location.reload()}
                        >
                            Play Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Game;