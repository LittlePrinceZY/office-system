import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth';
import { useSystemStore } from './stores/system';

// 页面导入
import LoginPage from './pages/Login';
import PortalPage from './pages/Portal';
import OfficeLayout from './pages/Office/Layout';
import Dashboard from './pages/Office/Dashboard';
import Contacts from './pages/Office/Contacts';
import Chat from './pages/Office/Chat';
import Announcements from './pages/Office/Announcements';
import Approvals from './pages/Office/Approvals';
import FinanceRoutes from './pages/Office/Finance';
import CRMRoutes from './pages/Office/CRM/CRMRoutes';
import Users from './pages/Office/System/Users';
import Roles from './pages/Office/System/Roles';
import Departments from './pages/Office/System/Departments';
import SystemConfig from './pages/Office/System/Config';
import ThemeTest from './components/ThemeTest';

// 路由守卫组件
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!user?.isAdmin) return <Navigate to="/office" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const { initialize } = useAuthStore();
  const { fetchSystemName } = useSystemStore();

  useEffect(() => {
    initialize();
    fetchSystemName();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        {/* 登录页面 */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* 门户页面 */}
        <Route
          path="/portal"
          element={
            <ProtectedRoute>
              <PortalPage />
            </ProtectedRoute>
          }
        />
        
        {/* 办公模式 */}
        <Route
          path="/office"
          element={
            <ProtectedRoute>
              <OfficeLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="chat" element={<Chat />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="approvals/*" element={<Approvals />} />
          <Route path="finance/*" element={<FinanceRoutes />} />
          <Route path="crm/*" element={<CRMRoutes />} />
          
          {/* 系统管理 - 需要管理员权限 */}
          <Route
            path="system/users"
            element={
              <AdminRoute>
                <Users />
              </AdminRoute>
            }
          />
          <Route
            path="system/roles"
            element={
              <AdminRoute>
                <Roles />
              </AdminRoute>
            }
          />
          <Route
            path="system/departments"
            element={
              <AdminRoute>
                <Departments />
              </AdminRoute>
            }
          />
          <Route
            path="system/config"
            element={
              <AdminRoute>
                <SystemConfig />
              </AdminRoute>
            }
          />
        </Route>
        
        {/* 测试页面 - 仅用于开发 */}
        <Route path="/theme-test" element={<ThemeTest />} />
        
        {/* 默认路由 */}
        <Route path="/" element={<Navigate to="/portal" replace />} />
        <Route path="*" element={<Navigate to="/portal" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
