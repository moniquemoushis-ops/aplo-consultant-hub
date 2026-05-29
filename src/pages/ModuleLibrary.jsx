import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Chip, Spinner } from '@heroui/react'
import { supabase } from '../lib/supabase'

const PLACEHOLDER_MODULES = [
  {
    id: 'placeholder-1',
    title: 'Engagement Foundations',
    description: 'Understand the groundwork needed before your first client meeting — from scoping the work to aligning internal expectations.',
    phase: 'before',
    lesson_count: 2,
  },
  {
    id: 'placeholder-2',
    title: 'Running the Engagement',
    description: 'Practical frameworks for managing client relationships, steering committees, and deliverable reviews during active work.',
    phase: 'during',
    lesson_count: 2,
  },
]

const PHASES = ['before', 'during', 'after']
const PHASE_LABELS = { before: 'Before', during: 'During', after: 'After' }
const PHASE_COLORS = { before: 'warning', during: 'accent', after: 'success' }

export default function ModuleLibrary() {
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchModules()
  }, [])

  async function fetchModules() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('modules')
      .select('id, title, description, phase, display_order, published')
      .eq('published', true)
      .order('display_order', { ascending: true })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    if (data && data.length > 0) {
      const ids = data.map(m => m.id)
      const { data: lessons } = await supabase
        .from('lessons')
        .select('module_id')
        .in('module_id', ids)
        .eq('published', true)

      const countMap = {}
      ;(lessons ?? []).forEach(l => {
        countMap[l.module_id] = (countMap[l.module_id] ?? 0) + 1
      })

      setModules(data.map(m => ({ ...m, lesson_count: countMap[m.id] ?? 0 })))
    } else {
      setModules(PLACEHOLDER_MODULES)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="loading-state">
        <Spinner />
        Loading modules…
      </div>
    )
  }

  return (
    <div className="page-fade page-inner">
      <div className="page-header">
        <h1 className="page-title">Module library</h1>
        <p className="page-subtitle">Browse all learning content organised by engagement phase</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {PHASES.map(phase => {
        const phaseModules = modules.filter(m => m.phase === phase)
        if (phaseModules.length === 0) return null

        return (
          <div key={phase} className="phase-section">
            <div className="phase-header">
              <div className={`phase-dot phase-dot-${phase}`} />
              <h2 className="phase-title">{PHASE_LABELS[phase]}</h2>
            </div>
            <div className="module-grid">
              {phaseModules.map(mod => (
                <Link
                  key={mod.id}
                  to={mod.id.startsWith('placeholder') ? '/learn' : `/learn/${mod.id}`}
                  className="no-underline"
                >
                  <Card className="module-card">
                    <div className="module-card-title">{mod.title}</div>
                    <div className="module-card-desc">{mod.description}</div>
                    <div className="module-card-meta">
                      <span className="module-card-count">
                        {mod.lesson_count} {mod.lesson_count === 1 ? 'lesson' : 'lessons'}
                      </span>
                      <Chip
                        color={PHASE_COLORS[mod.phase] ?? 'default'}
                        variant="soft"
                        size="sm"
                      >
                        {PHASE_LABELS[mod.phase] ?? mod.phase}
                      </Chip>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )
      })}

      {modules.length === 0 && !error && (
        <div className="empty-state">No published modules yet.</div>
      )}
    </div>
  )
}
