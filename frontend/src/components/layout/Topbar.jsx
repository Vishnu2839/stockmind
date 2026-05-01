import { useAuth } from '../../hooks/useAuth';

export default function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-bg2/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="md:hidden">
        <h1 className="text-lg font-bold bg-gradient-to-r from-purple to-teal bg-clip-text text-transparent font-display">
          StockMind
        </h1>
      </div>
      <div className="hidden md:block text-sm font-medium text-text2">
        Welcome back, <span className="text-purple2">{user?.name || 'Trader'}</span>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 bg-bg3 border border-border/50 rounded-full px-3 py-1.5">
          <div className="w-1.5 h-1.5 bg-green rounded-full animate-pulse"></div>
          <span className="text-[10px] text-text2 font-bold tracking-widest uppercase">Live Market Data</span>
        </div>
        
        <button 
          onClick={logout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-red hover:bg-red/10 transition-all border border-red/20"
        >
          <span>Logout</span>
          <span>🚪</span>
        </button>
      </div>
    </header>
  );
}
