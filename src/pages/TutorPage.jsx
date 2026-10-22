import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/AuthContext';
import { useStudy } from '../state/StudyContext';
import './tutor.css';

const modes = {
  explain: { label: 'Explain', hint: 'Untangle a word or grammar point.', prompt: 'What is the difference between は and が?' },
  correct: { label: 'Correct my Japanese', hint: 'Make a sentence sound natural.', prompt: 'Please check this sentence: 昨日、学校に行きます。' },
  practice: { label: 'Practise', hint: 'Try one question at a time.', prompt: 'Give me a particle practice question. Wait for my answer.' },
  conversation: { label: 'Conversation', hint: 'Rehearse a real-life situation.', prompt: 'Practise telling a supervisor that my train is delayed. Start with one short Japanese line.' },
};

// Render a small Markdown subset as escaped React text, never raw HTML.
function InlineText({ text }) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => part.startsWith('**') && part.endsWith('**')
    ? <strong key={index}>{part.slice(2, -2)}</strong> : part);
}

function TutorAnswer({ text }) {
  return <div className="tutor-answer">{text.split(/\n\s*\n/).map((block, index) => {
    const lines = block.trim().split('\n');
    if (lines.every((line) => /^\s*[-*]\s/.test(line))) return <ul key={index}>{lines.map((line, i) => <li key={i}><InlineText text={line.replace(/^\s*[-*]\s/, '')} /></li>)}</ul>;
    if (lines.length === 1 && /^#{1,6}\s/.test(lines[0])) return <h3 key={index}><InlineText text={lines[0].replace(/^#{1,6}\s/, '')} /></h3>;
    return <p key={index}><InlineText text={block} /></p>;
  })}</div>;
}

export function TutorPage() {
  const { user } = useAuth();
  const { activeLevel, progress } = useStudy();
  // A level change starts a fresh session, so a conversation never mixes levels.
  return <TutorSession key={`${user.id}:${activeLevel}`} level={activeLevel} romaji={progress.settings.romaji} isLocal={user.isLocal} />;
}

function TutorSession({ level, romaji, isLocal }) {
  const [mode, setMode] = useState('explain');
  const [mood, setMood] = useState('focused');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [truncated, setTruncated] = useState(false);
  const controller = useRef(null);
  const bottom = useRef(null);
  const input = useRef(null);
  const full = messages.length >= 10;

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, busy]);

  const newSession = (nextMode = mode) => {
    controller.current?.abort();
    controller.current = null;
    setBusy(false);
    setMessages([]);
    setMode(nextMode);
    setDraft('');
    setError('');
    setTruncated(false);
  };

  const ask = async (event) => {
    event.preventDefault();
    if (busy || controller.current || !draft.trim() || full || isLocal || !supabase) return;
    const question = draft.trim();
    const next = [...messages, { role: 'user', content: question }];
    const requestController = new AbortController();
    controller.current = requestController;
    setBusy(true);
    setError('');
    setTruncated(false);
    setMessages(next);
    setDraft('');
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (requestController.signal.aborted) return;
      if (sessionError || !data.session?.access_token) throw new Error('Please sign in again to use the tutor.');
      const response = await fetch('/api/ai-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ mode, mood, level, romaji, messages: next }),
        signal: requestController.signal,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || (response.status === 429 ? 'Please wait a minute before sending another message.' : 'The tutor is unavailable. Please try again.'));
      if (typeof payload.text !== 'string' || !payload.text.trim()) throw new Error('No answer was returned. Please try again.');
      if (requestController.signal.aborted) return;
      setMessages([...next, { role: 'assistant', content: payload.text }]);
      setTruncated(Boolean(payload.truncated));
    } catch (failure) {
      if (requestController.signal.aborted) return;
      setMessages(next.slice(0, -1));
      setDraft(question);
      setError(failure.message || 'Unable to connect. Please try again.');
    } finally {
      if (controller.current === requestController) {
        controller.current = null;
        setBusy(false);
      }
    }
  };

  return (
    <div className="page tutor-page">
      <header className="page-heading tutor-heading">
        <div><p className="eyebrow">A LITTLE HELP, RIGHT WHEN IT CLICKS</p><h1>Ask your Japanese tutor.</h1><p>Explore a tricky point, try a sentence, or practise a conversation at {level}.</p></div>
        <span className="tutor-level"><Sparkles /> {level} study companion</span>
      </header>
      <div className="tutor-layout">
        <aside className="tutor-sidebar">
          <h2>What shall we work on?</h2>
          <div className="tutor-modes">{Object.entries(modes).map(([key, item]) => <button key={key} className={mode === key ? 'selected' : ''} aria-pressed={mode === key} type="button" disabled={busy} onClick={() => newSession(key)}><strong>{item.label}</strong><span>{item.hint}</span></button>)}</div>
          <label className="tutor-mood">Study mood<select value={mood} onChange={(event) => setMood(event.target.value)} disabled={busy || messages.length > 0}><option value="focused">Focused — clear and structured</option><option value="tired">Tired — one small step</option><option value="curious">Curious — explain the nuance</option></select></label>
          <p className="tutor-note">The tutor follows the mood selected here. Start a new conversation to change it.</p>
          <button type="button" className="button secondary" onClick={() => newSession()}>New conversation</button>
        </aside>
        <section className="tutor-chat" aria-label="Japanese tutor conversation" aria-busy={busy}>
          {messages.length === 0 && <div className="tutor-welcome"><span className="tutor-mark"><MessageCircle /></span><h2>Bring a question. Leave with a little more clarity.</h2><p>{modes[mode].hint} Explanations follow the selected level and romaji setting.</p><button type="button" className="tutor-example" disabled={busy} onClick={() => { setDraft(modes[mode].prompt); input.current?.focus(); }}><Sparkles /><span>{modes[mode].prompt}</span></button></div>}
          <div className="tutor-messages" role="log" aria-label="Messages" aria-live="polite" aria-relevant="additions">{messages.map((message, index) => <article className={`tutor-message ${message.role}`} key={index}><p className="tutor-speaker">{message.role === 'user' ? 'Your question' : 'Japanese tutor'}</p>{message.role === 'assistant' ? <TutorAnswer text={message.content} /> : <p className="tutor-question">{message.content}</p>}</article>)}</div>
          {busy && <p className="tutor-thinking" role="status"><Sparkles /> Preparing a helpful answer…</p>}
          {truncated && <p className="tutor-note">This answer reached its length limit. Ask for a shorter explanation or a continuation.</p>}
          <div ref={bottom} />
          <form className="tutor-form" onSubmit={ask}>
            {error && <p className="tutor-error" role="alert">{error}</p>}
            {isLocal && <p className="tutor-error">Sign in with a registered account to use the AI tutor.</p>}
            {full && <p className="tutor-note">This conversation is complete. Start a new one for another question.</p>}
            <label htmlFor="tutor-question">{messages.length ? 'Continue the conversation' : 'Ask a question'}</label>
            <textarea ref={input} id="tutor-question" maxLength={2000} rows={3} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write in Japanese or English…" disabled={busy || full || isLocal} required />
            <div className="tutor-form-footer"><small>{draft.length}/2000 · {Math.floor(messages.length / 2)}/5 replies</small><button className="button primary" type="submit" disabled={busy || !draft.trim() || full || isLocal}><Send />{busy ? 'Thinking…' : 'Ask tutor'}</button></div>
          </form>
          <p className="tutor-disclosure">Questions and recent replies are sent to Anthropic to generate an answer. Conversations are kept only on this page and clear when leaving. AI answers can contain mistakes.</p>
        </section>
      </div>
    </div>
  );
}
