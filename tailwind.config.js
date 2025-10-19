/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}", // App Router files
    "./pages/**/*.{js,ts,jsx,tsx}", // Pages Router files (if used)
    "./components/**/*.{js,ts,jsx,tsx}", // Component files (if any)
  ],
  theme: {
    extend: {
      fontFamily: {
        dancing: "var(--font-dancing), cursive",
        poppins: "var(--font-poppins), ui-sans-serif, system-ui",
      },
    },
  },
  plugins: [],
};
