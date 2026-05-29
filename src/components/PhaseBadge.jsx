import { Chip } from '@heroui/react'

const colorMap = {
  before: 'warning',
  during: 'accent',
  after: 'success',
}

const labels = {
  before: 'Before',
  during: 'During',
  after: 'After',
}

export default function PhaseBadge({ phase }) {
  return (
    <Chip color={colorMap[phase] ?? 'default'} variant="soft" size="sm">
      {labels[phase] ?? phase}
    </Chip>
  )
}
