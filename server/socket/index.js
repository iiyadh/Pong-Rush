const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const GameSession = require('../models/GameSession');

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 120;
const BALL_SIZE = 12;
const WIN_SCORE = 11;
const MAX_BALL_SPEED = 14;
const TICK_RATE = 1000 / 60;

const gameRooms = new Map();
const waitingPlayers = [];
const gameLoops = new Map();

const initializeGame = () => ({
  ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: 4, dy: 3 },
  paddle1: { y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2 },
  paddle2: { y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2 },
  score: { player1: 0, player2: 0 },
  speed: 4
});

function startGameLoop(roomId, io) {
  const interval = setInterval(() => {
    const room = gameRooms.get(roomId);
    if (!room || !room.gameState || room.gameState.status !== 'playing') return;

    const gs = room.gameState;

    const prevBallX = gs.ball.x;

    gs.ball.x += gs.ball.dx;
    gs.ball.y += gs.ball.dy;

    if (gs.ball.y <= BALL_SIZE / 2 || gs.ball.y >= CANVAS_HEIGHT - BALL_SIZE / 2) {
      gs.ball.dy = -gs.ball.dy;
      gs.ball.y = Math.max(BALL_SIZE / 2, Math.min(CANVAS_HEIGHT - BALL_SIZE / 2, gs.ball.y));
    }

    const p1x = PADDLE_WIDTH + 20;
    const p2x = CANVAS_WIDTH - PADDLE_WIDTH - 20;

    if (
      gs.ball.dx < 0 &&
      prevBallX - BALL_SIZE / 2 > p1x + PADDLE_WIDTH &&
      gs.ball.x - BALL_SIZE / 2 <= p1x + PADDLE_WIDTH &&
      gs.ball.y >= gs.paddle1.y &&
      gs.ball.y <= gs.paddle1.y + PADDLE_HEIGHT
    ) {
      gs.ball.dx = -gs.ball.dx * 1.05;
      gs.ball.dx = Math.min(Math.abs(gs.ball.dx), MAX_BALL_SPEED) * Math.sign(gs.ball.dx);
      gs.ball.x = p1x + PADDLE_WIDTH + BALL_SIZE / 2;
      const hitPos = (gs.ball.y - gs.paddle1.y) / PADDLE_HEIGHT;
      gs.ball.dy = (hitPos - 0.5) * 8;
    }

    if (
      gs.ball.dx > 0 &&
      prevBallX + BALL_SIZE / 2 < p2x &&
      gs.ball.x + BALL_SIZE / 2 >= p2x &&
      gs.ball.y >= gs.paddle2.y &&
      gs.ball.y <= gs.paddle2.y + PADDLE_HEIGHT
    ) {
      gs.ball.dx = -gs.ball.dx * 1.05;
      gs.ball.dx = Math.min(Math.abs(gs.ball.dx), MAX_BALL_SPEED) * Math.sign(gs.ball.dx);
      gs.ball.x = p2x - BALL_SIZE / 2;
      const hitPos = (gs.ball.y - gs.paddle2.y) / PADDLE_HEIGHT;
      gs.ball.dy = (hitPos - 0.5) * 8;
    }

    let scored = false;
    if (gs.ball.x < 0) {
      gs.score.player2++;
      scored = true;
    } else if (gs.ball.x > CANVAS_WIDTH) {
      gs.score.player1++;
      scored = true;
    }

    if (scored) {
      if (gs.score.player1 >= WIN_SCORE || gs.score.player2 >= WIN_SCORE) {
        const winnerIdx = gs.score.player1 >= WIN_SCORE ? 0 : 1;
        const loserIdx = winnerIdx === 0 ? 1 : 0;
        const winner = room.players[winnerIdx];
        const loser = room.players[loserIdx];

        room.gameState.status = 'finished';
        stopGameLoop(roomId);

        // Save game session
        GameSession.findOneAndUpdate(
          { roomId },
          {
            winner: winner.userId,
            endedAt: new Date(),
            duration: 60,
            'gameState.status': 'finished',
            'players.0.score': gs.score.player1,
            'players.1.score': gs.score.player2
          }
        ).catch(console.error);

        // Update winner stats
        User.findById(winner.userId).then(user => {
          if (user) user.updateStats('win', gs.score.player1);
        }).catch(console.error);

        // Update loser stats
        User.findById(loser.userId).then(user => {
          if (user) user.updateStats('loss', gs.score.player2);
        }).catch(console.error);

        io.to(roomId).emit('game-over', {
          winner: winner.userId.toString(),
          score: gs.score
        });

        io.emit('leaderboard-update');
        return;
      }

      gs.ball.x = CANVAS_WIDTH / 2;
      gs.ball.y = CANVAS_HEIGHT / 2;
      gs.speed = 4;
      gs.ball.dx = (Math.random() > 0.5 ? 1 : -1) * gs.speed;
      gs.ball.dy = (Math.random() - 0.5) * 6;
    }

    io.to(roomId).emit('game-state', gs);
  }, TICK_RATE);

  gameLoops.set(roomId, interval);
}

function stopGameLoop(roomId) {
  const interval = gameLoops.get(roomId);
  if (interval) {
    clearInterval(interval);
    gameLoops.delete(roomId);
  }
}

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user._id.toString();
      socket.username = user.username;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[SERVER] User connected: ${socket.username} (${socket.userId}), socketId: ${socket.id}`);

    User.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date()
    }).catch(console.error);

    io.emit('online-count', io.engine.clientsCount);

    socket.on('find-match', async () => {
      console.log(`[SERVER] find-match from ${socket.username} (${socket.userId})`);
      console.log(`[SERVER] find-match: waitingPlayers count=${waitingPlayers.length}`);
      try {
        if (waitingPlayers.length > 0) {
          const opponent = waitingPlayers.shift();
          const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

          const room = {
            id: roomId,
            players: [
              { userId: opponent.userId, username: opponent.username, socketId: opponent.socketId },
              { userId: socket.userId, username: socket.username, socketId: socket.id }
            ],
            gameState: initializeGame(),
            playerReady: {}
          };

          gameRooms.set(roomId, room);

          const session = new GameSession({
            roomId,
            players: room.players.map(p => ({
              userId: p.userId,
              username: p.username
            })),
            gameState: { status: 'playing' }
          });
          await session.save();
          room.sessionId = session._id;

          socket.join(roomId);
          io.sockets.sockets.get(opponent.socketId)?.join(roomId);

          console.log(`[SERVER] find-match: matched! roomId=${roomId}, players=[${room.players.map(p => p.username).join(', ')}]`);
          room.gameState.status = 'ready';
          io.to(roomId).emit('game-start', {
            roomId,
            players: room.players.map(p => ({
              userId: p.userId,
              username: p.username
            })),
            gameState: room.gameState
          });
        } else {
          waitingPlayers.push({
            userId: socket.userId,
            username: socket.username,
            socketId: socket.id
          });

          socket.emit('waiting-for-match', { message: 'Waiting for an opponent...' });
        }
      } catch (error) {
        console.error('Find match error:', error);
        socket.emit('error', { message: 'Failed to find match' });
      }
    });

    socket.on('cancel-match', () => {
      const index = waitingPlayers.findIndex(p => p.userId === socket.userId);
      if (index !== -1) {
        waitingPlayers.splice(index, 1);
        socket.emit('match-cancelled');
      }
    });

    socket.on('join-game', async (roomId) => {
      try {
        socket.join(roomId);

        if (!gameRooms.has(roomId)) {
          gameRooms.set(roomId, {
            id: roomId,
            players: [],
            gameState: null,
            playerReady: {}
          });
        }

        const room = gameRooms.get(roomId);

        if (!room.players.some(p => p.userId === socket.userId)) {
          room.players.push({
            userId: socket.userId,
            username: socket.username,
            socketId: socket.id
          });
        }

        room.playerReady[socket.userId] = false;

        if (room.players.length === 1) {
          const session = new GameSession({
            roomId,
            players: room.players.map(p => ({
              userId: p.userId,
              username: p.username
            })),
            gameState: { status: 'waiting' }
          });
          await session.save();
          room.sessionId = session._id;
        }

        io.to(roomId).emit('room-update', {
          players: room.players.map(p => p.username),
          playerCount: room.players.length
        });

        if (room.players.length === 2) {
          const gameState = initializeGame();
          room.gameState = gameState;

          await GameSession.findByIdAndUpdate(room.sessionId, {
            'gameState': { status: 'ready' },
            'startedAt': new Date()
          });

          io.to(roomId).emit('game-start', {
            roomId,
            players: room.players.map(p => ({
              userId: p.userId,
              username: p.username
            })),
            gameState
          });
        }
      } catch (error) {
        console.error('Join game error:', error);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });

    socket.on('player-ready', async (roomId) => {
      console.log(`[SERVER] player-ready from ${socket.username} (${socket.userId}), roomId: ${roomId}`);
      const room = gameRooms.get(roomId);
      if (!room) {
        console.log(`[SERVER] player-ready: room not found`);
        return;
      }

      room.playerReady[socket.userId] = true;
      const allReady = room.players.every(p => room.playerReady[p.userId]);
      console.log(`[SERVER] player-ready: playerReady=${JSON.stringify(room.playerReady)}, allReady=${allReady}, playerCount=${room.players.length}`);

      if (allReady && room.players.length === 2) {
        console.log(`[SERVER] player-ready: all ready! Starting game loop`);
        room.gameState.status = 'playing';
        io.to(roomId).emit('game-begin');

        await GameSession.findByIdAndUpdate(room.sessionId, {
          'gameState.status': 'playing'
        });

        startGameLoop(roomId, io);
      }
    });

    socket.on('player-move', ({ roomId, paddleY }) => {
      console.log(`[SERVER] player-move from ${socket.username} (${socket.userId}), roomId: ${roomId}, paddleY: ${paddleY}`);
      const room = gameRooms.get(roomId);
      if (!room || !room.gameState) {
        console.log(`[SERVER] player-move: room not found or no gameState`);
        return;
      }

      const playerIdx = room.players.findIndex(p => p.userId === socket.userId);
      console.log(`[SERVER] player-move: playerIdx=${playerIdx}, players=[${room.players.map(p => `${p.userId}(${p.username})`).join(', ')}]`);
      if (playerIdx === 0) {
        room.gameState.paddle1.y = paddleY;
      } else if (playerIdx === 1) {
        room.gameState.paddle2.y = paddleY;
      }
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.username} (${socket.userId})`);

      await User.findByIdAndUpdate(socket.userId, {
        isOnline: false,
        lastSeen: new Date()
      }).catch(console.error);

      const waitingIndex = waitingPlayers.findIndex(p => p.userId === socket.userId);
      if (waitingIndex !== -1) {
        waitingPlayers.splice(waitingIndex, 1);
      }

      io.emit('online-count', io.engine.clientsCount);

      for (const [roomId, room] of gameRooms) {
        const playerIndex = room.players.findIndex(p => p.userId === socket.userId);
        if (playerIndex !== -1) {
          const disconnectedPlayer = room.players[playerIndex];
          room.players.splice(playerIndex, 1);
          delete room.playerReady[socket.userId];

          stopGameLoop(roomId);

          if (room.gameState && room.gameState.status === 'playing') {
            const winner = room.players[0];
            room.gameState.status = 'finished';

            io.to(roomId).emit('game-over', {
              winner: winner.userId.toString(),
              score: room.gameState.score,
              disconnected: disconnectedPlayer.username
            });

            User.findById(winner.userId).then(user => {
              if (user) user.updateStats('win', room.gameState.score.player1 || room.gameState.score.player2);
            }).catch(console.error);

            GameSession.findOneAndUpdate(
              { roomId },
              {
                winner: winner.userId,
                endedAt: new Date(),
                duration: 60,
                'gameState.status': 'finished'
              }
            ).catch(console.error);

            io.emit('leaderboard-update');
          } else {
            io.to(roomId).emit('player-disconnected', {
              username: socket.username
            });
          }

          gameRooms.delete(roomId);
          break;
        }
      }
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
};

module.exports = { setupSocket };
