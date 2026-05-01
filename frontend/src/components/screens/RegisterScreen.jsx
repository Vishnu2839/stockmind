import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (register(name, email, password)) {
      navigate('/');
    } else {
      alert('Email already registered');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-2xl animate-fadeup">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
             <span className="text-3xl">🚀</span>
          </div>
          <h1 className="text-2xl font-bold text-text">Create Account</h1>
          <p className="text-text3 text-sm mt-1">Join the future of paper trading</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase font-bold text-text3 mb-1 ml-1">Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-teal transition-all"
              placeholder="John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-text3 mb-1 ml-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-teal transition-all"
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
              className="w-full bg-bg3 border border-border rounded-xl px-4 py-3 text-sm text-text focus:outline-none focus:border-teal transition-all"
              placeholder="••••••••"
              required
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-teal hover:bg-teal/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-teal/20 active:scale-95"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-text3 text-xs mt-6">
          Already have an account? <Link to="/login" className="text-teal hover:underline font-bold">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
