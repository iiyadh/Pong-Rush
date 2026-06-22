import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import Layout from '../common/Layout';
import { ArrowLeft, Trophy, Zap, Target, Flame, Award, Calendar, TrendingUp, X, Camera } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadToCloudinary } from '../../utils/cloudinary';

const Profile = () => {
  const { user, fetchProfile, updateUsername, updatePassword, updateAvatar } = useAuthStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const stats = user?.stats || {};
  const winRate = stats.totalGames > 0
    ? Math.round((stats.wins / stats.totalGames) * 100)
    : 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setUploading(true);
    try {
      const data = await uploadToCloudinary(file, 'avatars', user?.id || user?._id);

      if (data.error) {
        throw new Error(data.error.message);
      }

      await updateAvatar(data.secure_url);
      toast.success('Profile picture updated!');
    } catch (err) {
      toast.error(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleUsernameChange = async (e) => {
    e.preventDefault();
    if (newUsername.trim() === user?.username) {
      setShowUsernameModal(false);
      return;
    }
    setLoading(true);
    try {
      await updateUsername(newUsername.trim());
      toast.success('Username updated!');
      setShowUsernameModal(false);
      setNewUsername('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await updatePassword(currentPassword, newPassword);
      toast.success('Password updated!');
      setShowPasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openUsernameModal = () => {
    setNewUsername(user?.username || '');
    setShowUsernameModal(true);
  };

  const openPasswordModal = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordModal(true);
  };

  const statCards = [
    { icon: <Trophy className="w-5 h-5 text-green-500" />, label: 'Wins', value: stats.wins || 0, color: 'text-green-500', bg: 'bg-green-500/10' },
    { icon: <Zap className="w-5 h-5 text-red-500" />, label: 'Losses', value: stats.losses || 0, color: 'text-red-500', bg: 'bg-red-500/10' },
    { icon: <Target className="w-5 h-5 text-accent" />, label: 'Total Games', value: stats.totalGames || 0, color: 'text-accent', bg: 'bg-accent/10' },
    { icon: <TrendingUp className="w-5 h-5 text-tertiary" />, label: 'Win Rate', value: `${winRate}%`, color: 'text-tertiary', bg: 'bg-tertiary/10' },
    { icon: <Flame className="w-5 h-5 text-orange-500" />, label: 'Win Streak', value: stats.winStreak || 0, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { icon: <Award className="w-5 h-5 text-yellow-500" />, label: 'Best Streak', value: stats.maxWinStreak || 0, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  ];

  return (
    <Layout>
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/lobby"
            className="p-2 text-gray-400 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-primary">Profile</h1>
            <p className="text-gray-400 mt-1">Your account and stats</p>
          </div>
        </div>

        <div className="card mb-8">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <button
                onClick={handleAvatarClick}
                className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0 focus:outline-none"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-accent flex items-center justify-center text-dark text-3xl font-bold">
                    {user?.username?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
              </button>
              <div
                onClick={handleAvatarClick}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-primary">{user?.username}</h2>
              <p className="text-gray-400">{user?.email}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Joined {formatDate(user?.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mb-8">
          <button onClick={openUsernameModal} className="btn-outline flex-1">
            Change Username
          </button>
          <button onClick={openPasswordModal} className="btn-outline flex-1">
            Change Password
          </button>
        </div>

        <h3 className="text-lg font-bold text-primary mb-4">Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {statCards.map((stat) => (
            <div key={stat.label} className="card text-center">
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-2 ${stat.bg}`}>
                {stat.icon}
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-4">
          <button onClick={() => navigate('/lobby')} className="btn-primary flex-1">
            Play a Match
          </button>
          <button onClick={() => navigate('/leaderboard')} className="btn-outline flex-1">
            View Leaderboard
          </button>
        </div>
      </div>

      {showUsernameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUsernameModal(false)} />
          <div className="card w-full max-w-md relative z-10 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-primary">Change Username</h2>
              <button onClick={() => setShowUsernameModal(false)} className="p-1 text-gray-400 hover:text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleUsernameChange}>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">New Username</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="input-field"
                  minLength={3}
                  maxLength={20}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowUsernameModal(false)} className="btn-outline flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={loading || newUsername.trim() === user?.username} className="btn-primary flex-1">
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="card w-full max-w-md relative z-10 animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-primary">Change Password</h2>
              <button onClick={() => setShowPasswordModal(false)} className="p-1 text-gray-400 hover:text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePasswordChange}>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  minLength={6}
                  required
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  minLength={6}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="btn-outline flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Profile;
