// Utilitários para salvar e carregar dados do jogo

export interface GameData {
    highScore: number;
    lastPlayed: number; // timestamp
    totalGamesPlayed: number;
    settings?: {
        difficulty: string;
        soundEnabled: boolean;
    };
}

// Chave padrão para o localStorage
const STORAGE_KEY = 'space-strike-data';

// Carregar dados do jogo do localStorage
export const loadGameData = (): GameData => {
    try {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            return JSON.parse(savedData) as GameData;
        }
    } catch (error) {
        console.error('Erro ao carregar dados do jogo:', error);
    }

    // Retornar dados padrão se não houver dados salvos ou ocorrer um erro
    return {
        highScore: 0,
        lastPlayed: 0,
        totalGamesPlayed: 0,
        settings: {
            difficulty: 'medium',
            soundEnabled: true
        }
    };
};

// Salvar dados do jogo no localStorage
export const saveGameData = (data: Partial<GameData>): void => {
    try {
        // Carregar dados existentes e mesclar com os novos
        const existingData = loadGameData();
        const updatedData = { ...existingData, ...data };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
    } catch (error) {
        console.error('Erro ao salvar dados do jogo:', error);
    }
};

// Atualizar apenas o high score
export const updateHighScore = (score: number): void => {
    const gameData = loadGameData();

    if (score > gameData.highScore) {
        saveGameData({
            highScore: score,
            lastPlayed: Date.now()
        });

        // Também atualizar o valor individual para compatibilidade
        localStorage.setItem('highScore', score.toString());
    } else {
        // Ainda atualizar lastPlayed
        saveGameData({ lastPlayed: Date.now() });
    }
};

// Incrementar o contador de jogos jogados
export const incrementGamesPlayed = (): void => {
    const gameData = loadGameData();
    saveGameData({
        totalGamesPlayed: gameData.totalGamesPlayed + 1,
        lastPlayed: Date.now()
    });
};

// Salvar configurações do jogo
export const saveGameSettings = (settings: GameData['settings']): void => {
    saveGameData({ settings });
};

// Limpar todos os dados de jogo (reset)
export const clearGameData = (): void => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('highScore');
};