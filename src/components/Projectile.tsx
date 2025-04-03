import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Projectile as ProjectileType } from '../store/gameSlice';

interface ProjectileProps {
  scene: THREE.Scene;
  projectile: ProjectileType;
}

const Projectile: React.FC<ProjectileProps> = ({ scene, projectile }) => {
  const meshRef = useRef<THREE.Mesh | null>(null);

  // Create the projectile mesh
  useEffect(() => {
    if (meshRef.current) {
      return; // Already created
    }

    // Determine projectile appearance based on owner
    let geometry, material;

    if (projectile.owner === 'player') {
      // Player projectiles are blue energy balls
      geometry = new THREE.SphereGeometry(0.2, 8, 8);
      material = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.8,
      });
    } else {
      // Enemy projectiles are red/orange energy balls
      geometry = new THREE.SphereGeometry(0.2, 8, 8);
      material = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.8,
      });
    }

    // Create the mesh
    const mesh = new THREE.Mesh(geometry, material);
    
    // Position the projectile
    mesh.position.set(
      projectile.position.x,
      projectile.position.y,
      projectile.position.z
    );
    
    // Add to scene
    scene.add(mesh);
    meshRef.current = mesh;

    // Add a point light to make it glow
    const light = new THREE.PointLight(
      projectile.owner === 'player' ? 0x00ffff : 0xff6600,
      0.5,
      2
    );
    mesh.add(light);

    // Cleanup function
    return () => {
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
      meshRef.current = null;
    };
  }, [scene, projectile.owner]);

  // Update projectile position
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.position.set(
        projectile.position.x,
        projectile.position.y,
        projectile.position.z
      );
    }
  }, [
    projectile.position.x,
    projectile.position.y,
    projectile.position.z,
  ]);

  return null; // This component doesn't render any HTML
};

export default Projectile;