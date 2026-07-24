import { BookOpenText, Brain, CalendarDays, Cloud, CloudOff, Library, LoaderCircle, LogOut, Menu, Settings, Shapes, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../state/AuthContext';
import { useStudy } from '../state/StudyContext';

const links = [
  { to: '/', label: 'Today', icon: CalendarDays, end: true },
  { to: '/learn', label: 'Learn', icon: Shapes },
  { to: '/test', label: 'Test', icon: Brain },
  { to: '/reading', label: 'Reading', icon: BookOpenText },
  { to: '/library', label: 'Library', icon: Library },
];

export function Layout({ children }) {
  const { signOut, user } = useAuth();
  const { cloudStatus, syncNow } = useStudy();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Learner';
  const cloudLabel = {
    loading: 'Loading cloud',
    ready: 'Cloud ready',
    syncing: 'Saving…',
    synced: 'Saved',
    error: 'Save failed',
    local: 'Local only',
  }[cloudStatus.state] || 'Cloud status';
  const CloudIcon = cloudStatus.state === 'error'
    ? CloudOff
    : cloudStatus.state === 'syncing' || cloudStatus.state === 'loading'
      ? LoaderCircle
      : Cloud;

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    const syncResult = await syncNow();
    if (!syncResult.ok) {
      window.alert(`Your progress could not be saved to Supabase, so you are still signed in. ${syncResult.error?.message || ''}`.trim());
      setSigningOut(false);
      return;
    }
    const { error } = await signOut();
    if (error) {
      window.alert(`Could not log out. ${error.message}`);
      setSigningOut(false);
    }
  };

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
          <span className={`cloud-indicator ${cloudStatus.state}`} title={cloudStatus.error || cloudLabel} aria-live="polite">
            <CloudIcon />
            <span>{cloudLabel}</span>
          </span>
          <NavLink className="icon-button" to="/settings" aria-label="Settings"><Settings /></NavLink>
          <button className="desktop-signout" type="button" onClick={handleSignOut} disabled={signingOut} title="Log out">
            <LogOut /><span>{signingOut ? 'Saving…' : 'Log out'}</span>
          </button>
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
            <button className="drawer-signout" type="button" disabled={signingOut} onClick={handleSignOut}><LogOut /> {signingOut ? 'Saving before logout…' : 'Log out'}</button>
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
