import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, Chip, Separator, Spinner, TextField, TextArea, Label } from '@heroui/react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const TYPE_CHIP = {
  article:  { color: 'default', label: 'Article' },
  checklist: { color: 'accent',  label: 'Checklist' },
  tool:     { color: 'danger',  label: 'Tool' },
  template: { color: 'warning', label: 'Template' },
}

function renderContent(text) {
  if (!text) return null

  return text.split(/\n\n+/).map((paragraph, pi) => {
    const parts = paragraph.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    const nodes = parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i}>{part.slice(1, -1)}</em>
      }
      return part
    })
    return <p key={pi}>{nodes}</p>
  })
}

export default function LessonView() {
  const { moduleId, lessonId } = useParams()
  const { user } = useAuth()

  const [lesson, setLesson] = useState(null)
  const [moduleName, setModuleName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [question, setQuestion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [questionSuccess, setQuestionSuccess] = useState(false)
  const [questionError, setQuestionError] = useState('')

  useEffect(() => {
    fetchLesson()
  }, [lessonId])

  async function fetchLesson() {
    setLoading(true)
    try {
      const [lessonRes, moduleRes] = await Promise.all([
        supabase.from('lessons').select('*').eq('id', lessonId).single(),
        supabase.from('modules').select('title').eq('id', moduleId).single(),
      ])

      if (lessonRes.error) throw lessonRes.error
      setLesson(lessonRes.data)
      setModuleName(moduleRes.data?.title ?? '')

      const { data: existing } = await supabase
        .from('lesson_views')
        .select('id')
        .eq('lesson_id', lessonId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (!existing) {
        await supabase.from('lesson_views').insert({ lesson_id: lessonId, user_id: user.id })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleQuestionSubmit(e) {
    e.preventDefault()
    if (!question.trim()) return

    setSubmitting(true)
    setQuestionError('')
    const { error: err } = await supabase.from('questions').insert({
      lesson_id: lessonId,
      user_id: user.id,
      question_text: question.trim(),
      status: 'open',
    })

    if (err) {
      setQuestionError(err.message)
    } else {
      setQuestionSuccess(true)
      setQuestion('')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="loading-state">
        <Spinner />
        Loading lesson…
      </div>
    )
  }

  if (!lesson) {
    return <div className="error-msg">Lesson not found.</div>
  }

  return (
    <div className="page-fade page-inner">
      <div className="breadcrumb">
        <Link to="/learn">Learning</Link>
        <span className="breadcrumb-sep">/</span>
        <Link to={`/learn/${moduleId}`}>{moduleName}</Link>
        <span className="breadcrumb-sep">/</span>
        <span>{lesson.title}</span>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="flex items-center gap-2 mb-3">
        {(() => {
          const chip = TYPE_CHIP[lesson.lesson_type] ?? { color: 'default', label: lesson.lesson_type }
          return <Chip color={chip.color} variant="soft" size="sm">{chip.label}</Chip>
        })()}
      </div>

      <h1 className="page-title mb-8">{lesson.title}</h1>

      <div className="lesson-content">
        {lesson.content ? renderContent(lesson.content) : (
          <p className="text-[var(--text-secondary)] italic">
            No content yet.
          </p>
        )}
      </div>

      <Separator className="my-7" />

      <div>
        <h3 className="text-base font-bold mb-1.5">
          Have a question about this lesson?
        </h3>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Submit your question and a consultant will respond.
        </p>

        {questionSuccess ? (
          <div className="success-msg">Your question has been submitted.</div>
        ) : (
          <form onSubmit={handleQuestionSubmit}>
            {questionError && <div className="error-msg">{questionError}</div>}
            <TextField
              value={question}
              onChange={setQuestion}
              isRequired
              fullWidth
              className="mb-3"
            >
              <TextArea placeholder="Ask your question…" rows={4} />
            </TextField>
            <Button type="submit" variant="primary" isDisabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit question'}
            </Button>
          </form>
        )}
      </div>

      <Link to={`/learn/${moduleId}`} className="back-link">← Back to module</Link>
    </div>
  )
}
