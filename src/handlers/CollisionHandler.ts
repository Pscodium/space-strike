import { Player, Enemy, Projectile, Vector3 } from '../store/gameSlice';

// Define collision shapes and sizes
export enum CollisionShape {
  SPHERE = 'sphere',
  BOX = 'box',
}

interface CollisionBox {
  width: number;
  height: number;
  depth: number;
}

interface CollisionSphere {
  radius: number;
}

interface CollisionObject {
  position: Vector3;
  shape: CollisionShape;
  dimensions: CollisionSphere | CollisionBox;
}

/**
 * Create a collision sphere for an entity
 */
export const createCollisionSphere = (position: Vector3, radius: number): CollisionObject => {
  return {
    position,
    shape: CollisionShape.SPHERE,
    dimensions: { radius },
  };
};

/**
 * Create a collision box for an entity
 */
export const createCollisionBox = (
  position: Vector3,
  width: number,
  height: number,
  depth: number
): CollisionObject => {
  return {
    position,
    shape: CollisionShape.BOX,
    dimensions: { width, height, depth },
  };
};

/**
 * Get distance between two points
 */
export const getDistance = (p1: Vector3, p2: Vector3): number => {
  return Math.sqrt(
    Math.pow(p2.x - p1.x, 2) +
    Math.pow(p2.y - p1.y, 2) +
    Math.pow(p2.z - p1.z, 2)
  );
};

/**
 * Check if two spheres are colliding
 */
export const sphereToSphereCollision = (
  sphere1: CollisionObject,
  sphere2: CollisionObject
): boolean => {
  if (
    sphere1.shape !== CollisionShape.SPHERE ||
    sphere2.shape !== CollisionShape.SPHERE
  ) {
    return false;
  }

  const s1 = sphere1.dimensions as CollisionSphere;
  const s2 = sphere2.dimensions as CollisionSphere;
  
  const distance = getDistance(sphere1.position, sphere2.position);
  return distance < s1.radius + s2.radius;
};

/**
 * Check if a sphere and box are colliding (simplified)
 */
export const sphereToBoxCollision = (
  sphere: CollisionObject,
  box: CollisionObject
): boolean => {
  if (
    sphere.shape !== CollisionShape.SPHERE ||
    box.shape !== CollisionShape.BOX
  ) {
    return false;
  }

  const s = sphere.dimensions as CollisionSphere;
  const b = box.dimensions as CollisionBox;
  
  // Get box extents
  const halfWidth = b.width / 2;
  const halfHeight = b.height / 2;
  const halfDepth = b.depth / 2;
  
  // Find the closest point on the box to the sphere center
  const closestX = Math.max(box.position.x - halfWidth, Math.min(sphere.position.x, box.position.x + halfWidth));
  const closestY = Math.max(box.position.y - halfHeight, Math.min(sphere.position.y, box.position.y + halfHeight));
  const closestZ = Math.max(box.position.z - halfDepth, Math.min(sphere.position.z, box.position.z + halfDepth));
  
  // Calculate the distance between the sphere's center and the closest point on the box
  const distance = getDistance(
    { x: closestX, y: closestY, z: closestZ },
    sphere.position
  );
  
  // If the distance is less than the sphere's radius, there's a collision
  return distance < s.radius;
};

/**
 * Check collision between projectile and enemy
 */
export const checkProjectileEnemyCollision = (
  projectile: Projectile,
  enemy: Enemy
): boolean => {
  // Create collision objects
  const projectileCollider = createCollisionSphere(
    projectile.position,
    0.2 // Projectile radius
  );
  
  // For simplicity, all enemies use sphere collisions
  const enemyCollider = createCollisionSphere(
    enemy.position,
    0.8 // Enemy radius (depends on enemy type)
  );
  
  return sphereToSphereCollision(projectileCollider, enemyCollider);
};

/**
 * Check collision between player and enemy
 */
export const checkPlayerEnemyCollision = (
  player: Player,
  enemy: Enemy
): boolean => {
  // Create collision objects
  const playerCollider = createCollisionSphere(
    player.position,
    1.0 // Player ship radius
  );
  
  const enemyCollider = createCollisionSphere(
    enemy.position,
    0.8 // Enemy radius
  );
  
  return sphereToSphereCollision(playerCollider, enemyCollider);
};

/**
 * Check if a point is inside a sphere
 */
export const isPointInSphere = (
  point: Vector3,
  sphereCenter: Vector3,
  radius: number
): boolean => {
  return getDistance(point, sphereCenter) <= radius;
};

/**
 * Check collision between all projectiles and enemies
 */
export const checkAllCollisions = (
  player: Player,
  projectiles: Projectile[],
  enemies: Enemy[]
): Array<{ projectile: Projectile | null; enemy: Enemy }> => {
  const collisions: Array<{ projectile: Projectile | null; enemy: Enemy }> = [];
  
  // Check player-enemy collisions
  enemies.forEach(enemy => {
    if (checkPlayerEnemyCollision(player, enemy)) {
      collisions.push({ projectile: null, enemy });
    }
  });
  
  // Check projectile-enemy collisions
  projectiles.forEach(projectile => {
    // Skip enemy projectiles
    if (projectile.owner !== 'player') return;
    
    enemies.forEach(enemy => {
      if (checkProjectileEnemyCollision(projectile, enemy)) {
        collisions.push({ projectile, enemy });
      }
    });
  });
  
  return collisions;
};