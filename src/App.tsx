import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import BudgetsPage from './pages/BudgetsPage';
import BudgetDetailPage from './pages/BudgetDetailPage';
import MaterialsPage from './pages/MaterialsPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminEmpresasPage from './pages/admin/AdminEmpresasPage';
import AdminPlanosPage from './pages/admin/AdminPlanosPage';
import AdminUsuariosPage from './pages/admin/AdminUsuariosPage';
import AdminLogsPage from './pages/admin/AdminLogsPage';
import AdminOperacoesPage from './pages/admin/AdminOperacoesPage';
import AdminRelatoriosPage from './pages/admin/AdminRelatoriosPage';
import AdminFinanceiroPage from './pages/admin/AdminFinanceiroPage';
import AdminConfiguracoesPage from './pages/admin/AdminConfiguracoesPage';

function PrivateRoute({ children, adminOnly = false, gestorOnly = false }: {
  children: React.ReactNode;
  adminOnly?: boolean;
  gestorOnly?: boolean;
}) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  if (gestorOnly && user.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-700" /></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'ADMIN' ? '/admin' : '/dashboard'} replace /> : <LoginPage />} />
      <Route path="/" element={<Navigate to={user?.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />} />

      {/* Client (GESTOR) routes */}
      <Route element={<PrivateRoute gestorOnly><Layout /></PrivateRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/projetos" element={<ProjectsPage />} />
        <Route path="/projetos/:id" element={<ProjectDetailPage />} />
        <Route path="/orcamentos" element={<BudgetsPage />} />
        <Route path="/orcamentos/:id" element={<BudgetDetailPage />} />
        <Route path="/materiais" element={<MaterialsPage />} />
        <Route path="/relatorios" element={<ReportsPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
      </Route>

      {/* Admin (SaaS) routes */}
      <Route element={<PrivateRoute adminOnly><Layout /></PrivateRoute>}>
        <Route path="/admin" element={<AdminDashboardPage />} />
        <Route path="/admin/empresas" element={<AdminEmpresasPage />} />
        <Route path="/admin/planos" element={<AdminPlanosPage />} />
        <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
        <Route path="/admin/financeiro" element={<AdminFinanceiroPage />} />
        <Route path="/admin/relatorios" element={<AdminRelatoriosPage />} />
        <Route path="/admin/operacoes" element={<AdminOperacoesPage />} />
        <Route path="/admin/logs" element={<AdminLogsPage />} />
        <Route path="/admin/configuracoes" element={<AdminConfiguracoesPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
