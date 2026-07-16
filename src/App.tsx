import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import AuthGate from './features/auth/AuthGate';
import { ProfileProvider } from './store/ProfileContext';
import Layout from './app/Layout';
import TodayScreen from './features/today/TodayScreen';
import ReviewScreen from './features/review/ReviewScreen';
import GrammarReviewScreen from './features/grammar/GrammarReviewScreen';
import QuizScreen from './features/quiz/QuizScreen';
import UnitScreen from './features/unit/UnitScreen';
import RulesScreen from './features/rules/RulesScreen';
import SpeakScreen from './features/speak/SpeakScreen';
import StatsScreen from './features/stats/StatsScreen';
import AdminLayout from './features/admin/AdminLayout';
import AdminUnits from './features/admin/AdminUnits';
import UnitEditor from './features/admin/UnitEditor';
import AdminWords from './features/admin/AdminWords';
import AdminRules from './features/admin/AdminRules';
import RuleEditor from './features/admin/RuleEditor';
import AdminAudio from './features/admin/AdminAudio';
import AdminBackup from './features/admin/AdminBackup';

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
              <Route path="unit/:id" element={<UnitScreen />} />
              <Route path="rules" element={<RulesScreen />} />
              <Route path="speak" element={<SpeakScreen />} />
              <Route path="stats" element={<StatsScreen />} />
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
