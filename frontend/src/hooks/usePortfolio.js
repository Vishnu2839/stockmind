import { useState, useEffect } from 'react';

const INITIAL_BALANCE = 1000000; // 1M INR

export function usePortfolio() {
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [holdings, setHoldings] = useState([]);

  // Load from local storage on mount
  useEffect(() => {
    const savedBalance = localStorage.getItem('portfolio_balance');
    const savedHoldings = localStorage.getItem('portfolio_holdings');
    
    if (savedBalance) setBalance(parseFloat(savedBalance));
    if (savedHoldings) setHoldings(JSON.parse(savedHoldings));
  }, []);

  const saveState = (newBalance, newHoldings) => {
    setBalance(newBalance);
    setHoldings(newHoldings);
    localStorage.setItem('portfolio_balance', newBalance.toString());
    localStorage.setItem('portfolio_holdings', JSON.stringify(newHoldings));
  };

  const buyStock = (ticker, shares, currentPrice) => {
    const cost = shares * currentPrice;
    if (balance < cost) return false;

    const newBalance = balance - cost;
    const newHoldings = [...holdings];
    const existing = newHoldings.find(h => h.ticker === ticker);

    if (existing) {
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

    const revenue = shares * currentPrice;
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
