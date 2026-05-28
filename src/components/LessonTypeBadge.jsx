const labels = {
  article: 'Article',
  checklist: 'Checklist',
  tool: 'Tool',
  template: 'Template',
}

export default function LessonTypeBadge({ type }) {
  return (
    <span className={`badge badge-${type}`}>
      {labels[type] ?? type}
    </span>
  )
}
