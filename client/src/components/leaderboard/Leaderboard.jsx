import { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../common/Layout';
import Avatar from '../common/Avatar';
import { Trophy, Medal, Crown, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getSocket } from '../../hooks/useSocket';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuthStore();

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get('/leaderboard');
      setLeaderboard(response.data.leaderboard);
    } catch (err) {
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    if (!token) return;
    const socket = getSocket(token);

    socket.on('leaderboard-update', () => {
      fetchLeaderboard();
    });

    return () => {
      socket.off('leaderboard-update');
    };
  }, [token]);

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Crown className="w-5 h-5 text-yellow-500" />;
      case 1:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 2:
        return <Medal className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-gray-500 w-5 text-center">{index + 1}</span>;
    }
  };

  const getRankBg = (index) => {
    switch (index) {
      case 0:
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 1:
        return 'bg-gray-400/10 border-gray-400/30';
      case 2:
        return 'bg-amber-600/10 border-amber-600/30';
      default:
        return 'bg-dark/50 border-gray-800';
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/lobby"
            className="p-2 text-gray-400 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
              <Trophy className="w-8 h-8 text-accent" />
              Leaderboard
            </h1>
            <p className="text-gray-400 mt-1">Top players ranked by wins</p>
          </div>
        </div>

        {loading ? (
          <div className="card text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading leaderboard...</p>
          </div>
        ) : error ? (
          <div className="card text-center py-12">
            <p className="text-secondary mb-4">{error}</p>
            <button onClick={fetchLeaderboard} className="btn-primary">
              Try Again
            </button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="card text-center py-12">
            <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-primary mb-2">No Games Played Yet</h3>
            <p className="text-gray-400 mb-6">Be the first to appear on the leaderboard!</p>
            <Link to="/lobby" className="btn-primary">
              Start Playing
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboard.map((player, index) => (
              <div
                key={player._id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:scale-[1.01] ${getRankBg(index)}`}
              >
                <div className="flex-shrink-0 w-8">
                  {getRankIcon(index)}
                </div>
                
                <div className="flex items-center gap-3 flex-grow">
                  <Avatar src={player.avatar} username={player.username} size="md" />
                  <div>
                    <p className="font-bold text-primary">{player.username}</p>
                    <p className="text-sm text-gray-400">
                      {player.stats.totalGames} games played
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-center">
                  <div>
                    <p className="text-lg font-bold text-accent">{player.stats.wins}</p>
                    <p className="text-xs text-gray-500">Wins</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-secondary">{player.stats.losses}</p>
                    <p className="text-xs text-gray-500">Losses</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-primary">
                      {player.winRate || 0}%
                    </p>
                    <p className="text-xs text-gray-500">Win Rate</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Leaderboard;
