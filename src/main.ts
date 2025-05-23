import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// Replace the body content with the Vue app
// Remove existing body content
document.body.innerHTML = ''
// Create a new container for the Vue app
const container = document.createElement('div')
container.id = 'app'
document.body.appendChild(container)

// remove all script and link tags
const scripts = document.getElementsByTagName('script')
console.log(scripts)
const links = document.getElementsByTagName('link')
for (let i in scripts) {
	console.log(scripts[i])
	console.log(typeof scripts[i])
	if (typeof scripts[i] === 'object') {
		scripts[i].remove()
	}
}
for (let i  in links) {
	console.log(links[i])
	console.log(typeof links[i])
	if (typeof links[i] === 'object') {
		links[i].remove()
	}
}

// mount Vue app
createApp(App).mount('#app')
