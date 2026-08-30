/** Every colour resolves through a CSS variable so the palette lives in one
 *  place. Channels are stored as raw RGB triples so Tailwind's `/opacity`
 *  modifiers keep working.
 *  @type {import('tailwindcss').Config} */
const c = (name) => `rgb(var(${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces
        canvas: c('--c-canvas'), // the calendar grid itself
        surface: c('--c-surface'), // app background, sidebar
        panel: c('--c-panel'), // cards
        'panel-2': c('--c-panel-2'), // hover
        'panel-3': c('--c-panel-3'), // raised control
        hairline: c('--c-hairline'),
        'hairline-2': c('--c-hairline-2'),

        // Text
        hi: c('--c-hi'),
        mid: c('--c-mid'),
        lo: c('--c-lo'),
        dim: c('--c-dim'),

        // Brand
        pink: c('--c-pink'),
        'pink-hi': c('--c-pink-hi'),
        'pink-lo': c('--c-pink-lo'),
        plum: c('--c-plum'), // active nav pill
        'on-plum': c('--c-on-plum'),

        // Entry fills — theme-dependent, so never hard-coded here.
        'e-pink': c('--c-e-pink'),
        'e-yellow': c('--c-e-yellow'),
        'e-blue': c('--c-e-blue'),
        'e-green': c('--c-e-green'),
        'e-lilac': c('--c-e-lilac'),
        'e-maroon': c('--c-e-maroon'), // all-day task bars

        // Semantics
        ok: c('--c-ok'),
        'ok-lo': c('--c-ok-lo'),
        warn: c('--c-warn'),
        'warn-lo': c('--c-warn-lo'),
        bad: c('--c-bad'),
        'bad-lo': c('--c-bad-lo'),
      },
      fontFamily: {
        // GT Haptik is Toggl's licensed face; Figtree is the closest free stand-in.
        display: ['Figtree', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: { '2xs': ['0.6875rem', { lineHeight: '1rem' }] },
      borderRadius: { pill: '999px' },
      boxShadow: {
        card: '0 1px 2px rgb(var(--c-shadow) / 0.06)',
        lift: '0 6px 18px rgb(var(--c-shadow) / 0.12)',
        pop: '0 16px 40px rgb(var(--c-shadow) / 0.22)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        // Draws the eye to an optional next move, then stops asking.
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.2' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.7)', opacity: '0' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.32s cubic-bezier(0.22,1,0.36,1) both',
        'fade-in': 'fade-in 0.24s ease-out both',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
        blink: 'blink 1.15s ease-in-out 3',
      },
    },
  },
  plugins: [],
}
