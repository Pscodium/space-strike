import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Definição de tipos
export interface Vector3 {
    x: number;
    y: number;
    z: number;
}

export interface Entity {
    id: string;
    position: Vector3;
    rotation: Vector3;
    velocity: Vector3;
    active: boolean;
}

export interface Projectile extends Entity {
    owner: string;
    damage: number;
    lifetime: number;
    rate: number;
}

export interface Enemy extends Entity {
    health: number;
    points: number;
    type: string;
}

export interface Player extends Entity {
    health: number;
    lives: number;
    score: number;
}

interface GameState {
    isRunning: boolean;
    isPaused: boolean;
    level: number;
    player: Player;
    enemies: Enemy[];
    projectiles: Projectile[];
    score: number;
    highScore: number;
    gameOver: boolean;
}

// Estado inicial
const initialState: GameState = {
    isRunning: false,
    isPaused: false,
    level: 1,
    player: {
        id: 'player',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        velocity: { x: 0, y: 0, z: 0 },
        active: true,
        health: 100,
        lives: 3,
        score: 0,
    },
    enemies: [],
    projectiles: [],
    score: 0,
    highScore: parseInt(localStorage.getItem('highScore') || '0', 10),
    gameOver: false,
};

const gameSlice = createSlice({
    name: 'game',
    initialState,
    reducers: {
        startGame: (state) => {
            state.isRunning = true;
            state.isPaused = false;
            state.gameOver = false;
            state.level = 1;
            state.score = 0;
            state.player = { ...initialState.player };
            state.enemies = [];
            state.projectiles = [];
        },
        pauseGame: (state) => {
            state.isPaused = true;
        },
        resumeGame: (state) => {
            state.isPaused = false;
        },
        endGame: (state) => {
            state.isRunning = false;
            state.gameOver = true;
            if (state.score > state.highScore) {
                state.highScore = state.score;
                // Salvar no localStorage para persistencia
                localStorage.setItem('highScore', state.score.toString());
            }
        },
        updatePlayer: (state, action: PayloadAction<Partial<Player>>) => {
            state.player = { ...state.player, ...action.payload };
        },
        addProjectile: (state, action: PayloadAction<Projectile>) => {
            state.projectiles.push(action.payload);
        },
        removeProjectile: (state, action: PayloadAction<string>) => {
            state.projectiles = state.projectiles.filter((p) => p.id !== action.payload);
        },
        updateProjectiles: (state, action: PayloadAction<Projectile[]>) => {
            state.projectiles = action.payload;
        },
        addEnemy: (state, action: PayloadAction<Enemy>) => {
            state.enemies.push(action.payload);
        },
        removeEnemy: (state, action: PayloadAction<string>) => {
            state.enemies = state.enemies.filter((e) => e.id !== action.payload);
        },
        updateEnemies: (state, action: PayloadAction<Enemy[]>) => {
            state.enemies = action.payload;
        },
        incrementScore: (state, action: PayloadAction<number>) => {
            state.score += action.payload;
        },
        nextLevel: (state) => {
            state.level += 1;
        },
    },
});

export const { startGame, pauseGame, resumeGame, endGame, updatePlayer, addProjectile, removeProjectile, updateProjectiles, addEnemy, removeEnemy, updateEnemies, incrementScore, nextLevel } =
    gameSlice.actions;

export default gameSlice.reducer;
