chrome.webRequest.onBeforeRequest.addListener(
	(details) => {
		console.log(
			'onBeforeRequest MAIN_FRAME:',
			details.url,
			details.type,
			details.frameId,
			details.tabId,
		)
		if (
			details.url === 'https://monster-siren.hypergryph.com/manifest.json' &&
			details.type === 'other' &&
			details.frameId === 0
		) {
			chrome.tabs.create({ url: chrome.runtime.getURL('index.html') })
			chrome.tabs.remove(details.tabId)
		}
	},
	{ urls: ['https://monster-siren.hypergryph.com/manifest.json'] },
)
