import { useState, useEffect } from 'react';

export default function AccuracyPanel({ fullAcc = 74.2, baseAcc = 61.3, improvement = 12.9 }) {
  const [animate, setAnimate] = useState(false);
  useEffect(() => { setTimeout(() => setAnimate(true), 300); }, []);

  const bars = [
    { label: 'StockMind (Full)', value: fullAcc, color: '#10b981' },
    { label: 'Price Only', value: baseAcc, color: '#8888aa' },
    { label: 'Random Guess', value: 50, color: '#44445a' },
  ];

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-bold text-text mb-1">Why StockMind is more accurate</h3>
      <p className="text-xs text-text3 mb-4">Emotion signals improve prediction by <span className="text-green font-bold">+{improvement.toFixed(1)}%</span></p>
      <div className="space-y-3">
        {bars.map((b, i) => (
          <div key={i}>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-text2">{b.label}</span>
              <span className="text-xs font-mono font-bold" style={{ color: b.color }}>{b.value.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 bg-bg3 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: animate ? `${b.value}%` : '0%',
                  backgroundColor: b.color,
                  transitionDelay: `${i * 200}ms`
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
