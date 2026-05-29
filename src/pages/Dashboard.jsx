import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Card, Spinner } from '@heroui/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ProgressBar from '../components/ProgressBar'
import PhaseBadge from '../components/PhaseBadge'

const PLACEHOLDER_RECENT = [
  { id: 'p1', title: 'Scoping the Engagement', moduleId: 'p-mod-1', moduleName: 'Engagement Foundations' },
  { id: 'p2', title: 'Setting Client Expectations', moduleId: 'p-mod-1', moduleName: 'Engagement Foundations' },
]

export default function Dashboard() {
  const { user, profile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [viewedCount, setViewedCount] = useState(0)
  const [totalLessons, setTotalLessons] = useState(0)
  const [phaseCounts, setPhaseCounts] = useState({ before: 0, during: 0, after: 0 })
  const [recentLessons, setRecentLessons] = useState([])

  const [stats, setStats] = useState({ modules: 0, lessons: 0, openQuestions: 0 })
  const [recentQuestions, setRecentQuestions] = useState([])

  useEffect(() => {
    if (!user) return
    isAdmin ? fetchAdminData() : fetchConsultantData()
  }, [user, isAdmin])

  async function fetchConsultantData() {
    setLoading(true)
    try {
      const [modulesRes, lessonsRes, viewsRes, recentViewsRes] = await Promise.all([
        supabase.from('modules').select('id, phase').eq('published', true),
        supabase.from('lessons').select('id').eq('published', true),
        supabase.from('lesson_views').select('lesson_id').eq('user_id', user.id),
        supabase
          .from('lesson_views')
          .select('lesson_id, created_at, lessons(id, title, module_id, modules(id, title))')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(3),
      ])

      if (modulesRes.error) throw modulesRes.error

      const modules = modulesRes.data ?? []
      const counts = { before: 0, during: 0, after: 0 }
      modules.forEach(m => { if (counts[m.phase] !== undefined) counts[m.phase]++ })
      setPhaseCounts(counts)

      setTotalLessons(lessonsRes.data?.length ?? 0)
      setViewedCount(viewsRes.data?.length ?? 0)

      const recent = (recentViewsRes.data ?? [])
        .filter(v => v.lessons)
        .map(v => ({
          id: v.lessons.id,
          title: v.lessons.title,
          moduleId: v.lessons.module_id,
          moduleName: v.lessons.modules?.title ?? '',
        }))
      setRecentLessons(recent)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function fetchAdminData() {
    setLoading(true)
    try {
      const [modulesRes, lessonsRes, questionsRes, recentQRes] = await Promise.all([
        supabase.from('modules').select('id').eq('published', true),
        supabase.from('lessons').select('id').eq('published', true),
        supabase.from('questions').select('id').eq('status', 'open'),
        supabase
          .from('questions')
          .select('id, question_text, created_at, status, lessons(title)')
          .eq('status', 'open')
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      setStats({
        modules: modulesRes.data?.length ?? 0,
        lessons: lessonsRes.data?.length ?? 0,
        openQuestions: questionsRes.data?.length ?? 0,
      })
      setRecentQuestions(recentQRes.data ?? [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        <Spinner />
        Loading dashboard…
      </div>
    )
  }

  return (
    <div className="page-fade page-inner">
      <div className="page-header">
        <h1 className="page-title">Welcome back, {profile?.full_name?.split(' ')[0] ?? 'there'}</h1>
        <p className="page-subtitle">{isAdmin ? 'Admin overview' : 'Pick up where you left off'}</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {isAdmin ? (
        <AdminDashboard stats={stats} recentQuestions={recentQuestions} />
      ) : (
        <ConsultantDashboard
          viewedCount={viewedCount}
          totalLessons={totalLessons}
          phaseCounts={phaseCounts}
          recentLessons={recentLessons}
        />
      )}
    </div>
  )
}

function ConsultantDashboard({ viewedCount, totalLessons, phaseCounts, recentLessons }) {
  return (
    <>
      <Card style={{ padding: 20, marginBottom: 24 }}>
        <ProgressBar value={viewedCount} max={totalLessons || 1} label="Lessons completed" />
      </Card>

      <div className="phase-cards">
        {[
          { key: 'before', label: 'Before', count: phaseCounts.before },
          { key: 'during', label: 'During', count: phaseCounts.during },
          { key: 'after', label: 'After', count: phaseCounts.after },
        ].map(({ key, label, count }) => (
          <Card key={key} className="phase-card">
            <div className={`phase-card-label ${key}`}>{label}</div>
            <div className="phase-card-count">{count}</div>
            <div className="phase-card-sub">{count === 1 ? 'module' : 'modules'}</div>
            <Link to="/learn" className="btn btn-secondary btn-sm">Go to modules</Link>
          </Card>
        ))}
      </div>

      <div>
        <div className="section-title">Continue learning</div>
        {recentLessons.length === 0 ? (
          <Card>
            <div className="empty-state">
              You haven't viewed any lessons yet.{' '}
              <Link to="/learn" style={{ color: 'var(--accent)' }}>Browse modules →</Link>
            </div>
          </Card>
        ) : (
          <Card className="recent-list">
            {recentLessons.map(lesson => (
              <Link
                key={lesson.id}
                to={`/learn/${lesson.moduleId}/${lesson.id}`}
                className="recent-item"
              >
                <div>
                  <div className="recent-item-label">{lesson.moduleName}</div>
                  <div className="recent-item-title">{lesson.title}</div>
                </div>
              </Link>
            ))}
          </Card>
        )}
      </div>
    </>
  )
}

function AdminDashboard({ stats, recentQuestions }) {
  function fmtDate(str) {
    return new Date(str).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  }

  return (
    <>
      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-label">Published modules</div>
          <div className="stat-value">{stats.modules}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Published lessons</div>
          <div className="stat-value">{stats.lessons}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Open questions</div>
          <div className="stat-value">{stats.openQuestions}</div>
        </Card>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        <Link to="/admin/modules" className="btn btn-primary">Manage modules</Link>
        <Link to="/admin/questions" className="btn btn-secondary">View questions</Link>
      </div>

      <div>
        <div className="section-title">Recent open questions</div>
        {recentQuestions.length === 0 ? (
          <Card>
            <div className="empty-state">No open questions right now.</div>
          </Card>
        ) : (
          <Card className="recent-list">
            {recentQuestions.map(q => (
              <Link key={q.id} to="/admin/questions" className="recent-item">
                <div style={{ flex: 1 }}>
                  <div className="recent-item-label">{q.lessons?.title ?? 'Unknown lesson'}</div>
                  <div className="recent-item-title">{q.question_text}</div>
                  <div className="recent-item-date">{fmtDate(q.created_at)}</div>
                </div>
              </Link>
            ))}
          </Card>
        )}
      </div>
    </>
  )
}
