import StepIndicator from './StepIndicator';
import ThinkingStream from './ThinkingStream';

export default function AIBrainPanel({ stream, onStart, ticker }) {
  const { text, currentStep, isStreaming, isDone, startStream } = stream;

  const handleStart = () => {
    if (ticker && startStream) {
      startStream(ticker);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="pulse-dot bg-purple"></div>
        <h3 className="text-sm font-bold text-text">StockMind AI Brain</h3>
        <span className="text-[10px] text-text3">— thinking out loud</span>
      </div>

      {!isStreaming && !isDone && currentStep === 0 && (
        <button
          onClick={handleStart}
          className="w-full py-3 bg-gradient-to-r from-purple to-teal rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity"
        >
          🧠 Start AI Analysis
        </button>
      )}

      {(isStreaming || isDone || currentStep > 0) && (
        <>
          <StepIndicator currentStep={currentStep} isDone={isDone} />
          <ThinkingStream text={text} />
          {isStreaming && (
            <div className="mt-3">
              <div className="h-1 bg-bg3 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple to-teal rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(currentStep / 5 * 100, 100)}%` }}
                />
              </div>
              <p className="text-[10px] text-text3 mt-1">{Math.min(currentStep / 5 * 100, 100).toFixed(0)}% complete</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
