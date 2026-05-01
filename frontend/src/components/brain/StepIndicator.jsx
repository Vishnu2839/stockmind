export default function StepIndicator({ currentStep, isDone }) {
  const steps = [
    { num: 1, label: 'Evidence Gathering' },
    { num: 2, label: 'Signal Reading' },
    { num: 3, label: 'Conflict Analysis' },
    { num: 4, label: 'Pattern Memory' },
    { num: 5, label: 'Final Verdict' },
  ];

  return (
    <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
      {steps.map((s) => {
        const done = isDone || currentStep > s.num;
        const active = currentStep === s.num;
        const waiting = !done && !active;

        return (
          <div key={s.num} className="flex items-center gap-1 shrink-0">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
              done ? 'bg-green/20 text-green' :
              active ? 'bg-purple/20 text-purple2 animate-pulse' :
              'bg-bg3 text-text3'
            }`}>
              {done ? '✓' : active ? '●' : '○'}
            </div>
            <span className={`text-[10px] ${done ? 'text-green' : active ? 'text-purple2' : 'text-text3'}`}>
              {s.label}
            </span>
            {s.num < 5 && <span className="text-text3 text-[10px] mx-0.5">→</span>}
          </div>
        );
      })}
    </div>
  );
}
