module.exports = {
	plugins: [
		require('postcss-import'),
		require('tailwindcss/nesting'),
    require('tailwindcss'),
    require('autoprefixer'),
	],
  content: [],
  theme: {
    extend: {
			borderWidth: {
				3: '3px'
			},
			colors: {
				'dune': {
					sand: `#cc9047`,
					whiteSand: `#ede6d8`,
					brown: '#201900',
					cyan: '#0ed5d5',
					cyanBright: '#03fbfb',
					cyanBrighter: '#7bffff',
					cyanDark: '#1c4f4f',
					green: '#00d01c',
					greenBright: '#328600',
					greenBrighter: '#00d21d'
				},
			},
		},
  },
}
