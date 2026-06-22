import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-dark to-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/lobby" className="inline-flex items-center gap-2 text-accent hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Lobby
        </Link>

        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold text-primary">Privacy Policy</h1>
          </div>

          <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-primary mb-2">1. Information We Collect</h2>
              <p>We collect information you provide when creating an account, including your username, email address, and avatar image. We also collect game statistics such as match results, scores, and leaderboard positions.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-primary mb-2">2. How We Use Your Information</h2>
              <p>Your information is used to provide and improve the game experience, including matchmaking, leaderboards, account management, and customer support. We do not sell your personal data to third parties.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-primary mb-2">3. Data Storage</h2>
              <p>Your account data and game history are stored securely on our servers. Passwords are hashed and never stored in plain text. You may request deletion of your account and associated data at any time.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-primary mb-2">4. Cookies</h2>
              <p>We use essential cookies for authentication (JWT tokens) and local storage for user preferences. No tracking cookies are used unless you opt in to analytics.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-primary mb-2">5. Third-Party Services</h2>
              <p>We use Cloudinary for avatar image hosting. Images uploaded are subject to Cloudinary's privacy policy. We do not share personal data with any other third parties.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-primary mb-2">6. Contact</h2>
              <p>For privacy-related inquiries, please contact us through our support page.</p>
            </section>

            <p className="text-gray-500 text-xs mt-8">Last updated: June 22, 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
