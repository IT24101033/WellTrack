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
                    DEFAULT: '#1E3A8A', // Blue - Main Brand
                    50: '#EFF6FF',
                    100: '#DBEAFE',
                    600: '#1E40AF',
                    700: '#1E3A8A',
                    800: '#1E3A8A',
                    900: '#172554',
                },
                secondary: {
                    DEFAULT: '#3B82F6', // Light Blue
                    50: '#F0F9FF',
                    100: '#E0F2FE',
                    600: '#2563EB',
                    700: '#1D4ED8',
                },
                success: {
                    DEFAULT: '#10B981', // Green
                    50: '#ECFDF5',
                    100: '#D1FAE5',
                    600: '#059669',
                }
            },
            fontFamily: {
                sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
