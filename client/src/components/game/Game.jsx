import { useEffect, useState, useRef, useCallback } from 'react';
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

const MAX_BALL_SPEED = 14;
const AI_REACTION_FACTOR = 0.1;
const AI_NOISE_SCALE = 0.4;

const PADDLE_ACCEL = 0.8;
const PADDLE_FRICTION = 0.85;

const BALL_TRAIL_LENGTH = 8;
const HIT_FEEDBACK_DURATION = 150;
const SCORE_DELAY_MS = 400;

const SOUND_ENABLED = true;

const P1X = PADDLE_WIDTH + 20;
const P2X = CANVAS_WIDTH - PADDLE_WIDTH - 20;

let audioCtx = null;
const getAudioCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
};

const playBeep = (freq, duration, volume = 0.15) => {
  if (!SOUND_ENABLED) return;
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    osc.type = 'square';
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration / 1000);
  } catch (_) {}
};

const playPaddleHit = () => playBeep(440, 60, 0.12);
const playWallBounce = () => playBeep(220, 40, 0.08);
const playScoreSound = () => playBeep(660, 100, 0.15);

const predictBallY = (bx, by, bdx, bdy) => {
  let x = bx;
  let y = by;
  let dx = bdx;
  let dy = bdy;
  const maxIter = 200;
  for (let i = 0; i < maxIter; i++) {
    x += dx;
    y += dy;
    if (y <= BALL_SIZE / 2) {
      y = BALL_SIZE / 2;
      dy = Math.abs(dy);
    }
    if (y >= CANVAS_HEIGHT - BALL_SIZE / 2) {
      y = CANVAS_HEIGHT - BALL_SIZE / 2;
      dy = -Math.abs(dy);
    }
    if (dx > 0 && x >= P2X) {
      return y;
    }
    if (dx < 0 && x <= P1X + PADDLE_WIDTH) {
      return y;
    }
  }
  return y;
};

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
    disconnected,
    isPaused,
    pauseRequester,
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
    setPaused,
    setConnecting,
    resetGame,
  } = useGameStore();

  const [iAmReady, setIAmReady] = useState(false);
  const paddleYRef = useRef((CANVAS_HEIGHT - PADDLE_HEIGHT) / 2);
  const socketRef = useRef(null);
  const gameStateRef = useRef(null);
  const keysRef = useRef(new Set());
  const lastTimeRef = useRef(0);
  const paddle1VelRef = useRef(0);
  const lastHitTimeRef = useRef(0);
  const scoreDelayUntilRef = useRef(0);

  const onHitFeedback = useCallback(() => {
    lastHitTimeRef.current = performance.now();
  }, []);

  useEffect(() => {
    if (!isSinglePlayer || !isGameStarted || gameOver) return;

    const gs = { ...useGameStore.getState().gameState };
    gameStateRef.current = gs;
    lastTimeRef.current = 0;
    paddle1VelRef.current = 0;
    scoreDelayUntilRef.current = 0;

    let animId;

    const loop = (timestamp) => {
      if (!gameStateRef.current) {
        animId = requestAnimationFrame(loop);
        return;
      }

      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
        animId = requestAnimationFrame(loop);
        return;
      }

      const rawDt = (timestamp - lastTimeRef.current) / (1000 / 60);
      const dt = Math.min(rawDt, 2);
      lastTimeRef.current = timestamp;

      const g = gameStateRef.current;
      const keys = keysRef.current;

      if (useGameStore.getState().isPaused) {
        setGameState({ ...gameStateRef.current });
        animId = requestAnimationFrame(loop);
        return;
      }

      if (scoreDelayUntilRef.current > 0 && timestamp < scoreDelayUntilRef.current) {
        setGameState({ ...gameStateRef.current });
        animId = requestAnimationFrame(loop);
        return;
      }
      scoreDelayUntilRef.current = 0;

      let accel = 0;
      if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) accel -= PADDLE_ACCEL;
      if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) accel += PADDLE_ACCEL;

      if (accel !== 0) {
        paddle1VelRef.current += accel * dt;
        paddle1VelRef.current = Math.max(-PADDLE_SPEED, Math.min(PADDLE_SPEED, paddle1VelRef.current));
      } else {
        paddle1VelRef.current *= Math.pow(PADDLE_FRICTION, dt);
        if (Math.abs(paddle1VelRef.current) < 0.1) paddle1VelRef.current = 0;
      }

      g.paddle1.y = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, g.paddle1.y + paddle1VelRef.current * dt));
      paddleYRef.current = g.paddle1.y;

      g.ball.x += g.ball.dx * dt;
      g.ball.y += g.ball.dy * dt;

      if (g.ball.y <= BALL_SIZE / 2 || g.ball.y >= CANVAS_HEIGHT - BALL_SIZE / 2) {
        g.ball.dy = -g.ball.dy;
        g.ball.y = Math.max(BALL_SIZE / 2, Math.min(CANVAS_HEIGHT - BALL_SIZE / 2, g.ball.y));
        playWallBounce();
        onHitFeedback();
      }

      const prevBallX = g.ball.x - g.ball.dx * dt;

      if (
        g.ball.dx < 0 &&
        prevBallX - BALL_SIZE / 2 > P1X + PADDLE_WIDTH &&
        g.ball.x - BALL_SIZE / 2 <= P1X + PADDLE_WIDTH &&
        g.ball.y >= g.paddle1.y &&
        g.ball.y <= g.paddle1.y + PADDLE_HEIGHT
      ) {
        g.ball.dx = -g.ball.dx * 1.05;
        g.ball.dx = Math.min(Math.abs(g.ball.dx), MAX_BALL_SPEED) * Math.sign(g.ball.dx);
        g.ball.x = P1X + PADDLE_WIDTH + BALL_SIZE / 2;
        const hitPos = (g.ball.y - g.paddle1.y) / PADDLE_HEIGHT;
        g.ball.dy = (hitPos - 0.5) * 8;
        playPaddleHit();
        onHitFeedback();
      }

      if (
        g.ball.dx > 0 &&
        prevBallX + BALL_SIZE / 2 < P2X &&
        g.ball.x + BALL_SIZE / 2 >= P2X &&
        g.ball.y >= g.paddle2.y &&
        g.ball.y <= g.paddle2.y + PADDLE_HEIGHT
      ) {
        g.ball.dx = -g.ball.dx * 1.05;
        g.ball.dx = Math.min(Math.abs(g.ball.dx), MAX_BALL_SPEED) * Math.sign(g.ball.dx);
        g.ball.x = P2X - BALL_SIZE / 2;
        const hitPos = (g.ball.y - g.paddle2.y) / PADDLE_HEIGHT;
        g.ball.dy = (hitPos - 0.5) * 8;
        playPaddleHit();
        onHitFeedback();
      }

      const aiCenter = g.paddle2.y + PADDLE_HEIGHT / 2;
      let targetY;
      if (g.ball.dx > 0) {
        targetY = predictBallY(g.ball.x, g.ball.y, g.ball.dx, g.ball.dy);
        targetY += (Math.random() - 0.5) * AI_NOISE_SCALE * 30;
      } else {
        targetY = CANVAS_HEIGHT / 2;
      }

      const diff = targetY - aiCenter;
      const noise = (Math.random() - 0.5) * AI_NOISE_SCALE;
      g.paddle2.y += (diff * AI_REACTION_FACTOR + noise) * dt;
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
        playScoreSound();
        onHitFeedback();

        if (g.score.player1 >= WIN_SCORE || g.score.player2 >= WIN_SCORE) {
          const w = g.score.player1 >= WIN_SCORE ? user?.id : 'cpu';
          gameStateRef.current = g;
          setGameState({ ...g });
          setGameOver(true, w);
          return;
        }

        g.ball.x = CANVAS_WIDTH / 2;
        g.ball.y = CANVAS_HEIGHT / 2;
        g.speed = 4;
        g.ball.dx = 0;
        g.ball.dy = 0;
        scoreDelayUntilRef.current = timestamp + SCORE_DELAY_MS;
        lastTimeRef.current = 0;

        setTimeout(() => {
          if (!gameStateRef.current) return;
          const sg = gameStateRef.current;
          sg.ball.dx = (Math.random() > 0.5 ? 1 : -1) * sg.speed;
          sg.ball.dy = (Math.random() - 0.5) * 6;
        }, SCORE_DELAY_MS);

        gameStateRef.current = g;
        setGameState({ ...g });

        animId = requestAnimationFrame(loop);
        return;
      }

      gameStateRef.current = g;
      setGameState({ ...g });
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animId);
  }, [isSinglePlayer, isGameStarted, gameOver, onHitFeedback]);

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
      setGameOver(true, data.winner, data.disconnected || null);
    };
    const onPlayerDisconnected = () => {
      console.log('[GAME] Received player-disconnected');
      setGameOver(true, null);
    };
    const onGamePaused = () => {
      console.log('[GAME] Game paused');
      setPaused(true, null);
    };
    const onGameResumed = () => {
      console.log('[GAME] Game resumed');
      setPaused(false, null);
    };
    const onPauseRequested = (data) => {
      console.log('[GAME] Pause requested by:', data.username);
      setPaused(false, data.username);
    };

    socket.on('game-begin', onGameBegin);
    socket.on('game-state', onGameState);
    socket.on('game-over', onGameOver);
    socket.on('player-disconnected', onPlayerDisconnected);
    socket.on('game-paused', onGamePaused);
    socket.on('game-resumed', onGameResumed);
    socket.on('pause-requested', onPauseRequested);

    let animId;
    let mpLastTime = 0;
    let mpPaddleVel = 0;

    const moveLoop = (timestamp) => {
      const keys = keysRef.current;
      const state = useGameStore.getState();
      if (!state.isGameStarted || state.gameOver) {
        mpLastTime = 0;
        animId = requestAnimationFrame(moveLoop);
        return;
      }

      if (mpLastTime === 0) {
        mpLastTime = timestamp;
        animId = requestAnimationFrame(moveLoop);
        return;
      }

      const rawDt = (timestamp - mpLastTime) / (1000 / 60);
      const dt = Math.min(rawDt, 2);
      mpLastTime = timestamp;

      let accel = 0;
      if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) accel -= PADDLE_ACCEL;
      if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) accel += PADDLE_ACCEL;

      if (accel !== 0) {
        mpPaddleVel += accel * dt;
        mpPaddleVel = Math.max(-PADDLE_SPEED, Math.min(PADDLE_SPEED, mpPaddleVel));
      } else {
        mpPaddleVel *= Math.pow(PADDLE_FRICTION, dt);
        if (Math.abs(mpPaddleVel) < 0.1) mpPaddleVel = 0;
      }

      const moved = Math.abs(mpPaddleVel) > 0.05;
      if (moved) {
        paddleYRef.current = Math.max(0, Math.min(CANVAS_HEIGHT - PADDLE_HEIGHT, paddleYRef.current + mpPaddleVel * dt));
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
      socket.off('game-paused', onGamePaused);
      socket.off('game-resumed', onGameResumed);
      socket.off('pause-requested', onPauseRequested);
      cancelAnimationFrame(animId);
    };
  }, [isSinglePlayer, token]);

  // Key tracking
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        const state = useGameStore.getState();
        if (state.gameOver) return;

        if (!state.isGameReady) return;

        if (state.isSinglePlayer) {
          if (state.isGameStarted) {
            console.log('[GAME] SPACE pressed - toggling single player pause');
            setPaused(!state.isPaused, null);
          } else {
            console.log('[GAME] SPACE pressed - starting single player');
            setGameStarted(true);
          }
          return;
        }

        const socket = socketRef.current;
        if (!socket || !state.roomId) return;

        if (state.isGameStarted) {
          console.log('[GAME] SPACE pressed - emitting pause-toggle');
          socket.emit('pause-toggle', state.roomId);
        } else {
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
    const socket = socketRef.current;
    const state = useGameStore.getState();
    if (socket && state.roomId && !state.isSinglePlayer) {
      socket.emit('leave-game', state.roomId);
    }
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
        disconnected={disconnected}
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

            <div className="relative">
              <GameCanvas
                gameState={gameState}
                lastHitTime={lastHitTimeRef.current}
              />

              {isPaused && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-accent mb-2">PAUSED</h2>
                    <p className="text-gray-400">
                      {isSinglePlayer
                        ? 'Press SPACE to resume'
                        : pauseRequester
                          ? `${pauseRequester} wants to pause — press SPACE`
                          : 'Press SPACE to resume'}
                    </p>
                  </div>
                </div>
              )}
            </div>

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
