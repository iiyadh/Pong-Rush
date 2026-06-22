const StatsCard = ({ icon, label, value }) => {
  return (
    <div className="card text-center">
      <div className="flex items-center justify-center mb-3">
        {icon}
      </div>
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
};

export default StatsCard;
