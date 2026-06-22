import { createRoot } from 'react-dom/client';
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';

import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Lobby from './components/lobby/Lobby';
import Game from './components/game/Game';
import Leaderboard from './components/leaderboard/Leaderboard';
import Profile from './components/profile/Profile';
import NotFound from './components/common/NotFound';
import Privacy from './components/common/Privacy';
import Terms from './components/common/Terms';
import Contact from './components/common/Contact';
import PrivateRoute from './components/auth/PrivateRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/lobby" replace />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/reset-password/:token',
    element: <ResetPassword />,
  },
  {
    path: '/lobby',
    element: (
      <PrivateRoute>
        <Lobby />
      </PrivateRoute>
    ),
  },
  {
    path: '/game',
    element: (
      <PrivateRoute>
        <Game />
      </PrivateRoute>
    ),
  },
  {
    path: '/leaderboard',
    element: (
      <PrivateRoute>
        <Leaderboard />
      </PrivateRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <PrivateRoute>
        <Profile />
      </PrivateRoute>
    ),
  },
  {
    path: '/privacy',
    element: <Privacy />,
  },
  {
    path: '/terms',
    element: <Terms />,
  },
  {
    path: '/contact',
    element: <Contact />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);

createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#1a1a2e',
          color: '#fff',
          border: '1px solid #333',
          borderRadius: '12px',
        },
        success: {
          iconTheme: {
            primary: '#ff8906',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#f25f4c',
            secondary: '#fff',
          },
        },
      }}
    />
    <RouterProvider router={router} />
  </ErrorBoundary>
);
