import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { useGame } from '@/context/GameContext';
import { loadGameData } from '@/utils/gameStorage';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { highScore } = useSelector((state: RootState) => state.game);
    const { start } = useGame();

    // Carregar dados do jogo do localStorage
    const gameData = loadGameData();
    // Usar o maior high score entre o Redux e o storage
    const displayHighScore = Math.max(highScore, gameData.highScore);

    // Carregar jogos jogados
    const totalGamesPlayed = gameData.totalGamesPlayed;

    const handleStartGame = () => {
        start();
        navigate('/game');
    };

    return (
        <div className='min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white'>
            <div className='max-w-md w-full bg-gray-800 rounded-lg p-8 shadow-lg'>
                <h1 className='text-4xl font-bold text-center mb-8'>Space Strike</h1>

                <div className='mb-8 text-center'>
                    <p className='text-xl'>High Score: {displayHighScore}</p>
                    {totalGamesPlayed > 0 && <p className='text-sm text-gray-400 mt-1'>Jogos jogados: {totalGamesPlayed}</p>}
                    {gameData.lastPlayed > 0 && <p className='text-sm text-gray-400 mt-1'>Última jogada: {new Date(gameData.lastPlayed).toLocaleDateString()}</p>}
                </div>

                <div className='space-y-4'>
                    <button className='w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded text-lg transition-colors' onClick={handleStartGame}>
                        Start Game
                    </button>

                    <button className='w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded text-lg transition-colors' onClick={() => navigate('/settings')}>
                        Settings
                    </button>

                    <div className='mt-8 bg-gray-700 rounded-lg p-4'>
                        <h2 className='text-xl font-semibold mb-2'>Controls:</h2>
                        <ul className='list-disc pl-5 space-y-1'>
                            <li>W - Move Forward</li>
                            <li>S - Move Backward</li>
                            <li>A - Move Left</li>
                            <li>D - Move Right</li>
                            <li>Q/E - Rotate Ship</li>
                            <li>Spacebar - Fire</li>
                            <li>ESC - Pause Game</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className='mt-8 text-gray-400 text-sm'>
                <p>© 2025 Space Strike Game</p>
            </div>
        </div>
    );
};

export default Home;
