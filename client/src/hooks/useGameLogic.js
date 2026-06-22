import { useEffect, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';
import { getSocket } from './useSocket';
import { SOCKET_EVENTS } from '../utils/constants';

const useGameLogic = () => {
  const token = useAuthStore((state) => state.token);
  const {
    roomId,
    setGameState,
    setGameStarted,
    setGameReady,
    setPlayers,
    setGameOver,
    setRoomId,
  } = useGameStore();

  const socket = token ? getSocket(token) : null;

  useEffect(() => {
    if (!socket) return;

    socket.on(SOCKET_EVENTS.GAME_START, (data) => {
      setPlayers(data.players);
      setGameState(data.gameState);
      setGameReady(true);
    });

    socket.on('game-begin', () => {
      setGameStarted(true);
    });

    socket.on(SOCKET_EVENTS.GAME_UPDATE, (gameState) => {
      setGameState(gameState);
    });

    socket.on('game-state', (gameState) => {
      setGameState(gameState);
    });

    socket.on(SOCKET_EVENTS.GAME_OVER, (data) => {
      setGameOver(true, data.winner);
    });

    socket.on('player-disconnected', () => {
      setGameOver(true, null);
    });

    socket.on('room-update', (data) => {
      setPlayers(data.players.map(p => ({ username: p })));
    });

    return () => {
      socket.off(SOCKET_EVENTS.GAME_START);
      socket.off('game-begin');
      socket.off(SOCKET_EVENTS.GAME_UPDATE);
      socket.off('game-state');
      socket.off(SOCKET_EVENTS.GAME_OVER);
      socket.off('player-disconnected');
      socket.off('room-update');
    };
  }, [socket]);

  const joinGame = useCallback((roomId) => {
    if (socket) {
      setRoomId(roomId);
      socket.emit(SOCKET_EVENTS.JOIN_GAME, roomId);
    }
  }, [socket, setRoomId]);

  const sendMove = useCallback((paddleY) => {
    if (socket && roomId) {
      socket.emit('game-move', { roomId, paddleY });
    }
  }, [socket, roomId]);

  const sendGameState = useCallback((gameState) => {
    if (socket && roomId) {
      socket.emit(SOCKET_EVENTS.GAME_UPDATE, { roomId, gameState });
    }
  }, [socket, roomId]);

  const playerReady = useCallback(() => {
    if (socket && roomId) {
      socket.emit('player-ready', roomId);
    }
  }, [socket, roomId]);

  return {
    joinGame,
    sendMove,
    sendGameState,
    playerReady,
    socket,
    roomId
  };
};

export default useGameLogic;
