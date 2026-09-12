import { Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { MandapamDetailPage } from './pages/MandapamDetailPage';
import { SubmitPage } from './pages/SubmitPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminProtectedRoute } from './components/admin/AdminProtectedRoute';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/mandapams/:id" element={<MandapamDetailPage />} />
      <Route path="/submit" element={<SubmitPage />} />
      
      {/* Admin routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <AdminProtectedRoute>
            <AdminDashboardPage />
          </AdminProtectedRoute>
        }
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
