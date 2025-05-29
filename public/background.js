console.log("aaaa")

// 兼容 Chrome 和 Firefox
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

browserAPI.webRequest.onBeforeRequest.addListener(
	async (details) => {
		console.log(
			'onBeforeRequest MAIN_FRAME:',
			details.url,
			details.type,
			details.frameId,
			details.tabId,
		)

		console.log('recived request for fontset api, redirecting to index.html')
		const pref = await browserAPI.storage.sync.get('preferences')

		if (pref === undefined || pref.preferences === undefined || pref.preferences.autoRedirect === undefined || pref.preferences.autoRedirect === true) {
			const isChrome = typeof browserAPI.runtime.getBrowserInfo === 'undefined';

			if (isChrome) {
				if (
					details.url === 'https://monster-siren.hypergryph.com/manifest.json' &&
					details.type === 'other' &&
					details.frameId === 0
				) {
					const pref = await chrome.storage.sync.get('preferences')

					chrome.tabs.create({ url: chrome.runtime.getURL('index.html') })
					chrome.tabs.remove(details.tabId)
				}
			} else {
				// Firefox: 直接在当前标签页导航
				browserAPI.tabs.update(details.tabId, { url: browserAPI.runtime.getURL('index.html') })
			}
		}
	},
	{ urls: ['https://monster-siren.hypergryph.com/api/fontset', 'https://monster-siren.hypergryph.com/manifest.json'] },
)

// 兼容新旧版本的 API
const actionAPI = browserAPI.action || browserAPI.browserAction;
if (actionAPI) {
	actionAPI.onClicked.addListener(() => {
		browserAPI.tabs.create({ url: browserAPI.runtime.getURL('index.html') })
	})
}