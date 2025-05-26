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
	const isLoaded = ref(false)
	const storageType = ref<'chrome' | 'localStorage' | 'memory'>('chrome')
	const debugInfo = ref<string[]>([])

	// 添加调试日志
	const addDebugInfo = (info: string) => {
		debugInfo.value.push(`[${new Date().toISOString()}] ${info}`)
		console.log(info)
	}

	// 检测可用的 API
	const detectAvailableAPIs = () => {
		addDebugInfo('开始检测可用的存储 API...')

		// 检查原生 chrome API
		try {
			if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
				addDebugInfo('✅ 检测到 chrome.storage.local')
				storageType.value = 'chrome'
				return 'chrome'
			} else {
				addDebugInfo('❌ 未检测到原生 chrome.storage.local')
			}
		} catch (error) {
			addDebugInfo(`❌ chrome API 检测失败: ${error}`)
		}

		// 检查 window.chrome
		try {
			if (window.chrome && window.chrome.storage && window.chrome.storage.local) {
				addDebugInfo('✅ 检测到 window.chrome.storage.local')
				storageType.value = 'chrome'
				return 'chrome'
			}
		} catch (error) {
			addDebugInfo(`❌ window.chrome API 检测失败: ${error}`)
		}

		// 检查 localStorage
		try {
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem('msr_test', 'test')
				localStorage.removeItem('msr_test')
				addDebugInfo('✅ 检测到 localStorage')
				storageType.value = 'localStorage'
				return 'localStorage'
			}
		} catch (error) {
			addDebugInfo(`❌ localStorage 检测失败: ${error}`)
		}

		// 都不可用，使用内存存储
		addDebugInfo('⚠️ 使用内存存储（不持久化）')
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
						const api = chrome?.storage?.local || window.chrome?.storage?.local
						if (api) {
							api.get({ [key]: defaultValue }, (result) => {
								if (chrome.runtime.lastError) {
									addDebugInfo(`Chrome storage 错误: ${chrome.runtime.lastError.message}`)
									resolve(defaultValue)
								} else {
									addDebugInfo(`从 Chrome storage 读取: ${key} = ${result[key]}`)
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
					addDebugInfo(`从 localStorage 读取: ${key} = ${value}`)
					return value

				case 'memory':
				default:
					addDebugInfo(`从内存返回默认值: ${key} = ${defaultValue}`)
					return defaultValue
			}
		} catch (error) {
			addDebugInfo(`获取存储值失败 (${type}): ${error}`)
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
						const api = chrome?.storage?.local || window.chrome?.storage?.local
						if (api) {
							api.set({ [key]: value }, () => {
								if (chrome.runtime.lastError) {
									const error = `Chrome storage 保存错误: ${chrome.runtime.lastError.message}`
									addDebugInfo(error)
									reject(new Error(error))
								} else {
									addDebugInfo(`保存到 Chrome storage: ${key} = ${value}`)
									resolve()
								}
							})
						} else {
							reject(new Error('Chrome storage API 不可用'))
						}
					})

				case 'localStorage':
					localStorage.setItem(`msr_${key}`, JSON.stringify(value))
					addDebugInfo(`保存到 localStorage: ${key} = ${value}`)
					break

				case 'memory':
					addDebugInfo(`内存存储（不持久化）: ${key} = ${value}`)
					break
			}
		} catch (error) {
			addDebugInfo(`保存设置失败 (${type}): ${error}`)
			throw error
		}
	}

	// 异步初始化函数
	const initializePreferences = async () => {
		addDebugInfo('开始初始化偏好设置...')

		try {
			const value = await getStoredValue('displayTimeLeft', false)
			displayTimeLeft.value = value as boolean
			isLoaded.value = true
			addDebugInfo(`✅ 偏好设置初始化完成: displayTimeLeft = ${value}`)
		} catch (error) {
			addDebugInfo(`❌ 初始化失败: ${error}`)
			displayTimeLeft.value = false
			isLoaded.value = true
		}
	}

	// 监听变化并保存
	watch(displayTimeLeft, async (val) => {
		if (isLoaded.value) {
			try {
				await setStoredValue('displayTimeLeft', val)
			} catch (error) {
				addDebugInfo(`❌ 监听器保存失败: ${error}`)
			}
		}
	})

	// 手动保存函数（用于调试）
	const manualSave = async () => {
		try {
			await setStoredValue('displayTimeLeft', displayTimeLeft.value)
			addDebugInfo(`✅ 手动保存成功`)
		} catch (error) {
			addDebugInfo(`❌ 手动保存失败: ${error}`)
		}
	}

	// 获取调试信息
	const getDebugInfo = () => {
		return {
			storageType: storageType.value,
			isLoaded: isLoaded.value,
			displayTimeLeft: displayTimeLeft.value,
			logs: debugInfo.value,
			chromeAvailable: typeof chrome !== 'undefined',
			chromeStorageAvailable: !!(chrome?.storage?.local),
			windowChromeAvailable: !!(window.chrome?.storage?.local),
			localStorageAvailable: typeof localStorage !== 'undefined'
		}
	}

	// 立即初始化
	initializePreferences()

	return {
		displayTimeLeft,
		isLoaded,
		storageType,
		debugInfo,
		initializePreferences,
		getStoredValue,
		setStoredValue,
		manualSave,
		getDebugInfo
	}
})