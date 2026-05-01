export default function ConfidenceRing({ value = 65, size = 80, color = '#7c3aed' }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} stroke="#1a1a35" strokeWidth="4" fill="none" />
        <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth="4" fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <span className="absolute text-sm font-mono font-bold" style={{ color }}>{value}%</span>
    </div>
  );
}
