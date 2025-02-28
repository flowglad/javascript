// ion/Avatar: Generated with Ion on 9/20/2024, 10:31:45 PM
import { Check, Plus, User, X } from 'lucide-react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cva } from 'class-variance-authority'
import clsx from 'clsx'
import * as React from 'react'

/* ---------------------------------- Component --------------------------------- */

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback> & {
    initials?: string
    size?: AvatarProps['size']
  }
>(({ className, initials, size = 'md', ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={clsx(
      'flex items-center justify-center',
      'text-secondary',
      {
        'text-lg': size === 'lg',
        'text-base': size === 'md',
        'text-sm': size === 'sm',
        'h-7 w-7': size === 'md',
        'h-4 w-4': size === 'sm',
        'h-12 w-12': size === 'lg',
      },
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

/* ---------------------------------- Types --------------------------------- */

type AvatarStatusProps = {
  /**  */
  type: AvatarProps['bottomStatus']
  location: 'top' | 'bottom'
  size: AvatarProps['size']
  variant: AvatarProps['variant']
}

/* ---------------------------------- Component --------------------------------- */

const avatarStatusClassNames = cva(
  [
    'absolute box-content flex flex-row items-center justify-center rounded-full',
  ],
  {
    variants: {
      location: {
        top: '',
        bottom: '',
      },
      variant: {
        circle: 'rounded-full',
        square: 'rounded-radius-md',
      },
      size: {
        lg: 'h-4 w-4',
        md: 'h-4 w-4',
        sm: 'h-[10px] w-[10px]',
      },
      type: {
        away: 'bg-warning-status',
        check: 'bg-info-status text-on-info',
        delete: 'bg-danger-status text-on-danger',
        inactive: 'bg-neutral text-on-neutral',
        online: 'bg-success-status',
        offline: 'bg-danger-status',
        plus: 'bg-neutral text-on-neutral border border-stroke-disabled',
      },
    },
    compoundVariants: [
      {
        variant: 'square',
        size: 'sm',
        className: 'rounded-radius-sm',
      },
      {
        location: 'top',
        variant: 'circle',
        className: 'top-0 right-0',
      },
      {
        location: 'bottom',
        variant: 'circle',
        className: 'bottom-0 right-0',
      },
      {
        location: 'top',
        variant: 'square',
        className: '-top-1 -right-1',
      },
      {
        location: 'bottom',
        variant: 'square',
        className: '-bottom-1 -right-1',
      },
      {
        location: 'top',
        variant: 'square',
        size: 'sm',
        className: '-top-0.5 -right-0.5',
      },
      {
        location: 'bottom',
        variant: 'square',
        size: 'sm',
        className: '-bottom-0.5 -right-0.5',
      },
    ],
  }
)

const AvatarStatus = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & AvatarStatusProps
>(({ className, type, location, size, variant, ...props }, ref) => {
  const iconSize = size === 'sm' ? 6 : 8
  return (
    <div
      ref={ref}
      className={clsx(
        avatarStatusClassNames({
          location,
          size,
          type,
          variant,
        }),
        className
      )}
      {...props}
    >
      {type === 'check' && <Check strokeWidth={2} size={iconSize} />}
      {type === 'plus' && <Plus strokeWidth={2} size={iconSize} />}
      {type === 'delete' && <X strokeWidth={2} size={iconSize} />}
    </div>
  )
})
AvatarStatus.displayName = 'AvatarStatus'

/* ---------------------------------- Component --------------------------------- */

const AvatarTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    size: AvatarProps['size']
  }
>(({ className, size, ...props }, ref) => (
  <h3
    ref={ref}
    className={clsx(
      'text-foreground font-semibold',
      {
        'text-base': size === 'lg',
        'text-sm': size === 'md',
        'text-xs': size === 'sm',
      },
      className
    )}
    {...props}
  />
))
AvatarTitle.displayName = 'AvatarTitle'

/* ---------------------------------- Component --------------------------------- */

const AvatarSubtitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    size: AvatarProps['size']
  }
>(({ className, size, ...props }, ref) => (
  <p
    ref={ref}
    className={clsx(
      'text-subtle font-medium',
      {
        'text-base': size === 'lg',
        'text-sm': size === 'md',
        'text-xs': size === 'sm',
      },
      className
    )}
    {...props}
  />
))
AvatarSubtitle.displayName = 'AvatarSubtitle'

/* ---------------------------------- Type --------------------------------- */

interface AvatarProps {
  /** Status indicator on the top right corner */
  topStatus?:
    | 'online'
    | 'offline'
    | 'inactive'
    | 'away'
    | 'check'
    | 'plus'
    | 'delete'
  /** Status indicator on the bottom right corner */
  bottomStatus?:
    | 'online'
    | 'offline'
    | 'inactive'
    | 'away'
    | 'check'
    | 'plus'
    | 'delete'
  /** Size of the avatar
   * @default 'md'
   */

  size?: 'sm' | 'md' | 'lg'
  /** Variant of the avatar
   * @default 'circle'
   */
  variant?: 'circle' | 'square'
  /** Title of the avatar */
  title?: string
  /** Subtitle of the avatar */
  subtitle?: string
  /** Initials when no image is provided */
  initials?: string
  /** Fallback when no image is provided */
  fallback?: React.ReactNode
  /** Image source */
  src?: string
  /** Alt text for the image */
  alt?: string
  className?: string
}

/* ---------------------------------- Component --------------------------------- */

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> &
    AvatarProps
>(
  (
    {
      className,
      initials,
      topStatus,
      bottomStatus,
      variant = 'circle',
      size = 'md',
      src,
      title,
      subtitle,
      fallback = <User size={24} />,
      ...props
    },
    ref
  ) => {
    const alt = props.alt ?? title ?? subtitle
    const imageAlt = alt ?? 'Avatar Image'
    const fallbackAlt = alt ?? 'Avatar Fallback'
    return (
      <div
        className={clsx('flex items-center shrink-0', {
          'gap-x-3': size === 'lg' || size === 'md',
          'gap-x-2': size === 'sm',
        })}
      >
        <AvatarPrimitive.Root
          ref={ref}
          className={clsx(
            {
              'relative flex shrink-0 flex-col items-center justify-center bg-disabled border border-background':
                true,
              'h-[60px] w-[60px]': size === 'lg',
              'h-12 w-12': size === 'md',
              'h-8 w-8': size === 'sm',
              'rounded-full': variant === 'circle',
              'rounded-radius-md': variant === 'square',
            },
            className
          )}
          {...props}
        >
          {topStatus && (
            <AvatarStatus
              location="top"
              type={topStatus}
              size={size}
              variant={variant}
            />
          )}
          {bottomStatus && (
            <AvatarStatus
              location="bottom"
              type={bottomStatus}
              size={size}
              variant={variant}
            />
          )}
          <AvatarPrimitive.Image
            className={clsx(
              'aspect-square object-cover',
              {
                'rounded-full': variant === 'circle',
                'rounded-radius-md': variant === 'square',
                'rounded-radius-sm':
                  variant === 'square' && size === 'sm',
              },
              className
            )}
            src={src}
            aria-label={imageAlt}
            alt={imageAlt}
            {...props}
          />
          <AvatarFallback
            initials={initials}
            size={size}
            aria-label={fallbackAlt}
          >
            {initials ? initials : fallback}
          </AvatarFallback>
        </AvatarPrimitive.Root>
        {title && (
          <div className="flex flex-col">
            <AvatarTitle size={size}>{title}</AvatarTitle>
            {subtitle && (
              <AvatarSubtitle size={size}>{subtitle}</AvatarSubtitle>
            )}
          </div>
        )}
      </div>
    )
  }
)
Avatar.displayName = 'Avatar'

export default Avatar
