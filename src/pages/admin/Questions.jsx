import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import StatusBadge from '../../components/StatusBadge'

const TABS = ['all', 'open', 'answered']

export default function Questions() {
  const [questions, setQuestions] = useState([])
  const [tab, setTab] = useState('open')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(null)
  const [answers, setAnswers] = useState({})
  const [submitting, setSubmitting] = useState(null)

  useEffect(() => {
    fetchQuestions()
  }, [tab])

  async function fetchQuestions() {
    setLoading(true)
    let query = supabase
      .from('questions')
      .select('id, question_text, answer_text, status, created_at, lessons(title)')
      .order('created_at', { ascending: false })

    if (tab !== 'all') {
      query = query.eq('status', tab)
    }

    const { data, error: err } = await query
    if (err) setError(err.message)
    else setQuestions(data ?? [])
    setLoading(false)
  }

  function fmtDate(str) {
    return new Date(str).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    })
  }

  async function handleAnswer(questionId) {
    const text = answers[questionId]?.trim()
    if (!text) return

    setSubmitting(questionId)
    const { error: err } = await supabase
      .from('questions')
      .update({ answer_text: text, status: 'answered' })
      .eq('id', questionId)

    if (err) {
      setError(err.message)
    } else {
      setQuestions(prev =>
        prev.map(q => q.id === questionId ? { ...q, answer_text: text, status: 'answered' } : q)
      )
      setAnswers(prev => ({ ...prev, [questionId]: '' }))
      setExpanded(null)
    }
    setSubmitting(null)
  }

  return (
    <div className="page-fade page-inner">
      <div className="page-header">
        <h1 className="page-title">Questions</h1>
        <p className="page-subtitle">Review and answer questions submitted by consultants</p>
      </div>

      {error && <div className="error-msg">{error}</div>}

      <div className="filter-tabs">
        {TABS.map(t => (
          <button
            key={t}
            className={`filter-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          Loading questions…
        </div>
      ) : questions.length === 0 ? (
        <div className="empty-state">No questions found.</div>
      ) : (
        questions.map(q => (
          <div key={q.id} className="card question-card">
            <div
              className="question-card-header"
              onClick={() => setExpanded(expanded === q.id ? null : q.id)}
            >
              <div style={{ flex: 1 }}>
                <div className="question-meta">
                  {q.lessons?.title ?? 'Unknown lesson'} · {fmtDate(q.created_at)}
                </div>
                <div className="question-text">{q.question_text}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <StatusBadge status={q.status} />
                <button className="question-expand">
                  {expanded === q.id ? '−' : '+'}
                </button>
              </div>
            </div>

            {expanded === q.id && (
              <div className="question-answer-area" style={{ paddingTop: 16 }}>
                {q.answer_text && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      ANSWER
                    </div>
                    <div className="question-existing-answer">{q.answer_text}</div>
                  </div>
                )}

                {q.status !== 'answered' && (
                  <>
                    <div className="form-group" style={{ marginBottom: 10 }}>
                      <textarea
                        className="form-textarea"
                        placeholder="Write your answer…"
                        rows={4}
                        value={answers[q.id] ?? ''}
                        onChange={e => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      />
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAnswer(q.id)}
                      disabled={submitting === q.id}
                    >
                      {submitting === q.id ? 'Submitting…' : 'Submit answer'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
