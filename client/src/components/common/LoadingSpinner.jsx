const LoadingSpinner = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-accent mx-auto"></div>
        <p className="text-primary mt-4 animate-pulse">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
