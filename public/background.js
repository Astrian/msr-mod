console.log("aaaa")

browser.webRequest.onBeforeRequest.addListener(
	async (details) => {
		console.log(
			'onBeforeRequest MAIN_FRAME:',
			details.url,
			details.type,
			details.frameId,
			details.tabId,
		)

		console.log('recived request for fontset api, redirecting to index.html')
		const pref = await browser.storage.sync.get('preferences')

		if (pref === undefined || pref.preferences === undefined || pref.preferences.autoRedirect === undefined || pref.preferences.autoRedirect === true) {
			const isChrome = typeof browser.runtime.getBrowserInfo === 'undefined';

			if (isChrome) {
				browser.tabs.create({ url: browser.runtime.getURL('index.html') })
				browser.tabs.remove(details.tabId)
			} else {
				// Firefox: 直接在当前标签页导航
				browser.tabs.update(details.tabId, { url: browser.runtime.getURL('index.html') })
			}
		}
	},
	{ urls: ['https://monster-siren.hypergryph.com/api/fontset'] },
)

// 兼容新旧版本的 API
const actionAPI = browser.action || browser.browserAction;
if (actionAPI) {
	actionAPI.onClicked.addListener(() => {
		browser.tabs.create({ url: browser.runtime.getURL('index.html') })
	})
}