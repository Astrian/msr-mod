// Replace the body content with the Vue app
function replaceBodyContent() {
	console.log('replaceBodyContent')
	// Remove existing body content
	document.body.innerHTML = ''
	// Create a new container for the Vue app
	const container = document.createElement('div')
	container.id = 'app'
	document.body.appendChild(container)

	console.log('content.js')

// Run the replacement
replaceBodyContent()

// remove all script and link tags
const scripts = document.getElementsByTagName('script')
console.log(scripts)
const links = document.getElementsByTagName('link')
for (let i in scripts) {
	console.log(scripts[i])
	scripts[i].remove()
}
for (let i  in links) {
	console.log(links[i])
	links[i].remove()
}

// insert assets/index.js and assets/index.css
const script = document.createElement('script')
script.src = chrome.runtime.getURL('assets/index.js')
document.head.appendChild(script)
const link = document.createElement('link')
link.rel = 'stylesheet'
link.href = chrome.runtime.getURL('assets/index.css')
document.head.appendChild(link)
}

