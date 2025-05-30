import { defineStore } from "pinia"
import { ref, watch, computed } from "vue"

// 声明全局类型
declare global {
	interface Window {
		browser?: any
	}
}

export const useFavourites = defineStore('favourites', () => {
	const favourites = ref<QueueItem[]>([])

	const isLoaded = ref(false)
	const storageType = ref<'chrome' | 'localStorage' | 'memory'>('chrome')

	// 默认收藏列表
	const defaultFavourites: QueueItem[] = []

	// 检测可用的 API
	const detectAvailableAPIs = () => {
		// 检查原生 chrome API
		try {
			if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
				storageType.value = 'chrome'
				return 'chrome'
			}
		} catch (error) {
			// Silent fail
		}

		// 检查 window.chrome
		try {
			if (window.chrome && window.chrome.storage && window.chrome.storage.local) {
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
						const api = chrome?.storage?.local || window.chrome?.storage?.local
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
						const api = chrome?.storage?.local || window.chrome?.storage?.local
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

	// 数据验证和规范化函数
	const normalizeFavourites = (data: any[]): QueueItem[] => {
		if (!Array.isArray(data)) return []

		return data.map(item => {
			if (!item || !item.song) return null

			// 规范化 Song 对象
			const song: Song = {
				cid: item.song.cid || '',
				name: item.song.name || '',
				albumCid: item.song.albumCid,
				sourceUrl: item.song.sourceUrl,
				lyricUrl: item.song.lyricUrl,
				mvUrl: item.song.mvUrl,
				mvCoverUrl: item.song.mvCoverUrl,
				// 确保 artistes 和 artists 是数组
				artistes: Array.isArray(item.song.artistes) ? item.song.artistes :
					typeof item.song.artistes === 'object' ? Object.values(item.song.artistes) :
						[],
				artists: Array.isArray(item.song.artists) ? item.song.artists :
					typeof item.song.artists === 'object' ? Object.values(item.song.artists) :
						[]
			}

			// 规范化 Album 对象（如果存在）
			const album = item.album ? {
				cid: item.album.cid || '',
				name: item.album.name || '',
				intro: item.album.intro,
				belong: item.album.belong,
				coverUrl: item.album.coverUrl || '',
				coverDeUrl: item.album.coverDeUrl,
				artistes: Array.isArray(item.album.artistes) ? item.album.artistes :
					typeof item.album.artistes === 'object' ? Object.values(item.album.artistes) :
						[],
				songs: item.album.songs
			} : undefined

			return { song, album }
		}).filter(Boolean) as QueueItem[]
	}

	// 获取收藏列表
	const getFavourites = async () => {
		const result = await getStoredValue('favourites', defaultFavourites)
		// 确保返回的是数组并进行数据规范化
		const normalizedResult = Array.isArray(result) ? normalizeFavourites(result) : defaultFavourites
		return normalizedResult
	}

	// 保存收藏列表
	const saveFavourites = async () => {
		// 确保保存的是规范化的数组
		const normalizedFavourites = normalizeFavourites([...favourites.value])
		await setStoredValue('favourites', normalizedFavourites)
	}

	// 检查歌曲是否已收藏
	const isFavourite = (songCid: string): boolean => {
		return favourites.value.some(item => item.song.cid === songCid)
	}

	// 添加到收藏
	const addToFavourites = async (queueItem: QueueItem) => {
		if (!isFavourite(queueItem.song.cid)) {
			favourites.value.push(queueItem)
			if (isLoaded.value) {
				try {
					await saveFavourites()
				} catch (error) {
					// 保存失败时回滚
					favourites.value.pop()
					throw error
				}
			}
		}
	}

	// 从收藏中移除
	const removeFromFavourites = async (songCid: string) => {
		const index = favourites.value.findIndex(item => item.song.cid === songCid)
		if (index !== -1) {
			const removedItem = favourites.value.splice(index, 1)[0]
			if (isLoaded.value) {
				try {
					await saveFavourites()
				} catch (error) {
					// 保存失败时回滚
					favourites.value.splice(index, 0, removedItem)
					throw error
				}
			}
		}
	}

	// 切换收藏状态
	const toggleFavourite = async (queueItem: QueueItem) => {
		if (isFavourite(queueItem.song.cid)) {
			await removeFromFavourites(queueItem.song.cid)
		} else {
			await addToFavourites(queueItem)
		}
	}

	// 清空收藏列表
	const clearFavourites = async () => {
		const backup = [...favourites.value]
		favourites.value = []
		if (isLoaded.value) {
			try {
				await saveFavourites()
			} catch (error) {
				// 保存失败时回滚
				favourites.value = backup
				throw error
			}
		}
	}

	// 获取收藏数量
	const favouritesCount = computed(() => favourites.value.length)

	// 异步初始化函数
	const initializeFavourites = async () => {
		try {
			const savedFavourites = await getFavourites()
			// 确保设置的是有效且规范化的数组
			favourites.value = Array.isArray(savedFavourites) ? savedFavourites : []
			isLoaded.value = true
		} catch (error) {
			favourites.value = []
			isLoaded.value = true
		}
	}

	// 监听变化并保存（防抖处理）
	let saveTimeout: NodeJS.Timeout | null = null
	watch(favourites, async () => {
		if (isLoaded.value) {
			// 清除之前的定时器
			if (saveTimeout) {
				clearTimeout(saveTimeout)
			}
			// 设置新的定时器，防抖保存
			saveTimeout = setTimeout(async () => {
				try {
					await saveFavourites()
				} catch (error) {
					// Silent fail
				}
			}, 300)
		}
	}, { deep: true })

	// 更新收藏列表中的歌曲信息
	const updateSongInFavourites = async (songCid: string, updatedSong: Song) => {
		const index = favourites.value.findIndex(item => item.song.cid === songCid)
		if (index !== -1) {
			// 更新歌曲信息，保持其他属性不变
			favourites.value[index].song = { ...favourites.value[index].song, ...updatedSong }
			if (isLoaded.value) {
				try {
					await saveFavourites()
				} catch (error) {
					// 保存失败时可以考虑回滚或错误处理
					console.error('Failed to save updated song:', error)
				}
			}
		}
	}

	// 立即初始化
	initializeFavourites()

	return {
		favourites,
		isLoaded,
		storageType,
		favouritesCount,
		initializeFavourites,
		getFavourites,
		saveFavourites,
		isFavourite,
		addToFavourites,
		removeFromFavourites,
		toggleFavourite,
		clearFavourites,
		getStoredValue,
		setStoredValue,
		updateSongInFavourites
	}
})

