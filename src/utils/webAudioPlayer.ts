class SimpleAudioPlayer {
	context: AudioContext
	currentSource: AudioBufferSourceNode | null
	audioBuffer: AudioBuffer | null
	playing: boolean
	startTime: number
	pauseTime: number
	duration: number
	dummyAudio: HTMLAudioElement

	constructor() {
		this.context = new window.AudioContext()
		this.currentSource = null
		this.audioBuffer = null
		this.playing = false
		this.startTime = 0
		this.pauseTime = 0
		this.duration = 0
		
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

	async loadResource() {
		try {
			// 如果已经加载过，直接播放
			if (this.audioBuffer) {
				this.play()
				return
			}

			// 加载音频
			const response = await fetch(
				'https://s3-us-west-2.amazonaws.com/s.cdpn.io/858/outfoxing.mp3'
			)
			const arrayBuffer = await response.arrayBuffer()
			this.audioBuffer = await this.context.decodeAudioData(arrayBuffer)
			this.duration = this.audioBuffer.duration

			// 设置媒体元数据
			if ('mediaSession' in navigator) {
				navigator.mediaSession.metadata = new MediaMetadata({
					title: 'Outfoxing the Fox',
					artist: 'Kevin MacLeod',
					album: 'YouTube Audio Library',
				})
			}

			// 开始播放
			this.play()
		} catch (error) {
			console.error('播放失败:', error)
		}
	}

	async play() {
		if (!this.audioBuffer) {
			this.loadResource()
			return
		}

		if (this.playing) {
			console.log('Already playing, ignoring play request')
			return
		}

		console.log('Starting playback from position:', this.pauseTime)

		// 恢复 AudioContext（如果被暂停）
		if (this.context.state === 'suspended') {
			await this.context.resume()
		}

		// 开始播放隐藏的 audio 元素
		try {
			await this.dummyAudio.play()
		} catch (e) {
			console.log('Dummy audio play failed (expected):', e)
		}

		// 创建新的源节点
		this.currentSource = this.context.createBufferSource()
		this.currentSource.buffer = this.audioBuffer
		this.currentSource.connect(this.context.destination)

		// 从暂停位置开始播放
		const offset = this.pauseTime
		this.currentSource.start(0, offset)
		
		this.startTime = this.context.currentTime - offset
		this.playing = true

		// 播放结束处理 - 只在自然结束时触发
		this.currentSource.onended = () => {
			console.log('Audio naturally ended')
			// 检查是否真的播放到了结尾
			const currentTime = this.getCurrentTime()
			if (currentTime >= this.duration - 0.1) { // 允许小误差
				console.log('Natural end of track')
				this.stop()
			} else {
				console.log('Audio ended prematurely (likely paused), current time:', currentTime)
				// 这是由于暂停导致的结束，不做任何处理
			}
		}

		// 更新媒体会话状态
		this.updateMediaSessionState()
	}

	pause() {
		console.log('Pause requested, current state - playing:', this.playing, 'hasSource:', !!this.currentSource)
		
		// 暂停隐藏的 audio 元素
		this.dummyAudio.pause()
		
		if (!this.playing) {
			console.log('Already paused, but updating media session state')
			// 即使已经暂停，也要确保媒体会话状态正确
			this.updateMediaSessionState()
			return
		}

		if (!this.currentSource) {
			console.log('No current source, but updating media session state')
			this.updateMediaSessionState()
			return
		}

		console.log('Pausing playback at position:', this.getCurrentTime())

		// 计算当前播放位置
		this.pauseTime = this.getCurrentTime()
		
		// 移除 onended 事件处理器，避免干扰
		this.currentSource.onended = null
		
		// 停止当前源
		this.currentSource.stop()
		this.currentSource = null
		this.playing = false

		// 更新媒体会话状态
		this.updateMediaSessionState()
	}

	stop() {
		console.log('Stopping playback')
		
		// 停止隐藏的 audio 元素
		this.dummyAudio.pause()
		this.dummyAudio.currentTime = 0
		
		if (this.currentSource) {
			this.currentSource.stop()
			this.currentSource = null
		}
		
		this.playing = false
		this.pauseTime = 0
		this.startTime = 0

		// 更新媒体会话状态
		this.updateMediaSessionState()
	}

	togglePlay() {
		if (this.playing) {
			this.pause()
		} else {
			this.play()
		}
	}

	getCurrentTime(): number {
		if (this.playing && this.currentSource) {
			return Math.min(this.context.currentTime - this.startTime, this.duration)
		}
		return this.pauseTime
	}

	updateMediaSessionState() {
		if ('mediaSession' in navigator) {
			let state = 'none'
			if (this.playing) {
				state = 'playing'
			} else if (this.audioBuffer) {
				// 只要有音频缓冲区就应该是暂停状态
				state = 'paused'
			}
			
			console.log('Updating media session state to:', state, '(playing:', this.playing, ', hasBuffer:', !!this.audioBuffer, ')')
			
			// 强制设置状态
			try {
				navigator.mediaSession.playbackState = state as any
				
				// 更新位置信息
				if ('setPositionState' in navigator.mediaSession && this.duration > 0) {
					navigator.mediaSession.setPositionState({
						duration: this.duration,
						playbackRate: 1.0,
						position: this.getCurrentTime()
					})
				}
			} catch (error) {
				console.error('Error updating media session:', error)
			}
		}
	}

	// 定期更新播放位置
	startPositionUpdates() {
		setInterval(() => {
			if (this.audioBuffer) {
				this.updateMediaSessionState()
			}
		}, 1000)
	}

	// 清理资源
	destroy() {
		this.stop()
		if (this.dummyAudio) {
			document.body.removeChild(this.dummyAudio)
		}
		if (this.context.state !== 'closed') {
			this.context.close()
		}
	}
}

export default SimpleWebAudioPlayer