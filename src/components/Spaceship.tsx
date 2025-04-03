import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGame } from '../context/GameContext';

interface SpaceshipProps {
    scene: THREE.Scene;
    position?: { x: number; y: number; z: number };
    rotation?: { x: number; y: number; z: number };
}

const Spaceship: React.FC<SpaceshipProps> = ({ scene, position = { x: 0, y: 0, z: 0 }, rotation = { x: 0, y: 0, z: 0 } }) => {
    const { player } = useGame();
    const shipRef = useRef<THREE.Group | null>(null);

    // Create the spaceship model
    useEffect(() => {
        if (shipRef.current) {
            // Ship already exists, skip creation
            return;
        }

        // Create a group to hold all spaceship parts
        const shipGroup = new THREE.Group();

        // Create the main body of the ship
        const bodyGeometry = new THREE.BoxGeometry(1, 2, 0.5);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x44aaff });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        shipGroup.add(body);

        // Create wings
        const wingGeometry = new THREE.BoxGeometry(3, 1, 0.2);
        const wingMaterial = new THREE.MeshPhongMaterial({ color: 0x2288cc });
        const wings = new THREE.Mesh(wingGeometry, wingMaterial);
        wings.position.y = -0.5;
        shipGroup.add(wings);

        // Create cockpit
        const cockpitGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const cockpitMaterial = new THREE.MeshPhongMaterial({
            color: 0x88ccff,
            transparent: true,
            opacity: 0.8,
        });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.y = 0.5;
        cockpit.position.z = 0.2;
        shipGroup.add(cockpit);

        // Create engine glow
        const engineGlowGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const engineGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xff4400,
            transparent: true,
            opacity: 0.7,
        });
        const engineGlow = new THREE.Mesh(engineGlowGeometry, engineGlowMaterial);
        engineGlow.position.y = -1.2;
        shipGroup.add(engineGlow);

        // Position the ship
        shipGroup.position.set(position.x, position.y, position.z);
        shipGroup.rotation.set(rotation.x, rotation.y, rotation.z);

        // Add to scene
        scene.add(shipGroup);
        shipRef.current = shipGroup;

        // Engine glow animation
        const animateEngineGlow = () => {
            if (engineGlow) {
                engineGlowMaterial.opacity = 0.4 + Math.sin(Date.now() * 0.01) * 0.3;
            }
            requestAnimationFrame(animateEngineGlow);
        };
        animateEngineGlow();

        // Cleanup function
        return () => {
            scene.remove(shipGroup);

            // Dispose of geometries and materials
            [bodyGeometry, wingGeometry, cockpitGeometry, engineGlowGeometry].forEach((geometry) => geometry.dispose());

            [bodyMaterial, wingMaterial, cockpitMaterial, engineGlowMaterial].forEach((material) => material.dispose());

            shipRef.current = null;
        };
    }, [scene, position.x, position.y, position.z, rotation.x, rotation.y, rotation.z]);

    // Update the ship position and rotation based on player state
    useEffect(() => {
        if (shipRef.current) {
            shipRef.current.position.set(player.position.x, player.position.y, player.position.z);
            shipRef.current.rotation.set(player.rotation.x , player.rotation.y, player.rotation.z);
        }
    }, [player.position.x, player.position.y, player.position.z, player.rotation.x, player.rotation.y, player.rotation.z]);

    return null; // This component doesn't render any HTML
};

export default Spaceship;
