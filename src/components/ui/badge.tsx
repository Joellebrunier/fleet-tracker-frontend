import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#00E5CC] focus:ring-offset-2 focus:ring-offset-[#0A0A0F]',
  {
    variants: {
      variant: {
        default: 'border-[#00E5CC] bg-[rgba(0,229,204,0.15)] text-[#00E5CC]',
        secondary: 'border-[#2A2A3D] bg-[rgba(42,42,61,0.4)] text-[#F0F0F5]',
        destructive: 'border-[#FF4D6A] bg-[rgba(255,77,106,0.15)] text-[#FF4D6A]',
        outline: 'border-[#1F1F2E] text-[#F0F0F5]',
        success: 'border-[#00E5CC] bg-[rgba(0,229,204,0.15)] text-[#00E5CC]',
        warning: 'border-[#FFB547] bg-[rgba(255,181,71,0.15)] text-[#FFB547]',
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
