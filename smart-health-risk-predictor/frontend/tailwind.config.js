/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#10B981', // Emerald 500
                    50: '#ECFDF5',
                    100: '#D1FAE5',
                    600: '#059669',
                    700: '#047857',
                },
                secondary: {
                    DEFAULT: '#3B82F6', // Blue 500
                    50: '#EFF6FF',
                    100: '#DBEAFE',
                    600: '#2563EB',
                    700: '#1D4ED8',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
