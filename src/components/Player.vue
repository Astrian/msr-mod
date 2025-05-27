<!-- Player.vue - 添加预加载功能 -->
<script setup lang="ts">

import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { useTemplateRef, watch, nextTick, computed } from 'vue'
import { useRoute } from 'vue-router'

import PlayIcon from '../assets/icons/play.vue'
import LoadingIndicator from '../assets/icons/loadingindicator.vue'
import { audioVisualizer } from '../utils'

const playQueueStore = usePlayQueueStore()
const route = useRoute()
const player = useTemplateRef('playerRef')

// [调试] 检查 store 方法类型
console.log('[Player] 检查 store 方法:', {
	preloadNext: typeof playQueueStore.preloadNext,
	getPreloadedAudio: typeof playQueueStore.getPreloadedAudio,
	clearPreloadedAudio: typeof playQueueStore.clearPreloadedAudio
})

// 获取当前歌曲的计算属性
const currentTrack = computed(() => {
	if (playQueueStore.playMode.shuffle && playQueueStore.shuffleList.length > 0) {
		return playQueueStore.list[playQueueStore.shuffleList[playQueueStore.currentIndex]]
	} else {
		return playQueueStore.list[playQueueStore.currentIndex]
	}
})

// 获取当前歌曲的音频源
const currentAudioSrc = computed(() => {
	const track = currentTrack.value
	return track ? track.song.sourceUrl : ''
})

watch(() => playQueueStore.isPlaying, (newValue) => {
	if (newValue) {
		player.value?.play()
		setMetadata()
	}
	else { player.value?.pause() }
})

// 监听当前索引变化，处理预加载逻辑
watch(() => playQueueStore.currentIndex, async () => {
	console.log('[Player] 当前索引变化:', playQueueStore.currentIndex)

	// 检查是否可以使用预加载的音频
	const track = currentTrack.value
	if (track) {
		const songId = track.song.cid

		try {
			const preloadedAudio = playQueueStore.getPreloadedAudio(songId)

			if (preloadedAudio) {
				console.log(`[Player] 使用预加载的音频: ${track.song.name}`)

				// 直接使用预加载的音频数据
				if (player.value) {
					// 复制预加载音频的状态到主播放器
					player.value.src = preloadedAudio.src
					player.value.currentTime = 0

					// 清理使用过的预加载音频
					playQueueStore.clearPreloadedAudio(songId)

					// 如果正在播放状态，立即播放
					if (playQueueStore.isPlaying) {
						await nextTick()
						player.value.play().catch(console.error)
					}

					playQueueStore.isBuffering = false
				}
			} else {
				console.log(`[Player] 正常加载音频: ${track.song.name}`)
				playQueueStore.isBuffering = true
			}
		} catch (error) {
			console.error('[Player] 处理预加载音频时出错:', error)
			playQueueStore.isBuffering = true
		}
	}

	setMetadata()

	// 延迟预加载下一首歌，避免影响当前歌曲加载
	setTimeout(() => {
		try {
			console.log('[Player] 尝试预加载下一首歌')

			// 检查函数是否存在
			if (typeof playQueueStore.preloadNext === 'function') {
				playQueueStore.preloadNext()
				playQueueStore.limitPreloadCache()
			} else {
				console.error('[Player] preloadNext 不是一个函数')
			}
		} catch (error) {
			console.error('[Player] 预加载失败:', error)
		}
	}, 1000)
})

function artistsOrganize(list: string[]) {
	if (list.length === 0) { return '未知音乐人' }
	return list.map((artist) => {
		return artist
	}).join(' / ')
}

function setMetadata() {
	if ('mediaSession' in navigator) {
		let current = currentTrack.value
		if (!current) return

		navigator.mediaSession.metadata = new MediaMetadata({
			title: current.song.name,
			artist: artistsOrganize(current.song.artists ?? []),
			album: current.album?.name,
			artwork: [
				{ src: current.album?.coverUrl ?? '', sizes: '500x500', type: 'image/png' },
			]
		})

		navigator.mediaSession.setActionHandler('previoustrack', playPrevious)
		navigator.mediaSession.setActionHandler('nexttrack', playNext)

		playQueueStore.duration = player.value?.duration ?? 0
		playQueueStore.currentTime = player.value?.currentTime ?? 0
	}

	watch(() => playQueueStore.updatedCurrentTime, (newValue) => {
		if (newValue === null) { return }
		if (player.value) player.value.currentTime = newValue
		playQueueStore.updatedCurrentTime = null
	})
}

function playNext() {
	if (playQueueStore.currentIndex === playQueueStore.list.length - 1) {
		console.log("at the bottom, pause")
		playQueueStore.currentIndex = 0
		if (playQueueStore.playMode.repeat === 'all') {
			playQueueStore.currentIndex = 0
			playQueueStore.isPlaying = true
		} else {
			player.value?.pause()
			playQueueStore.isPlaying = false
		}
	} else {
		playQueueStore.currentIndex++
		playQueueStore.isPlaying = true
	}
}

function playPrevious() {
	if (player.value && (player.value.currentTime ?? 0) < 5 && playQueueStore.currentIndex > 0) {
		playQueueStore.currentIndex--
		playQueueStore.isPlaying = true
	} else {
		if (player.value) { player.value.currentTime = 0 }
	}
}

function updateCurrentTime() {
	playQueueStore.currentTime = player.value?.currentTime ?? 0

	// 智能预加载策略：支持动态配置
	if (playQueueStore.duration > 0) {
		const progress = playQueueStore.currentTime / playQueueStore.duration
		const remainingTime = playQueueStore.duration - playQueueStore.currentTime

		// 从 localStorage 获取配置，如果没有则使用默认值
		const config = JSON.parse(localStorage.getItem('preloadConfig') || '{}')
		const preloadTrigger = (config.preloadTrigger || 50) / 100 // 转换为小数
		const remainingTimeThreshold = config.remainingTimeThreshold || 30

		if ((progress > preloadTrigger || remainingTime < remainingTimeThreshold) && !playQueueStore.isPreloading) {

			try {
				if (typeof playQueueStore.preloadNext === 'function') {
					playQueueStore.preloadNext()
				} else {
					console.error('[Player] preloadNext 不是一个函数')
				}
			} catch (error) {
				console.error('[Player] 智能预加载失败:', error)
			}
		}
	}
}

console.log('[Player] 初始化 audioVisualizer')
const { barHeights, connectAudio, isAnalyzing, error } = audioVisualizer({
	sensitivity: 1.5,
	barCount: 6,
	maxDecibels: -10,
	bassBoost: 0.8,
	midBoost: 1.2,
	trebleBoost: 1.4,
	threshold: 0
})

console.log('[Player] audioVisualizer 返回值:', { barHeights: barHeights.value, isAnalyzing: isAnalyzing.value })

// 监听播放列表变化
watch(() => playQueueStore.list.length, async (newLength) => {
	console.log('[Player] 播放列表长度变化:', newLength)
	if (newLength === 0) {
		console.log('[Player] 播放列表为空，跳过连接')
		return
	}

	// 等待下一帧，确保 audio 元素已经渲染
	await nextTick()

	if (player.value) {
		console.log('[Player] 连接音频元素到可视化器')
		console.log('[Player] 音频元素状态:', {
			src: player.value.src?.substring(0, 50) + '...',
			readyState: player.value.readyState,
			paused: player.value.paused
		})
		connectAudio(player.value)
	} else {
		console.log('[Player] ❌ 音频元素不存在')
	}

	playQueueStore.visualizer = barHeights.value

	// 开始预加载第一首歌的下一首
	setTimeout(() => {
		playQueueStore.preloadNext()
	}, 2000)
})

// 监听音频元素变化
watch(() => player.value, (audioElement) => {
	if (audioElement && playQueueStore.list.length > 0) {
		connectAudio(audioElement)
	}
})

// 监听可视化器数据变化
watch(() => barHeights.value, (newHeights) => {
	playQueueStore.visualizer = newHeights
}, { deep: true })

// 监听错误
watch(() => error.value, (newError) => {
	if (newError) {
		console.error('[Player] 可视化器错误:', newError)
	}
})

// 切换播放模式
watch(() => playQueueStore.playMode.shuffle, (isShuffle) => {
	if (isShuffle) {
		// 提取当前歌曲的索引和队列中总项目数
		const currentIndex = playQueueStore.currentIndex
		const trackCount = playQueueStore.list.length
		// 生成新的随机播放列表，该列表是原来列表的下标数组（保持原有的顺序不变，以便用户关闭随机播放时恢复原有队列）
		// 将队列中剩余的项目随机排列，队列中更早的歌曲保持不变
		let shuffledList = [...Array(currentIndex).keys()]
		// 如果 shuffleCurrent 被指定为 false 或 undefined，那么将当前歌曲放在新列表的开头
		if (!playQueueStore.shuffleCurrent) {
			shuffledList.push(currentIndex)
		}
		// 重置 shuffleCurrent 标签
		playQueueStore.shuffleCurrent = undefined

		// 将剩余的项目列出来
		let shuffleSpace = [...Array(trackCount).keys()]
		shuffleSpace = shuffleSpace.filter((item) => item > currentIndex)
		console.log(shuffleSpace)
		// 随机打乱剩余的项目
		shuffleSpace.sort(() => Math.random() - 0.5)

		// 拼接新队列
		shuffledList = shuffledList.concat(shuffleSpace)

		// 应用新的随机播放列表
		playQueueStore.shuffleList = shuffledList
	} else {
		// 将当前播放的歌曲的原来的索引赋给 currentIndex
		playQueueStore.currentIndex = playQueueStore.shuffleList[playQueueStore.currentIndex]
	}

	// 切换播放模式后重新预加载
	setTimeout(() => {
		playQueueStore.clearAllPreloadedAudio()
		playQueueStore.preloadNext()
	}, 500)
})

function getCurrentTrack() {
	return currentTrack.value
}

// 组件卸载时清理预加载
// onUnmounted(() => {
//   playQueueStore.clearAllPreloadedAudio()
// })
</script>

<template>
	<div>
		<audio :src="currentAudioSrc" ref="playerRef" :autoplay="playQueueStore.isPlaying"
			v-if="playQueueStore.list.length !== 0" @ended="() => {
				if (playQueueStore.playMode.repeat === 'single') { playQueueStore.isPlaying = true }
				else { playNext() }
			}" @pause="playQueueStore.isPlaying = false" @play="playQueueStore.isPlaying = true" @playing="() => {
				console.log('[Player] 音频开始播放事件')
				playQueueStore.isBuffering = false
				setMetadata()
			}" @waiting="playQueueStore.isBuffering = true" @loadeddata="() => {
				console.log('[Player] 音频数据加载完成')
				playQueueStore.isBuffering = false
			}" @canplay="() => {
				console.log('[Player] 音频可以播放')
				playQueueStore.isBuffering = false
			}" @error="(e) => {
				console.error('[Player] 音频错误:', e)
				playQueueStore.isBuffering = false
			}" crossorigin="anonymous" @timeupdate="updateCurrentTime">
		</audio>

		<!-- 预加载进度指示器（可选显示） -->
		<!-- <div v-if="playQueueStore.isPreloading"
			class="fixed top-4 right-4 bg-black/80 text-white px-3 py-1 rounded text-xs z-50">
			预加载中... {{ Math.round(playQueueStore.preloadProgress) }}%
		</div> -->

		<div
			class="text-white h-9 bg-neutral-800/80 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex gap-2 overflow-hidden select-none"
			v-if="playQueueStore.list.length !== 0 && route.path !== '/playroom'">
			<RouterLink to="/playroom">
				<img :src="getCurrentTrack()?.album?.coverUrl ?? ''" class="rounded-full h-8 w-8 mt-[.0625rem]" />
			</RouterLink>

			<RouterLink to="/playroom">
				<div class="flex items-center w-32 h-9">
					<span class="truncate">{{ getCurrentTrack()?.song.name }}</span>
				</div>
			</RouterLink>

			<button class="h-9 w-12 flex justify-center items-center" @click.stop="() => {
				playQueueStore.isPlaying = !playQueueStore.isPlaying
			}">
				<div v-if="playQueueStore.isPlaying">
					<LoadingIndicator v-if="playQueueStore.isBuffering === true" :size="4" />
					<div v-else class="h-4 flex justify-center items-center gap-[.125rem]">
						<div class="bg-white/75 w-[.125rem] rounded-full" v-for="(bar, index) in playQueueStore.visualizer"
							:key="index" :style="{
								height: `${Math.max(10, bar)}%`
							}" />
					</div>
				</div>
				<PlayIcon v-else :size="4" />
			</button>
		</div>
	</div>
</template>