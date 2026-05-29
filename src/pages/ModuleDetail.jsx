import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, Chip, Spinner } from '@heroui/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

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

const PHASE_CHIP = {
  before: { color: 'warning', label: 'Before' },
  during: { color: 'accent', label: 'During' },
  after: { color: 'success', label: 'After' },
}

const TYPE_CHIP = {
  article:  { color: 'default', label: 'Article' },
  checklist: { color: 'accent',  label: 'Checklist' },
  tool:     { color: 'danger',  label: 'Tool' },
  template: { color: 'warning', label: 'Template' },
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

  const phaseChip = PHASE_CHIP[module.phase] ?? { color: 'default', label: module.phase }

  return (
    <div className="page-fade page-inner">
      <div className="breadcrumb">
        <Link to="/learn">Learning</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{module.title}</span>
      </div>

      <div className="page-header">
        <div className="flex items-center gap-2 mb-2">
          <Chip color={phaseChip.color} variant="soft" size="sm">{phaseChip.label}</Chip>
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
          {lessons.map(lesson => {
            const chip = TYPE_CHIP[lesson.lesson_type] ?? { color: 'default', label: lesson.lesson_type }
            return (
              <Link
                key={lesson.id}
                to={lesson.id.startsWith('pl-') ? '#' : `/learn/${moduleId}/${lesson.id}`}
                className="lesson-row"
              >
                <Chip color={chip.color} variant="soft" size="sm">{chip.label}</Chip>
                <span className="lesson-row-title">{lesson.title}</span>
                {viewedIds.has(lesson.id) && (
                  <span className="lesson-viewed">Viewed</span>
                )}
              </Link>
            )
          })}
        </div>
      )}

      <Link to="/learn" className="back-link">← Back to modules</Link>
    </div>
  )
}
