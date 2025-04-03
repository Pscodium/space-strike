import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGame } from '../context/GameContext';

interface UseThreeJSProps {
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook for setting up and managing the Three.js scene
 */
const useThreeJS = ({ containerRef }: UseThreeJSProps) => {
  // Access game context
  const { 
    scene: sceneRef, 
    renderer: rendererRef, 
    camera: cameraRef,
    player,
    enemies,
    projectiles,
  } = useGame();
  
  // References to Three.js objects
  const shipRef = useRef<THREE.Mesh | null>(null);
  const projectileMeshes = useRef<Map<string, THREE.Mesh>>(new Map());
  const enemyMeshes = useRef<Map<string, THREE.Mesh>>(new Map());

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000020); // Dark blue background
    sceneRef.current = scene;
    
    // Create camera
    const aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
    camera.position.set(0, -10, 15); // Position camera behind and above the player
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Create renderer with performance optimizations
    const renderer = new THREE.WebGLRenderer({
        antialias: false, // Disable antialiasing for better performance
        powerPreference: 'high-performance',
        precision: 'mediump' // Use medium precision for shaders
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    
    // Set pixel ratio to 1 for better performance
    renderer.setPixelRatio(1);
    
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
  
    
    console.log("Three.js scene initialized:", { 
      sceneExists: !!scene, 
      cameraExists: !!camera, 
      rendererExists: !!renderer,
      containerWidth: containerRef.current.clientWidth,
      containerHeight: containerRef.current.clientHeight
    });
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);
    
    // Add player ship
    createPlayerShip();
    
    // Add grid for reference
    const gridHelper = new THREE.GridHelper(50, 10, 0x444444, 0x222222);
    gridHelper.rotation.x = Math.PI / 2; // Rotate to be in the XY plane
    scene.add(gridHelper);
    
    // Primeira renderização logo após inicialização
    renderer.render(scene, camera);
    
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
      
      // Dispose of all geometries and materials
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          } else if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          }
        }
      });
    };
  }, []);
  
  // Create player ship
  const createPlayerShip = () => {
    if (!sceneRef.current) return;
    
    // Create ship body (a simple cube for now) - reduced geometry
    const geometry = new THREE.BoxGeometry(1, 2, 0.5);
    const material = new THREE.MeshBasicMaterial({ color: 0x44aaff });
    const ship = new THREE.Mesh(geometry, material);
    
    // Add wings - simpler geometry
    const wingGeometry = new THREE.BoxGeometry(3, 1, 0.2);
    const wingMaterial = new THREE.MeshBasicMaterial({ color: 0x2288cc });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.y = -0.5;
    ship.add(wings);
    
    // Add a cockpit
    const cockpitGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const cockpitMaterial = new THREE.MeshBasicMaterial({ color: 0x88ccff });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.y = 0.5;
    cockpit.position.z = 0.2;
    ship.add(cockpit);
    
    // Position ship at player's position
    ship.position.set(
      player.position.x,
      player.position.y,
      player.position.z
    );
    
    // Add to scene
    sceneRef.current.add(ship);
    shipRef.current = ship;
  };
  
  // Create a projectile mesh
  const createProjectileMesh = (id: string, position: THREE.Vector3) => {
    if (!sceneRef.current) return;
    
    // Simple sphere for projectile
    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.copy(position);
    
    sceneRef.current.add(mesh);
    projectileMeshes.current.set(id, mesh);
  };
  
  // Create an enemy mesh
  const createEnemyMesh = (id: string, position: THREE.Vector3, type: string) => {
    if (!sceneRef.current) return;
    
    let geometry, material;
    
    // Different enemy types
    switch (type) {
      case 'fighter':
        geometry = new THREE.ConeGeometry(0.5, 1.5, 4);
        material = new THREE.MeshPhongMaterial({ color: 0xff2222 });
        break;
      case 'bomber':
        geometry = new THREE.SphereGeometry(0.8, 8, 8);
        material = new THREE.MeshPhongMaterial({ color: 0xff8800 });
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
        material = new THREE.MeshPhongMaterial({ color: 0xaa2222 });
    }
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    
    sceneRef.current.add(mesh);
    enemyMeshes.current.set(id, mesh);
  };
  
  // Update function to sync Three.js objects with game state
  const updateObjects = () => {
    // Update player ship
    if (shipRef.current) {
      shipRef.current.position.set(
        player.position.x,
        player.position.y,
        player.position.z
      );
      shipRef.current.rotation.set(
        player.rotation.x,
        player.rotation.y,
        player.rotation.z
      );
    }
    
    // Update projectiles
    // Remove projectiles that no longer exist in game state
    projectileMeshes.current.forEach((mesh, id) => {
      if (!projectiles.some(p => p.id === id)) {
        if (sceneRef.current) {
          sceneRef.current.remove(mesh);
          mesh.geometry.dispose();
          if (mesh.material instanceof THREE.Material) {
            mesh.material.dispose();
          }
        }
        projectileMeshes.current.delete(id);
      }
    });
    
    // Add new projectiles or update existing ones
    projectiles.forEach(projectile => {
      if (!projectileMeshes.current.has(projectile.id)) {
        createProjectileMesh(
          projectile.id, 
          new THREE.Vector3(
            projectile.position.x, 
            projectile.position.y, 
            projectile.position.z
          )
        );
      } else {
        const mesh = projectileMeshes.current.get(projectile.id);
        if (mesh) {
          mesh.position.set(
            projectile.position.x,
            projectile.position.y,
            projectile.position.z
          );
        }
      }
    });
    
    // Update enemies with same pattern as projectiles
    enemyMeshes.current.forEach((mesh, id) => {
      if (!enemies.some(e => e.id === id)) {
        if (sceneRef.current) {
          sceneRef.current.remove(mesh);
          mesh.geometry.dispose();
          if (mesh.material instanceof THREE.Material) {
            mesh.material.dispose();
          }
        }
        enemyMeshes.current.delete(id);
      }
    });
    
    enemies.forEach(enemy => {
      if (!enemyMeshes.current.has(enemy.id)) {
        createEnemyMesh(
          enemy.id, 
          new THREE.Vector3(
            enemy.position.x, 
            enemy.position.y, 
            enemy.position.z
          ),
          enemy.type
        );
      } else {
        const mesh = enemyMeshes.current.get(enemy.id);
        if (mesh) {
          mesh.position.set(
            enemy.position.x,
            enemy.position.y,
            enemy.position.z
          );
        }
      }
    });
  };
  
  // Render function
  const render = () => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
    
    // Update objects in scene based on game state
    updateObjects();
    
    // Render the scene
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };
  
  return {
    render
  };
};

export default useThreeJS;