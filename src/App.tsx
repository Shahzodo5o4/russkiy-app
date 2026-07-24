import { lazy } from 'react';
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthGate from './features/auth/AuthGate';
import { ProfileProvider } from './store/ProfileContext';
import Layout from './app/Layout';

// Ekranlar lazy-load — boshlang'ich bundle kichik bo'lsin (route-level code-splitting).
// Admin bo'limi va Stats (recharts) faqat kerak bo'lganda alohida chunk sifatida yuklanadi.
const TodayScreen = lazy(() => import('./features/today/TodayScreen'));
const ReviewScreen = lazy(() => import('./features/review/ReviewScreen'));
const GrammarReviewScreen = lazy(() => import('./features/grammar/GrammarReviewScreen'));
const QuizScreen = lazy(() => import('./features/quiz/QuizScreen'));
const ExamScreen = lazy(() => import('./features/exam/ExamScreen'));
const UnitScreen = lazy(() => import('./features/unit/UnitScreen'));
const RulesScreen = lazy(() => import('./features/rules/RulesScreen'));
const SpeakScreen = lazy(() => import('./features/speak/SpeakScreen'));
const StatsScreen = lazy(() => import('./features/stats/StatsScreen'));
const SettingsScreen = lazy(() => import('./features/settings/SettingsScreen'));
const AdminLayout = lazy(() => import('./features/admin/AdminLayout'));
const AdminUnits = lazy(() => import('./features/admin/AdminUnits'));
const UnitEditor = lazy(() => import('./features/admin/UnitEditor'));
const AdminWords = lazy(() => import('./features/admin/AdminWords'));
const AdminRules = lazy(() => import('./features/admin/AdminRules'));
const RuleEditor = lazy(() => import('./features/admin/RuleEditor'));
const AdminAudio = lazy(() => import('./features/admin/AdminAudio'));
const AdminBackup = lazy(() => import('./features/admin/AdminBackup'));

export default function App() {
  return (
    <HashRouter>
      <AuthGate>
        <ProfileProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<TodayScreen />} />
              <Route path="review" element={<ReviewScreen />} />
              <Route path="grammar" element={<GrammarReviewScreen />} />
              <Route path="quiz" element={<QuizScreen />} />
              <Route path="exam" element={<ExamScreen />} />
              <Route path="unit/:id" element={<UnitScreen />} />
              <Route path="rules" element={<RulesScreen />} />
              <Route path="speak" element={<SpeakScreen />} />
              <Route path="stats" element={<StatsScreen />} />
              <Route path="settings" element={<SettingsScreen />} />
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="units" replace />} />
                <Route path="units" element={<AdminUnits />} />
                <Route path="units/:id" element={<UnitEditor />} />
                <Route path="words" element={<AdminWords />} />
                <Route path="rules" element={<AdminRules />} />
                <Route path="rules/:id" element={<RuleEditor />} />
                <Route path="audio" element={<AdminAudio />} />
                <Route path="backup" element={<AdminBackup />} />
              </Route>
            </Route>
          </Routes>
        </ProfileProvider>
      </AuthGate>
    </HashRouter>
  );
}
