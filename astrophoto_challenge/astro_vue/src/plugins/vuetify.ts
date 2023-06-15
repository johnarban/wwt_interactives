/**
 * plugins/vuetify.ts
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'



// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  defaults: {
		global: {
		},
    VBtn: {
      style: 'text-transform: none;',
    },
	},
  theme: {
    themes: {
      light: {
        colors: {
          background: '#ffffff',
          primary: '#4A04BC',
          secondary: '#44BAAA',
          accent: '#7D6697',
        },
      },
    },
  },
})
