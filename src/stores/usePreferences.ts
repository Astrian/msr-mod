import { defineStore } from "pinia"
import { ref, watch } from "vue"

// 声明全局类型
declare global {
	interface Window {
		browser?: any
	}
}

export const usePreferences = defineStore('preferences', () => {
	const displayTimeLeft = ref<boolean>(false)
	const presentLyrics = ref<boolean>(false)

	const isLoaded = ref(false)
	const storageType = ref<'chrome' | 'localStorage' | 'memory'>('chrome')

	// 默认偏好设置
	const defaultPreferences = {
		displayTimeLeft: false,
		presentLyrics: false
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

	// 获取所有偏好设置
	const getPreferences = async () => {
		return await getStoredValue('preferences', defaultPreferences)
	}

	// 保存所有偏好设置
	const savePreferences = async () => {
		const preferences = {
			displayTimeLeft: displayTimeLeft.value,
			presentLyrics: presentLyrics.value
		}
		await setStoredValue('preferences', preferences)
	}

	// 异步初始化函数
	const initializePreferences = async () => {
		try {
			const preferences = await getPreferences()
			displayTimeLeft.value = preferences.displayTimeLeft
			presentLyrics.value = preferences.presentLyrics
			isLoaded.value = true
		} catch (error) {
			displayTimeLeft.value = false
			presentLyrics.value = false
			isLoaded.value = true
		}
	}

	// 监听变化并保存
	watch([displayTimeLeft, presentLyrics], async () => {
		if (isLoaded.value) {
			try {
				await savePreferences()
			} catch (error) {
				// Silent fail
			}
		}
	})

	// 立即初始化
	initializePreferences()

	return {
		displayTimeLeft,
		presentLyrics,
		isLoaded,
		storageType,
		initializePreferences,
		getStoredValue,
		setStoredValue,
		getPreferences,
		savePreferences
	}
})