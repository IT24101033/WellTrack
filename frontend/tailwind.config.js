/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: '#1E3A8A',
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                    950: '#172554',
                },
                secondary: {
                    DEFAULT: '#3B82F6',
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    200: '#bae6fd',
                    300: '#7dd3fc',
                    400: '#38bdf8',
                    500: '#0ea5e9',
                    600: '#0284c7',
                    700: '#0369a1',
                    800: '#075985',
                    900: '#0c4a6e',
                    950: '#082f49',
                },
                success: {
                    DEFAULT: '#10B981',
                    50: '#ecfdf5',
                    100: '#d1fae5',
                    200: '#a7f3d0',
                    300: '#6ee7b7',
                    400: '#34d399',
                    500: '#10b981',
                    600: '#059669',
                    700: '#047857',
                    800: '#065f46',
                    900: '#064e3b',
                    950: '#022c22',
                },
                glass: {
                    light: 'rgba(255,255,255,0.6)',
                    dark: 'rgba(20,25,40,0.6)',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                '3xl': '24px',
                '4xl': '32px',
            },
            backdropBlur: {
                xs: '4px',
                sm: '8px',
                DEFAULT: '12px',
                md: '16px',
                lg: '20px',
                xl: '24px',
                '2xl': '28px',
                '3xl': '32px',
            },
            keyframes: {
                'pulse-glow': {
                    '0%, 100%': { boxShadow: '0 0 20px 4px rgba(59,130,246,0.25)', opacity: '1' },
                    '50%': { boxShadow: '0 0 36px 10px rgba(59,130,246,0.45)', opacity: '0.85' },
                },
                'float': {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-6px)' },
                },
                'shimmer': {
                    '0%': { backgroundPosition: '-200% center' },
                    '100%': { backgroundPosition: '200% center' },
                },
                'ring-spin': {
                    '0%': { strokeDashoffset: '440' },
                    '100%': { strokeDashoffset: '0' },
                },
                'fade-in': {
                    '0%': { opacity: '0', transform: 'translateY(8px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'scale-in': {
                    '0%': { opacity: '0', transform: 'scale(0.95)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                'slide-right': {
                    '0%': { opacity: '0', transform: 'translateX(-12px)' },
                    '100%': { opacity: '1', transform: 'translateX(0)' },
                },
            },
            animation: {
                'pulse-glow': 'pulse-glow 2.5s ease-in-out infinite',
                'float': 'float 4s ease-in-out infinite',
                'shimmer': 'shimmer 2.5s linear infinite',
                'fade-in': 'fade-in 0.35s ease-out both',
                'scale-in': 'scale-in 0.3s ease-out both',
                'slide-right': 'slide-right 0.3s ease-out both',
                'spin-slow': 'spin 3s linear infinite',
            },
            boxShadow: {
                'glass': '0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.4)',
                'glass-dark': '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)',
                'glow-blue': '0 0 24px rgba(59,130,246,0.4)',
                'glow-green': '0 0 24px rgba(16,185,129,0.4)',
                'glow-yellow': '0 0 24px rgba(245,158,11,0.4)',
                'glow-red': '0 0 24px rgba(239,68,68,0.4)',
                'float': '0 20px 60px rgba(0,0,0,0.12)',
                'float-dark': '0 20px 60px rgba(0,0,0,0.5)',
            },
        },
    },
    plugins: [],
}

