import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const COOKIE_KEY = 'cookie-consent';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(COOKIE_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-dark/95 backdrop-blur-sm border-t border-gray-800">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="text-sm text-gray-300 flex-1">
          We use essential cookies for authentication and preferences. No tracking cookies are used without your consent.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={accept} className="btn-primary text-sm px-4 py-2">
            Accept
          </button>
          <button onClick={decline} className="btn-outline text-sm px-4 py-2">
            Decline
          </button>
          <button onClick={decline} className="p-2 text-gray-500 hover:text-primary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
