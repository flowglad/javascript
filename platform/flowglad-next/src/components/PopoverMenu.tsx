// Generated with Ion on 10/7/2024, 11:17:18 PM
// Figma Link: https://www.figma.com/design/3fYHKpBnD7eYSAmfSvPhvr?node-id=765:40804

import core from '@/utils/core'
import clsx from 'clsx'
import { PopoverClose } from './ion/Popover'

export enum PopoverMenuItemState {
  Default = 'default',
  Danger = 'danger',
}

export interface PopoverMenuItemProps {
  children: React.ReactNode
  className: string
  state?: PopoverMenuItemState
  disabled?: boolean
  helperText?: string
  onClick: () => void
}

export interface PopoverMenuItem {
  label: string
  state?: PopoverMenuItemState
  disabled?: boolean
  helperText?: string
  handler: () => void
}

export interface PopoverMenuProps {
  items: PopoverMenuItem[]
}

const PopoverMenuItem = ({
  children,
  className,
  state,
  onClick,
  disabled,
  helperText,
}: PopoverMenuItemProps) => {
  return (
    <PopoverClose asChild>
      <div
        className={clsx(
          'flex flex-col w-fit items-start gap-2.5 px-4 py-2 text-sm hover:bg-white hover:bg-opacity-[0.07] rounded-radius-xs',
          className,
          disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer'
        )}
        onClick={disabled ? undefined : onClick}
      >
        <div
          className={core.cn(
            'font-bold',
            state === PopoverMenuItemState.Danger
              ? 'text-danger'
              : 'text-foreground'
          )}
        >
          {children}
        </div>
        {helperText && (
          <p className="text-xs text-foreground/50">{helperText}</p>
        )}
      </div>
    </PopoverClose>
  )
}

const PopoverMenu = ({ items }: PopoverMenuProps) => {
  return (
    <div className="flex flex-col py-2 w-full">
      {items.map((item, index) => (
        <PopoverMenuItem
          key={index}
          className={core.cn(
            'max-w-[200px] w-full justify-start text-left'
          )}
          state={item.state}
          disabled={item.disabled}
          helperText={item.helperText}
          onClick={item.handler}
        >
          {item.label}
        </PopoverMenuItem>
      ))}
    </div>
  )
}

export default PopoverMenu
