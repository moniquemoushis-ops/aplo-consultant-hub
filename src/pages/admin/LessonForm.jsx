import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Button, Card, Spinner, Switch,
  TextField, Label, Input, TextArea,
  Select, ListBox, ListBoxItem,
} from '@heroui/react'
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
        <Spinner />
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

      <Card style={{ padding: 28 }}>
        <form onSubmit={handleSubmit}>
          <TextField value={form.title} onChange={field('title')} isRequired fullWidth style={{ marginBottom: 20 }}>
            <Label className="form-label">Title</Label>
            <Input placeholder="e.g. Scoping the Engagement" />
          </TextField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            <Select
              selectedKey={form.module_id || null}
              onSelectionChange={(key) => setForm(prev => ({ ...prev, module_id: String(key) }))}
              isRequired
              fullWidth
            >
              <Label className="form-label">Module</Label>
              <Select.Trigger>
                <Select.Value placeholder="Select a module…" />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  {modules.map(m => (
                    <ListBoxItem key={m.id} id={m.id}>{m.title}</ListBoxItem>
                  ))}
                </ListBox>
              </Select.Popover>
            </Select>

            <Select
              selectedKey={form.lesson_type}
              onSelectionChange={(key) => setForm(prev => ({ ...prev, lesson_type: String(key) }))}
              fullWidth
            >
              <Label className="form-label">Type</Label>
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBoxItem id="article">Article</ListBoxItem>
                  <ListBoxItem id="checklist">Checklist</ListBoxItem>
                  <ListBoxItem id="tool">Tool</ListBoxItem>
                  <ListBoxItem id="template">Template</ListBoxItem>
                </ListBox>
              </Select.Popover>
            </Select>
          </div>

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
              style={{ maxWidth: 120 }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <Switch isSelected={form.published} onChange={field('published')}>
              <Switch.Control><Switch.Thumb /></Switch.Control>
              <span style={{ marginLeft: 8, fontSize: 14, fontWeight: 500 }}>
                Published (visible to consultants)
              </span>
            </Switch>
          </div>

          <TextField value={form.content} onChange={field('content')} fullWidth style={{ marginBottom: 20 }}>
            <Label className="form-label">Content</Label>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Use{' '}
              <code style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>**bold**</code>
              {' '}for bold,{' '}
              <code style={{ background: 'var(--bg)', padding: '1px 5px', borderRadius: 4, fontSize: 12 }}>*italic*</code>
              {' '}for italic, and blank lines for paragraph breaks.
            </p>
            <TextArea
              className="large"
              placeholder="Write your lesson content here…"
            />
          </TextField>

          <div style={{ display: 'flex', gap: 10 }}>
            <Button type="submit" variant="primary" isDisabled={saving}>
              {saving ? 'Saving…' : 'Save lesson'}
            </Button>
            <Link to={backTo} className="btn btn-secondary">Cancel</Link>
          </div>
        </form>
      </Card>
    </div>
  )
}
