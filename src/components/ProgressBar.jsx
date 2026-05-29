import { ProgressBar as HeroProgressBar } from '@heroui/react'

export default function ProgressBar({ value, max, label }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0

  return (
    <HeroProgressBar value={pct} maxValue={100}>
      <div className="flex justify-between mb-1.5">
        <span className="text-[13px] text-[var(--text-secondary)]">{label}</span>
        <HeroProgressBar.Output className="text-[13px] font-semibold text-[var(--text-primary)]">
          {value} / {max}
        </HeroProgressBar.Output>
      </div>
      <HeroProgressBar.Track>
        <HeroProgressBar.Fill />
      </HeroProgressBar.Track>
    </HeroProgressBar>
  )
}
