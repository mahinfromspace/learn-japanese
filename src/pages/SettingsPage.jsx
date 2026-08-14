import { Archive, CalendarRange, Check, Download, FileUp, Pencil, Plus, RotateCcw, Save, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { LevelSwitch } from '../components/LevelSwitch';
import { useStudy } from '../state/StudyContext';

const areaLabels = { kanji: 'Kanji', vocabulary: 'Vocabulary', grammar: 'Grammar', reading: 'Reading' };

export function SettingsPage() {
  const { activeLevel } = useStudy();
  return <SettingsContent key={activeLevel} />;
}

function SettingsContent() {
  const {
    progress, content, levelContent, activeLevel, updateSettings, editContent, addContent, archiveContent, resetItems,
    resetAll, resetTestHistory, importProgress, replaceOfficialKanji, setCompletedKanjiDays,
  } = useStudy();
  const [area, setArea] = useState('kanji');
  const [selectedId, setSelectedId] = useState(content.kanji[0]?.id || '');
  const [json, setJson] = useState(() => JSON.stringify(content.kanji[0] || {}, null, 2));
  const [message, setMessage] = useState('');
  const fileRef = useRef(null);
  const selected = content[area].find((item) => item.id === selectedId);
  const resetCandidates = useMemo(() => area === 'kanji' ? [...new Set([...progress.kanji.official, ...progress.kanji.extra])] : area === 'reading' ? Object.keys(progress.reading.completed) : progress[area].learned, [area, progress]);
  const [resetSelection, setResetSelection] = useState([]);
  const totalKanjiDays = Math.max(1, Math.ceil(levelContent.kanji.length / progress.settings.kanjiDaily));
  const learnedLevelKanji = levelContent.kanji.filter((item) => progress.kanji.official.includes(item.id));
  const [studyDay, setStudyDay] = useState(Math.min(totalKanjiDays, Math.floor(learnedLevelKanji.length / progress.settings.kanjiDaily) + 1));
  const [kanjiQuery, setKanjiQuery] = useState('');
  const [officialSelection, setOfficialSelection] = useState(learnedLevelKanji.map((item) => item.id));
  const visibleKanji = levelContent.kanji.filter((item) => `${item.character} ${item.meaning} ${item.onyomi} ${item.kunyomi}`.toLowerCase().includes(kanjiQuery.toLowerCase()));

  const changeArea = (nextArea) => {
    const first = content[nextArea][0];
    setArea(nextArea);
    setSelectedId(first?.id || '');
    setJson(first ? JSON.stringify(first, null, 2) : '');
    setResetSelection([]);
  };

  const changeItem = (id) => {
    const item = content[area].find((entry) => entry.id === id);
    setSelectedId(id);
    setJson(item ? JSON.stringify(item, null, 2) : '');
  };

  const notify = (text) => { setMessage(text); window.setTimeout(() => setMessage(''), 2400); };
  const saveJson = () => {
    try {
      const parsed = JSON.parse(json);
      if (!parsed.id) throw new Error('An id is required.');
      if (content[area].some((item) => item.id === parsed.id)) editContent(area, parsed.id, parsed);
      else addContent(area, parsed);
      notify('Content saved locally.');
    } catch (error) { notify(error.message); }
  };
  const startNew = () => {
    const id = `custom-${area}-${Date.now()}`;
    const templates = {
      kanji: { id, character: '', onyomi: '', kunyomi: '', meaning: '', word: '', wordReading: '', wordMeaning: '', level: activeLevel, order: content.kanji.length + 1 },
      vocabulary: { id, word: '', reading: '', romaji: '', meaning: '', level: activeLevel, type: 'Noun', commonUsage: '', realLife: '', examples: [] },
      grammar: { id, pattern: '', romaji: '', meaning: '', level: activeLevel, structure: '', explanation: '', register: '', commonMistake: '', comparison: '', examples: [] },
      reading: { id, title: '', type: 'Custom', difficulty: 'Standard', minutes: 3, japanese: '', translation: '', grammar: [], vocabulary: [], questions: [], level: activeLevel },
    };
    setSelectedId('');
    setJson(JSON.stringify(templates[area], null, 2));
  };
  const exportData = () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `japanese-for-today-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const importData = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try { const parsed = JSON.parse(await file.text()); importProgress(parsed); notify('Backup imported.'); }
    catch { notify('That file is not valid JSON.'); }
    event.target.value = '';
  };

  return (
    <div className="page settings-page">
      <header className="page-heading"><p className="eyebrow">SETTINGS + DATA STUDIO</p><h1>Your app, your rules.</h1><p>Adjust the pace, repair progress, and edit every catalog as structured local data.</p></header>
      {message && <div className="toast" role="status">{message}</div>}
      <section className="section-block"><div className="section-heading"><div><p className="eyebrow">LEVEL + DAILY PACE</p><h2>Study as much as you choose.</h2></div><ShieldCheck /></div><div className="settings-level-row"><span><strong>Active course</strong><small>Every daily area and test follows this level.</small></span><LevelSwitch /></div><div className="setting-grid"><NumberSetting label="Kanji per day" value={progress.settings.kanjiDaily} min={1} max={levelContent.kanji.length} onChange={(kanjiDaily) => updateSettings({ kanjiDaily })} /><NumberSetting label="Vocabulary per day" value={progress.settings.vocabularyDaily} min={1} max={levelContent.vocabulary.length} onChange={(vocabularyDaily) => updateSettings({ vocabularyDaily })} /><NumberSetting label="Grammar per day" value={progress.settings.grammarDaily} min={1} max={levelContent.grammar.length} onChange={(grammarDaily) => updateSettings({ grammarDaily })} /></div><p className="fine-print">There is no preset daily cap. Increase any field up to the complete {activeLevel} catalog; today’s session refreshes immediately.</p></section>

      <section className="section-block progress-repair">
        <div className="section-heading"><div><p className="eyebrow">RESTORE YOUR {activeLevel} PLACE</p><h2>Choose your study day and learned kanji</h2></div><CalendarRange /></div>
        <div className="study-day-control">
          <label><span>Current official day</span><input type="number" min={1} max={totalKanjiDays} value={studyDay} onChange={(event) => setStudyDay(Math.min(totalKanjiDays, Math.max(1, Number(event.target.value) || 1)))} /></label>
          <div><strong>Day {studyDay} of {totalKanjiDays}</strong><p>Applying this marks earlier adjustable daily sets as learned and makes this day’s chronological set today’s study queue.</p></div>
          <button className="button primary" type="button" onClick={() => {
            setCompletedKanjiDays(studyDay - 1);
            const selected = levelContent.kanji.slice(0, (studyDay - 1) * progress.settings.kanjiDaily).map((item) => item.id);
            setOfficialSelection(selected);
            notify(`Official progress moved to day ${studyDay}.`);
          }}>Apply day</button>
        </div>
        <div className="manual-kanji-head">
          <div><h3>Fine-tune individual kanji</h3><p>{officialSelection.length} selected as officially learned</p></div>
          <label className="search-box"><Search /><input type="search" value={kanjiQuery} onChange={(event) => setKanjiQuery(event.target.value)} placeholder="Search kanji or meaning" /></label>
        </div>
        <div className="learned-kanji-picker">
          {visibleKanji.map((item) => {
            const selected = officialSelection.includes(item.id);
            return <button className={selected ? 'selected' : ''} type="button" key={item.id} onClick={() => setOfficialSelection((current) => selected ? current.filter((id) => id !== item.id) : [...current, item.id])}><span>{item.character}</span><small>{item.meaning.split(';')[0]}</small>{selected && <Check />}</button>;
          })}
        </div>
        <div className="button-row">
          <button className="button primary" type="button" onClick={() => { replaceOfficialKanji(officialSelection); notify('Official learned-kanji selection saved.'); }}><Save /> Save learned selection</button>
          <button className="button secondary" type="button" onClick={() => setOfficialSelection(levelContent.kanji.filter((item) => progress.kanji.official.includes(item.id)).map((item) => item.id))}>Undo unsaved changes</button>
          <button className="button danger-quiet" type="button" onClick={() => setOfficialSelection([])}>Clear selection</button>
        </div>
      </section>

      <section className="section-block"><div className="section-heading"><div><p className="eyebrow">BACKUP</p><h2>Move or protect your progress</h2></div><Save /></div><div className="button-row"><button className="button secondary" type="button" onClick={exportData}><Download /> Export JSON</button><button className="button secondary" type="button" onClick={() => fileRef.current?.click()}><FileUp /> Import JSON</button><input ref={fileRef} hidden type="file" accept="application/json" onChange={importData} /></div><p className="fine-print">The export includes progress, SRS dates, settings, edits, custom items, and archived records.</p></section>

      <section className="section-block data-studio"><div className="section-heading"><div><p className="eyebrow">DATA STUDIO</p><h2>Edit any learning content</h2></div><Pencil /></div><div className="studio-controls"><label>Catalog<select value={area} onChange={(event) => changeArea(event.target.value)}>{Object.entries(areaLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Item<select value={selectedId} onChange={(event) => changeItem(event.target.value)}><option value="">New item draft</option>{content[area].map((item) => <option value={item.id} key={item.id}>{item.character || item.word || item.pattern || item.title}</option>)}</select></label></div><textarea className="json-editor" value={json} onChange={(event) => setJson(event.target.value)} spellCheck="false" aria-label="Content JSON editor" /><div className="button-row"><button className="button primary" type="button" onClick={saveJson}><Save /> Save JSON</button><button className="button secondary" type="button" onClick={startNew}><Plus /> New {areaLabels[area]}</button>{selected && <button className="button danger-quiet" type="button" onClick={() => { archiveContent(area, selected.id); notify('Item archived.'); }}><Archive /> Archive</button>}</div></section>

      {area !== 'reading' && <section className="section-block"><div className="section-heading"><div><p className="eyebrow">SELECTIVE RESET</p><h2>Remove learned status</h2></div><RotateCcw /></div><div className="reset-item-grid">{resetCandidates.length ? resetCandidates.map((id) => { const item = content[area].find((entry) => entry.id === id); if (!item) return null; return <label key={id}><input type="checkbox" checked={resetSelection.includes(id)} onChange={(event) => setResetSelection((current) => event.target.checked ? [...current, id] : current.filter((value) => value !== id))} /><span>{item.character || item.word || item.pattern}</span><small>{item.meaning}</small></label>; }) : <p className="empty-inline">No learned items in this area.</p>}</div><button className="button danger-quiet" type="button" disabled={!resetSelection.length} onClick={() => { resetItems(area, resetSelection); setResetSelection([]); notify('Selected progress removed.'); }}><Trash2 /> Reset selected ({resetSelection.length})</button></section>}

      <section className="danger-zone"><div><p className="eyebrow">RESET CONTROLS</p><h2>Destructive actions</h2><p>Exports are a good idea before clearing large amounts of progress.</p></div><div className="danger-actions"><button type="button" onClick={() => { resetItems('kanji', progress.kanji.official, 'official'); notify('Official kanji progress reset.'); }}>Reset official kanji</button><button type="button" onClick={() => { resetItems('kanji', progress.kanji.extra, 'extra'); notify('Extra kanji reset.'); }}>Reset extra kanji</button><button type="button" onClick={() => { if (confirm('Reset all quiz and reading history?')) resetTestHistory(); }}>Reset test history</button><button className="most-danger" type="button" onClick={() => { if (confirm('Reset the entire app? This cannot be undone without an export.')) resetAll(); }}>Reset everything</button></div></section>
    </div>
  );
}

function NumberSetting({ label, value, min, max, onChange }) {
  return <label className="number-setting"><span>{label}</span><input type="number" min={min} max={max} value={value} onChange={(event) => onChange(Math.min(max, Math.max(min, Number(event.target.value) || min)))} /></label>;
}
