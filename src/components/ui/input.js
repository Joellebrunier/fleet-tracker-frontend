import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '@/lib/utils';
const Input = React.forwardRef(({ className, type, ...props }, ref) => (_jsx("input", { type: type, className: cn('flex h-10 w-full rounded-md border border-[#1F1F2E] bg-[#0A0A0F] text-[#F0F0F5] px-3 py-2 text-sm placeholder:text-[#44445A] focus:border-[#00E5CC] focus:outline-none focus:ring-2 focus:ring-[#00E5CC] focus:ring-opacity-30 disabled:cursor-not-allowed disabled:opacity-50', className), ref: ref, ...props })));
Input.displayName = 'Input';
export { Input };
//# sourceMappingURL=input.js.map