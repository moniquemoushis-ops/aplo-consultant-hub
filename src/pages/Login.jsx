import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, TextField, Label, Input, Card } from '@heroui/react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="login-page">
      <Card className="login-card">
        <div className="login-logo">Aplo Consultant Hub</div>
        <p className="login-tagline">Sign in to access your learning platform</p>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit}>
          <TextField
            value={email}
            onChange={setEmail}
            type="email"
            isRequired
            autoFocus
            fullWidth
            className="mb-5"
          >
            <Label>Email</Label>
            <Input placeholder="you@example.com" />
          </TextField>

          <TextField
            value={password}
            onChange={setPassword}
            type="password"
            isRequired
            fullWidth
            className="mb-6"
          >
            <Label>Password</Label>
            <Input placeholder="••••••••" />
          </TextField>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isDisabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
