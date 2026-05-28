import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AdminRoute({ children }) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        Loading…
      </div>
    )
  }

  if (profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
