import { createApp } from 'vue'
import { createWebHashHistory, createRouter } from 'vue-router'
import './style.css'
import App from './App.vue'
import HomePage from './pages/Home.vue'
import AlbumDetailView from './pages/AlbumDetail.vue'

const routes = [
  { path: '/', component: HomePage },
  { path: '/albums/:id', component: AlbumDetailView },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

; createApp(App).use(router).mount('#app')
