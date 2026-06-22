import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-dark via-dark to-gray-900">
      <div className="text-center">
        <div className="w-24 h-24 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl">🏓</span>
        </div>
        <h1 className="text-7xl font-bold text-accent mb-4">404</h1>
        <p className="text-xl text-gray-400 mb-8">
          This page got served out of bounds.
        </p>
        <Link
          to="/lobby"
          className="btn-primary inline-flex items-center gap-2"
        >
          Back to Lobby
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
