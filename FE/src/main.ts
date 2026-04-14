import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { VueQueryPlugin } from '@tanstack/vue-query'
import router from './router'
import App from './App.vue'
import { queryClient, setupQueryPersistence } from './lib/query-client'
import i18n from './i18n'
import './style.css'

const app = createApp(App)

setupQueryPersistence()

app.use(createPinia())
app.use(VueQueryPlugin, { queryClient })
app.use(i18n)
app.use(router)

app.mount('#app')
