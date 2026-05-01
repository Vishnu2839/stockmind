import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/markets', label: 'Markets', icon: '📊' },
  { to: '/brain', label: 'AI Brain', icon: '🧠' },
  { to: '/portfolio', label: 'Portfolio', icon: '💼' },
];

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-[220px] bg-bg2 border-r border-border h-screen fixed left-0 top-0 z-40">
      <div className="px-5 py-6 border-b border-border">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple to-teal bg-clip-text text-transparent font-display">
          StockMind
        </h1>
        <p className="text-[10px] text-text3 mt-0.5 tracking-widest uppercase">AI Brain for Stocks</p>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-purple/10 text-purple2 border border-purple/30'
                  : 'text-text2 hover:text-text hover:bg-bg3'
              }`
            }
          >
            <span className="text-base">{l.icon}</span>
            <span className="font-medium">{l.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="bg-bg3 rounded-lg p-3">
          <p className="text-[10px] text-text3 uppercase tracking-wider mb-1">Live Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green rounded-full animate-pulse"></div>
            <span className="text-xs text-green">Backend Connected</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
