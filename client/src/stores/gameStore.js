import { create } from 'zustand';

export const useGameStore = create((set, get) => ({
  roomId: null,
  gameState: null,
  isGameStarted: false,
  isGameReady: false,
  players: [],
  score: { player1: 0, player2: 0 },
  gameOver: false,
  winner: null,
  disconnected: null,
  isConnecting: false,
  isSinglePlayer: false,
  isSearching: false,

  setRoomId: (roomId) => set({ roomId }),
  setGameState: (gameState) => {
    if (gameState) {
      set({ 
        gameState,
        score: gameState.score
      });
    }
  },
  setGameStarted: (started) => set({ isGameStarted: started }),
  setGameReady: (ready) => set({ isGameReady: ready }),
  setPlayers: (players) => set({ players }),
  setGameOver: (gameOver, winner = null, disconnected = null) => set({ gameOver, winner, disconnected }),
  setConnecting: (isConnecting) => set({ isConnecting }),
  setSinglePlayer: (isSinglePlayer) => set({ isSinglePlayer }),
  setSearching: (isSearching) => set({ isSearching }),
  
  resetGame: () => set({
    roomId: null,
    gameState: null,
    isGameStarted: false,
    isGameReady: false,
    players: [],
    score: { player1: 0, player2: 0 },
    gameOver: false,
    winner: null,
    disconnected: null,
    isConnecting: false,
    isSinglePlayer: false,
    isSearching: false
  }),
  
  updateScore: (player, value) => {
    set((state) => ({
      score: {
        ...state.score,
        [player]: value
      }
    }));
  }
}));
