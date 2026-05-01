import { useState, createContext, useContext, useEffect } from 'react';

export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function useAuthState() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const login = (email, password) => {
    const users = JSON.parse(localStorage.getItem('stockmind_users') || '[]');
    const found = users.find(u => u.email === email && u.password === password);
    if (found) {
      setUser(found);
      localStorage.setItem('stockmind_user', JSON.stringify(found));
      return true;
    }
    return false;
  };

  const register = (name, email, password) => {
    const users = JSON.parse(localStorage.getItem('stockmind_users') || '[]');
    if (users.find(u => u.email === email)) return false;
    const newUser = { name, email, password, createdAt: new Date().toISOString() };
    users.push(newUser);
    localStorage.setItem('stockmind_users', JSON.stringify(users));
    setUser(newUser);
    localStorage.setItem('stockmind_user', JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('stockmind_user');
  };

  return { user, login, register, logout, loading };
}
