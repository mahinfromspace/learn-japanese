import { ArrowLeft, BookOpenText, Brain, CalendarDays, Library, LogOut, Menu, Settings, Shapes, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { LevelSwitch } from './LevelSwitch';

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
  const location = useLocation();
  const navigate = useNavigate();
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Learner';
  const goBack = () => {
    if (location.key !== 'default') navigate(-1);
    else if (/^\/(kanji|vocabulary|grammar|reading)\//.test(location.pathname)) navigate(`/${location.pathname.split('/')[1]}`);
    else navigate('/');
  };
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="JapaneseForToday home">
          <span className="brand-mark">日</span>
          <span><strong>JapaneseForToday</strong><small>JLPT study system</small></span>
        </NavLink>
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end}><Icon />{label}</NavLink>)}
        </nav>
        <div className="top-actions">
          <LevelSwitch compact />
          <NavLink className="icon-button profile-button" to="/profile" aria-label="Profile"><UserRound /></NavLink>
          <NavLink className="icon-button" to="/settings" aria-label="Settings"><Settings /></NavLink>
          <button className="icon-button menu-button" type="button" onClick={() => setOpen(true)} aria-label="Open menu"><Menu /></button>
        </div>
      </header>

      {open && (
        <div className="nav-drawer-backdrop" onClick={() => setOpen(false)} role="presentation">
          <nav className="nav-drawer" onClick={(event) => event.stopPropagation()} aria-label="Menu">
            <div className="drawer-head"><span><strong>{displayName}</strong><small>Your study profile</small></span><button className="icon-button" type="button" onClick={() => setOpen(false)}><X /></button></div>
            {[...links, { to: '/profile', label: 'Profile', icon: UserRound }, { to: '/settings', label: 'Settings', icon: Settings }].map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} onClick={() => setOpen(false)}><Icon />{label}</NavLink>
            ))}
            <button className="drawer-signout" type="button" onClick={() => { setOpen(false); signOut(); }}><LogOut /> Sign out</button>
          </nav>
        </div>
      )}

      <main className="page-shell">
        {location.pathname !== '/' && <button className="global-back" type="button" onClick={goBack}><ArrowLeft /> Back</button>}
        {children}
      </main>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end}><Icon /><span>{label}</span></NavLink>)}
      </nav>
    </div>
  );
}
