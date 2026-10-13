/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './utils/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Workbench chrome, named after the Dark Modern theme tokens they imitate.
        vsc: {
          editor: '#1e1e1e',
          sidebar: '#252526',
          activity: '#333333',
          tab: '#2d2d2d',
          hover: '#2a2d2e',
          control: '#3c3c3c',
          widget: '#454545',
          panel: '#414141',
          muted: '#5a5a5a',
          'list-active': '#37373d',
          'list-active-hover': '#404047',
          selection: '#094771',
          accent: '#007acc',
          button: '#0e639c',
          'button-hover': '#1177bb',
          text: '#cccccc',
        },
        // Syntax colours double as the game's semantic palette.
        syntax: {
          type: '#4ec9b0',
          func: '#dcdcaa',
          string: '#ce9178',
          variable: '#9cdcfe',
          keyword: '#569cd6',
          control: '#c586c0',
          number: '#b5cea8',
          json: '#e06c75',
          warning: '#cca700',
          error: '#f14c4c',
        },
      },
    },
  },
  plugins: [],
};
