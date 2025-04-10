/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        primary: "var(--primary-color)",
        secondary: "var(--secondary-color)",
        accent: "var(--accent-color)",
        contrast: "var(--contrast-accent-color)",
        hover_contrast: "var(--hover-contrast-accent-color)",

        success_text: "var(--success-text-color)",
        error_text: "var(--error-text-color)",
        warning_text: "var(--warning-text-color)",
        info_text: "var(--info-text-color)",

        success_bg: "var(--success-bg-color)",
        error_bg: "var(--error-bg-color)",
        warning_bg: "var(--warning-bg-color)",
        info_bg: "var(--info-bg-color)",
      },
    },
  },
  plugins: [],
}

