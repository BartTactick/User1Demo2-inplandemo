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
      50: '#fff0f4',
      100: '#ffd9e3',
      200: '#ffb3c8',
      300: '#ff7d9f',
      400: '#f84f7d',
      500: '#fa3',
      600: '#d91f5d',
      700: '#fa3',
      800: '#a00338',
      900: '#8f0232',
      950: '#5f0121',
    },
  },
  components: {
    button: {
      colorScheme: {
        light: {
          root: {
            primary: {
              background: '#fa3',
              hoverBackground: '#fa3',
              activeBackground: '#fa3',
              borderColor: '#fa3',
              hoverBorderColor: '#fa3',
              activeBorderColor: '#fa3',
              color: '#ffffff',
              hoverColor: '#ffffff',
              activeColor: '#ffffff',
            },
          },
        },
      },
    },
  },
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.use(PrimeVue, {
  theme: {
    preset: InMeetPreset,

    options: {
      darkModeSelector: false,
    },
  },
})
app.mount('#app')
