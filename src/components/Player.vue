<!-- Player.vue - 添加预加载功能 -->
<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useFavourites } from '../stores/useFavourites'
import { usePlayQueueStore } from '../stores/usePlayQueueStore'

import LoadingIndicator from '../assets/icons/loadingindicator.vue'
import PlayIcon from '../assets/icons/play.vue'
import PauseIcon from '../assets/icons/pause.vue'
import { audioVisualizer, checkAndRefreshSongResource, supportsWebAudioVisualization } from '../utils'

const playQueueStore = usePlayQueueStore()
const favourites = useFavourites()
const route = useRoute()
const player = useTemplateRef('playerRef')

// [调试] 检查 store 方法类型
console.log('[Player] 检查 store 方法:', {
	preloadNext: typeof playQueueStore.preloadNext,
	getPreloadedAudio: typeof playQueueStore.getPreloadedAudio,
	clearPreloadedAudio: typeof playQueueStore.clearPreloadedAudio,
})

// 获取当前歌曲的计算属性
const currentTrack = computed(() => {
	if (
		playQueueStore.playMode.shuffle &&
		playQueueStore.shuffleList.length > 0
	) {
		return playQueueStore.list[
			playQueueStore.shuffleList[playQueueStore.currentIndex]
		]
	}

	return playQueueStore.list[playQueueStore.currentIndex]
})

// 获取当前歌曲的音频源
const currentAudioSrc = computed(() => {
	const track = currentTrack.value
	return track ? track.song.sourceUrl : ''
})

watch(
	() => playQueueStore.isPlaying,
	(newValue) => {
		if (newValue) {
			player.value?.play()
			setMetadata()
		} else {
			player.value?.pause()
		}
	},
)

// 监听当前索引变化，处理预加载逻辑
watch(
	() => playQueueStore.currentIndex,
	async () => {
		console.log('[Player] 当前索引变化:', playQueueStore.currentIndex)

		// 检查是否可以使用预加载的音频
		const track = currentTrack.value
		if (track) {
			const songId = track.song.cid

			try {
				// 首先检查和刷新当前歌曲的资源
				console.log('[Player] 检查当前歌曲资源:', track.song.name)
				const updatedSong = await checkAndRefreshSongResource(
					track.song,
					(updated) => {
						// 更新播放队列中的歌曲信息
						// 在随机播放模式下，currentIndex 是 shuffleList 的索引
						// 需要通过 shuffleList[currentIndex] 获取实际的 list 索引
						const actualIndex =
							playQueueStore.playMode.shuffle &&
							playQueueStore.shuffleList.length > 0
								? playQueueStore.shuffleList[playQueueStore.currentIndex]
								: playQueueStore.currentIndex
						if (playQueueStore.list[actualIndex]) {
							playQueueStore.list[actualIndex].song = updated
						}
						// 如果歌曲在收藏夹中，也更新收藏夹
						favourites.updateSongInFavourites(songId, updated)
					},
				)

				// 使用更新后的歌曲信息
				const preloadedAudio = playQueueStore.getPreloadedAudio(songId)

				if (preloadedAudio && updatedSong.sourceUrl === track.song.sourceUrl) {
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

					// 如果资源地址已更新，清除旧的预加载音频
					if (updatedSong.sourceUrl !== track.song.sourceUrl) {
						playQueueStore.clearPreloadedAudio(songId)
					}
				}
			} catch (error) {
				console.error('[Player] 处理预加载音频时出错:', error)
				playQueueStore.isBuffering = true
			}
		}

		setMetadata()

		// 延迟预加载下一首歌，避免影响当前歌曲加载
		setTimeout(async () => {
			try {
				console.log('[Player] 尝试预加载下一首歌')

				// 检查函数是否存在
				if (typeof playQueueStore.preloadNext === 'function') {
					await playQueueStore.preloadNext()

					// 预加载完成后，检查播放队列是否有更新，同步到收藏夹
					playQueueStore.list.forEach((item) => {
						if (favourites.isFavourite(item.song.cid)) {
							favourites.updateSongInFavourites(item.song.cid, item.song)
						}
					})

					playQueueStore.limitPreloadCache()
				} else {
					console.error('[Player] preloadNext 不是一个函数')
				}
			} catch (error) {
				console.error('[Player] 预加载失败:', error)
			}
		}, 1000)
	},
)

function artistsOrganize(list: string[]) {
	if (list.length === 0) {
		return '未知音乐人'
	}
	return list
		.map((artist) => {
			return artist
		})
		.join(' / ')
}

function setMetadata() {
	if ('mediaSession' in navigator) {
		const current = currentTrack.value
		if (!current) return

		navigator.mediaSession.metadata = new MediaMetadata({
			title: current.song.name,
			artist: artistsOrganize(current.song.artists ?? []),
			album: current.album?.name,
			artwork: [
				{
					src: current.album?.coverUrl ?? '',
					sizes: '500x500',
					type: 'image/png',
				},
			],
		})

		navigator.mediaSession.setActionHandler('previoustrack', playPrevious)
		navigator.mediaSession.setActionHandler('nexttrack', playNext)

		playQueueStore.duration = player.value?.duration ?? 0
		playQueueStore.currentTime = player.value?.currentTime ?? 0
	}

	watch(
		() => playQueueStore.updatedCurrentTime,
		(newValue) => {
			if (newValue === null) {
				return
			}
			if (player.value) player.value.currentTime = newValue
			playQueueStore.updatedCurrentTime = null
		},
	)
}

function playNext() {
	if (playQueueStore.currentIndex === playQueueStore.list.length - 1) {
		console.log('at the bottom, pause')
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
	if (
		player.value &&
		(player.value.currentTime ?? 0) < 5 &&
		playQueueStore.currentIndex > 0
	) {
		playQueueStore.currentIndex--
		playQueueStore.isPlaying = true
	} else {
		if (player.value) {
			player.value.currentTime = 0
		}
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

		if (
			(progress > preloadTrigger || remainingTime < remainingTimeThreshold) &&
			!playQueueStore.isPreloading
		) {
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

// 检查浏览器是否支持音频可视化
const isAudioVisualizationSupported = supportsWebAudioVisualization()
console.log('[Player] 音频可视化支持状态:', isAudioVisualizationSupported)

// 只在支持的浏览器上初始化音频可视化
let barHeights = ref<number[]>([0, 0, 0, 0, 0, 0])
let connectAudio = (_audio: HTMLAudioElement) => {}
let isAnalyzing = ref(false)
let error = ref<string | null>(null)

if (isAudioVisualizationSupported) {
	console.log('[Player] 初始化 audioVisualizer')
	const visualizer = audioVisualizer({
		sensitivity: 1.5,
		barCount: 6,
		maxDecibels: -10,
		bassBoost: 0.8,
		midBoost: 1.2,
		trebleBoost: 1.4,
		threshold: 0,
	})
	
	barHeights = visualizer.barHeights
	connectAudio = visualizer.connectAudio
	isAnalyzing = visualizer.isAnalyzing
	error = visualizer.error
	
	console.log('[Player] audioVisualizer 返回值:', {
		barHeights: barHeights.value,
		isAnalyzing: isAnalyzing.value,
	})
} else {
	console.log('[Player] 音频可视化被禁用（Safari 或不支持的浏览器）')
}

// 监听播放列表变化
watch(
	() => playQueueStore.list.length,
	async (newLength) => {
		console.log('[Player] 播放列表长度变化:', newLength)
		if (newLength === 0) {
			console.log('[Player] 播放列表为空，跳过连接')
			return
		}

		// 等待下一帧，确保 audio 元素已经渲染
		await nextTick()

		if (player.value) {
			if (isAudioVisualizationSupported) {
				console.log('[Player] 连接音频元素到可视化器')
				console.log('[Player] 音频元素状态:', {
					src: player.value.src?.substring(0, 50) + '...',
					readyState: player.value.readyState,
					paused: player.value.paused,
				})
				connectAudio(player.value)
			} else {
				console.log('[Player] 跳过音频可视化连接（不支持的浏览器）')
			}
		} else {
			console.log('[Player] ❌ 音频元素不存在')
		}

		playQueueStore.visualizer = barHeights.value

		// 开始预加载第一首歌的下一首
		setTimeout(() => {
			playQueueStore.preloadNext()
		}, 2000)

		// 初始化音量
		if (player.value) {
			initializeVolume()
		}
	},
)

// 监听音频元素变化
watch(
	() => player.value,
	(audioElement) => {
		if (audioElement && playQueueStore.list.length > 0 && isAudioVisualizationSupported) {
			connectAudio(audioElement)
		}
	},
)

// 监听可视化器数据变化
watch(
	() => barHeights.value,
	(newHeights) => {
		playQueueStore.visualizer = newHeights
	},
	{ deep: true },
)

// 监听错误
watch(
	() => error.value,
	(newError) => {
		if (newError) {
			console.error('[Player] 可视化器错误:', newError)
		}
	},
)

// 切换播放模式
watch(
	() => playQueueStore.playMode.shuffle,
	(isShuffle) => {
		if (isShuffle) {
			const currentIndex = playQueueStore.currentIndex
			const trackCount = playQueueStore.list.length

			// 1. 已播放部分：不变
			let shuffledList = [...Array(currentIndex).keys()]

			// 2. 构建待打乱的列表
			const shuffleSpace = [...Array(trackCount).keys()].filter((index) =>
				playQueueStore.shuffleCurrent
					? index >= currentIndex
					: index > currentIndex,
			)

			// 3. 随机打乱
			shuffleSpace.sort(() => Math.random() - 0.5)

			// 4. 如果当前曲目不参与打乱，插入回当前位置（即 currentIndex 处）
			if (!playQueueStore.shuffleCurrent) {
				shuffledList.push(currentIndex)
			}

			// 5. 拼接：已播放部分 + 当前（可选）+ 打乱后的剩余部分
			shuffledList = shuffledList.concat(shuffleSpace)

			// 6. 应用 shuffleList
			playQueueStore.shuffleList = shuffledList

			// 清除 shuffleCurrent 状态
			playQueueStore.shuffleCurrent = undefined
		} else {
			// 退出随机播放：恢复当前播放曲目的原索引
			playQueueStore.currentIndex =
				playQueueStore.shuffleList[playQueueStore.currentIndex]
		}

		// 切换播放模式后重新预加载
		setTimeout(() => {
			playQueueStore.clearAllPreloadedAudio()
			playQueueStore.preloadNext()
		}, 500)
	},
)

function getCurrentTrack() {
	return currentTrack.value
}

// 初始化音量
function initializeVolume() {
	if (player.value) {
		const savedVolume = localStorage.getItem('audioVolume')
		if (savedVolume) {
			const volumeValue = Number.parseFloat(savedVolume)
			player.value.volume = volumeValue
			console.log('[Player] 初始化音量:', volumeValue)
		} else {
			// 设置默认音量
			player.value.volume = 1
			localStorage.setItem('audioVolume', '1')
		}
	}
}

// 监听音量变化事件
function handleVolumeChange(event: Event) {
	const target = event.target as HTMLAudioElement
	if (target) {
		// 保存音量变化到localStorage
		localStorage.setItem('audioVolume', target.volume.toString())
		console.log('[Player] 音量变化:', target.volume)
	}
}

// 监听localStorage中音量的变化，同步到音频元素
function syncVolumeFromStorage() {
	if (player.value) {
		const savedVolume = localStorage.getItem('audioVolume')
		if (savedVolume) {
			const volumeValue = Number.parseFloat(savedVolume)
			if (player.value.volume !== volumeValue) {
				player.value.volume = volumeValue
			}
		}
	}
}

// 定期检查音量同步（可选，或者使用storage事件）
setInterval(syncVolumeFromStorage, 100)

// 组件卸载时清理预加载
// onUnmounted(() => {
//   playQueueStore.clearAllPreloadedAudio()
// })
</script>

<template>
	<div>
		<audio :src="currentAudioSrc" ref="playerRef" :autoplay="playQueueStore.isPlaying"
			v-if="playQueueStore.list.length !== 0" @volumechange="handleVolumeChange" @ended="() => {
				if (playQueueStore.playMode.repeat === 'single') { playQueueStore.isPlaying = true }
				else { playNext() }
			}" @pause="playQueueStore.isPlaying = false" @play="playQueueStore.isPlaying = true" @playing="() => {
				console.log('[Player] 音频开始播放事件')
				playQueueStore.isBuffering = false
				setMetadata()
				initializeVolume()
			}" @waiting="playQueueStore.isBuffering = true" @loadeddata="() => {
				console.log('[Player] 音频数据加载完成')
				playQueueStore.isBuffering = false
				initializeVolume()
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
					<span class="truncate text-xs">{{ getCurrentTrack()?.song.name }}</span>
				</div>
			</RouterLink>

			<button class="h-9 w-12 flex justify-center items-center" @click.stop="() => {
				playQueueStore.isPlaying = !playQueueStore.isPlaying
			}">
				<div v-if="playQueueStore.isPlaying">
					<LoadingIndicator v-if="playQueueStore.isBuffering === true" :size="4" />
					<!-- 在支持的浏览器上显示可视化，否则显示暂停图标 -->
					<div v-else-if="isAudioVisualizationSupported" class="h-4 flex justify-center items-center gap-[.125rem]">
						<div class="bg-white/75 w-[.125rem] rounded-full" v-for="(bar, index) in playQueueStore.visualizer"
							:key="index" :style="{
								height: `${Math.max(10, bar)}%`
							}" />
					</div>
					<PauseIcon v-else :size="4" />
				</div>
				<PlayIcon v-else :size="4" />
			</button>
		</div>
	</div>
</template>