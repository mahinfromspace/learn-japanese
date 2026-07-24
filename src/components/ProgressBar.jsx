export function ProgressBar({ value, max, label }) {
  const percent = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="progress-wrap" aria-label={`${label}: ${value} of ${max}`}>
      <div className="progress-label"><span>{label}</span><strong>{value}/{max}</strong></div>
      <div className="progress-track"><span style={{ width: `${percent}%` }} /></div>
    </div>
  );
}

