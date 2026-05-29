import { ProgressBar as HeroProgressBar, Label } from '@heroui/react'

export default function ProgressBar({ value, max, label }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0

  return (
    <HeroProgressBar value={pct} maxValue={100}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <Label style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</Label>
        <HeroProgressBar.Output style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          {value} / {max}
        </HeroProgressBar.Output>
      </div>
      <HeroProgressBar.Track>
        <HeroProgressBar.Fill />
      </HeroProgressBar.Track>
    </HeroProgressBar>
  )
}
