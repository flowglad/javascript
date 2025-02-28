import { Check, X } from 'lucide-react'
import Badge from '@/app/components/ion/Badge'

type Props = {
  active: boolean
}

const StatusBadge = ({ active }: Props) => {
  if (active) {
    return (
      <div className="w-20">
        <Badge
          iconLeading={<Check size={12} strokeWidth={2} />}
          variant="soft"
          color="green"
          size="sm"
          className="w-full"
        >
          Active
        </Badge>
      </div>
    )
  }

  return (
    <div className="w-20">
      <Badge
        iconLeading={<X size={12} strokeWidth={2} />}
        variant="soft"
        color="grey"
        size="sm"
        className="w-full"
      >
        Inactive
      </Badge>
    </div>
  )
}

export default StatusBadge
