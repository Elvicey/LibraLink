/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#2F6FED",
        "primary-dark": "#1E4FC4",
        ink: "#0F172A",
        sidebar: "#0F1B2E",
        "sidebar-hover": "#182B45",
        surface: "#F7F9FC",
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
      },
    },
  },
  plugins: [],
};
