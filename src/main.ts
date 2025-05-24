import { createApp } from 'vue'
import { createWebHashHistory, createRouter } from 'vue-router'
import './style.css'
import { createPinia } from 'pinia'

import App from './App.vue'
import HomePage from './pages/Home.vue'
import AlbumDetailView from './pages/AlbumDetail.vue'

const routes = [
  { path: '/', component: HomePage },
  { path: '/albums/:albumId', component: AlbumDetailView },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

const pinia = createPinia()

createApp(App).use(router).use(pinia).mount('#app')

