import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
import { useSettings } from '@/context/SettingsContext';
import { endGame as reduxEndGame, incrementScore } from '@/store/gameSlice';
import { updateHighScore, incrementGamesPlayed } from '@/utils/gameStorage';

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
        fireRate = 0.2, // Default fire rate in seconds (200ms)
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

    // Player state
    const playerRef = useRef({
        position: new THREE.Vector3(0, 0, 0),
        rotation: new THREE.Euler(0, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0),
        mesh: null as THREE.Mesh | null,
        lastFireTime: 0,
        isInvincible: false,
    });

    // Game objects
    const projectilesRef = useRef<THREE.Mesh[]>([]);
    const enemiesRef = useRef<THREE.Mesh[]>([]);

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

    // Track if game has been started (for incrementGamesPlayed)
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

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        // Add directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(0, 1, 1);
        scene.add(directionalLight);

        // Create player ship
        createPlayerShip();

        // Add grid
        const gridHelper = new THREE.GridHelper(50, 10, 0x444444, 0x222222);
        gridHelper.rotation.x = Math.PI / 2;
        scene.add(gridHelper);

        // Initial render
        renderer.render(scene, camera);

        // Start the game
        startGame();

        // Increment games played only once when game starts
        if (!hasGameStarted.current) {
            console.log('Incrementing games played count');
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

            // Dispose of geometries and materials
            if (sceneRef.current) {
                sceneRef.current.traverse((object) => {
                    if (object instanceof THREE.Mesh) {
                        object.geometry.dispose();
                        if (object.material instanceof THREE.Material) {
                            object.material.dispose();
                        } else if (Array.isArray(object.material)) {
                            object.material.forEach((material) => material.dispose());
                        }
                    }
                });
            }
        };
    }, []);

    // Add cleanup for particles on game end
    useEffect(() => {
        return () => {
            // Limpar todas as partículas quando o componente for desmontado
            if (sceneRef.current && (sceneRef.current as any).particles) {
                const particles = (sceneRef.current as any).particles;
                particles.forEach((particle: THREE.Mesh) => {
                    sceneRef.current?.remove(particle);
                    if (particle.geometry) particle.geometry.dispose();
                    if (particle.material instanceof THREE.Material) {
                        particle.material.dispose();
                    }
                });
                (sceneRef.current as any).particles = [];
            }
        };
    }, []);

    // Monitorar mudanças no playerHealth e playerLives para debug
    useEffect(() => {
        console.log(`Health state changed to: ${playerHealth}`);
    }, [playerHealth]);

    useEffect(() => {
        console.log(`Lives state changed to: ${playerLives}`);
    }, [playerLives]);

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

    // Create player ship
    const createPlayerShip = () => {
        if (!sceneRef.current) return;

        // Create the ship body
        const geometry = new THREE.BoxGeometry(1, 2, 0.5);
        const material = new THREE.MeshBasicMaterial({ color: 0x44aaff });
        const ship = new THREE.Mesh(geometry, material);

        // Add wings
        const wingGeometry = new THREE.BoxGeometry(3, 1, 0.2);
        const wingMaterial = new THREE.MeshBasicMaterial({ color: 0x2288cc });
        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        wings.position.y = -0.5;
        ship.add(wings);

        // Add cockpit
        const cockpitGeometry = new THREE.SphereGeometry(0.4, 8, 8);
        const cockpitMaterial = new THREE.MeshBasicMaterial({ color: 0x88ccff });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.y = 0.5;
        cockpit.position.z = 0.2;
        ship.add(cockpit);

        // Add hitbox visualization (opcionalmente, para debug)
        const hitboxGeometry = new THREE.SphereGeometry(1.5, 8, 8);
        const hitboxMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.2,
            wireframe: true,
        });
        const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        // Comente a linha abaixo depois que terminar o debugging
        // ship.add(hitbox);

        // Position ship
        ship.position.set(0, 0, 0);

        // Add to scene
        sceneRef.current.add(ship);
        playerRef.current.mesh = ship;
    };

    // Add rotation functionality
    const rotatePlayer = (direction: number) => {
        playerRef.current.rotation.z += direction * shipTorque;
    };

    // Fire projectile
    const fireProjectile = () => {
        if (!sceneRef.current || !playerRef.current.mesh) return;

        // Create projectile
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const projectile = new THREE.Mesh(geometry, material);

        // Position projectile at ship's position
        projectile.position.copy(playerRef.current.mesh.position);

        // Set velocity (forward direction)
        const direction = new THREE.Vector3(0, 1, 0);
        direction.applyEuler(playerRef.current.rotation);

        // Add to scene and tracking array
        sceneRef.current.add(projectile);
        projectilesRef.current.push(projectile);

        // Store direction on the projectile object
        (projectile as any).velocity = direction.multiplyScalar(fireSpeed);
        (projectile as any).lifetime = 2000; // 2 seconds
        (projectile as any).damage = fireStrength;
    };

    // Spawn enemy
    const spawnEnemy = () => {
        if (!sceneRef.current) return;

        // Create enemy
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const enemy = new THREE.Mesh(geometry, material);

        // Add hitbox visualization (opcional, para debug)
        const hitboxGeometry = new THREE.SphereGeometry(1.5, 8, 8);
        const hitboxMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.2,
            wireframe: true,
        });
        const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        // Comente a linha abaixo depois que terminar o debugging
        // enemy.add(hitbox);

        // Position randomly at top of screen
        const randomX = Math.random() * 20 - 10; // -10 to 10
        enemy.position.set(randomX, 20, 0);

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

        // Add velocity
        (enemy as any).velocity = new THREE.Vector3(0, -enemySpeed, 0);
        (enemy as any).health = enemyHealth;
        (enemy as any).points = enemyPoints;

        // Add to scene and tracking array
        sceneRef.current.add(enemy);
        enemiesRef.current.push(enemy);
    };

    // Create explosion effect
    const createExplosion = (position: THREE.Vector3) => {
        if (!sceneRef.current) return;

        // Number of particles
        const particleCount = 15;

        // Create particles
        for (let i = 0; i < particleCount; i++) {
            // Create particle
            const size = Math.random() * 0.3 + 0.1;
            const geometry = new THREE.SphereGeometry(size, 4, 4);

            // Randomize color between yellow, orange and red
            const colors = [0xffff00, 0xff8800, 0xff0000];
            const material = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)],
                transparent: true,
                opacity: 0.8,
            });

            const particle = new THREE.Mesh(geometry, material);

            // Position at explosion center
            particle.position.copy(position);

            // Random velocity in all directions
            const speed = Math.random() * 5 + 3;
            const direction = new THREE.Vector3(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();

            (particle as any).velocity = direction.multiplyScalar(speed);
            (particle as any).lifetime = Math.random() * 500 + 500; // 0.5-1 second

            // Add to scene
            sceneRef.current.add(particle);

            // Add to list for updates
            const particles = (sceneRef.current as any).particles || [];
            particles.push(particle);
            (sceneRef.current as any).particles = particles;
        }
    };

    // Player damage function
    const damagePlayer = (amount: number) => {
        // Don't damage if player is invincible or game is over
        if (playerRef.current.isInvincible || gameOver) {
            console.log('Ignoring damage because player is invincible or game over');
            return;
        }

        // Primeiro vamos registrar para debug:
        console.log(`Attempting to apply damage: ${amount} to current health: ${playerHealth}`);

        // Make player temporarily invincible to prevent multiple hits
        playerRef.current.isInvincible = true;

        // Calcula o novo valor de saúde
        let newHealth = Math.max(0, playerHealth - amount);
        console.log(`Calculated new health: ${newHealth}`);

        // Força a atualização visual
        document.body.classList.add('force-refresh'); // Hack para forçar redraw
        setTimeout(() => document.body.classList.remove('force-refresh'), 10);

        // Atualizar a saúde
        setPlayerHealth(newHealth);

        // Verificação para debug
        setTimeout(() => {
            console.log(`Health after update: ${playerHealth}`);
        }, 50);

        // If health reaches 0, handle life loss
        if (newHealth === 0) {
            // Handle life loss
            const newLives = playerLives - 1;
            console.log(`Lost a life. Lives: ${playerLives} -> ${newLives}`);

            // Update lives
            setPlayerLives(newLives);

            // If no more lives, game over
            if (newLives <= 0) {
                console.log('Game over - no lives left');
                setTimeout(endGame, 50);
            } else {
                // Still have lives, restore health after a delay
                setTimeout(() => {
                    console.log('Restoring health to 100');
                    setPlayerHealth(100);
                }, 1000);

                // Maintain invincibility for a while after health restoration
                setTimeout(() => {
                    playerRef.current.isInvincible = false;
                    console.log('Invincibility ended after life loss');
                }, 3000);
            }
        } else {
            // Just took damage, end invincibility after a delay
            setTimeout(() => {
                playerRef.current.isInvincible = false;
                console.log('Invincibility ended after taking damage');
            }, 1000);
        }

        // Apply visual feedback when hit
        if (playerRef.current.mesh) {
            // Flash red
            const originalMaterial = (playerRef.current.mesh.material as THREE.Material).clone();
            playerRef.current.mesh.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

            // Blink effect for invincibility
            let visible = false;
            const blinkInterval = setInterval(() => {
                if (playerRef.current.mesh && playerRef.current.isInvincible) {
                    playerRef.current.mesh.visible = visible;
                    visible = !visible;
                } else {
                    // Stop blinking if invincibility ended
                    clearInterval(blinkInterval);
                    if (playerRef.current.mesh) {
                        playerRef.current.mesh.visible = true;
                    }
                }
            }, 200);

            // Reset to original material
            setTimeout(() => {
                if (playerRef.current.mesh) {
                    playerRef.current.mesh.material = originalMaterial;
                    playerRef.current.mesh.visible = true;
                }
            }, 1000);
        }
    };

    // End game function
    const endGame = () => {
        console.log('Game Over!');
        setGameOver(true);
        setIsPaused(true);
        // Garantir que o jogador tenha exatamente 0 vidas (não negativas)
        setPlayerLives(0);

        // Limpar qualquer intervalo que possa estar rodando
        if (playerRef.current.mesh) {
            playerRef.current.mesh.visible = true;
        }

        // Dispatch de endGame para o Redux (salva o high score)
        dispatch(reduxEndGame());

        // Salvar no localStorage com nossa utility
        updateHighScore(score);
        // Removido incrementGamesPlayed() daqui para evitar múltiplas contagens
    };

    // Tratar colisões com inimigos que atingem a parte inferior
    const handleEnemyReachedBottom = (enemy: THREE.Mesh) => {
        // Damage player when enemy reaches bottom (varies by difficulty)
        let bottomDamage = 20;

        switch (difficulty) {
            case 'easy':
                bottomDamage = 10;
                break;
            case 'medium':
                bottomDamage = 20;
                break;
            case 'hard':
                bottomDamage = 30;
                break;
        }

        // Aplicar o dano apenas se estiver ativo
        if (sceneRef.current && !gameOver) {
            console.log(`Enemy reached bottom! Applying damage: ${bottomDamage}`);
            // Use a new collision handler
            handleCollision(bottomDamage);
        } else {
            console.log('Not applying bottom damage - game over or scene not available');
        }
    };

    // Tratar colisões entre jogador e inimigos
    const handlePlayerEnemyCollision = (enemy: THREE.Mesh) => {
        // Damage player (varies by difficulty)
        let collisionDamage = 30;

        switch (difficulty) {
            case 'easy':
                collisionDamage = 20;
                break;
            case 'medium':
                collisionDamage = 30;
                break;
            case 'hard':
                collisionDamage = 50;
                break;
        }

        // Log de colisão para debug
        console.log(`Collision with enemy! Damage: ${collisionDamage}`);

        // Use the new collision handler
        handleCollision(collisionDamage);
    };

    // For debugging - explicit damage function
    const applyDirectDamage = (damage: number) => {
        console.log('Applying direct damage:', damage);

        // Aplicar dano diretamente
        const newHealth = Math.max(0, playerHealth - damage);
        setPlayerHealth(newHealth);

        // Apply the visual effect for feedback
        if (playerRef.current.mesh) {
            playerRef.current.mesh.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            setTimeout(() => {
                if (playerRef.current.mesh) {
                    playerRef.current.mesh.material = new THREE.MeshBasicMaterial({ color: 0x44aaff });
                }
            }, 200);
        }
    };

    // Alternative method for handling collisions
    const handleCollision = (damage: number) => {
        console.log('Handling collision with damage:', damage);

        // Ensure not already invincible
        if (playerRef.current.isInvincible || gameOver) {
            console.log('Ignoring collision - player invincible or game over');
            return;
        }

        // Make player invincible temporarily
        playerRef.current.isInvincible = true;

        // Apply damage directly
        const newHealth = Math.max(0, playerHealth - damage);
        setPlayerHealth(newHealth);
        console.log(`Health after damage: ${newHealth}`);

        // Handle life loss if needed
        if (newHealth === 0) {
            const newLives = playerLives - 1;
            setPlayerLives(newLives);
            console.log(`Lives reduced to: ${newLives}`);

            if (newLives <= 0) {
                endGame();
            } else {
                setTimeout(() => {
                    setPlayerHealth(100);
                    console.log('Health restored');
                }, 1000);
            }
        }

        // Visual feedback
        if (playerRef.current.mesh) {
            const originalMaterial = playerRef.current.mesh.material;
            playerRef.current.mesh.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            setTimeout(() => {
                if (playerRef.current.mesh) {
                    playerRef.current.mesh.material = originalMaterial;
                }
            }, 500);
        }

        // Reset invincibility
        setTimeout(() => {
            playerRef.current.isInvincible = false;
            console.log('Invincibility ended');
        }, 1500);
    };

    // Start game loop
    const startGame = () => {
        console.log('Starting game with difficulty:', difficulty);

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

        // Remove enemies that might still be in the scene on unmount
        return () => {
            clearInterval(enemySpawnTimer);
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }

            // Limpar inimigos
            if (enemiesRef.current && enemiesRef.current.length > 0) {
                enemiesRef.current.forEach((enemy) => {
                    sceneRef.current?.remove(enemy);
                });
                enemiesRef.current = [];
            }

            // Limpar projéteis
            if (projectilesRef.current && projectilesRef.current.length > 0) {
                projectilesRef.current.forEach((projectile) => {
                    sceneRef.current?.remove(projectile);
                });
                projectilesRef.current = [];
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
        if (playerRef.current.mesh) {
            playerRef.current.mesh.position.copy(playerRef.current.position);
            playerRef.current.mesh.rotation.copy(playerRef.current.rotation);
        }

        // Fire weapon
        if (keys[' ']) {
            // Limit firing rate by checking time since last shot
            const now = Date.now();
            if (!playerRef.current.lastFireTime || now - playerRef.current.lastFireTime > fireRate * 1000) {
                fireProjectile();
                playerRef.current.lastFireTime = now;
            }
        }

        // Update projectiles
        const projectiles = projectilesRef.current;
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const projectile = projectiles[i];

            // Update position
            const velocity = (projectile as any).velocity;
            projectile.position.add(velocity.clone().multiplyScalar(deltaTime));

            // Update lifetime
            (projectile as any).lifetime -= deltaTime * 1000;

            // Remove expired projectiles
            if ((projectile as any).lifetime <= 0 || Math.abs(projectile.position.x) > 20 || Math.abs(projectile.position.y) > 20) {
                sceneRef.current?.remove(projectile);
                projectiles.splice(i, 1);
            }
        }

        // Update enemies
        const enemies = enemiesRef.current;
        for (let i = enemies.length - 1; i >= 0; i--) {
            const enemy = enemies[i];

            // Update position
            const velocity = (enemy as any).velocity;
            if (!velocity) continue; // Garantir que o inimigo tem velocidade definida

            enemy.position.add(velocity.clone().multiplyScalar(deltaTime));

            // Check if enemy reached bottom of screen
            if (enemy.position.y < -15) {
                // Tratar dano quando inimigo atinge parte inferior
                handleEnemyReachedBottom(enemy);

                // Remove enemy
                sceneRef.current?.remove(enemy);
                enemies.splice(i, 1);
                continue;
            }

            // Check collision with player
            if (playerRef.current.mesh && !playerRef.current.isInvincible && !gameOver) {
                const distanceToPlayer = enemy.position.distanceTo(playerRef.current.mesh.position);

                // Ajustando o raio de colisão para ser mais preciso
                // O valor 1.5 é um raio de colisão mais conservador
                // (deve ser ajustado de acordo com o tamanho real dos objetos)
                const collisionRadius = 1.5;

                if (distanceToPlayer < collisionRadius) {
                    // Raio de colisão ajustado
                    // Log de colisão para debug
                    console.log(`Collision detected! Distance: ${distanceToPlayer.toFixed(2)}, Radius: ${collisionRadius}`);

                    // Tratar colisão
                    handlePlayerEnemyCollision(enemy);

                    // Remove enemy
                    sceneRef.current?.remove(enemy);
                    enemies.splice(i, 1);
                    continue;
                }
            }

            // Check collision with projectiles
            for (let j = projectiles.length - 1; j >= 0; j--) {
                const projectile = projectiles[j];

                // Simple distance-based collision
                const distance = projectile.position.distanceTo(enemy.position);
                // Ajustando o raio de colisão para ser mais preciso
                // (0.7 = 0.2 do projétil + 0.5 do inimigo)
                const collisionRadius = 0.7;

                if (distance < collisionRadius) {
                    // Raio de colisão ajustado
                    // Damage enemy
                    (enemy as any).health -= (projectile as any).damage || fireStrength;

                    // Remove projectile
                    sceneRef.current?.remove(projectile);
                    projectiles.splice(j, 1);

                    // Check if enemy destroyed
                    if ((enemy as any).health <= 0) {
                        // Create explosion effect
                        createExplosion(enemy.position.clone());

                        // Remove enemy
                        sceneRef.current?.remove(enemy);
                        enemies.splice(i, 1);

                        // Increment score
                        const enemyPoints = (enemy as any).points;
                        setScore((prev) => prev + enemyPoints);
                        // Também atualizar no Redux
                        dispatch(incrementScore(enemyPoints));
                        break;
                    }
                }
            }
        }

        // Update explosion particles
        if (sceneRef.current && (sceneRef.current as any).particles) {
            const particles = (sceneRef.current as any).particles;

            for (let i = particles.length - 1; i >= 0; i--) {
                const particle = particles[i];
                if (!particle) continue; // Verificar se a partícula existe

                // Update position
                const velocity = (particle as any).velocity;
                if (!velocity) continue; // Verificar se a partícula tem velocidade

                particle.position.add(velocity.clone().multiplyScalar(deltaTime));

                // Update lifetime
                (particle as any).lifetime -= deltaTime * 1000;

                // Update opacity for fade out
                if (particle.material instanceof THREE.Material) {
                    particle.material.opacity = Math.min(1, (particle as any).lifetime / 500);
                }
                // Remove expired particles
                if ((particle as any).lifetime <= 0) {
                    sceneRef.current.remove(particle);
                    particles.splice(i, 1);

                    // Dispose geometry and material
                    (particle.geometry as THREE.BufferGeometry).dispose();
                    if (particle.material instanceof THREE.Material) {
                        particle.material.dispose();
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
                        <button className='bg-red-500 px-2 py-1 text-xs rounded' onClick={() => handleCollision(30)}>
                            Collision 30
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
                        <button className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mr-2' onClick={() => setIsPaused(false)}>
                            Resume
                        </button>
                        <button className='bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded' onClick={() => navigate('/')}>
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
                        <button className='bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded mr-2' onClick={() => navigate('/')}>
                            Main Menu
                        </button>
                        <button className='bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded' onClick={() => window.location.reload()}>
                            Play Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Game;
