import { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useAuthStore } from '../../stores/authStore';
import { getSocket } from '../../hooks/useSocket';
import GameCanvas from './GameCanvas';
import GameOver from './GameOver';
import { ArrowLeft, Users, Cpu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_HEIGHT = 120;
const PADDLE_SPEED = 6;
const BALL_SIZE = 12;
const PADDLE_WIDTH = 12;
const WIN_SCORE = 11;
const AI_SPEED = 4.5;

const Game = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useAuthStore();
  const {
    gameState,
    isGameStarted,
    isGameReady,
    gameOver,
    winner,
    players,
    score,
    roomId,
    isConnecting,
    isSinglePlayer,
    setGameState,
    setGameStarted,
    setGameReady,
    setPlayers,
    setRoomId,
    setGameOver,
    setConnecting,
    resetGame,
  } = useGameStore();

  const [iAmReady, setIAmReady] = useState(false);
  const paddleYRef = useRef((CANVAS_HEIGHT - PADDLE_HEIGHT) / 2);
  const socketRef = useRef(null);
  const gameStateRef = useRef(null);
  const keysRef = useRef(new Set());

  // Single player game loop
  useEffect(() => {
    if (!isSinglePlayer || !isGameStarted || gameOver) return;

    const gs = { ...useGameStore.getState().gameState };
    gameStateRef.current = gs;

    const p1x = PADDLE_WIDTH + 20;
    const p2x = CANVAS_WIDTH - PADDLE_WIDTH - 20;

    const loop = setInterval(() => {
      if (!gameStateRef.current) return;
      const g = gameStateRef.current;
      const keys = keysRef.current;

      if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) {
        g.paddle1.y = Math.max(0, g.paddle1.y - PADDLE_SPEED);
        paddleYRef.current = g.paddle1.y;
      }
      if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) {
        g.paddle1.y = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, g.paddle1.y + PADDLE_SPEED);
        paddleYRef.current = g.paddle1.y;
      }

      g.ball.x += g.ball.dx;
      g.ball.y += g.ball.dy;

      if (g.ball.y <= BALL_SIZE / 2 || g.ball.y >= CANVAS_HEIGHT - BALL_SIZE / 2) {
        g.ball.dy = -g.ball.dy;
        g.ball.y = Math.max(BALL_SIZE / 2, Math.min(CANVAS_HEIGHT - BALL_SIZE / 2, g.ball.y));
      }

      if (
        g.ball.dx < 0 &&
        g.ball.x - BALL_SIZE / 2 <= p1x + PADDLE_WIDTH &&
        g.ball.x - BALL_SIZE / 2 >= p1x &&
        g.ball.y >= g.paddle1.y &&
        g.ball.y <= g.paddle1.y + PADDLE_HEIGHT
      ) {
        g.ball.dx = -g.ball.dx * 1.05;
        g.ball.x = p1x + PADDLE_WIDTH + BALL_SIZE / 2;
        const hitPos = (g.ball.y - g.paddle1.y) / PADDLE_HEIGHT;
        g.ball.dy = (hitPos - 0.5) * 8;
      }

      if (
        g.ball.dx > 0 &&
        g.ball.x + BALL_SIZE / 2 >= p2x &&
        g.ball.x + BALL_SIZE / 2 <= p2x + PADDLE_WIDTH &&
        g.ball.y >= g.paddle2.y &&
        g.ball.y <= g.paddle2.y + PADDLE_HEIGHT
      ) {
        g.ball.dx = -g.ball.dx * 1.05;
        g.ball.x = p2x - BALL_SIZE / 2;
        const hitPos = (g.ball.y - g.paddle2.y) / PADDLE_HEIGHT;
        g.ball.dy = (hitPos - 0.5) * 8;
      }

      if (g.ball.dx > 0 && Math.abs(g.ball.y - (g.paddle2.y + PADDLE_HEIGHT / 2)) > 10) {
        const aiCenter = g.paddle2.y + PADDLE_HEIGHT / 2;
        const diff = g.ball.y - aiCenter;
        let targetY = g.ball.y;
        if (Math.random() < 0.2) {
          targetY += (Math.random() - 0.5) * PADDLE_HEIGHT * 0.6;
        }
        const targetDiff = targetY - aiCenter;
        const currentSpeed = Math.random() < 0.15 ? AI_SPEED * 0.5 : AI_SPEED;
        if (Math.random() > 0.1) {
          g.paddle2.y += Math.sign(targetDiff) * currentSpeed;
        }
      }
      if (g.ball.dx < 0 && Math.random() < 0.03) {
        g.paddle2.y += (Math.random() - 0.5) * AI_SPEED * 3;
      }
      g.paddle2.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, g.paddle2.y));

      let scored = false;
      if (g.ball.x < 0) {
        g.score.player2++;
        scored = true;
      } else if (g.ball.x > CANVAS_WIDTH) {
        g.score.player1++;
        scored = true;
      }

      if (scored) {
        if (g.score.player1 >= WIN_SCORE || g.score.player2 >= WIN_SCORE) {
          const w = g.score.player1 >= WIN_SCORE ? user?.id : 'cpu';
          gameStateRef.current = g;
          setGameState({ ...g });
          setGameOver(true, w);
          clearInterval(loop);

          return;
        }
        g.ball.x = CANVAS_WIDTH / 2;
        g.ball.y = CANVAS_HEIGHT / 2;
        g.speed = 4;
        g.ball.dx = (Math.random() > 0.5 ? 1 : -1) * g.speed;
        g.ball.dy = (Math.random() - 0.5) * 6;
      }

      gameStateRef.current = g;
      setGameState({ ...g });
    }, 1000 / 60);

    return () => clearInterval(loop);
  }, [isSinglePlayer, isGameStarted, gameOver]);

  // Initialize multiplayer from navigation state
  useEffect(() => {
    if (isSinglePlayer || !token) return;

    const gameData = location.state?.gameData;
    if (gameData) {
      console.log('[GAME] Initializing from navigation state:', gameData);
      setRoomId(gameData.roomId);
      setPlayers(gameData.players);
      setGameState(gameData.gameState);
      setGameReady(true);
      setConnecting(false);
      paddleYRef.current = gameData.gameState.paddle1.y;
      // Clear navigation state so it doesn't re-init
      window.history.replaceState({}, document.title);
    }
  }, [token, isSinglePlayer]);

  // Multiplayer: socket events + movement loop
  useEffect(() => {
    if (isSinglePlayer || !token) return;

    const socket = getSocket(token);
    socketRef.current = socket;
    console.log('[GAME] Multiplayer effect running, socket id:', socket.id);

    const onGameBegin = () => {
      console.log('[GAME] Received game-begin');
      setGameStarted(true);
    };
    const onGameState = (newGameState) => setGameState(newGameState);
    const onGameOver = (data) => {
      console.log('[GAME] Received game-over:', data);
      setGameOver(true, data.winner);
    };
    const onPlayerDisconnected = () => {
      console.log('[GAME] Received player-disconnected');
      setGameOver(true, null);
    };

    socket.on('game-begin', onGameBegin);
    socket.on('game-state', onGameState);
    socket.on('game-over', onGameOver);
    socket.on('player-disconnected', onPlayerDisconnected);

    let animId;
    const moveLoop = () => {
      const keys = keysRef.current;
      const state = useGameStore.getState();
      if (!state.isGameStarted || state.gameOver) {
        animId = requestAnimationFrame(moveLoop);
        return;
      }

      let moved = false;
      if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) {
        paddleYRef.current = Math.max(0, paddleYRef.current - PADDLE_SPEED);
        moved = true;
      }
      if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) {
        paddleYRef.current = Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddleYRef.current + PADDLE_SPEED);
        moved = true;
      }

      if (moved && state.roomId) {
        console.log('[GAME] Emitting player-move, paddleY:', paddleYRef.current, 'roomId:', state.roomId);
        socket.emit('player-move', { roomId: state.roomId, paddleY: paddleYRef.current });
      }

      animId = requestAnimationFrame(moveLoop);
    };

    animId = requestAnimationFrame(moveLoop);

    return () => {
      socket.off('game-begin', onGameBegin);
      socket.off('game-state', onGameState);
      socket.off('game-over', onGameOver);
      socket.off('player-disconnected', onPlayerDisconnected);
      cancelAnimationFrame(animId);
    };
  }, [isSinglePlayer, token]);

  // Key tracking
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        const state = useGameStore.getState();
        if (!state.isGameReady || state.isGameStarted || state.gameOver) return;

        if (state.isSinglePlayer) {
          console.log('[GAME] SPACE pressed - starting single player');
          setGameStarted(true);
          return;
        }

        const socket = socketRef.current;
        if (socket) {
          console.log('[GAME] SPACE pressed - emitting player-ready, roomId:', state.roomId);
          setIAmReady(true);
          socket.emit('player-ready', state.roomId);
        }
        return;
      }

      keysRef.current.add(e.key);
      if (['ArrowUp', 'ArrowDown', 'w', 's', 'W', 'S'].includes(e.key)) {
        console.log('[GAME] Key DOWN:', e.key, 'held keys:', [...keysRef.current]);
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current.delete(e.key);
      if (['ArrowUp', 'ArrowDown', 'w', 's', 'W', 'S'].includes(e.key)) {
        console.log('[GAME] Key UP:', e.key, 'held keys:', [...keysRef.current]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleLeaveGame = () => {
    resetGame();
    navigate('/lobby');
  };

  if (isConnecting && !isSinglePlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent mx-auto"></div>
          <p className="text-primary mt-4 animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (gameOver) {
    return (
      <GameOver
        winner={winner}
        score={score}
        players={players}
        onPlayAgain={handleLeaveGame}
        onLeave={handleLeaveGame}
      />
    );
  }

  return (
    <div className="min-h-screen bg-dark p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleLeaveGame}
            className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {isSinglePlayer ? 'Back to Lobby' : 'Leave Game'}
          </button>

          <div className="flex items-center gap-4">
            {isSinglePlayer ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Cpu className="w-4 h-4" />
                <span className="text-sm">vs Computer</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-4 h-4" />
                <span className="text-sm">{players.length}/2 Players</span>
              </div>
            )}
          </div>
        </div>

        {!isGameReady ? (
          <div className="card text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-primary mb-2">Waiting for opponent...</h2>
            <p className="text-gray-400">Another player will join soon</p>
          </div>
        ) : (
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4 px-4">
              <div className="text-center">
                <p className="text-sm text-gray-400">{players[0]?.username || 'Player 1'}</p>
                <p className="text-3xl font-bold text-accent">{score.player1}</p>
              </div>
              <div className="text-sm text-gray-500">VS</div>
              <div className="text-center">
                <p className="text-sm text-gray-400">{players[1]?.username || 'Player 2'}</p>
                <p className="text-3xl font-bold text-secondary">{score.player2}</p>
              </div>
            </div>

            <GameCanvas gameState={gameState} />

            {!isGameStarted && (
              <div className="mt-4 text-center">
                {isSinglePlayer ? (
                  <p className="text-primary text-lg font-bold animate-pulse">
                    Press SPACE to start
                  </p>
                ) : iAmReady ? (
                  <p className="text-accent animate-pulse text-lg font-bold">
                    Waiting for opponent to press SPACE...
                  </p>
                ) : (
                  <p className="text-primary text-lg font-bold animate-pulse">
                    Press SPACE to start
                  </p>
                )}
              </div>
            )}

            {isGameStarted && (
              <div className="mt-4 text-center">
                <p className="text-gray-500 text-sm mb-2">Controls</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2 text-gray-400">
                    <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">W</kbd>
                    <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Arrow Up</kbd>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">S</kbd>
                    <kbd className="px-2 py-1 bg-gray-800 rounded text-xs">Arrow Down</kbd>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;
