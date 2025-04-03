import * as THREE from 'three';

/**
 * GameController - Gerencia a criação e manipulação de objetos do jogo
 */
export class GameController {
  private scene: THREE.Scene;
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }
  
  /**
   * Cria uma nave do jogador e adiciona à cena
   * @param initialPosition Posição inicial da nave
   * @param initialRotation Rotação inicial da nave
   * @param debug Modo de depuração que mostra hitboxes
   * @returns Controlador da nave com funções auxiliares
   */
  createPlayerShip(
    initialPosition = new THREE.Vector3(0, 0, 0),
    initialRotation = new THREE.Euler(0, 0, 0),
    debug = false
  ) {
    // Criar o corpo da nave
    const geometry = new THREE.BoxGeometry(1, 2, 0.5);
    const material = new THREE.MeshBasicMaterial({ color: 0x44aaff });
    const ship = new THREE.Mesh(geometry, material);

    // Adicionar asas
    const wingGeometry = new THREE.BoxGeometry(3, 1, 0.2);
    const wingMaterial = new THREE.MeshBasicMaterial({ color: 0x2288cc });
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.y = -0.5;
    ship.add(wings);

    // Adicionar cabine
    const cockpitGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const cockpitMaterial = new THREE.MeshBasicMaterial({ color: 0x88ccff });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.y = 0.5;
    cockpit.position.z = 0.2;
    ship.add(cockpit);

    // Adicionar visualização de hitbox se modo debug estiver ativado
    if (debug) {
      const hitboxGeometry = new THREE.SphereGeometry(1.5, 8, 8);
      const hitboxMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.2,
        wireframe: true,
      });
      const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
      ship.add(hitbox);
    }

    // Posicionar nave
    ship.position.copy(initialPosition);
    ship.rotation.copy(initialRotation);

    // Adicionar à cena
    this.scene.add(ship);

    // Métodos auxiliares
    const updatePosition = (position: THREE.Vector3) => {
      ship.position.copy(position);
    };

    const updateRotation = (rotation: THREE.Euler) => {
      ship.rotation.copy(rotation);
    };

    const setVisible = (visible: boolean) => {
      ship.visible = visible;
    };
    const setMaterial = (newMaterial: THREE.MeshBasicMaterial) => {
      ship.material = newMaterial;
    };

    const dispose = () => {
      this.scene.remove(ship);
      
      // Liberar geometrias e materiais
      geometry.dispose();
      wingGeometry.dispose();
      cockpitGeometry.dispose();
      
      if (material instanceof THREE.Material) material.dispose();
      if (wingMaterial instanceof THREE.Material) wingMaterial.dispose();
      if (cockpitMaterial instanceof THREE.Material) cockpitMaterial.dispose();
      if (debug) {
        const hitbox = ship.children[2] as THREE.Mesh;
        const hitboxGeometry = hitbox.geometry;
        const hitboxMaterial = hitbox.material;
        
        if (hitboxGeometry) hitboxGeometry.dispose();
        if (hitboxMaterial instanceof THREE.Material) hitboxMaterial.dispose();
      }
    };

    return {
      mesh: ship,
      updatePosition,
      updateRotation,
      setVisible,
      setMaterial,
      dispose,
    };
  }
  
  /**
   * Cria um projétil na cena
   * @param position Posição inicial do projétil
   * @param direction Direção do projétil
   * @param speed Velocidade do projétil
   * @param damage Dano causado pelo projétil
   * @param lifetime Tempo de vida em milissegundos
   * @returns Mesh do projétil
   */
  createProjectile(
    position: THREE.Vector3,
    direction: THREE.Vector3,
    speed: number,
    damage = 1,
    lifetime = 2000
  ) {
    // Criar projétil
    const geometry = new THREE.SphereGeometry(0.2, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const projectile = new THREE.Mesh(geometry, material);

    // Posicionar projétil
    projectile.position.copy(position);

    // Definir velocidade (direção multiplicada pela velocidade)
    const velocity = direction.clone().normalize().multiplyScalar(speed);

    // Adicionar à cena
    this.scene.add(projectile);

    // Armazenar propriedades no objeto do projétil
    (projectile as any).velocity = velocity;
    (projectile as any).lifetime = lifetime;
    (projectile as any).damage = damage;
    
    const dispose = () => {
      this.scene.remove(projectile);
      geometry.dispose();
      if (material instanceof THREE.Material) material.dispose();
    };

    return {
      mesh: projectile,
      velocity,
      damage,
      lifetime,
      dispose
    };
  }
  
  /**
   * Cria um inimigo na cena
   * @param position Posição inicial do inimigo
   * @param velocity Velocidade do inimigo
   * @param health Vida do inimigo
   * @param points Pontos concedidos ao destruir o inimigo
   * @param debug Modo de depuração que mostra hitboxes
   * @returns Mesh do inimigo
   */
  createEnemy(
    position: THREE.Vector3,
    velocity: THREE.Vector3,
    health = 10,
    points = 100,
    debug = false
  ) {
    // Criar inimigo
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const enemy = new THREE.Mesh(geometry, material);

    // Adicionar visualização de hitbox se modo debug estiver ativado
    if (debug) {
      const hitboxGeometry = new THREE.SphereGeometry(1.5, 8, 8);
      const hitboxMaterial = new THREE.MeshBasicMaterial({
        color: 0xff0000,
        transparent: true,
        opacity: 0.2,
        wireframe: true,
      });
      const hitbox = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
      enemy.add(hitbox);
    }

    // Posicionar inimigo
    enemy.position.copy(position);

    // Adicionar à cena
    this.scene.add(enemy);

    // Armazenar propriedades no objeto do inimigo
    (enemy as any).velocity = velocity;
    (enemy as any).health = health;
    (enemy as any).points = points;
    
    const dispose = () => {
      this.scene.remove(enemy);
      geometry.dispose();
      if (material instanceof THREE.Material) material.dispose();
      if (debug) {
        const hitbox = enemy.children[0] as THREE.Mesh;
        const hitboxGeometry = hitbox?.geometry;
        const hitboxMaterial = hitbox?.material;
        
        if (hitboxGeometry) hitboxGeometry.dispose();
        if (hitboxMaterial instanceof THREE.Material) hitboxMaterial.dispose();
      }
    };

    return {
      mesh: enemy,
      velocity,
      health,
      points,
      dispose,
      takeDamage: (amount: number) => {
        (enemy as any).health -= amount;
        return (enemy as any).health <= 0;
      }
    };
  }
  
  /**
   * Cria um efeito de explosão na cena
   * @param position Posição da explosão
   * @param particleCount Número de partículas
   * @returns Array de partículas criadas
   */
  createExplosion(position: THREE.Vector3, particleCount = 15) {
    const particles: THREE.Mesh[] = [];
    
    // Criar partículas
    for (let i = 0; i < particleCount; i++) {
      // Criar partícula
      const size = Math.random() * 0.3 + 0.1;
      const geometry = new THREE.SphereGeometry(size, 4, 4);

      // Randomizar cor entre amarelo, laranja e vermelho
      const colors = [0xffff00, 0xff8800, 0xff0000];
      const material = new THREE.MeshBasicMaterial({
        color: colors[Math.floor(Math.random() * colors.length)],
        transparent: true,
        opacity: 0.8,
      });

      const particle = new THREE.Mesh(geometry, material);

      // Posicionar no centro da explosão
      particle.position.copy(position);

      // Velocidade aleatória em todas as direções
      const speed = Math.random() * 5 + 3;
      const direction = new THREE.Vector3(
        Math.random() * 2 - 1, 
        Math.random() * 2 - 1, 
        Math.random() * 2 - 1
      ).normalize();

      (particle as any).velocity = direction.multiplyScalar(speed);
      (particle as any).lifetime = Math.random() * 500 + 500; // 0.5-1 segundo

      // Adicionar à cena
      this.scene.add(particle);
      particles.push(particle);
    }
    
    // Função para dispor de todas as partículas
    const disposeAll = () => {
      particles.forEach(particle => {
        this.scene.remove(particle);
        particle.geometry.dispose();
        if (particle.material instanceof THREE.Material) {
          particle.material.dispose();
        }
      });
    };
    
    return {
      particles,
      disposeAll
    };
  }
  
  /**
   * Cria um efeito de luz na cena
   * @param position Posição da luz
   * @param color Cor da luz
   * @param intensity Intensidade da luz
   * @param distance Distância máxima da luz
   * @returns Objeto de luz
   */
  createLight(
    position: THREE.Vector3,
    color = 0xffffff,
    intensity = 1,
    distance = 10
  ) {
    const light = new THREE.PointLight(color, intensity, distance);
    light.position.copy(position);
    this.scene.add(light);
    
    return {
      light,
      dispose: () => {
        this.scene.remove(light);
      }
    };
  }
  
  /**
   * Inicializa a cena com iluminação básica
   */
  setupBasicScene() {
    // Adicionar luz ambiente
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    // Adicionar luz direcional
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 1);
    this.scene.add(directionalLight);
    
    // Adicionar grid para referência
    const gridHelper = new THREE.GridHelper(50, 10, 0x444444, 0x222222);
    gridHelper.rotation.x = Math.PI / 2; // Rotacionar para ficar no plano XY
    this.scene.add(gridHelper);
    
    return {
      ambientLight,
      directionalLight,
      gridHelper,
      dispose: () => {
        this.scene.remove(ambientLight);
        this.scene.remove(directionalLight);
        this.scene.remove(gridHelper);
      }
    };
  }
  
  /**
   * Verifica colisão entre dois objetos baseada em distância
   * @param object1 Primeiro objeto
   * @param object2 Segundo objeto
   * @param radius1 Raio do primeiro objeto
   * @param radius2 Raio do segundo objeto
   * @returns Verdadeiro se houver colisão
   */
  checkCollision(
    object1: THREE.Object3D,
    object2: THREE.Object3D,
    radius1 = 1.0,
    radius2 = 1.0
  ) {
    const distance = object1.position.distanceTo(object2.position);
    return distance < (radius1 + radius2);
  }
}

export default GameController;