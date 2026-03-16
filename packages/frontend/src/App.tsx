import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import ReportDetail from './pages/ReportDetail';
import Login from './pages/Login';
import Admin from './pages/Admin';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={<Layout><Dashboard /></Layout>}
      />
      <Route
        path="/reports/:id"
        element={<Layout><ReportDetail /></Layout>}
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requireAdmin>
            <Layout><Admin /></Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
