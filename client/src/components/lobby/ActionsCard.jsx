import { Loader2, X } from 'lucide-react';

const ActionsCard = ({ title, description, buttonText, buttonAction, buttonColor, isSearching, onCancel }) => {
  const colorClasses = {
    accent: 'btn-primary',
    secondary: 'btn-secondary',
  };

  return (
    <div className="card flex justify-between flex-col p-6 w-full max-w-sm bg-dark/50 border border-gray-800 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-primary mb-2">{title}</h3>
      <p className="text-gray-400 mb-6">{description}</p>
      {isSearching ? (
        <div className="flex gap-2">
          <button
            disabled
            className="flex-1 btn-secondary flex items-center justify-center gap-2 opacity-70 cursor-not-allowed"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
            Searching...
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2.5 bg-gray-700 text-primary font-semibold rounded-lg
                       transition-all duration-300 hover:bg-gray-600
                       flex items-center justify-center gap-1"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={buttonAction}
          className={`${colorClasses[buttonColor] || 'btn-primary'} w-full flex items-center justify-center gap-2`}
        >
          {buttonText}
        </button>
      )}
    </div>
  );
};

export default ActionsCard;
