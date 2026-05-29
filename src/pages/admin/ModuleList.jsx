import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Chip, Spinner, Switch } from '@heroui/react'
import { supabase } from '../../lib/supabase'

const PHASE_CHIP = {
  before: { color: 'warning', label: 'Before' },
  during: { color: 'accent',  label: 'During' },
  after:  { color: 'success', label: 'After' },
}

export default function ModuleList() {
  const [modules, setModules] = useState([])
  const [lessonCounts, setLessonCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchModules()
  }, [])

  async function fetchModules() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('modules')
      .select('*')
      .order('display_order', { ascending: true })

    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    setModules(data ?? [])

    if (data && data.length > 0) {
      const ids = data.map(m => m.id)
      const { data: lessons } = await supabase
        .from('lessons')
        .select('module_id')
        .in('module_id', ids)

      const counts = {}
      ;(lessons ?? []).forEach(l => {
        counts[l.module_id] = (counts[l.module_id] ?? 0) + 1
      })
      setLessonCounts(counts)
    }

    setLoading(false)
  }

  async function togglePublished(module) {
    const { error: err } = await supabase
      .from('modules')
      .update({ published: !module.published })
      .eq('id', module.id)

    if (err) {
      setError(err.message)
    } else {
      setModules(prev => prev.map(m => m.id === module.id ? { ...m, published: !m.published } : m))
    }
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
      <div className="toolbar">
        <div>
          <h1 className="page-title">Modules</h1>
          <p className="page-subtitle">Manage learning modules and their lessons</p>
        </div>
        <Link to="/admin/modules/new" className="btn btn-primary btn-sm">+ New module</Link>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {modules.length === 0 ? (
        <Card>
          <div className="empty-state">
            No modules yet.{' '}
            <Link to="/admin/modules/new" style={{ color: 'var(--accent)' }}>Create the first one →</Link>
          </div>
        </Card>
      ) : (
        <Card>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Phase</th>
                <th>Lessons</th>
                <th>Order</th>
                <th>Published</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {modules.map(mod => (
                <tr key={mod.id}>
                  <td style={{ fontWeight: 600 }}>{mod.title}</td>
                  <td>
                    {(() => {
                      const c = PHASE_CHIP[mod.phase] ?? { color: 'default', label: mod.phase }
                      return <Chip color={c.color} variant="soft" size="sm">{c.label}</Chip>
                    })()}
                  </td>
                  <td>{lessonCounts[mod.id] ?? 0}</td>
                  <td>{mod.display_order}</td>
                  <td>
                    <Switch
                      isSelected={mod.published}
                      onChange={() => togglePublished(mod)}
                      aria-label={mod.published ? 'Unpublish' : 'Publish'}
                      size="sm"
                    >
                      <Switch.Control><Switch.Thumb /></Switch.Control>
                    </Switch>
                  </td>
                  <td>
                    <Link to={`/admin/modules/${mod.id}`} className="btn btn-secondary btn-sm">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
