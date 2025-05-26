import { defineStore } from "pinia"
import { ref, watch } from "vue"
import browser from 'webextension-polyfill'

export const usePreferences = defineStore('preferences', () => {
	const displayTimeLeft = ref<boolean>(false) // 设置默认值
	const isLoaded = ref(false) // 添加加载状态

	// 异步初始化函数
	const initializePreferences = async () => {
		try {
			// 指定默认值对象
			const result = await browser.storage.local.get({
				displayTimeLeft: false // 如果键不存在，使用这个默认值
			})
			
			displayTimeLeft.value = result.displayTimeLeft as boolean // 现在类型是安全的
			isLoaded.value = true
		} catch (error) {
			console.error('加载偏好设置失败:', error)
			displayTimeLeft.value = false
			isLoaded.value = true
		}
	}

	// 监听变化并保存
	watch(displayTimeLeft, async (val) => {
		if (isLoaded.value) { // 只有在初始化完成后才保存
			try {
				await browser.storage.local.set({
					displayTimeLeft: val
				})
			} catch (error) {
				console.error('保存偏好设置失败:', error)
			}
		}
	})

	// 立即初始化
	initializePreferences()

	return {
		displayTimeLeft,
		isLoaded,
		initializePreferences
	}
})