import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AppLayout from './layout/AppLayout';
import AuthPage from './pages/AuthPages';
import DashboardPage from './pages/DashboardPage';
import { ProjectsPage, ProjectDetailPage } from './pages/ProjectsPages';
import TasksPage from './pages/TasksPage';
import { AdminUsersPage, NotFoundPage, NotificationsPage } from './pages/OtherPages';
import { loadMe, logout } from './store';
import { Loading } from './components/ui';

function Protected({ admin = false, children }) {
  const { user, ready } = useSelector((s) => s.auth);
  if (!ready) return <div className="min-h-screen bg-slate-50 dark:bg-slate-950"><Loading label="Restoring session…"/></div>;
  if (!user) return <Navigate to="/login" replace/>;
  if (admin && user.role !== 'ADMIN') return <Navigate to="/dashboard" replace/>;
  return children;
}
export default function App() {
  const dispatch = useDispatch();
  useEffect(() => { localStorage.getItem('taskflow_token') ? dispatch(loadMe()) : dispatch(logout()); }, [dispatch]);
  return <Routes>
    <Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/register" element={<AuthPage mode="register"/>}/>
    <Route element={<Protected><AppLayout/></Protected>}><Route index element={<Navigate to="/dashboard" replace/>}/><Route path="/dashboard" element={<DashboardPage/>}/><Route path="/projects" element={<ProjectsPage/>}/><Route path="/projects/:id" element={<ProjectDetailPage/>}/><Route path="/tasks" element={<TasksPage/>}/><Route path="/notifications" element={<NotificationsPage/>}/><Route path="/admin/users" element={<Protected admin><AdminUsersPage/></Protected>}/><Route path="*" element={<NotFoundPage/>}/></Route>
  </Routes>;
}
