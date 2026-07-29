import { BookOpenCheck, Database, Eye, EyeOff, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../state/AuthContext';

export function LoginPage() {
  const { configured, continueLocally, signIn, signUp } = useAuth();
  const [mode, setMode] = useState('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setMessage('');
    if (!configured) {
      continueLocally(displayName);
      return;
    }
    setBusy(true);
    const result = mode === 'signup'
      ? await signUp({ email, password, displayName })
      : await signIn({ email, password });
    setBusy(false);
    if (result.error) {
      setMessage(result.error.message);
    } else if (mode === 'signup' && !result.data.session) {
      setMessage('Account created. Check your email, confirm it, then sign in.');
      setMode('signin');
    }
  };

  return (
    <main className="login-page">
      <section className="login-intro">
        <span className="login-mark">日</span>
        <p className="eyebrow">JLPT N4 STUDY SYSTEM</p>
        <h1>Your Japanese progress, ready when you are.</h1>
        <p>Daily kanji, vocabulary, grammar, reading, flashcards, and review history in one mobile-first app.</p>
        <div className="login-points">
          <span><BookOpenCheck /> Daily sets stay consistent</span>
          <span><Database /> Progress is ready for Supabase sync</span>
          <span><LockKeyhole /> Every account keeps separate data</span>
        </div>
      </section>

      <section className="login-card">
        <div>
          <p className="eyebrow">{configured ? 'ACCOUNT' : 'LOCAL PROFILE'}</p>
          <h2>{configured ? (mode === 'signup' ? 'Create your account' : 'Welcome back') : 'Start studying'}</h2>
          <p>{configured ? 'Sign in to load your study progress.' : 'Supabase is not connected yet. This profile stores progress on this device.'}</p>
        </div>
        {configured && (
          <div className="segmented auth-tabs">
            <button className={mode === 'signin' ? 'active' : ''} type="button" onClick={() => { setMode('signin'); setMessage(''); }}>Sign in</button>
            <button className={mode === 'signup' ? 'active' : ''} type="button" onClick={() => { setMode('signup'); setMessage(''); }}>Create account</button>
          </div>
        )}
        <form onSubmit={submit}>
          {(!configured || mode === 'signup') && (
            <label>
              <span>Name</span>
              <div className="login-field"><UserRound /><input required={!configured} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" /></div>
            </label>
          )}
          {configured && (
            <>
              <label>
                <span>Email</span>
                <div className="login-field"><Mail /><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>
              </label>
              <label>
                <span>Password</span>
                <div className="login-field password-field">
                  <LockKeyhole />
                  <input required minLength={6} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" />
                  <button className="password-toggle" type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </label>
            </>
          )}
          {message && <p className="auth-message" role="status">{message}</p>}
          <button className="button primary large" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : configured ? (mode === 'signup' ? 'Create account' : 'Sign in') : 'Continue on this device'}
          </button>
        </form>
        {!configured && <p className="login-config-note">To enable real accounts, copy <strong>.env.example</strong> to <strong>.env.local</strong> and add your Supabase URL and publishable key.</p>}
      </section>
    </main>
  );
}
