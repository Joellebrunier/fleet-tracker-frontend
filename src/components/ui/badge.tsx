import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-fleet-tracker-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-fleet-tracker-500 bg-fleet-tracker-50 text-fleet-tracker-700',
        secondary: 'border-gray-300 bg-gray-100 text-gray-800',
        destructive: 'border-red-500 bg-red-50 text-red-700',
        outline: 'border-gray-300 text-gray-700',
        success: 'border-green-500 bg-green-50 text-green-700',
        warning: 'border-yellow-500 bg-yellow-50 text-yellow-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
