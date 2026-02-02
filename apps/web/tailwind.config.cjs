/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-strong": "var(--bg-strong)",
        "bg-soft": "var(--bg-soft)",
        text: "var(--text)",
        muted: "var(--muted)",
        border: "var(--border)",
        accent: "var(--accent)",
        "accent-contrast": "var(--accent-contrast)",
        "accent-soft": "var(--accent-soft)",
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)"
      },
      fontFamily: {
        body: "var(--font-body)",
        title: "var(--font-title)"
      },
      boxShadow: {
        card: "var(--shadow)",
        soft: "var(--shadow-soft)"
      },
      borderRadius: {
        card: "20px",
        modal: "22px",
        pill: "999px"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(16px)" }
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        float: "float 14s ease-in-out infinite",
        "fade-up": "fade-up 240ms ease"
      }
    }
  },
  plugins: []
};
