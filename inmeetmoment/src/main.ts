import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

import App from './App.vue'
import router from './router'
import './styles.css'
import 'primeicons/primeicons.css'

const InMeetPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#edf6ff',
      100: '#d9ecff',
      200: '#b8dcff',
      300: '#86c5ff',
      400: '#4da5f5',
      500: '#008cd2',
      600: '#0058bd',
      700: '#003878',
      800: '#002b5c',
      900: '#001d3d',
      950: '#001329'
    }
  },
  components: {
    button: {
      colorScheme: {
        light: {
          root: {
            primary: {
              background: '{primary.700}',
              hoverBackground: '{primary.800}',
              activeBackground: '{primary.900}',
              borderColor: '{primary.700}',
              hoverBorderColor: '{primary.800}',
              activeBorderColor: '{primary.900}',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff'
            }
          }
        }
      }
    }
  }
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.use(PrimeVue, {
  theme: {
    preset: InMeetPreset,

    options: {
      darkModeSelector: false
    }
  }
})
app.mount('#app')
