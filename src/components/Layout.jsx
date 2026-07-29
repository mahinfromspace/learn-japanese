import { BookOpenText, Brain, CalendarDays, Library, LogOut, Menu, Settings, Shapes, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';

const links = [
  { to: '/', label: 'Today', icon: CalendarDays, end: true },
  { to: '/learn', label: 'Learn', icon: Shapes },
  { to: '/test', label: 'Test', icon: Brain },
  { to: '/reading', label: 'Reading', icon: BookOpenText },
  { to: '/library', label: 'Library', icon: Library },
];

export function Layout({ children }) {
  const { signOut, user } = useAuth();
  const [open, setOpen] = useState(false);
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Learner';
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="N4 Daily home">
          <span className="brand-mark">日</span>
          <span><strong>N4 Daily</strong><small>JLPT study system</small></span>
        </NavLink>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end}><Icon />{label}</NavLink>)}
        </nav>
        <div className="top-actions">
          <NavLink className="icon-button" to="/settings" aria-label="Settings"><Settings /></NavLink>
          <button className="icon-button menu-button" type="button" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
        </div>
      </header>

      {open && (
        <div className="nav-drawer-backdrop" onClick={() => setOpen(false)} role="presentation">
          <nav className="nav-drawer" onClick={(event) => event.stopPropagation()} aria-label="Menu">
            <div className="drawer-head"><span><strong>{displayName}</strong><small>Your study profile</small></span><button className="icon-button" type="button" onClick={() => setOpen(false)}><X /></button></div>
            {[...links, { to: '/settings', label: 'Settings', icon: Settings }].map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={() => setOpen(false)}><Icon />{label}</NavLink>
            ))}
            <button className="drawer-signout" type="button" onClick={() => { setOpen(false); signOut(); }}><LogOut /> Sign out</button>
          </nav>
        </div>
      )}

      <main className="page-shell">{children}</main>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end}><Icon /><span>{label}</span></NavLink>)}
      </nav>
    </div>
  );
}
