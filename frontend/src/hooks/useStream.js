import { useState, useCallback, useRef } from 'react';

export function useStream() {
  const [text, setText] = useState('');
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const sourceRef = useRef(null);

  const startStream = useCallback((ticker, timeframe = '1M') => {
    setText('');
    setSteps([]);
    setCurrentStep(0);
    setIsStreaming(true);
    setIsDone(false);

    const API = import.meta.env.VITE_API_URL || 'http://localhost:8001';
    const es = new EventSource(`${API}/think?ticker=${ticker}&timeframe=${timeframe}`);
    sourceRef.current = es;

    es.onmessage = (event) => {
      const d = event.data;
      if (d === '[DONE]') {
        es.close();
        setIsStreaming(false);
        setIsDone(true);
        setCurrentStep(6);
        return;
      }
      // Handle step markers
      const stepMatch = d.match(/\[STEP\](\d+)\[\/STEP\]/);
      if (stepMatch) {
        const stepNum = parseInt(stepMatch[1]);
        setCurrentStep(stepNum);
        setSteps(prev => [...prev, stepNum]);
        return;
      }
      setText(prev => prev + d);
    };

    es.onerror = () => {
      es.close();
      setIsStreaming(false);
      setIsDone(true);
    };
  }, []);

  const stopStream = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.close();
      setIsStreaming(false);
    }
  }, []);

  return { text, currentStep, isStreaming, isDone, startStream, stopStream, steps };
}
