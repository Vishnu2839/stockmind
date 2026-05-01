const API = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export async function fetchAnalysis(ticker) {
  const res = await fetch(`${API}/analyze?ticker=${ticker}`);
  if (!res.ok) throw new Error(`Analysis failed: ${res.status}`);
  return res.json();
}

export async function fetchHistorical(ticker, days = 365) {
  const res = await fetch(`${API}/historical?ticker=${ticker}&days=${days}`);
  if (!res.ok) throw new Error(`Historical failed: ${res.status}`);
  return res.json();
}

export async function fetchBacktest(ticker) {
  const res = await fetch(`${API}/backtest?ticker=${ticker}`);
  if (!res.ok) throw new Error(`Backtest failed: ${res.status}`);
  return res.json();
}

export async function fetchCompare(ticker) {
  const res = await fetch(`${API}/compare?ticker=${ticker}`);
  if (!res.ok) throw new Error(`Compare failed: ${res.status}`);
  return res.json();
}

export async function fetchNews(ticker) {
  const res = await fetch(`${API}/news?ticker=${ticker}`);
  if (!res.ok) throw new Error(`News failed: ${res.status}`);
  return res.json();
}

export async function fetchSearch(query) {
  const res = await fetch(`${API}/search?q=${query}`);
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return res.json();
}

export async function fetchWatchlist(tickers = 'AAPL,TSLA,NVDA,MSFT,GOOGL') {
  const res = await fetch(`${API}/watchlist?tickers=${tickers}`);
  if (!res.ok) throw new Error(`Watchlist failed: ${res.status}`);
  return res.json();
}

export async function fetchHealth() {
  const res = await fetch(`${API}/health`);
  if (!res.ok) throw new Error(`Health failed: ${res.status}`);
  return res.json();
}

export function streamThinking(ticker, timeframe = '1M', onWord, onDone) {
  const eventSource = new EventSource(`${API}/think?ticker=${ticker}&timeframe=${timeframe}`);
  eventSource.onmessage = (event) => {
    const data = event.data;
    if (data === '[DONE]') {
      eventSource.close();
      if (onDone) onDone();
    } else {
      if (onWord) onWord(data);
    }
  };
  eventSource.onerror = () => {
    eventSource.close();
    if (onDone) onDone();
  };
  return eventSource;
}
