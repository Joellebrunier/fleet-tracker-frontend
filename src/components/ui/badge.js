import { jsx as _jsx } from "react/jsx-runtime";
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
const badgeVariants = cva('inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#4361EE] focus:ring-offset-2 focus:ring-offset-[#F5F7FA]', {
    variants: {
        variant: {
            default: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF]',
            secondary: 'border-[#E5E7EB] bg-[#F3F4F6] text-[#1F2937]',
            destructive: 'border-[#FECACA] bg-[#FEE2E2] text-[#DC2626]',
            outline: 'border-[#D1D5DB] text-[#4B5563]',
            success: 'border-[#BBEF63] bg-[#ECFDF5] text-[#15803D]',
            warning: 'border-[#FCD34D] bg-[#FFFBEB] text-[#B45309]',
        },
    },
    defaultVariants: {
        variant: 'default',
    },
});
function Badge({ className, variant, ...props }) {
    return _jsx("div", { className: cn(badgeVariants({ variant }), className), ...props });
}
export { Badge, badgeVariants };
//# sourceMappingURL=badge.js.map