import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { GateQuiz } from './components/GateQuiz';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './state/AuthContext';
import { StudyProvider } from './state/StudyContext';
import { Dashboard } from './pages/Dashboard';
import { LearnHub } from './pages/LearnHub';
import { GrammarPage, KanjiPage, VocabularyPage } from './pages/StudyAreaPages';
import { GrammarDetail, KanjiDetail, VocabularyDetail } from './pages/DetailPages';
import { ReadingDetail, ReadingPage } from './pages/ReadingPages';
import { LibraryPage } from './pages/LibraryPage';
import { TestPage } from './pages/TestPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

function StudyApp() {
  const { user, loading } = useAuth();
  if (loading) return <div className="app-loading"><span className="login-mark">日</span><p>Loading your study space…</p></div>;
  if (!user) return <LoginPage />;
  return (
    <StudyProvider key={user.id}>
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/learn" element={<LearnHub />} />
          <Route path="/kanji" element={<KanjiPage />} />
          <Route path="/kanji/:id" element={<KanjiDetail />} />
          <Route path="/vocabulary" element={<VocabularyPage />} />
          <Route path="/vocabulary/:id" element={<VocabularyDetail />} />
          <Route path="/grammar" element={<GrammarPage />} />
          <Route path="/grammar/:id" element={<GrammarDetail />} />
          <Route path="/reading" element={<ReadingPage />} />
          <Route path="/reading/:id" element={<ReadingDetail />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
      <GateQuiz />
    </StudyProvider>
  );
}

export default function App() {
  return <AuthProvider><StudyApp /></AuthProvider>;
}
