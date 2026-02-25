import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './pages/DashboardPage';
import KnowledgeGraphPage from './pages/KnowledgeGraphPage';
import PracticePage from './pages/PracticePage';
import ReportPage from './pages/ReportPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import WrongQuestionsPage from './pages/WrongQuestionsPage';
import AchievementsPage from './pages/AchievementsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import DailyGoalsPage from './pages/DailyGoalsPage';
import ParentDashboardPage from './pages/ParentDashboardPage';
import ExamReportPage from './pages/ExamReportPage';
import RequireAuth from './components/auth/RequireAuth';

// Admin Pages
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import KnowledgeManagement from './pages/admin/KnowledgeManagement';
import PromptManagement from './pages/admin/PromptManagement';
import Statistics from './pages/admin/Statistics';
import SystemLogs from './pages/admin/SystemLogs';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Student Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="knowledge-graph" element={<KnowledgeGraphPage />} />
          <Route path="practice" element={<PracticePage />} />
          <Route path="report" element={<ReportPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="wrong-questions" element={<WrongQuestionsPage />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="daily-goals" element={<DailyGoalsPage />} />
          <Route path="parent" element={<ParentDashboardPage />} />
          <Route path="exam-report" element={<ExamReportPage />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="knowledge" element={<KnowledgeManagement />} />
          <Route path="prompts" element={<PromptManagement />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="logs" element={<SystemLogs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
