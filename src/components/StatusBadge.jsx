import { Chip } from '@heroui/react'

const colorMap = {
  open: 'warning',
  answered: 'success',
  dismissed: 'default',
}

const labels = {
  open: 'Open',
  answered: 'Answered',
  dismissed: 'Dismissed',
}

export default function StatusBadge({ status }) {
  return (
    <Chip color={colorMap[status] ?? 'default'} variant="soft" size="sm">
      {labels[status] ?? status}
    </Chip>
  )
}
