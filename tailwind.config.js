/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: "#facc15",
                secondary: "#1e293b",
                match: "#10b981",
                "background-light": "#fefce8",
                "text-main": "#1e293b",
                "text-secondary": "#64748b",
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"],
                display: ["Plus Jakarta Sans", "sans-serif"],
            },
            padding: {
                'safe-bottom': 'max(1.5rem, calc(1.5rem + env(safe-area-inset-bottom, 0px)))',
            },
        },
    },
    plugins: [],
}
