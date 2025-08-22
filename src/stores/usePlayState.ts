import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { debugStore } from '../utils/debug'
import artistsOrganize from '../utils/artistsOrganize'

export const usePlayState = defineStore('playState', () => {
	// 播放状态
	const isPlaying = ref(false)
	const playProgress = ref(0) // 播放进度
	const currentTrackDuration = ref(0) // 曲目总时长
	const currentTrack = ref<QueueItem | null>(null) // 当前播放的曲目
	const mediaSessionInitialized = ref(false)

	// 外显播放状态方法
	const playingState = computed(() => isPlaying.value)
	const playProgressState = computed(() => playProgress.value)
	const trackDurationState = computed(() => currentTrackDuration.value)

	// 回报目前播放进度百分比
	const playProgressPercent = computed(() => {
		if (currentTrackDuration.value === 0) return 0
		return Math.min(playProgress.value / currentTrackDuration.value, 1)
	})

	// 回报剩余时间
	const remainingTime = computed(() => {
		return Math.max(currentTrackDuration.value - playProgress.value, 0)
	})

	/***********
	 * 修改状态
	 **********/
	// 触发播放
	const togglePlay = (turnTo?: boolean) => {
		const newPlayState = turnTo ?? !isPlaying.value
		if (newPlayState === isPlaying.value) return
		isPlaying.value = newPlayState
		debugStore(`播放状态更新: ${newPlayState}`)
	}

	// 回报播放位置
	const reportPlayProgress = (progress: number) => {
		debugStore(`播放位置回报: ${progress}`)
		playProgress.value = progress
	}

	// 回报曲目进度
	const setCurrentTrackDuration = (duration: number) => {
		debugStore(`曲目进度回报: ${duration}`)
		currentTrackDuration.value = duration
	}

	// 重置播放进度
	const resetProgress = () => {
		debugStore('重置播放进度')
		playProgress.value = 0
	}

	// 用户触发进度条跳转
	const seekTo = (time: number) => {
		const clampedTime = Math.max(0, Math.min(time, currentTrackDuration.value))
		debugStore(`进度条跳转: ${clampedTime}`)
		playProgress.value = clampedTime
	}

	/***********
	 * 媒体会话管理
	 **********/
	// 设置当前播放曲目
	const setCurrentTrack = (track: QueueItem | null) => {
		debugStore('设置当前曲目:', track?.song.name || 'null')
		currentTrack.value = track
		if (track) {
			updateMediaSession(track)
		}
	}

	// 初始化媒体会话处理器
	const setupMediaSessionHandlers = () => {
		if (!('mediaSession' in navigator) || mediaSessionInitialized.value) return

		debugStore('设置媒体会话处理器')

		navigator.mediaSession.setActionHandler('play', () => {
			debugStore('媒体会话: 播放')
			togglePlay(true)
		})

		navigator.mediaSession.setActionHandler('pause', () => {
			debugStore('媒体会话: 暂停')
			togglePlay(false)
		})

		// 上一首和下一首需要从外部传入回调
		mediaSessionInitialized.value = true
	}

	// 设置上一首/下一首处理器
	const setTrackNavigationHandlers = (
		previousHandler: () => void,
		nextHandler: () => void,
	) => {
		if (!('mediaSession' in navigator)) return

		navigator.mediaSession.setActionHandler('previoustrack', () => {
			debugStore('媒体会话: 上一首')
			previousHandler()
		})

		navigator.mediaSession.setActionHandler('nexttrack', () => {
			debugStore('媒体会话: 下一首')
			nextHandler()
		})
	}

	// 更新媒体会话信息
	const updateMediaSession = (track: QueueItem) => {
		if (!('mediaSession' in navigator)) return

		debugStore('更新媒体会话:', track.song.name)

		try {
			navigator.mediaSession.metadata = new MediaMetadata({
				title: track.song.name,
				artist: artistsOrganize(track.song.artists ?? []),
				album: track.album?.name,
				artwork: [
					{
						src: track.album?.coverUrl ?? '',
						sizes: '500x500',
						type: 'image/png',
					},
				],
			})
		} catch (error) {
			console.error('更新媒体会话元数据失败:', error)
		}
	}

	// 更新媒体会话播放状态
	const updateMediaSessionPlaybackState = () => {
		if (!('mediaSession' in navigator)) return

		navigator.mediaSession.playbackState = isPlaying.value
			? 'playing'
			: 'paused'
		debugStore('媒体会话状态更新:', navigator.mediaSession.playbackState)
	}

	// 更新媒体会话位置信息
	const updateMediaSessionPosition = () => {
		if (
			!('mediaSession' in navigator) ||
			!('setPositionState' in navigator.mediaSession)
		)
			return

		try {
			navigator.mediaSession.setPositionState({
				duration: currentTrackDuration.value || 0,
				playbackRate: 1.0,
				position: playProgress.value,
			})
		} catch (error) {
			debugStore('媒体会话位置更新失败:', error)
		}
	}

	// 监听播放状态变化，自动更新媒体会话
	watch(isPlaying, () => {
		updateMediaSessionPlaybackState()
	})

	// 监听播放进度变化，定期更新位置信息
	watch(playProgress, () => {
		updateMediaSessionPosition()
	})

	return {
		// 状态读取
		isPlaying: playingState,
		playProgress: playProgressState,
		trackDuration: trackDurationState,
		playProgressPercent,
		remainingTime,
		currentTrack: computed(() => currentTrack.value),

		// 修改方法
		togglePlay,
		reportPlayProgress,
		setCurrentTrackDuration,
		resetProgress,
		seekTo,

		// 媒体会话方法
		setCurrentTrack,
		setupMediaSessionHandlers,
		setTrackNavigationHandlers,
		updateMediaSession,
		updateMediaSessionPlaybackState,
		updateMediaSessionPosition,
	}
})
