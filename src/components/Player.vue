<!-- Player.vue - 添加调试信息 -->
<script setup lang="ts">
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { useTemplateRef, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'

import PlayIcon from '../assets/icons/play.vue'
import LoadingIndicator from '../assets/icons/loadingindicator.vue'
import { audioVisualizer } from '../utils'

const playQueueStore = usePlayQueueStore()
const route = useRoute()
const player = useTemplateRef('playerRef')

watch(() => playQueueStore.isPlaying, (newValue) => {
	if (newValue) {
		player.value?.play()
		setMetadata()
	}
	else { player.value?.pause() }
})

watch(() => playQueueStore.currentIndex, () => {
	console.log('[Player] 当前索引变化:', playQueueStore.currentIndex)
	setMetadata()
	playQueueStore.isBuffering = true
})

function artistsOrganize(list: string[]) {
	if (list.length === 0) { return '未知音乐人' }
	return list.map((artist) => {
		return artist
	}).join(' / ')
}

function setMetadata() {
	if ('mediaSession' in navigator) {
		navigator.mediaSession.metadata = new MediaMetadata({
			title: playQueueStore.list[playQueueStore.currentIndex].song.name,
			artist: artistsOrganize(playQueueStore.list[playQueueStore.currentIndex].song.artists ?? []),
			album: playQueueStore.list[playQueueStore.currentIndex].album?.name,
			artwork: [
				{ src: playQueueStore.list[playQueueStore.currentIndex].album?.coverUrl ?? '', sizes: '500x500', type: 'image/png' },
			]
		})

		navigator.mediaSession.setActionHandler('previoustrack', playPrevious)
		navigator.mediaSession.setActionHandler('nexttrack', playNext)

		playQueueStore.duration = player.value?.duration?? 0
		playQueueStore.currentTime = player.value?.currentTime?? 0
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
		player.value?.pause()
		playQueueStore.isPlaying = false
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
	playQueueStore.currentTime = player.value?.currentTime?? 0
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
</script>

<template>
	<div>
		<audio
			:src="playQueueStore.list[playQueueStore.currentIndex] ? playQueueStore.list[playQueueStore.currentIndex].song.sourceUrl : ''"
			ref="playerRef" 
			:autoplay="playQueueStore.isPlaying" 
			v-if="playQueueStore.list.length !== 0" 
			@ended="playNext"
			@pause="playQueueStore.isPlaying = false" 
			@play="playQueueStore.isPlaying = true" 
			@playing="() => {
				console.log('[Player] 音频开始播放事件')
				playQueueStore.isBuffering = false
				setMetadata()
			}" 
			@waiting="playQueueStore.isBuffering = true"
			@loadeddata="() => console.log('[Player] 音频数据加载完成')"
			@canplay="() => console.log('[Player] 音频可以播放')"
			@error="(e) => console.error('[Player] 音频错误:', e)"
			crossorigin="anonymous"
			@timeupdate="updateCurrentTime">
		</audio>

		<div
			class="text-white h-9 bg-neutral-800/80 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex gap-2 overflow-hidden select-none"
			v-if="playQueueStore.list.length !== 0 && route.path !== '/playroom'"
			>
			<RouterLink to="/playroom">
				<img :src="playQueueStore.list[playQueueStore.currentIndex].album?.coverUrl ?? ''" class="rounded-full h-9 w-9" />
			</RouterLink>

			<RouterLink to="/playroom">
				<div class="flex items-center w-32 h-9">
					<span class="truncate">{{ playQueueStore.list[playQueueStore.currentIndex].song.name }}</span>
				</div>
			</RouterLink>

			<button class="h-9 w-12 flex justify-center items-center" @click.stop="() => {
				playQueueStore.isPlaying = !playQueueStore.isPlaying
			}">
				<div v-if="playQueueStore.isPlaying">
					<LoadingIndicator v-if="playQueueStore.isBuffering === true" :size="4" />
					<div v-else class="h-4 flex justify-center items-center gap-[.125rem]">
						<div class="bg-white/75 w-[.125rem] rounded-full" v-for="(bar, index) in playQueueStore.visualizer" :key="index" :style="{
							height: `${Math.max(10, bar)}%`
						}" />
					</div>
				</div>
				<PlayIcon v-else :size="4" />
			</button>
		</div>
	</div>
</template>