import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

const EMPTY_FORM = {
  title: '',
  module_id: '',
  lesson_type: 'article',
  display_order: 1,
  published: false,
  content: '',
}

export default function LessonForm() {
  const { lessonId } = useParams()
  const [searchParams] = useSearchParams()
  const isNew = !lessonId
  const navigate = useNavigate()

  const [form, setForm] = useState({
    ...EMPTY_FORM,
    module_id: searchParams.get('moduleId') ?? '',
  })
  const [modules, setModules] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchModules()
    if (!isNew) fetchLesson()
    else setLoading(false)
  }, [lessonId])

  async function fetchModules() {
    const { data } = await supabase
      .from('modules')
      .select('id, title, phase')
      .order('display_order', { ascending: true })
    setModules(data ?? [])
  }

  async function fetchLesson() {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single()

    if (err) {
      setError(err.message)
    } else {
      const { id, created_at, ...fields } = data
      setForm(fields)
    }
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
      ({ error: err } = await supabase.from('lessons').insert(payload))
    } else {
      ({ error: err } = await supabase.from('lessons').update(payload).eq('id', lessonId))
    }

    if (err) {
      setError(err.message)
      setSaving(false)
    } else {
      const backTo = form.module_id ? `/admin/modules/${form.module_id}` : '/admin/modules'
      navigate(backTo)
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

  const backTo = form.module_id ? `/admin/modules/${form.module_id}` : '/admin/modules'

  return (
    <div className="page-fade page-inner">
      <div className="page-header">
        <h1 className="page-title">{isNew ? 'New lesson' : 'Edit lesson'}</h1>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="card" style={{ padding: 28 }}>
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
              placeholder="e.g. Scoping the Engagement"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label" htmlFor="module_id">Module</label>
              <select
                id="module_id"
                name="module_id"
                className="form-select"
                value={form.module_id}
                onChange={handleChange}
                required
              >
                <option value="">Select a module…</option>
                {modules.map(m => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lesson_type">Type</label>
              <select
                id="lesson_type"
                name="lesson_type"
                className="form-select"
                value={form.lesson_type}
                onChange={handleChange}
              >
                <option value="article">Article</option>
                <option value="checklist">Checklist</option>
                <option value="tool">Tool</option>
                <option value="template">Template</option>
              </select>
            </div>
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
              style={{ maxWidth: 120 }}
            />
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

          <div className="form-group">
            <label className="form-label" htmlFor="content">Content</label>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Use <code style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>**bold**</code> for bold,{' '}
              <code style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>*italic*</code> for italic,
              and blank lines for paragraph breaks.
            </p>
            <textarea
              id="content"
              name="content"
              className="form-textarea large"
              value={form.content}
              onChange={handleChange}
              placeholder="Write your lesson content here…"
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save lesson'}
            </button>
            <Link to={backTo} className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
