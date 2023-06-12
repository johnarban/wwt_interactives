/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

import { WWTComponent, wwtPinia } from "@wwtelescope/engine-pinia";







// Plugins
import { registerPlugins } from '@/plugins'


const app = createApp(App)
app.use(wwtPinia)
app.component("WorldWideTelescope", WWTComponent)

registerPlugins(app)

app.mount('#app')
