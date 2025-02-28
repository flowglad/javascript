export default function MenuItem({
  icon,
  title,
  action,
  isActive = null,
}: {
  icon?: React.ReactNode
  title?: string
  action?: () => void
  isActive?: (() => boolean) | null
}) {
  return (
    <button
      className={`bg-transparent border-none rounded-[0.4rem] text-white cursor-pointer h-7 mr-1 p-1 w-7 hover:bg-[#303030] ${
        isActive && isActive() ? 'bg-[#303030]' : ''
      }`}
      onClick={action}
      title={title}
    >
      {icon}
    </button>
  )
}
