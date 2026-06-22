import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useGameStore } from '../../stores/gameStore';
import { getSocket } from '../../hooks/useSocket';
import Layout from '../common/Layout';
import StatsCard from './StatsCard';
import ActionsCard from './ActionsCard';
import Avatar from '../common/Avatar';
import { Trophy, Zap, Users, Clock, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const PADDLE_HEIGHT = 120;

const Lobby = () => {
  const navigate = useNavigate();
  const { user, token, fetchProfile } = useAuthStore();
  const {
    setRoomId, setConnecting, setPlayers, setGameState,
    setGameReady, setSinglePlayer, isSearching, setSearching
  } = useGameStore();
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (token) {
      fetchProfile();
      fetchHistory();
    }
  }, [token]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/game/history');
      setHistory(response.data.history || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  useEffect(() => {
    if (!token) return;
    const s = getSocket(token);

    s.on('online-count', (count) => {
      setOnlineUsers(count);
    });

    return () => {
      s.off('online-count');
    };
  }, [token]);

  const handleFindMatch = () => {
    if (!token) return;
    const s = getSocket(token);
    setSearching(true);
    s.emit('find-match');
    toast.loading('Searching for opponent...', { id: 'waiting' });

    const onGameStart = (data) => {
      toast.dismiss('waiting');
      setSearching(false);
      s.off('game-start', onGameStart);
      s.off('match-cancelled', onCancel);
      navigate('/game', { state: { gameData: data } });
    };

    const onCancel = () => {
      setSearching(false);
      s.off('game-start', onGameStart);
      s.off('match-cancelled', onCancel);
    };

    s.on('game-start', onGameStart);
    s.on('match-cancelled', onCancel);
  };

  const handleCancelMatch = () => {
    const s = getSocket(token);
    setSearching(false);
    s.emit('cancel-match');
    toast.dismiss('waiting');
    toast.error('Matchmaking cancelled');
  };

  const handleQuickPlay = () => {
    const initialGameState = {
      ball: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, dx: 4, dy: 3 },
      paddle1: { y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2 },
      paddle2: { y: (CANVAS_HEIGHT - PADDLE_HEIGHT) / 2 },
      score: { player1: 0, player2: 0 },
      speed: 4
    };

    setSinglePlayer(true);
    setPlayers([
      { userId: user?.id, username: user?.username },
      { userId: 'cpu', username: 'Computer' }
    ]);
    setGameState(initialGameState);
    setGameReady(true);
    navigate('/game');
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getGameResult = (session) => {
    const myId = user?.id || user?._id;
    const myIdStr = myId?.toString();
    const myPlayer = session.players.find(p => {
      const pid = typeof p.userId === 'object' ? p.userId?._id?.toString() || p.userId?.toString() : p.userId?.toString();
      return pid === myIdStr;
    });
    if (!myPlayer) return 'draw';

    if (session.winner) {
      const winnerId = typeof session.winner === 'object' ? session.winner?._id?.toString() || session.winner?.toString() : session.winner?.toString();
      return myIdStr === winnerId ? 'win' : 'loss';
    }

    const myScore = myPlayer.score || 0;
    const otherPlayer = session.players.find(p => {
      const pid = typeof p.userId === 'object' ? p.userId?._id?.toString() || p.userId?.toString() : p.userId?.toString();
      return pid !== myIdStr;
    });
    if (!otherPlayer) {
      const cpuPlayer = session.players.find(p => (p.username || '').toLowerCase() === 'computer');
      if (cpuPlayer) {
        const cpuScore = cpuPlayer.score || 0;
        if (myScore > cpuScore) return 'win';
        if (myScore < cpuScore) return 'loss';
      }
      return 'draw';
    }
    const otherScore = otherPlayer.score || 0;
    if (myScore > otherScore) return 'win';
    if (myScore < otherScore) return 'loss';
    return 'draw';
  };

  const getOpponent = (session) => {
    const myId = user?.id || user?._id;
    const myIdStr = myId?.toString();
    const opponent = session.players.find(p => {
      const pid = typeof p.userId === 'object' ? p.userId?._id?.toString() || p.userId?.toString() : p.userId?.toString();
      return pid !== myIdStr;
    });
    if (opponent) return opponent.username;
    const cpuPlayer = session.players.find(p => (p.username || '').toLowerCase() === 'computer');
    if (cpuPlayer) return 'Computer';
    return 'Unknown';
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Avatar src={user?.avatar} username={user?.username} size="lg" />
            <div>
              <h1 className="text-3xl font-bold text-primary">
                Welcome, <span className="text-accent">{user?.username}</span>!
              </h1>
              <p className="text-gray-400">Find a match and start playing</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard
            icon={<Trophy className="w-6 h-6 text-accent" />}
            label="Wins"
            value={user?.stats?.wins || 0}
          />
          <StatsCard
            icon={<Zap className="w-6 h-6 text-secondary" />}
            label="Win Rate"
            value={`${user?.stats?.totalGames > 0 
              ? Math.round((user.stats.wins / user.stats.totalGames) * 100) 
              : 0}%`}
          />
          <StatsCard
            icon={<Users className="w-6 h-6 text-tertiary" />}
            label="Games Played"
            value={user?.stats?.totalGames || 0}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <ActionsCard
            title="Find Match"
            description="Get matched with another player for a 1v1 game"
            buttonText="Find Match"
            buttonAction={handleFindMatch}
            buttonColor="accent"
            isSearching={isSearching}
            onCancel={handleCancelMatch}
          />
          <ActionsCard
            title="Quick Play"
            description="Practice against the computer"
            buttonText="Play vs Computer"
            buttonAction={handleQuickPlay}
            buttonColor="secondary"
          />
        </div>

        {history.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-primary mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Recent Matches
            </h2>
            <div className="space-y-2">
              {history.slice(0, 10).map((session) => {
                const result = getGameResult(session);
                return (
                  <div
                    key={session._id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      result === 'win'
                        ? 'bg-green-500/10 border-green-500/30'
                        : result === 'loss'
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-dark/50 border-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {result === 'win' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : result === 'loss' ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-600" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-primary">
                          vs {getOpponent(session)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(session.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        result === 'win' ? 'text-green-500' : result === 'loss' ? 'text-red-500' : 'text-gray-500'
                      }`}>
                        {result === 'win' ? 'WIN' : result === 'loss' ? 'LOSE' : 'DRAW'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session.players[0]?.score || 0} - {session.players[1]?.score || 0}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="text-center">
          <p className="text-gray-500 text-sm">
            {onlineUsers > 0 ? (
              <>
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                {onlineUsers} player{onlineUsers !== 1 ? 's' : ''} online
              </>
            ) : (
              'Connecting to server...'
            )}
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Lobby;
