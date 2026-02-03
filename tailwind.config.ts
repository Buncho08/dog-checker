/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            keyframes: {
                fadeOut: {
                    '0%': { opacity: '1' },
                    '70%': { opacity: '1' },
                    '100%': { opacity: '0' }
                }
            }
        },
    },
    plugins: [],
}
