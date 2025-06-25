import { defineStore } from "pinia"
import { ref } from "vue"

// 声明全局类型
declare global {
	interface Window {
		browser?: any
	}
}

export const useUpdatePopup = defineStore('updatePopup', () => {
	const isLoaded = ref(false)
	const storageType = ref<'chrome' | 'localStorage' | 'memory'>('chrome')

	// 获取当前版本号
	const getCurrentVersion = (): string => {
		try {
			// 尝试从 Chrome 扩展 API 获取版本号
			return chrome?.runtime?.getManifest?.()?.version || 'unknown'
		} catch (error) {
			return 'unknown'
		}
	}

	// 检测可用的 API
	const detectAvailableAPIs = () => {
		// 检查原生 chrome API
		try {
			if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
				storageType.value = 'chrome'
				return 'chrome'
			}
		} catch (error) {
			// Silent fail
		}

		// 检查 window.chrome
		try {
			if (window.chrome && window.chrome.storage && window.chrome.storage.sync) {
				storageType.value = 'chrome'
				return 'chrome'
			}
		} catch (error) {
			// Silent fail
		}

		// 检查 localStorage
		try {
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('msr_test', 'test')
				localStorage.removeItem('msr_test')
				storageType.value = 'localStorage'
				return 'localStorage'
			}
		} catch (error) {
			// Silent fail
		}

		// 都不可用，使用内存存储
		storageType.value = 'memory'
		return 'memory'
	}

	// 通用的获取存储值函数
	const getStoredValue = async (key: string, defaultValue: any) => {
		const type = detectAvailableAPIs()

		try {
			switch (type) {
				case 'chrome':
					return await new Promise((resolve) => {
						const api = chrome?.storage?.sync || window.chrome?.storage?.sync
						if (api) {
							api.get({ [key]: defaultValue }, (result) => {
								if (chrome.runtime.lastError) {
									resolve(defaultValue)
								} else {
									resolve(result[key])
								}
							})
						} else {
							resolve(defaultValue)
						}
					})

				case 'localStorage':
					const stored = localStorage.getItem(`msr_${key}`)
					const value = stored ? JSON.parse(stored) : defaultValue
					return value

				case 'memory':
				default:
					return defaultValue
			}
		} catch (error) {
			return defaultValue
		}
	}

	// 通用的设置存储值函数
	const setStoredValue = async (key: string, value: any) => {
		const type = storageType.value

		try {
			switch (type) {
				case 'chrome':
					return await new Promise<void>((resolve, reject) => {
						const api = chrome?.storage?.sync || window.chrome?.storage?.sync
						if (api) {
							api.set({ [key]: value }, () => {
								if (chrome.runtime.lastError) {
									reject(new Error(chrome.runtime.lastError.message))
								} else {
									resolve()
								}
							})
						} else {
							reject(new Error('Chrome storage API 不可用'))
						}
					})

				case 'localStorage':
					localStorage.setItem(`msr_${key}`, JSON.stringify(value))
					break

				case 'memory':
					// 内存存储（不持久化）
					break
			}
		} catch (error) {
			throw error
		}
	}

	// 检查是否需要显示更新弹窗
	const shouldShowUpdatePopup = async (): Promise<boolean> => {
		try {
			const currentVersion = getCurrentVersion()
			
			// 如果无法获取当前版本，不显示弹窗
			if (currentVersion === 'unknown') {
				return false
			}

			// 获取上次显示弹窗的版本号
			const lastShownVersion = await getStoredValue('lastUpdatePopupVersion', '')

			// 如果版本号不同，需要显示弹窗并更新存储的版本号
			if (lastShownVersion !== currentVersion) {
				await setStoredValue('lastUpdatePopupVersion', currentVersion)
				return true
			}

			return false
		} catch (error) {
			console.error('检查更新弹窗状态失败:', error)
			return false
		}
	}

	// 标记已显示过更新弹窗（手动关闭时调用）
	const markUpdatePopupShown = async () => {
		try {
			const currentVersion = getCurrentVersion()
			if (currentVersion !== 'unknown') {
				await setStoredValue('lastUpdatePopupVersion', currentVersion)
			}
		} catch (error) {
			console.error('标记更新弹窗已显示失败:', error)
		}
	}

	// 获取当前存储的版本号
	const getLastShownVersion = async (): Promise<string> => {
		return await getStoredValue('lastUpdatePopupVersion', '')
	}

	// 异步初始化函数
	const initializeUpdatePopup = async () => {
		try {
			// 初始化存储类型检测
			detectAvailableAPIs()
			isLoaded.value = true
		} catch (error) {
			console.error('初始化更新弹窗 store 失败:', error)
			isLoaded.value = true
		}
	}

	// 立即初始化
	initializeUpdatePopup()

	return {
		isLoaded,
		storageType,
		getCurrentVersion,
		shouldShowUpdatePopup,
		markUpdatePopupShown,
		getLastShownVersion,
		initializeUpdatePopup,
		getStoredValue,
		setStoredValue
	}
})