import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
export default function LoginPage() {
    const navigate = useNavigate();
    const { login, isLoading, error } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const handleLogin = async (e) => {
        e.preventDefault();
        setLocalError('');
        if (!email || !password) {
            setLocalError('Please enter both email and password');
            return;
        }
        try {
            await login({ email, password });
            navigate('/');
        }
        catch (err) {
            setLocalError(err.response?.data?.message || 'Login failed. Please try again.');
        }
    };
    return (_jsxs("div", { className: "flex min-h-screen items-center justify-center bg-[#0A0A0F] px-4", children: [_jsx("style", { children: `
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&display=swap');
      ` }), _jsxs(Card, { className: "w-full max-w-md bg-[#12121A] border border-[#1F1F2E] rounded-[12px] shadow-2xl relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 opacity-20 pointer-events-none", children: _jsx("div", { className: "absolute inset-0 rounded-[12px] border border-[#00E5CC] shadow-lg shadow-[#00E5CC]/20" }) }), _jsxs(CardHeader, { className: "space-y-4 relative z-10", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-4xl font-bold text-[#F0F0F5]", style: { fontFamily: 'Syne, sans-serif' }, children: "FLEET TRACKER" }), _jsx("p", { className: "mt-2 text-sm text-[#6B6B80]", style: { fontFamily: 'monospace' }, children: "MAT\u00C9RIEL TECH+" })] }), _jsx(CardTitle, { className: "text-center text-[#F0F0F5]", children: "Login to your account" }), _jsx(CardDescription, { className: "text-center text-[#6B6B80]", children: "Enter your credentials to access Fleet Tracker" })] }), _jsxs(CardContent, { className: "relative z-10", children: [(error || localError) && (_jsxs("div", { className: "mb-4 flex items-center space-x-3 rounded-lg border border-[#FF4D6A] bg-[#FF4D6A]/10 p-4 text-[#FF4D6A]", children: [_jsx(AlertCircle, { size: 20 }), _jsx("p", { className: "text-sm", children: error || localError })] })), _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#F0F0F5]", children: "Email" }), _jsx(Input, { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@example.com", className: "mt-1 bg-[#0A0A0F] border border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A] rounded-[8px] focus:border-[#00E5CC] focus:ring-1 focus:ring-[#00E5CC]/50", disabled: isLoading })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-[#F0F0F5]", children: "Password" }), _jsx(Input, { type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", className: "mt-1 bg-[#0A0A0F] border border-[#1F1F2E] text-[#F0F0F5] placeholder-[#44445A] rounded-[8px] focus:border-[#00E5CC] focus:ring-1 focus:ring-[#00E5CC]/50", disabled: isLoading })] }), _jsx(Button, { type: "submit", className: "w-full bg-gradient-to-r from-[#00E5CC] to-[#00C4B0] text-[#0A0A0F] font-bold hover:opacity-90 transition-opacity rounded-[8px]", disabled: isLoading, children: isLoading ? 'Signing in...' : 'Sign in' })] }), _jsxs("p", { className: "mt-4 text-center text-sm text-[#6B6B80]", children: ["Don't have an account?", ' ', _jsx("a", { href: "#", className: "font-medium text-[#00E5CC] hover:text-[#00C4B0] transition-colors", children: "Contact your administrator" })] })] })] })] }));
}
//# sourceMappingURL=LoginPage.js.map