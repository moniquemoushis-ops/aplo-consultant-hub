import { Navigate } from 'react-router-dom'

// /admin redirects to /admin/modules
export default function AdminDashboard() {
  return <Navigate to="/admin/modules" replace />
}
