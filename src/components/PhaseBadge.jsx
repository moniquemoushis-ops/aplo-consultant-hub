const labels = {
  before: 'Before',
  during: 'During',
  after: 'After',
}

export default function PhaseBadge({ phase }) {
  return (
    <span className={`badge badge-${phase}`}>
      {labels[phase] ?? phase}
    </span>
  )
}
