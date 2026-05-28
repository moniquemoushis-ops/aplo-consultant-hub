import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import LessonTypeBadge from '../components/LessonTypeBadge'

// Convert simple markdown-like syntax to React elements
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

      // Record lesson view (ignore if duplicate — RLS will handle or we check manually)
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
        <div className="spinner" />
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <LessonTypeBadge type={lesson.lesson_type} />
      </div>

      <h1 className="page-title" style={{ marginBottom: 32 }}>{lesson.title}</h1>

      <div className="lesson-content">
        {lesson.content ? renderContent(lesson.content) : (
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            No content yet.
          </p>
        )}
      </div>

      <div className="divider" />

      <div>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
          Have a question about this lesson?
        </h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Submit your question and a consultant will respond.
        </p>

        {questionSuccess ? (
          <div className="success-msg">Your question has been submitted.</div>
        ) : (
          <form onSubmit={handleQuestionSubmit}>
            {questionError && <div className="error-msg">{questionError}</div>}
            <div className="form-group" style={{ marginBottom: 12 }}>
              <textarea
                className="form-textarea"
                placeholder="Ask your question…"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                rows={4}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit question'}
            </button>
          </form>
        )}
      </div>

      <Link to={`/learn/${moduleId}`} className="back-link">← Back to module</Link>
    </div>
  )
}
