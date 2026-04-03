import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
const buttonVariants = cva('inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-[#0A0A0F] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5CC] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50', {
    variants: {
        variant: {
            default: 'bg-[#00E5CC] text-[#0A0A0F] hover:bg-[#00C4AB] font-semibold',
            destructive: 'bg-[#FF4D6A] text-white hover:bg-[#E63A55] font-semibold',
            outline: 'border border-[#1F1F2E] bg-transparent text-[#F0F0F5] hover:bg-[#1A1A25] hover:border-[#2A2A3D]',
            secondary: 'bg-[#1A1A25] text-[#F0F0F5] hover:bg-[#2A2A3D]',
            ghost: 'text-[#F0F0F5] hover:bg-[#1A1A25]',
            link: 'text-[#00E5CC] underline-offset-4 hover:underline',
        },
        size: {
            default: 'h-10 px-4 py-2',
            sm: 'h-9 rounded-md px-3 text-xs',
            lg: 'h-11 rounded-md px-8',
            icon: 'h-10 w-10',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});
const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return _jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref: ref, ...props });
});
Button.displayName = 'Button';
export { Button, buttonVariants };
//# sourceMappingURL=button.js.map