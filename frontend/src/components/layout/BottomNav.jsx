import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Home', icon: '🏠' },
  { to: '/markets', label: 'Markets', icon: '📊' },
  { to: '/brain', label: 'Brain', icon: '🧠' },
  { to: '/portfolio', label: 'Portfolio', icon: '💼' },
];

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-bg2 border-t border-border z-40 safe-area-pb">
      <div className="flex justify-around items-center h-16">
        {tabs.map(t => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-all ${
                isActive ? 'text-purple2' : 'text-text3'
              }`
            }
          >
            <span className="text-lg">{t.icon}</span>
            <span className="text-[10px] font-medium">{t.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
