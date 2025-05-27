import { defineStore } from "pinia"
import { ref, computed } from "vue"

export const usePlayQueueStore = defineStore('queue', () => {
	const list = ref<QueueItem[]>([])
	const currentIndex = ref<number>(0)
	const isPlaying = ref<boolean>(false)
	const queueReplaceLock = ref<boolean>(false)
	const isBuffering = ref<boolean>(false)
	const currentTime = ref<number>(0)
	const duration = ref<number>(0)
	const updatedCurrentTime = ref<number | null>(null)
	const visualizer = ref<number[]>([0, 0, 0, 0, 0, 0])
	const shuffleList = ref<number[]>([])
	const playMode = ref<{
		shuffle: boolean,
		repeat: 'off' | 'single' | 'all'
	}>({
		shuffle: false,
		repeat: 'off'
	})
	const shuffleCurrent = ref<boolean | undefined>(undefined)

	// 预加载相关状态
	const preloadedAudio = ref<Map<string, HTMLAudioElement>>(new Map())
	const isPreloading = ref<boolean>(false)
	const preloadProgress = ref<number>(0)

	// 获取下一首歌的索引
	const getNextIndex = computed(() => {
		if (list.value.length === 0) return -1

		if (playMode.value.repeat === 'single') {
			return currentIndex.value
		}

		if (playMode.value.shuffle && shuffleList.value.length > 0) {
			const currentShuffleIndex = shuffleList.value.indexOf(currentIndex.value)
			if (currentShuffleIndex < shuffleList.value.length - 1) {
				return shuffleList.value[currentShuffleIndex + 1]
			} else if (playMode.value.repeat === 'all') {
				return shuffleList.value[0]
			}
			return -1
		}

		if (currentIndex.value < list.value.length - 1) {
			return currentIndex.value + 1
		} else if (playMode.value.repeat === 'all') {
			return 0
		}

		return -1
	})

	// 预加载下一首歌
	const preloadNext = async () => {
		console.log('[Store] preloadNext 被调用')
		
		const nextIndex = getNextIndex.value
		if (nextIndex === -1) {
			console.log('[Store] 没有下一首歌，跳过预加载')
			return
		}

		// 获取下一首歌曲对象
		let nextSong
		if (playMode.value.shuffle && shuffleList.value.length > 0) {
			nextSong = list.value[shuffleList.value[nextIndex]]
		} else {
			nextSong = list.value[nextIndex]
		}

		if (!nextSong || !nextSong.song) {
			console.log('[Store] 下一首歌曲不存在，跳过预加载')
			return
		}

		const songId = nextSong.song.cid

		// 如果已经预加载过，跳过
		if (preloadedAudio.value.has(songId)) {
			console.log(`[Store] 歌曲 ${songId} 已预加载`)
			return
		}

		// 检查是否有有效的音频源
		if (!nextSong.song.sourceUrl) {
			return
		}

		try {
			isPreloading.value = true
			preloadProgress.value = 0

			const audio = new Audio()
			audio.preload = 'auto'
			audio.crossOrigin = 'anonymous'

			// 监听加载进度
			audio.addEventListener('progress', () => {
				if (audio.buffered.length > 0) {
					const buffered = audio.buffered.end(0)
					const total = audio.duration || 1
					preloadProgress.value = (buffered / total) * 100
				}
			})

			// 监听加载完成
			audio.addEventListener('canplaythrough', () => {
				preloadedAudio.value.set(songId, audio)
				isPreloading.value = false
				preloadProgress.value = 100
			})

			// 监听加载错误
			audio.addEventListener('error', (e) => {
				console.error(`[Store] 预加载音频失败: ${e}`)
				isPreloading.value = false
				preloadProgress.value = 0
			})

			// 设置音频源并开始加载
			audio.src = nextSong.song.sourceUrl

		} catch (error) {
			isPreloading.value = false
		}
	}

	// 获取预加载的音频对象
	const getPreloadedAudio = (songId: string): HTMLAudioElement | null => {
		const audio = preloadedAudio.value.get(songId) || null
		return audio
	}

	// 清理预加载的音频
	const clearPreloadedAudio = (songId: string) => {
		const audio = preloadedAudio.value.get(songId)
		if (audio) {
			audio.pause()
			audio.src = ''
			preloadedAudio.value.delete(songId)
		}
	}

	// 清理所有预加载的音频
	const clearAllPreloadedAudio = () => {
		preloadedAudio.value.forEach((_audio, songId) => {
			clearPreloadedAudio(songId)
		})
		preloadedAudio.value.clear()
	}

	// 限制预加载缓存大小（最多保留3首歌）
	const limitPreloadCache = () => {
		while (preloadedAudio.value.size > 3) {
			const oldestKey = preloadedAudio.value.keys().next().value
			if (oldestKey) { 
				clearPreloadedAudio(oldestKey) 
			} else {
				break
			}
		}
	}

	// 调试函数：打印当前状态
	const debugPreloadState = () => {
		console.log('[Store] 预加载状态:', {
			isPreloading: isPreloading.value,
			progress: preloadProgress.value,
			cacheSize: preloadedAudio.value.size,
			cachedSongs: Array.from(preloadedAudio.value.keys()),
			nextIndex: getNextIndex.value
		})
	}

	return {
		list,
		currentIndex,
		isPlaying,
		queueReplaceLock,
		isBuffering,
		currentTime,
		duration,
		updatedCurrentTime,
		visualizer,
		shuffleList,
		playMode,
		shuffleCurrent,
		// 预加载相关 - 确保所有函数都在返回对象中
		preloadedAudio,
		isPreloading,
		preloadProgress,
		getNextIndex,
		preloadNext,
		getPreloadedAudio,
		clearPreloadedAudio,
		clearAllPreloadedAudio,
		limitPreloadCache,
		debugPreloadState
	}
})