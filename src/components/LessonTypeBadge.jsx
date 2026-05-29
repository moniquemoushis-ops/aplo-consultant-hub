import { Chip } from '@heroui/react'

const colorMap = {
  article: 'default',
  checklist: 'accent',
  tool: 'danger',
  template: 'warning',
}

const labels = {
  article: 'Article',
  checklist: 'Checklist',
  tool: 'Tool',
  template: 'Template',
}

export default function LessonTypeBadge({ type }) {
  return (
    <Chip color={colorMap[type] ?? 'default'} variant="soft" size="sm">
      {labels[type] ?? type}
    </Chip>
  )
}
