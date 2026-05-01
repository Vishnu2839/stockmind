import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const INITIAL_BALANCE = 1000000; // 1M INR

export function usePortfolio() {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [holdings, setHoldings] = useState([]);
  const { user } = useAuth();
  const API = import.meta.env.VITE_API_URL || 'http://localhost:8001';

  // Load from local storage or backend on mount/user change
  useEffect(() => {
    if (user?.email) {
      // Try to fetch from backend
      fetch(`${API}/portfolio/get?email=${user.email}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.balance !== undefined) {
            setBalance(data.balance);
            setHoldings(data.holdings || []);
            localStorage.setItem('portfolio_balance', data.balance);
            localStorage.setItem('portfolio_holdings', JSON.stringify(data.holdings || []));
          }
        })
        .catch(() => {
          // Fallback to localStorage if offline/error
          const savedBalance = localStorage.getItem('portfolio_balance');
          const savedHoldings = localStorage.getItem('portfolio_holdings');
          if (savedBalance) setBalance(parseFloat(savedBalance));
          if (savedHoldings) setHoldings(JSON.parse(savedHoldings));
        });
    }
  }, [user, API]);

  const saveState = async (newBalance, newHoldings) => {
    setBalance(newBalance);
    setHoldings(newHoldings);
    localStorage.setItem('portfolio_balance', newBalance.toString());
    localStorage.setItem('portfolio_holdings', JSON.stringify(newHoldings));

    if (user?.email) {
      try {
        await fetch(`${API}/portfolio/update`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            balance: newBalance,
            holdings: newHoldings
          })
        });
      } catch (e) {
        console.error("Failed to sync portfolio to cloud:", e);
      }
    }
  };

  const buyStock = (ticker, shares, currentPrice) => {
    if (!currentPrice || currentPrice <= 0) return false;
    const cost = shares * currentPrice;
    if (balance < cost) return false;

    const newBalance = balance - cost;
    const newHoldings = [...holdings];
    const existingIndex = newHoldings.findIndex(h => h.ticker === ticker);

    if (existingIndex !== -1) {
      const existing = newHoldings[existingIndex];
      const totalCost = (existing.shares * existing.avgBuy) + cost;
      existing.shares += shares;
      existing.avgBuy = totalCost / existing.shares;
    } else {
      newHoldings.push({ ticker, shares, avgBuy: currentPrice });
    }

    saveState(newBalance, newHoldings);
    return true;
  };

  const sellStock = (ticker, shares, currentPrice) => {
    const newHoldings = [...holdings];
    const existingIndex = newHoldings.findIndex(h => h.ticker === ticker);
    
    if (existingIndex === -1 || newHoldings[existingIndex].shares < shares) return false;

    const revenue = shares * (currentPrice || 0);
    const newBalance = balance + revenue;

    newHoldings[existingIndex].shares -= shares;
    if (newHoldings[existingIndex].shares === 0) {
      newHoldings.splice(existingIndex, 1);
    }

    saveState(newBalance, newHoldings);
    return true;
  };

  const resetPortfolio = () => {
    saveState(INITIAL_BALANCE, []);
  };

  return { balance, holdings, buyStock, sellStock, resetPortfolio };
}
