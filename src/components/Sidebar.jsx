import { NavLink, useNavigate } from 'react-router-dom'
import { Button } from '@heroui/react'
import { useAuth } from '../context/AuthContext'

function IconDashboard() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  )
}

function IconBook() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 1 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 13.5Z" />
    </svg>
  )
}

function IconModules() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 3h14M1 8h14M1 13h14" strokeLinecap="round" />
    </svg>
  )
}

function IconQuestions() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="7" />
      <path d="M6.25 6.25a1.75 1.75 0 1 1 2.14 1.7A.75.75 0 0 0 8 8.75V9.5" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r=".5" fill="currentColor" stroke="none" />
    </svg>
  )
}

export default function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const isAdmin = profile?.role === 'admin'

  async function handleLogout() {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        Aplo Consultant Hub
        <span>Learning Platform</span>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
        >
          <IconDashboard />
          Dashboard
        </NavLink>
        <NavLink
          to="/learn"
          className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
        >
          <IconBook />
          Learning
        </NavLink>

        {isAdmin && (
          <>
            <div className="sidebar-section-label">Admin</div>
            <NavLink
              to="/admin/modules"
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              <IconModules />
              Modules
            </NavLink>
            <NavLink
              to="/admin/questions"
              className={({ isActive }) => 'sidebar-link' + (isActive ? ' active' : '')}
            >
              <IconQuestions />
              Questions
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user-name">{profile?.full_name ?? 'Loading…'}</div>
        <Button
          variant="ghost"
          size="sm"
          className="sidebar-logout"
          onPress={handleLogout}
        >
          Sign out
        </Button>
      </div>
    </aside>
  )
}
