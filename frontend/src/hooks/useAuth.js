import { useState, createContext, useContext, useEffect } from 'react';

export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function useAuthState() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API = import.meta.env.VITE_API_URL || 'http://localhost:8001';

  useEffect(() => {
    const savedUser = localStorage.getItem('stockmind_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('stockmind_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('stockmind_user', JSON.stringify(data.user));
        // Also save portfolio from login response
        if (data.portfolio) {
          localStorage.setItem('portfolio_balance', data.portfolio.balance);
          localStorage.setItem('portfolio_holdings', JSON.stringify(data.portfolio.holdings));
        }
        return true;
      }
    } catch (e) {
      console.error("Login error:", e);
    }
    return false;
  };

  const register = async (name, email, password) => {
    try {
      const res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('stockmind_user', JSON.stringify(data.user));
        return true;
      }
    } catch (e) {
      console.error("Register error:", e);
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stockmind_user');
    localStorage.removeItem('portfolio_balance');
    localStorage.removeItem('portfolio_holdings');
  };

  return { user, login, register, logout, loading };
}
