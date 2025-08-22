import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { debugStore } from '../utils/debug'

export const usePlayState = defineStore('playState', () => {
	// 播放状态
	const isPlaying = ref(false) // 用户控制的播放与暂停
	const playProgress = ref(0) // 播放进度
	const currentTrackDuration = ref(0) // 曲目总时长
	const currentTrack = ref<QueueItem | null>(null) // 当前播放的曲目
	const actualPlaying = ref(false) // 实际音频的播放与暂停

	// 外显播放状态方法
	const playingState = computed(() => isPlaying.value || actualPlaying.value) // 其中有一个为 true 时回报为 true
	const playProgressState = computed(() => playProgress.value)
	const trackDurationState = computed(() => currentTrackDuration.value)
	const actualPlayingState = computed(() => actualPlaying.value)

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
		playProgress.value = progress
	}

	// 回报曲目长度
	const reportCurrentTrackDuration = (duration: number) => {
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

	// 回报 Web Audio API 正在播放
	const reportActualPlaying = (playing: boolean) => {
		actualPlaying.value = playing
	}

	return {
		// 状态读取
		isPlaying: playingState,
		playProgress: playProgressState,
		trackDuration: trackDurationState,
		playProgressPercent,
		remainingTime,
		currentTrack: computed(() => currentTrack.value),
		actualPlaying: actualPlayingState,

		// 修改方法
		togglePlay,
		reportPlayProgress,
		reportCurrentTrackDuration,
		resetProgress,
		seekTo,
		reportActualPlaying,
	}
})
