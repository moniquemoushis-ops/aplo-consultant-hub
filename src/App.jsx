import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Sidebar from './components/Sidebar'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ModuleLibrary from './pages/ModuleLibrary'
import ModuleDetail from './pages/ModuleDetail'
import LessonView from './pages/LessonView'
import AdminDashboard from './pages/admin/AdminDashboard'
import ModuleList from './pages/admin/ModuleList'
import ModuleForm from './pages/admin/ModuleForm'
import LessonForm from './pages/admin/LessonForm'
import Questions from './pages/admin/Questions'

function AppLayout() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const isLogin = location.pathname === '/login'

  if (loading) {
    return (
      <div className="loading-state" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
        Loading…
      </div>
    )
  }

  if (!user || isLogin) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn"
            element={
              <ProtectedRoute>
                <ModuleLibrary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/:moduleId"
            element={
              <ProtectedRoute>
                <ModuleDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/learn/:moduleId/:lessonId"
            element={
              <ProtectedRoute>
                <LessonView />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/modules"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <ModuleList />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/modules/new"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <ModuleForm />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/modules/:moduleId"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <ModuleForm />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/lessons/new"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <LessonForm />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/lessons/:lessonId"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <LessonForm />
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <Questions />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  )
}
