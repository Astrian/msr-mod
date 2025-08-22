<script setup lang="ts">
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { usePlayState } from '../stores/usePlayState'
import { debugPlayer } from '../utils/debug'
import { watch, ref, onMounted } from 'vue'
import artistsOrganize from '../utils/artistsOrganize'

const playQueue = usePlayQueueStore()
const playState = usePlayState()
const playerInstance = ref<WebAudioPlayer | null>(null)

class WebAudioPlayer {
	context: AudioContext
	audioBuffer: { [key: string]: AudioBuffer}
	dummyAudio: HTMLAudioElement
	currentTrackStartTime: number
	currentSource: AudioBufferSourceNode | null
	nextSource: AudioBufferSourceNode | null
	reportInterval: ReturnType<typeof setTimeout> | null

	constructor() {
		this.context = new window.AudioContext()
		this.audioBuffer = {}
		this.currentTrackStartTime = 0
		this.currentSource = null
		this.nextSource = null
		this.reportInterval = null
		
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
				playState.togglePlay(true)
			})
			navigator.mediaSession.setActionHandler('pause', () => {
				console.log('Media session: pause requested')
				playState.togglePlay(false)
			})
			navigator.mediaSession.setActionHandler('stop', () => {
				console.log('Media session: stop requested')
				
			})
		}
	}

	// 缓存歌曲并播放
	async loadResourceAndPlay() {
		try {
			debugPlayer("从播放器实例内部获取播放项目：")
			debugPlayer(`目前播放：${playQueue.currentTrack?.song.cid ?? "空"}`)
			debugPlayer(`上一首：${playQueue.previousTrack?.song.cid ?? "空"}`)
			debugPlayer(`下一首：${playQueue.nextTrack?.song.cid ?? "空"}`)

			if (playQueue.queue.length === 0) {
				// TODO: 如果当前正在播放，则可能需要停止播放
				playState.reportPlayProgress(0)
				playState.reportActualPlaying(false)
				this.currentSource?.stop()
				this.nextSource?.stop()
			}

			if (playQueue.currentTrack) {
				await this.loadBuffer(playQueue.currentTrack)
				this.play()
			}

			if (playQueue.nextTrack) {
				await this.loadBuffer(playQueue.nextTrack)
				if (playState.isPlaying) this.scheduleNextTrack()
			} else {
				this.nextSource = null
			}

			if (playQueue.previousTrack)
				await this.loadBuffer(playQueue.previousTrack)

			debugPlayer("缓存完成")
		} catch (error) {
			console.error('播放失败:', error)
		}
	}

	// 将音频 buffer 加载到缓存空间
	loadBuffer = async (track: QueueItem) => {
		if (this.audioBuffer[track.song.cid]) return // 已经缓存了，直接跳
		const response = await fetch(track.sourceUrl ?? "")
		const arrayBuffer = await response.arrayBuffer()
		const audioBuffer = await this.context.decodeAudioData(arrayBuffer)
		this.audioBuffer[track.song.cid] = audioBuffer
	}

	// 播放
	play() {
		if (!playQueue.currentTrack) return 
		
		if (!playState.actualPlaying) {
			// 如果实际正在播放，那么跳过音轨初始化阶段
			debugPlayer("开始播放")
			navigator.mediaSession.playbackState = 'playing'
			if (playState.playProgress !== 0) debugPlayer(`已经有所进度！${playState.playProgress}`)
			this.currentSource = this.context.createBufferSource()
			this.currentSource.buffer = this.audioBuffer[playQueue.currentTrack.song.cid]
			this.currentSource.connect(this.context.destination)
			this.currentSource.start(this.context.currentTime, playState.playProgress)
			playState.reportActualPlaying(true)
			this.reportProgress()
		}
		// 开始预先准备无缝播放下一首
		// 获取下一首歌接入的时间点
		this.currentTrackStartTime = this.context.currentTime - playState.playProgress
		if (playQueue.nextTrack && this.audioBuffer[playQueue.nextTrack.song.cid]) this.scheduleNextTrack()

		// 写入当前曲目播放完成后的钩子
		if (this.currentSource) this.currentSource.onended = () => {
			debugPlayer("当前歌曲播放结束")
			if (!!this.reportInterval) {
				// 页面依然正在回报播放进度，因此为歌曲自然结束
				debugPlayer("歌曲自然结束")
				this.onTrackEnded()
			} else {
				debugPlayer("用户暂停")
			}
		}
	}

	// 安排下一首歌
	scheduleNextTrack() {
		if (this.nextSource !== null) {
			debugPlayer("下一首已经调度，跳过重复调度")
			return
		}

		// TODO: 处理不同循环逻辑
		if (!playQueue.nextTrack) return
		this.nextSource = null
		const nextTrackStartTime = this.currentTrackStartTime
		 + this.audioBuffer[playQueue.currentTrack.song.cid].duration
		debugPlayer(`下一首歌将在 ${nextTrackStartTime} 时间点接入`)

		this.nextSource = this.context.createBufferSource()
		this.nextSource.buffer = this.audioBuffer[playQueue.nextTrack.song.cid]
		this.nextSource.connect(this.context.destination)

		this.nextSource.start(nextTrackStartTime)
	}

	// 开始回报播放进度
	reportProgress() {
		this.reportInterval = setInterval(() => {
			const progress = this.context.currentTime - this.currentTrackStartTime
			playState.reportPlayProgress(progress)
			playState.reportCurrentTrackDuration(this.audioBuffer[playQueue.currentTrack.song.cid].duration)
			
			// 向浏览器回报
			if (('mediaSession' in navigator) && ('setPositionState' in navigator.mediaSession)) {
			try {
				navigator.mediaSession.setPositionState({
					duration: this.audioBuffer[playQueue.currentTrack.song.cid].duration || 0,
					playbackRate: 1.0,
					position: progress,
				})
			} catch (error) {
				debugPlayer('媒体会话位置更新失败:', error)
			}
		}
		}, 100)
	}

	// 停止回报
	stopReportProgress() {
		if (this.reportInterval) clearInterval(this.reportInterval)
		this.reportInterval = null
		debugPlayer(this.reportInterval)
	}

	pause() {
		navigator.mediaSession.playbackState = 'paused'
		debugPlayer("尝试暂停播放")
		debugPlayer(this.currentSource)
		this.currentSource?.stop()
		this.nextSource?.stop()
		this.nextSource = null 
		playState.reportActualPlaying(false)
		this.stopReportProgress()
	}

	async onTrackEnded() {
		// 1. 清理当前状态
		this.stopReportProgress()
		playState.reportPlayProgress(0)

		// 2. 检查是否还有下一首
		if (!this.nextSource) {
			// 播放结束
			playState.reportActualPlaying(false)
			playState.togglePlay(false)
			return
		}

		// 3. 切换到下一首
		playQueue.continueToNext()
		this.currentSource = this.nextSource
		this.nextSource = null
		
		// 4. 重新计算时间轴并启动进度报告
		this.currentTrackStartTime = this.context.currentTime
		this.reportProgress()

		// 5. 处理下下首
		if (playQueue.nextTrack) {
			debugPlayer("处理下下一首歌")
			if (this.audioBuffer[playQueue.nextTrack.song.cid]) {
				this.scheduleNextTrack()
			} else {
				await this.loadBuffer(playQueue.nextTrack)
				if (playState.actualPlaying) this.scheduleNextTrack()
			}
		}
	}
}

// 初始化 Web Audio 播放器
onMounted(() => {
	playerInstance.value = new WebAudioPlayer()
})

watch(() => playQueue.currentTrack, () => {
	debugPlayer(`检测到当前播放曲目更新`)
	navigator.mediaSession.playbackState = playState.isPlaying ? 'playing' : 'paused'
	navigator.mediaSession.metadata = new MediaMetadata({
    title: playQueue.currentTrack.song.name,
    artist: artistsOrganize(playQueue.currentTrack.song.artistes ?? []),
    album: playQueue.currentTrack.album?.name,
    artwork: [
      { src: playQueue.currentTrack.album?.coverUrl ?? "",   sizes: '500x500',   type: 'image/png' },
    ]
  })
	playerInstance.value?.loadResourceAndPlay()
})

watch(() => playState.isPlaying, () => {
	if (!playState.isPlaying) {
		// 触发暂停
		playerInstance.value?.pause()
	} else {
		// 恢复音频
		playerInstance.value?.play()
	}
})
</script>

<template>
</template>

