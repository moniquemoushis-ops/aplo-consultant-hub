import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import PhaseBadge from '../../components/PhaseBadge'
import LessonTypeBadge from '../../components/LessonTypeBadge'

const EMPTY_FORM = { title: '', description: '', phase: 'before', display_order: 1, published: false }

export default function ModuleForm() {
  const { moduleId } = useParams()
  const isNew = !moduleId
  const navigate = useNavigate()

  const [form, setForm] = useState(EMPTY_FORM)
  const [lessons, setLessons] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isNew) fetchModule()
  }, [moduleId])

  async function fetchModule() {
    setLoading(true)
    const [moduleRes, lessonsRes] = await Promise.all([
      supabase.from('modules').select('*').eq('id', moduleId).single(),
      supabase
        .from('lessons')
        .select('id, title, lesson_type, display_order, published')
        .eq('module_id', moduleId)
        .order('display_order', { ascending: true }),
    ])

    if (moduleRes.error) {
      setError(moduleRes.error.message)
    } else {
      const { id, created_at, ...fields } = moduleRes.data
      setForm(fields)
    }
    setLessons(lessonsRes.data ?? [])
    setLoading(false)
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const payload = { ...form, display_order: Number(form.display_order) }

    let err
    if (isNew) {
      ({ error: err } = await supabase.from('modules').insert(payload))
    } else {
      ({ error: err } = await supabase.from('modules').update(payload).eq('id', moduleId))
    }

    if (err) {
      setError(err.message)
      setSaving(false)
    } else {
      navigate('/admin/modules')
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        Loading…
      </div>
    )
  }

  return (
    <div className="page-fade page-inner">
      <div className="page-header">
        <h1 className="page-title">{isNew ? 'New module' : 'Edit module'}</h1>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card" style={{ padding: 28, marginBottom: 28 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              className="form-input"
              value={form.title}
              onChange={handleChange}
              required
              placeholder="e.g. Engagement Foundations"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              value={form.description}
              onChange={handleChange}
              placeholder="Brief description of what this module covers"
              rows={3}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="phase">Phase</label>
              <select id="phase" name="phase" className="form-select" value={form.phase} onChange={handleChange}>
                <option value="before">Before</option>
                <option value="during">During</option>
                <option value="after">After</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="display_order">Display order</label>
              <input
                id="display_order"
                name="display_order"
                type="number"
                className="form-input"
                value={form.display_order}
                onChange={handleChange}
                min={1}
              />
            </div>
          </div>

          <div className="form-checkbox-row">
            <input
              id="published"
              name="published"
              type="checkbox"
              checked={form.published}
              onChange={handleChange}
            />
            <label htmlFor="published">Published (visible to consultants)</label>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save module'}
            </button>
            <Link to="/admin/modules" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>

      {!isNew && (
        <div>
          <div className="toolbar">
            <div className="section-title" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
              Lessons in this module
            </div>
            <Link
              to={`/admin/lessons/new?moduleId=${moduleId}`}
              className="btn btn-secondary btn-sm"
            >
              + Add lesson
            </Link>
          </div>

          {lessons.length === 0 ? (
            <div className="empty-state">No lessons yet.</div>
          ) : (
            <div className="card">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Order</th>
                    <th>Published</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.map(lesson => (
                    <tr key={lesson.id}>
                      <td style={{ fontWeight: 600 }}>{lesson.title}</td>
                      <td><LessonTypeBadge type={lesson.lesson_type} /></td>
                      <td>{lesson.display_order}</td>
                      <td>
                        <span className={`badge ${lesson.published ? 'badge-answered' : 'badge-dismissed'}`}>
                          {lesson.published ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td>
                        <Link to={`/admin/lessons/${lesson.id}`} className="btn btn-secondary btn-sm">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
