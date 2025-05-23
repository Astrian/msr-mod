import { createApp } from 'vue';
import './style.css';
import App from './App.vue';

// unregister the service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      // 可以根据 scope 判断是否是目标网站的 Service Worker
      console.log('Unregistering service worker:', registration.scope)
      registration.unregister()
    }
  })
}

// Replace the body content with the Vue app
document.getElementsByTagName('html')[0].innerHTML = `
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MSR Mod</title>
  </head>
  <body>
    <div id="app"></div>
  </body>
`;

createApp(App).mount('#app')

