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
        card: "14px",
        modal: "16px",
        pill: "999px"
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        }
      },
      animation: {
        "fade-up": "fade-up 180ms ease"
      }
    }
  },
  plugins: []
};
