import { useAuthStore } from '../../stores/authStore';
import { Trophy, RotateCcw, LogOut, Star } from 'lucide-react';

const GameOver = ({ winner, score, players, onPlayAgain, onLeave }) => {
  const { user } = useAuthStore();
  const isWinner = winner === user?.id;
  const winnerPlayer = players.find(p => p.userId === winner);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-dark via-dark to-gray-900">
      <div className="card w-full max-w-md text-center animate-slide-up">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 ${
          isWinner ? 'bg-accent/20' : 'bg-secondary/20'
        }`}>
          {isWinner ? (
            <Trophy className="w-10 h-10 text-accent animate-float" />
          ) : (
            <Star className="w-10 h-10 text-secondary" />
          )}
        </div>

        <h1 className={`text-3xl font-bold mb-2 ${
          isWinner ? 'text-accent' : 'text-secondary'
        }`}>
          {isWinner ? 'You Won!' : 'You Lost!'}
        </h1>
        
        <p className="text-gray-400 mb-6">
          {winnerPlayer?.username || 'Unknown Player'} wins the match
        </p>

        <div className="flex items-center justify-center gap-8 mb-8">
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">{players[0]?.username || 'Player 1'}</p>
            <p className="text-4xl font-bold text-accent">{score.player1}</p>
          </div>
          <div className="text-2xl text-gray-600">-</div>
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-1">{players[1]?.username || 'Player 2'}</p>
            <p className="text-4xl font-bold text-secondary">{score.player2}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={onPlayAgain} className="btn-primary flex items-center justify-center gap-2">
            <RotateCcw className="w-5 h-5" />
            Back to Lobby
          </button>
          <button onClick={onLeave} className="btn-outline flex items-center justify-center gap-2">
            <LogOut className="w-5 h-5" />
            Leave
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
