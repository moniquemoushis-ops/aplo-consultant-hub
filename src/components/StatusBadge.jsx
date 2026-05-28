const labels = {
  open: 'Open',
  answered: 'Answered',
  dismissed: 'Dismissed',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`badge badge-${status}`}>
      {labels[status] ?? status}
    </span>
  )
}
