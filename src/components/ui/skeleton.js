import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
function Skeleton({ className, ...props }) {
    return (_jsx("div", { className: cn('animate-pulse rounded-md bg-[#1A1A25]', className), ...props }));
}
export { Skeleton };
//# sourceMappingURL=skeleton.js.map