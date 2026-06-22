const CANVAS = {
  WIDTH: 800,
  HEIGHT: 600,
  PADDLE: {
    WIDTH: 12,
    HEIGHT: 120,
    SPEED: 6
  },
  BALL: {
    SIZE: 12,
    SPEED: 4,
    MAX_SPEED: 10
  }
};

const GAME = {
  WIN_SCORE: 11,
  MAX_PLAYERS: 2,
  SPEED_INCREMENT: 0.5
};

const SOCKET_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_GAME: 'join-game',
  GAME_START: 'game-start',
  GAME_UPDATE: 'game-update',
  GAME_OVER: 'game-over',
  PLAYER_MOVE: 'player-move',
  OPPONENT_MOVE: 'opponent-move',
  ROOM_UPDATE: 'room-update'
};

module.exports = { CANVAS, GAME, SOCKET_EVENTS };
