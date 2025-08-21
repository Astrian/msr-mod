<script setup lang="ts">
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { WebAudioGaplessPlayer } from '../utils/webAudioPlayer'
import { debugPlayer } from '../utils/debug'
import { watch, ref, onMounted, onUnmounted } from 'vue'
import artistsOrganize from '../utils/artistsOrganize'

const playQueue = usePlayQueueStore()
const player = ref<WebAudioGaplessPlayer | null>(null)
const isInitialized = ref(false)
const currentTrackIndex = ref(-1)

// 初始化 Web Audio 播放器
onMounted(() => {
	player.value = new WebAudioGaplessPlayer()
	
	// 注册事件回调
	player.value.onTrackStart((index) => {
		debugPlayer(`Track ${index} started`)
		currentTrackIndex.value = index
		
		// 更新 store 中的当前播放索引
		playQueue.toggleQueuePlay(index)
		
		// 更新媒体会话
		const track = playQueue.queue[index]
		if (track) {
			updateMediaSession(track)
		}
	})
	
	player.value.onTrackEnd((index) => {
		debugPlayer(`Track ${index} ended`)
		
		// 根据循环模式处理
		if (playQueue.loopMode === 'single') {
			// 单曲循环：重新播放当前曲目
			player.value?.seekToTrack(index)
		} else if (index === playQueue.queue.length - 1) {
			// 最后一首歌
			if (playQueue.loopMode === 'all') {
				// 列表循环：从头开始
				player.value?.seekToTrack(0)
			} else {
				// 停止播放
				playQueue.togglePlay(false)
			}
		} else {
			// 立即播放下一首歌
			player.value?.playNext()
		}
	})
	
	isInitialized.value = true
	
	// 设置媒体会话处理器
	setupMediaSessionHandlers()
})

// 销毁播放器
onUnmounted(() => {
	if (player.value) {
		player.value.destroy()
		player.value = null
	}
})

// 监听播放队列变化
watch(
	() => playQueue.queue,
	async (newQueue) => {
		if (!player.value || !isInitialized.value) return
		
		debugPlayer('Queue changed, rebuilding Web Audio queue')
		
		// 清空当前队列
		player.value.clearQueue()
		currentTrackIndex.value = -1
		
		// 添加所有曲目到 Web Audio 队列
		for (const track of newQueue) {
			if (track.song.sourceUrl) {
				await player.value.addTrack(track.song.sourceUrl, {
					cid: track.song.cid,
					name: track.song.name,
					artists: track.song.artists,
					album: track.album,
				})
			}
		}
		
		debugPlayer(`Added ${newQueue.length} tracks to Web Audio queue`)
	},
	{ deep: true },
)

// 监听播放状态变化
watch(
	() => playQueue.isPlaying,
	async (isPlaying) => {
		if (!player.value || !isInitialized.value) return
		
		if (isPlaying) {
			debugPlayer('Starting playback')
			// 如果是从暂停恢复
			const position = player.value.getCurrentPosition()
			if (position && position.trackTime > 0) {
				await player.value.resume()
			} else {
				// 从当前索引开始播放
				await player.value.play(playQueue.currentIndex)
			}
		} else {
			debugPlayer('Pausing playback')
			player.value.pause()
		}
	},
)

// 监听当前曲目变化（用户手动切换）
watch(
	() => playQueue.currentIndex,
	async (newIndex, oldIndex) => {
		if (!player.value || !isInitialized.value) return
		
		// 如果是 Web Audio 触发的变化，跳过
		if (newIndex === currentTrackIndex.value) return
		
		debugPlayer(`User requested track change: ${oldIndex} -> ${newIndex}`)
		
		// 跳转到指定曲目
		await player.value.seekToTrack(newIndex)
		currentTrackIndex.value = newIndex
	},
)

// 监听音量变化（如果有音量控制）
// Note: volume control not implemented in current store, default to 1
watch(
	() => isInitialized.value,
	(initialized) => {
		if (initialized && player.value) {
			player.value.setVolume(1)
		}
	},
	{ immediate: true },
)

// 更新媒体会话信息
function updateMediaSession(track: QueueItem) {
	if (!('mediaSession' in navigator)) return
	
	console.log('Updating media session for:', track.song.name)
	
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
	
	// 设置播放状态
	navigator.mediaSession.playbackState = playQueue.isPlaying ? 'playing' : 'paused'
}

// 初始化媒体会话处理器（只需要设置一次）
function setupMediaSessionHandlers() {
	if (!('mediaSession' in navigator)) return
	
	console.log('Setting up media session handlers')
	
	navigator.mediaSession.setActionHandler('play', () => {
		console.log('Media session: play')
		playQueue.togglePlay(true)
	})
	
	navigator.mediaSession.setActionHandler('pause', () => {
		console.log('Media session: pause')
		playQueue.togglePlay(false)
	})
	
	navigator.mediaSession.setActionHandler('previoustrack', () => {
		console.log('Media session: previous')
		const prevIndex = Math.max(0, playQueue.currentIndex - 1)
		playQueue.toggleQueuePlay(prevIndex)
	})
	
	navigator.mediaSession.setActionHandler('nexttrack', () => {
		console.log('Media session: next')
		playQueue.skipToNext()
	})
}

// 定期报告播放进度
let progressInterval: number | null = null

watch(
	() => playQueue.isPlaying,
	(isPlaying) => {
		// 同步媒体会话播放状态
		if ('mediaSession' in navigator) {
			navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused'
		}
		
		if (isPlaying) {
			// 开始定期报告进度
			progressInterval = window.setInterval(() => {
				if (!player.value) return
				
				const position = player.value.getCurrentPosition()
				if (position) {
					playQueue.reportPlayProgress(position.trackTime)
					
					// 更新媒体会话位置信息
					if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
						const currentTrack = playQueue.queue[position.trackIndex]
						if (currentTrack) {
							try {
								navigator.mediaSession.setPositionState({
									duration: currentTrack.song.duration || 0,
									playbackRate: 1.0,
									position: position.trackTime,
								})
							} catch (error) {
								// 某些浏览器可能不支持 setPositionState
								console.debug('Media session setPositionState not supported:', error)
							}
						}
					}
				}
			}, 100) // 每100ms更新一次
		} else {
			// 停止报告进度
			if (progressInterval !== null) {
				clearInterval(progressInterval)
				progressInterval = null
			}
		}
	},
)

// 清理定时器
onUnmounted(() => {
	if (progressInterval !== null) {
		clearInterval(progressInterval)
	}
})
</script>

<template>
	<!-- Web Audio Player 不需要 DOM 元素 -->
	<div class="web-audio-player" v-show="false">
		<div v-if="!isInitialized" class="text-white">
			Initializing Web Audio Player...
		</div>
		<div v-else class="text-white">
			Web Audio Player Ready ({{ playQueue.queue.length }} tracks)
		</div>
	</div>
</template>

<style scoped>
.web-audio-player {
	position: absolute;
	pointer-events: none;
	opacity: 0;
	z-index: -1;
}
</style>