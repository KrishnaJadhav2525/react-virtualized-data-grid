/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./stories/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // using css variables for designn tokens
                'grid-bg': 'var(--grid-bg)',
                'grid-header': 'var(--grid-header)',
                'grid-row-alt': 'var(--grid-row-alt)',
                'grid-border': 'var(--grid-border)',
                'grid-focus': 'var(--grid-focus)',
            },
            spacing: {
                'cell-h': 'var(--cell-height)',
            }
        },
    },
    plugins: [],
}
