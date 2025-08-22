<script setup lang="ts">
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { usePlayState } from '../stores/usePlayState'
import { debugPlayer } from '../utils/debug'
import { watch, ref, onMounted, onUnmounted } from 'vue'
import artistsOrganize from '../utils/artistsOrganize'

const playQueue = usePlayQueueStore()
const playState = usePlayState()
const playerInstance = ref<WebAudioPlayer | null>(null)

class WebAudioPlayer {
	context: AudioContext
	audioBuffer: { [key: string]: AudioBuffer}
	dummyAudio: HTMLAudioElement

	constructor() {
		this.context = new window.AudioContext()
		this.audioBuffer = {}
		
		// 创建一个隐藏的 HTML Audio 元素来帮助同步媒体会话状态
		this.dummyAudio = new Audio()
		this.dummyAudio.style.display = 'none'
		this.dummyAudio.loop = true
		this.dummyAudio.volume = 0.001 // 极小音量
		// 使用一个很短的静音音频文件，或者生成一个
		this.createSilentAudioBlob()
		
		document.body.appendChild(this.dummyAudio)
		
		this.initMediaSession()
	}

	createSilentAudioBlob() {
		// 创建一个1秒的静音WAV文件
		const sampleRate = 44100
		const channels = 1
		const length = sampleRate * 1 // 1秒
		
		const arrayBuffer = new ArrayBuffer(44 + length * 2)
		const view = new DataView(arrayBuffer)
		
		// WAV 文件头
		const writeString = (offset: number, string: string) => {
			for (let i = 0; i < string.length; i++) {
				view.setUint8(offset + i, string.charCodeAt(i))
			}
		}
		
		writeString(0, 'RIFF')
		view.setUint32(4, 36 + length * 2, true)
		writeString(8, 'WAVE')
		writeString(12, 'fmt ')
		view.setUint32(16, 16, true)
		view.setUint16(20, 1, true)
		view.setUint16(22, channels, true)
		view.setUint32(24, sampleRate, true)
		view.setUint32(28, sampleRate * 2, true)
		view.setUint16(32, 2, true)
		view.setUint16(34, 16, true)
		writeString(36, 'data')
		view.setUint32(40, length * 2, true)
		
		// 静音数据（全零）
		for (let i = 0; i < length; i++) {
			view.setInt16(44 + i * 2, 0, true)
		}
		
		const blob = new Blob([arrayBuffer], { type: 'audio/wav' })
		this.dummyAudio.src = URL.createObjectURL(blob)
	}

	initMediaSession() {
		if ('mediaSession' in navigator) {
			navigator.mediaSession.setActionHandler('play', () => {
				console.log('Media session: play requested')
				this.play()
			})
			navigator.mediaSession.setActionHandler('pause', () => {
				console.log('Media session: pause requested')
				this.pause()
			})
			navigator.mediaSession.setActionHandler('stop', () => {
				console.log('Media session: stop requested')
				this.stop()
			})
		}
	}

	async loadResourceAndPlay() {
		try {
			debugPlayer("从播放器实例内部获取播放项目：")
			debugPlayer(`目前播放：${playQueue.currentTrack?.song.cid ?? "空"}`)
			debugPlayer(`上一首：${playQueue.previousTrack?.song.cid ?? "空"}`)
			debugPlayer(`下一首：${playQueue.nextTrack?.song.cid ?? "空"}`)

			if (playQueue.queue.length === 0) {
				// TODO: 如果当前正在播放，则可能需要停止播放
			}

			// 将音频 buffer 加载到缓存空间
			const loadBuffer = async (track: QueueItem) => {
				if (this.audioBuffer[track.song.cid]) return // 已经缓存了，直接跳
				const response = await fetch(track.sourceUrl ?? "")
				const arrayBuffer = await response.arrayBuffer()
				const audioBuffer = await this.context.decodeAudioData(arrayBuffer)
				this.audioBuffer[track.song.cid] = audioBuffer
			}

			if (playQueue.currentTrack){
				await loadBuffer(playQueue.currentTrack)
				this.play()
			}

			if (playQueue.nextTrack)
				await loadBuffer(playQueue.nextTrack)

			if (playQueue.previousTrack)
				await loadBuffer(playQueue.previousTrack)

			debugPlayer("缓存完成")
		} catch (error) {
			console.error('播放失败:', error)
		}
	}

	// 从头播放
	async play() {
		debugPlayer("开始播放")
		const source = this.context.createBufferSource()
		source.buffer = this.audioBuffer[playQueue.currentTrack.song.cid]
		source.connect(this.context.destination)
		source.start()
	}

	pause() {}

	resume() {}

	stop() {
		
	}

	togglePlay() {
		
	}

	getCurrentTime() {
		
	}

	updateMediaSessionState() {
		
	}

	// 定期更新播放位置
	startPositionUpdates() {
		
	}

	// 清理资源
	destroy() {
		
	}
}

// 初始化 Web Audio 播放器
onMounted(() => {
	playerInstance.value = new WebAudioPlayer()
})

watch(() => playQueue.currentTrack, () => {
	debugPlayer(`检测到当前播放曲目更新`)
	playerInstance.value?.loadResourceAndPlay()
})
</script>

<template>
</template>

