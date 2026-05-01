import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(email, password)) {
      navigate('/');
    } else {
      alert('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl animate-fadeup">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
             <span className="text-3xl">🧠</span>
          </div>
          <h1 className="text-2xl font-bold text-text">Welcome Back</h1>
          <p className="text-text3 text-sm mt-1">Sign in to your StockMind account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-text3 mb-1 ml-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-purple transition-all"
              placeholder="name@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-text3 mb-1 ml-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-purple transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-purple hover:bg-purple2 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple/20 active:scale-95"
          >
            Sign In
          </button>
        </form>

        <p className="text-center text-text3 text-xs mt-6">
          Don't have an account? <Link to="/register" className="text-purple hover:underline font-bold">Register Now</Link>
        </p>
      </div>
    </div>
  );
}
