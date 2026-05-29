import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, Spinner } from '@heroui/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import PhaseBadge from '../components/PhaseBadge'
import LessonTypeBadge from '../components/LessonTypeBadge'

const PLACEHOLDER_LESSONS = {
  'placeholder-1': [
    { id: 'pl-1', title: 'Scoping the Engagement', lesson_type: 'article', display_order: 1 },
    { id: 'pl-2', title: 'Setting Client Expectations', lesson_type: 'checklist', display_order: 2 },
  ],
  'placeholder-2': [
    { id: 'pl-3', title: 'Stakeholder Mapping', lesson_type: 'tool', display_order: 1 },
    { id: 'pl-4', title: 'Weekly Status Reporting', lesson_type: 'template', display_order: 2 },
  ],
}

const PLACEHOLDER_MODULES = {
  'placeholder-1': { id: 'placeholder-1', title: 'Engagement Foundations', description: 'Understand the groundwork needed before your first client meeting.', phase: 'before' },
  'placeholder-2': { id: 'placeholder-2', title: 'Running the Engagement', description: 'Practical frameworks for managing client relationships during active work.', phase: 'during' },
}

export default function ModuleDetail() {
  const { moduleId } = useParams()
  const { user } = useAuth()

  const [module, setModule] = useState(null)
  const [lessons, setLessons] = useState([])
  const [viewedIds, setViewedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (moduleId.startsWith('placeholder')) {
      setModule(PLACEHOLDER_MODULES[moduleId] ?? null)
      setLessons(PLACEHOLDER_LESSONS[moduleId] ?? [])
      setLoading(false)
      return
    }
    fetchData()
  }, [moduleId])

  async function fetchData() {
    setLoading(true)
    try {
      const [moduleRes, lessonsRes, viewsRes] = await Promise.all([
        supabase.from('modules').select('*').eq('id', moduleId).single(),
        supabase
          .from('lessons')
          .select('id, title, lesson_type, display_order')
          .eq('module_id', moduleId)
          .eq('published', true)
          .order('display_order', { ascending: true }),
        supabase
          .from('lesson_views')
          .select('lesson_id')
          .eq('user_id', user.id),
      ])

      if (moduleRes.error) throw moduleRes.error
      setModule(moduleRes.data)
      setLessons(lessonsRes.data ?? [])
      setViewedIds(new Set((viewsRes.data ?? []).map(v => v.lesson_id)))
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
        Loading module…
      </div>
    )
  }

  if (!module) {
    return <div className="error-msg">Module not found.</div>
  }

  return (
    <div className="page-fade page-inner">
      <div className="breadcrumb">
        <Link to="/learn">Learning</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{module.title}</span>
      </div>

      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <PhaseBadge phase={module.phase} />
        </div>
        <h1 className="page-title">{module.title}</h1>
        {module.description && (
          <p className="page-subtitle">{module.description}</p>
        )}
      </div>

      {error && <div className="error-msg">{error}</div>}

      {lessons.length === 0 ? (
        <div className="empty-state">No lessons published yet.</div>
      ) : (
        <div className="lesson-list">
          {lessons.map(lesson => (
            <Link
              key={lesson.id}
              to={lesson.id.startsWith('pl-') ? '#' : `/learn/${moduleId}/${lesson.id}`}
              className="lesson-row"
            >
              <LessonTypeBadge type={lesson.lesson_type} />
              <span className="lesson-row-title">{lesson.title}</span>
              {viewedIds.has(lesson.id) && (
                <span className="lesson-viewed">Viewed</span>
              )}
            </Link>
          ))}
        </div>
      )}

      <Link to="/learn" className="back-link">← Back to modules</Link>
    </div>
  )
}
