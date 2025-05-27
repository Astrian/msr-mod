import { createApp } from 'vue'
import { createWebHashHistory, createRouter } from 'vue-router'
import './style.css'
import { createPinia } from 'pinia'
import ToastPlugin from 'vue-toast-notification'
import 'vue-toast-notification/dist/theme-default.css'

import App from './App.vue'
import HomePage from './pages/Home.vue'
import AlbumDetailView from './pages/AlbumDetail.vue'
import Playroom from './pages/Playroom.vue'

const routes = [
  { path: '/', component: HomePage },
  { path: '/albums/:albumId', component: AlbumDetailView },
  { path: '/playroom', component: Playroom }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const pinia = createPinia()

createApp(App).use(router).use(pinia).use(ToastPlugin).mount('#app')

