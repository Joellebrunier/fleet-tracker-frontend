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
    return (_jsx("div", { className: "flex min-h-screen items-center justify-center bg-gradient-to-br from-fleet-tracker-600 to-fleet-tracker-800 px-4", children: _jsxs(Card, { className: "w-full max-w-md", children: [_jsxs(CardHeader, { className: "space-y-4", children: [_jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-3xl font-bold text-fleet-tracker-600", children: "Fleet Tracker" }), _jsx("p", { className: "mt-2 text-sm text-gray-500", children: "GPS Fleet Management System" })] }), _jsx(CardTitle, { className: "text-center", children: "Login to your account" }), _jsx(CardDescription, { className: "text-center", children: "Enter your credentials to access Fleet Tracker" })] }), _jsxs(CardContent, { children: [(error || localError) && (_jsxs("div", { className: "mb-4 flex items-center space-x-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700", children: [_jsx(AlertCircle, { size: 20 }), _jsx("p", { className: "text-sm", children: error || localError })] })), _jsxs("form", { onSubmit: handleLogin, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Email" }), _jsx(Input, { type: "email", value: email, onChange: (e) => setEmail(e.target.value), placeholder: "you@example.com", className: "mt-1", disabled: isLoading })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Password" }), _jsx(Input, { type: "password", value: password, onChange: (e) => setPassword(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", className: "mt-1", disabled: isLoading })] }), _jsx(Button, { type: "submit", className: "w-full", disabled: isLoading, children: isLoading ? 'Signing in...' : 'Sign in' })] }), _jsxs("p", { className: "mt-4 text-center text-sm text-gray-600", children: ["Don't have an account?", ' ', _jsx("a", { href: "#", className: "font-medium text-fleet-tracker-600 hover:underline", children: "Contact your administrator" })] })] })] }) }));
}
//# sourceMappingURL=LoginPage.js.map