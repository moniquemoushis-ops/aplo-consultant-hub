import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Button, Card, Chip, Spinner, Switch,
  TextField, Label, Input, TextArea,
  Select, ListBox, ListBoxItem,
} from '@heroui/react'
import { supabase } from '../../lib/supabase'

const TYPE_CHIP = {
  article:  { color: 'default', label: 'Article' },
  checklist: { color: 'accent',  label: 'Checklist' },
  tool:     { color: 'danger',  label: 'Tool' },
  template: { color: 'warning', label: 'Template' },
}

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

  function field(name) {
    return (value) => setForm(prev => ({ ...prev, [name]: value }))
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
        <Spinner />
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

      <Card style={{ padding: 28, marginBottom: 28 }}>
        <form onSubmit={handleSubmit}>
          <TextField value={form.title} onChange={field('title')} isRequired fullWidth style={{ marginBottom: 20 }}>
            <Label className="form-label">Title</Label>
            <Input placeholder="e.g. Engagement Foundations" />
          </TextField>

          <TextField value={form.description} onChange={field('description')} fullWidth style={{ marginBottom: 20 }}>
            <Label className="form-label">Description</Label>
            <TextArea placeholder="Brief description of what this module covers" rows={3} />
          </TextField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <Select
              selectedKey={form.phase}
              onSelectionChange={(key) => setForm(prev => ({ ...prev, phase: String(key) }))}
              fullWidth
            >
              <Label className="form-label">Phase</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBoxItem id="before">Before</ListBoxItem>
                  <ListBoxItem id="during">During</ListBoxItem>
                  <ListBoxItem id="after">After</ListBoxItem>
                </ListBox>
              </Select.Popover>
            </Select>

            <div className="form-group">
              <label className="form-label" htmlFor="display_order">Display order</label>
              <input
                id="display_order"
                name="display_order"
                type="number"
                className="form-input"
                value={form.display_order}
                onChange={e => setForm(prev => ({ ...prev, display_order: e.target.value }))}
                min={1}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <Switch isSelected={form.published} onChange={field('published')}>
              <Switch.Control><Switch.Thumb /></Switch.Control>
              <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 500 }}>
                Published (visible to consultants)
              </span>
            </Switch>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button type="submit" variant="primary" isDisabled={saving}>
              {saving ? 'Saving…' : 'Save module'}
            </Button>
            <Link to="/admin/modules" className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </Card>

      {!isNew && (
        <div>
          <div className="toolbar">
            <div className="section-title" style={{ margin: 0, border: 'none', paddingBottom: 0 }}>
              Lessons in this module
            </div>
            <Link to={`/admin/lessons/new?moduleId=${moduleId}`} className="btn btn-secondary btn-sm">+ Add lesson</Link>
          </div>

          {lessons.length === 0 ? (
            <div className="empty-state">No lessons yet.</div>
          ) : (
            <Card>
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
                      <td>
                        {(() => {
                          const c = TYPE_CHIP[lesson.lesson_type] ?? { color: 'default', label: lesson.lesson_type }
                          return <Chip color={c.color} variant="soft" size="sm">{c.label}</Chip>
                        })()}
                      </td>
                      <td>{lesson.display_order}</td>
                      <td>
                        <Chip color={lesson.published ? 'success' : 'default'} variant="soft" size="sm">
                          {lesson.published ? 'Yes' : 'No'}
                        </Chip>
                      </td>
                      <td>
                        <Link to={`/admin/lessons/${lesson.id}`} className="btn btn-secondary btn-sm">Edit</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}
