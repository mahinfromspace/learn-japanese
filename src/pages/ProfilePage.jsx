import { useEffect, useMemo, useState } from 'react';
import { BarChart3, Medal, Settings, SlidersHorizontal, Trophy, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProgressBar } from '../components/ProgressBar';
import { supabase } from '../lib/supabase';
import { useAuth } from '../state/AuthContext';
import { useStudy } from '../state/StudyContext';

export function ProfilePage() {
  const { user } = useAuth();
  const { activeLevel, score, progress } = useStudy();
  const [leaders, setLeaders] = useState([]);
  const [leaderboardReady, setLeaderboardReady] = useState(Boolean(user.isLocal || !supabase));
  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Learner';

  useEffect(() => {
    if (!supabase || user.isLocal) return;
    let active = true;
    supabase.from('user_scores').select('user_id, display_name, overall_score, active_level, updated_at').order('overall_score', { ascending: false }).limit(25)
      .then(({ data, error }) => {
        if (!active) return;
        if (!error) setLeaders(data || []);
        setLeaderboardReady(!error);
      });
    return () => { active = false; };
  }, [score.total, user.isLocal]);

  const rows = useMemo(() => {
    const self = { user_id: user.id, display_name: displayName, overall_score: score.total, active_level: activeLevel };
    const merged = leaders.some((row) => row.user_id === user.id)
      ? leaders.map((row) => row.user_id === user.id ? { ...row, ...self } : row)
      : [...leaders, self];
    return merged.sort((left, right) => right.overall_score - left.overall_score).slice(0, 25);
  }, [activeLevel, displayName, leaders, score.total, user.id]);
  const rank = rows.findIndex((row) => row.user_id === user.id) + 1;
  const accuracy = progress.stats.answered ? Math.round((progress.stats.correct / progress.stats.answered) * 100) : 0;

  return (
    <div className="page profile-page">
      <header className="profile-hero"><div className="profile-avatar"><UserRound /></div><div><p className="eyebrow">LEARNER PROFILE · {activeLevel}</p><h1>{displayName}</h1><p>{user.isLocal ? 'Local profile on this device' : 'Synced Supabase profile'}</p></div><div className="overall-score"><span>Overall score</span><strong>{score.total}</strong><small>/ {score.max}</small></div></header>
      <div className="profile-summary-grid"><article><Trophy /><span>Leaderboard rank</span><strong>{rank || '—'}</strong></article><article><BarChart3 /><span>Answer accuracy</span><strong>{accuracy}%</strong></article><article><Medal /><span>Active study days</span><strong>{score.activityDays}</strong></article></div>

      <section className="section-block score-breakdown"><div className="section-heading"><div><p className="eyebrow">SCORE BREAKDOWN</p><h2>Everything contributes.</h2></div><span>Comparable 1,000-point scale</span></div>{score.sections.map((section) => <div className="score-row" key={section.key}><div><strong>{section.label}</strong><span>{section.points} / {section.max}</span></div><ProgressBar label={section.label} value={section.points} max={section.max} /></div>)}</section>

      <section className="section-block leaderboard"><div className="section-heading"><div><p className="eyebrow">LEADERBOARD</p><h2>Compare overall progress.</h2></div><Trophy /></div><div className="leaderboard-table">{rows.map((row, index) => <div className={row.user_id === user.id ? 'is-you' : ''} key={row.user_id}><span className="leader-rank">{index + 1}</span><span><strong>{row.display_name || 'Learner'}</strong><small>{row.active_level || 'N4'}{row.user_id === user.id ? ' · You' : ''}</small></span><b>{row.overall_score}</b></div>)}</div>{!leaderboardReady && <p className="fine-print">Run the updated Supabase schema once to enable cross-user ranking. Your personal score still works now.</p>}{user.isLocal && <p className="fine-print">Sign in with Supabase to appear in the shared leaderboard.</p>}</section>

      <section className="section-block profile-controls"><div><p className="eyebrow">PROGRESS CONTROL</p><h2>Shape your next session.</h2><p>Change pace, repair learned status, or build a custom set from any level.</p></div><div className="button-row"><Link className="button primary" to="/custom-study"><SlidersHorizontal /> Build custom session</Link><Link className="button secondary" to="/settings"><Settings /> Progress settings</Link></div></section>
    </div>
  );
}
