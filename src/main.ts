import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

// Replace the body content with the Vue app
// Remove existing body content
document.getElementsByTagName('html')[0].innerHTML = `
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Popup</title>
	</head>
	<body>
		<div id="app"></div>
	</body>
`

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (let registration of registrations) {
      registration.unregister()
    }
  })
}

// mount Vue app
createApp(App).mount('#app')
