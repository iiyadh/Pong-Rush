const Avatar = ({ src, username, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-20 h-20 text-3xl',
  };

  if (src) {
    return (
      <img
        src={src}
        alt={username || 'User'}
        className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0`}
      />
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-gradient-accent flex items-center justify-center text-dark font-bold flex-shrink-0`}>
      {username?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
};

export default Avatar;
