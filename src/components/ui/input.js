import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '@/lib/utils';
const Input = React.forwardRef(({ className, type, ...props }, ref) => (_jsx("input", { type: type, className: cn('flex h-10 w-full rounded-md border border-[#D1D5DB] bg-[#FFFFFF] text-[#1F2937] px-3 py-2 text-sm placeholder:text-[#9CA3AF] focus:border-[#4361EE] focus:outline-none focus:ring-2 focus:ring-[#4361EE] focus:ring-opacity-10 disabled:cursor-not-allowed disabled:opacity-50', className), ref: ref, ...props })));
Input.displayName = 'Input';
export { Input };
//# sourceMappingURL=input.js.map