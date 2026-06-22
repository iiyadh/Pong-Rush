export const CANVAS = {
  WIDTH: 800,
  HEIGHT: 600,
  PADDLE: {
    WIDTH: 12,
    HEIGHT: 120,
    SPEED: 6
  },
  BALL: {
    SIZE: 12,
    SPEED: 4
  }
};

export const GAME = {
  WIN_SCORE: 11,
  MAX_PLAYERS: 2
};

export const SOCKET_EVENTS = {
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

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout'
  },
  GAME: {
    STATS: '/game/stats',
    LEADERBOARD: '/game/leaderboard'
  }
};

export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme'
};
