import { Link } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark via-dark to-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link to="/lobby" className="inline-flex items-center gap-2 text-accent hover:underline mb-8">
          <ArrowLeft className="w-4 h-4" />
          Back to Lobby
        </Link>

        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-8 h-8 text-accent" />
            <h1 className="text-3xl font-bold text-primary">Terms of Service</h1>
          </div>

          <div className="space-y-6 text-gray-300 text-sm leading-relaxed">
            <section>
              <h2 className="text-lg font-semibold text-primary mb-2">1. Acceptance of Terms</h2>
              <p>By creating an account and using Pong Rush, you agree to these Terms of Service. If you do not agree, do not use the service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-primary mb-2">2. User Accounts</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials. You must not share your account or use another user's account. You must be at least 13 years old to use this service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-primary mb-2">3. Acceptable Use</h2>
              <p>You agree not to exploit bugs, use automated tools (bots), harass other players, or engage in any activity that disrupts the game experience for others. We reserve the right to suspend or terminate accounts that violate these rules.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-primary mb-2">4. Intellectual Property</h2>
              <p>The game, its code, design, and branding are owned by Pong Rush. You may not copy, modify, or distribute the game or its assets without permission.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-primary mb-2">5. Limitation of Liability</h2>
              <p>Pong Rush is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from your use of the service.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-primary mb-2">6. Changes to Terms</h2>
              <p>We may update these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
            </section>

            <p className="text-gray-500 text-xs mt-8">Last updated: June 22, 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;
