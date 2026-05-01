import { useState, useEffect, useRef } from 'react';
import { usePortfolio } from '../../hooks/usePortfolio';
import { fetchWatchlist } from '../../api/stockApi';

export default function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I am your StockMind Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const { balance, holdings } = usePortfolio();
  const [marketData, setMarketData] = useState([]);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchWatchlist('AAPL,TSLA,NVDA,MSFT,GOOGL,META,AMZN').then(d => {
        setMarketData(d.watchlist || []);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [isThinking, setIsThinking] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsThinking(true);

    // Local Logic Engine
    setTimeout(() => {
      const response = generateResponse(userMsg);
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
      setIsThinking(false);
    }, 800);
  };

  const generateResponse = (text) => {
    const cleanText = text.toLowerCase().trim();
    
    // 1. Core Intents
    const hasLoss = cleanText.includes('loss') || cleanText.includes('worst') || cleanText.includes('down') || cleanText.includes('dropped') || cleanText.includes('red') || cleanText.includes('falling');
    const hasBest = cleanText.includes('best') || cleanText.includes('which stock') || cleanText.includes('suggest') || cleanText.includes('recommend') || cleanText.includes('buy now') || cleanText.includes('top');
    const hasAmount = cleanText.match(/\d+/);

    // Specific "Best Stock" Logic
    if (hasBest && !hasLoss) {
      if (marketData.length === 0) return 'I am analyzing the latest market trends. Please wait a few seconds...';
      const sortedByBrain = [...marketData].sort((a, b) => (b.brain_score || 0) - (a.brain_score || 0));
      const best = sortedByBrain[0];
      return `Based on my AI Brain analysis, the best stock to buy right now is ${best.ticker} (${best.company_name}). It has a high confidence score of ${(best.brain_score || 85)}% and bullish sentiment across News and Technicals. 🚀`;
    }

    // Specific "Loss" Logic
    if (hasLoss) {
      if (marketData.length === 0) return 'I am checking the current losers...';
      const worst = [...marketData].sort((a, b) => a.price_change_pct - b.price_change_pct)[0];
      return `Currently, ${worst.ticker} is in the most loss, down ${Math.abs(worst.price_change_pct).toFixed(2)}%. My AI suggests caution, but this could be a "buy the dip" opportunity if the technicals stabilize! 📉`;
    }

    // Amount-based Investment Logic
    if (hasAmount && (hasBest || cleanText.includes('invest') || cleanText.includes('buy'))) {
      const amount = parseInt(hasAmount[0]);
      if (marketData.length === 0) return `Calculating the best way to invest $${amount}...`;
      
      // Filter for affordable stocks
      const affordable = marketData.filter(s => s.current_price <= amount && s.current_price > 0);
      if (affordable.length === 0) {
        return `With $${amount}, you might want to look at fractional shares or lower-priced assets. Currently, our tracked stocks like TSLA and AAPL are trading above that price.`;
      }
      
      const recommendation = affordable.sort((a, b) => (b.brain_score || 0) - (a.brain_score || 0))[0];
      const shares = Math.floor(amount / recommendation.current_price);
      return `With $${amount}, I recommend ${recommendation.ticker}. It's currently $${recommendation.current_price.toFixed(2)}, so you could buy ${shares} share${shares > 1 ? 's' : ''}. It has a solid AI outlook! 💰`;
    }

    if (cleanText.includes('buy') || cleanText.includes('how to trade')) {
      return "To trade: 1. Go to 'Markets'. 2. Select a stock. 3. Use the 'Buy' section. You have $1,000,000 to start your journey!";
    }

    if (cleanText.includes('portfolio') || cleanText.includes('balance')) {
      return `You have $${balance.toLocaleString()} in cash. You've built a portfolio with ${holdings.length} stocks. Great job!`;
    }

    if (cleanText.includes('hi') || cleanText.includes('hello')) {
      return "Hello! I am your StockMind Assistant. I can suggest the best stocks to buy, identify stocks in loss, or help you plan an investment. What's your goal today?";
    }

    if (cleanText.includes('thanks') || cleanText.includes('ok')) {
      return "Happy to help! Let me know if you need anything else. 📈";
    }

    // Ultimate Fallback - Never say "I don't know"
    return "I am here to help you win! Ask me: 'Which stock is best to buy?', 'Which stock is in loss?', or 'How should I invest $1000?'.";
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-purple hover:bg-purple2 shadow-lg shadow-purple/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
      >
        {isOpen ? (
          <span className="text-white text-xl">✕</span>
        ) : (
          <div className="relative">
             <span className="text-white text-2xl">🤖</span>
             <div className="absolute -top-1 -right-1 w-3 h-3 bg-green rounded-full border-2 border-purple"></div>
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[320px] h-[450px] bg-bg2 border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fadeup">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple/20 to-teal/10 p-4 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple/20 flex items-center justify-center">🤖</div>
            <div>
              <p className="text-xs font-bold text-text">StockMind Assistant</p>
              <p className="text-[10px] text-green flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse"></span>
                Online & Ready
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl p-3 text-xs ${
                  m.role === 'user' 
                    ? 'bg-purple text-white rounded-br-none shadow-md shadow-purple/10' 
                    : 'bg-card border border-border text-text rounded-bl-none shadow-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-none p-3 px-4">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-text3 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-text3 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                    <div className="w-1.5 h-1.5 bg-text3 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="p-2 flex gap-1 overflow-x-auto no-scrollbar border-t border-border bg-bg3">
            {['Top Gainer', 'My Portfolio', 'Instructions'].map(act => (
              <button 
                key={act}
                onClick={() => setInput(act)}
                className="whitespace-nowrap px-3 py-1 bg-card border border-border rounded-full text-[10px] text-text3 hover:text-text hover:border-purple transition-all"
              >
                {act}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-border flex gap-2">
            <input 
              type="text" 
              placeholder="Ask me anything..."
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 bg-bg3 border border-border rounded-xl px-4 py-2 text-xs text-text focus:outline-none focus:border-purple"
            />
            <button 
              type="submit"
              className="w-8 h-8 rounded-xl bg-purple/10 text-purple flex items-center justify-center hover:bg-purple hover:text-white transition-all"
            >
              ➔
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
