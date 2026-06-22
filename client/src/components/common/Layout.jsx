import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Trophy, LogOut } from 'lucide-react';
import Avatar from './Avatar';
import CookieConsent from './CookieConsent';
import Logo from '../../assets/logo.png';


const Layout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <nav className="border-b border-gray-800 bg-dark/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/lobby" className="flex items-center gap-3">
              <img src={Logo} alt="Ping Pong Logo" className="w-16 h-16" />
              <span className="text-xl font-bold text-accent">Ping Pong</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                to="/lobby"
                className={`px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === '/lobby'
                    ? 'bg-accent/20 text-accent'
                    : 'text-gray-400 hover:text-primary hover:bg-white/5'
                }`}
              >
                Lobby
              </Link>
              <Link
                to="/leaderboard"
                className={`px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === '/leaderboard'
                    ? 'bg-accent/20 text-accent'
                    : 'text-gray-400 hover:text-primary hover:bg-white/5'
                }`}
              >
                <Trophy className="w-4 h-4 inline mr-1" />
                Leaderboard
              </Link>

              <div className="flex items-center gap-3 ml-4 pl-4 border-l border-gray-800">
                <Link
                  to="/profile"
                  className={`flex items-center gap-2 transition-colors ${
                    location.pathname === '/profile'
                      ? 'text-accent'
                      : 'text-gray-400 hover:text-primary'
                  }`}
                >
                  <Avatar src={user?.avatar} username={user?.username} size="sm" />
                  <span className="text-sm">{user?.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-secondary transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-gray-800 bg-dark/80 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} Pong Rush. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="text-sm text-gray-400 hover:text-accent transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-gray-400 hover:text-accent transition-colors">
                Terms of Service
              </Link>
              <Link to="/contact" className="text-sm text-gray-400 hover:text-accent transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>

      <CookieConsent />
    </div>
  );
};

export default Layout;
