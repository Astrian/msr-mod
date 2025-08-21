interface AudioTrack {
	url: string
	buffer: AudioBuffer | null
	source: AudioBufferSourceNode | null
	gainNode: GainNode | null
	duration: number
	metadata?: any
}

interface PlaybackState {
	isPlaying: boolean
	currentIndex: number
	pausedAt: number
	pausedOffset: number
}

export class WebAudioGaplessPlayer {
	private context: AudioContext
	private masterGain: GainNode
	private tracks: AudioTrack[] = []
	private state: PlaybackState = {
		isPlaying: false,
		currentIndex: 0,
		pausedAt: 0,
		pausedOffset: 0,
	}
	private bufferCache: Map<string, AudioBuffer> = new Map()
	private onTrackEndCallbacks: ((index: number) => void)[] = []
	private onTrackStartCallbacks: ((index: number) => void)[] = []
	private preloadAhead = 2
	private maxCacheSize = 5

	constructor() {
		this.context = new (
			window.AudioContext || (window as any).webkitAudioContext
		)()
		this.masterGain = this.context.createGain()
		this.masterGain.connect(this.context.destination)
	}

	/**
	 * Load and decode audio from URL
	 */
	private async loadAudio(url: string): Promise<AudioBuffer> {
		if (this.bufferCache.has(url)) {
			return this.bufferCache.get(url)!
		}

		try {
			const response = await fetch(url)
			if (!response.ok) {
				throw new Error(`Failed to fetch audio: ${response.status}`)
			}

			const arrayBuffer = await response.arrayBuffer()
			const audioBuffer = await this.context.decodeAudioData(arrayBuffer)

			this.bufferCache.set(url, audioBuffer)
			this.cleanupCache()

			return audioBuffer
		} catch (error) {
			console.error('Failed to load audio:', error)
			throw error
		}
	}

	/**
	 * Clean up cache
	 */
	private cleanupCache(): void {
		if (this.bufferCache.size <= this.maxCacheSize) return

		const currentUrls = new Set(
			this.tracks
				.slice(
					Math.max(0, this.state.currentIndex - 1),
					this.state.currentIndex + this.preloadAhead + 1,
				)
				.map((t) => t.url),
		)

		for (const [url] of this.bufferCache) {
			if (!currentUrls.has(url) && this.bufferCache.size > this.maxCacheSize) {
				this.bufferCache.delete(url)
			}
		}
	}

	/**
	 * Add a track to the queue
	 */
	async addTrack(url: string, metadata?: any): Promise<number> {
		const track: AudioTrack = {
			url,
			buffer: null,
			source: null,
			gainNode: null,
			duration: 0,
			metadata,
		}

		this.tracks.push(track)
		const index = this.tracks.length - 1

		// Preload if within range
		if (this.shouldPreload(index)) {
			await this.preloadTrack(index)
		}

		return index
	}

	/**
	 * Check if a track should be preloaded
	 */
	private shouldPreload(index: number): boolean {
		const distance = index - this.state.currentIndex
		return distance >= 0 && distance <= this.preloadAhead
	}

	/**
	 * Preload a track
	 */
	private async preloadTrack(index: number): Promise<void> {
		const track = this.tracks[index]
		if (!track || track.buffer) return

		try {
			track.buffer = await this.loadAudio(track.url)
			track.duration = track.buffer.duration
		} catch (error) {
			console.error(`Failed to preload track ${index}:`, error)
		}
	}

	/**
	 * Stop current track if playing
	 */
	private stopCurrentTrack(): void {
		const currentTrack = this.tracks[this.state.currentIndex]
		if (currentTrack?.source) {
			try {
				currentTrack.source.stop()
			} catch (e) {
				// Source might have already ended
			}
			currentTrack.source = null
			currentTrack.gainNode = null
		}
	}

	/**
	 * Play a specific track
	 */
	async playTrack(index: number): Promise<void> {
		if (index < 0 || index >= this.tracks.length) return

		// Stop any currently playing track
		this.stopCurrentTrack()

		// Resume context if suspended
		if (this.context.state === 'suspended') {
			await this.context.resume()
		}

		// Ensure track is loaded
		await this.preloadTrack(index)

		const track = this.tracks[index]
		if (!track?.buffer) {
			console.error(`Track ${index} not loaded`)
			return
		}

		// Update state
		this.state.currentIndex = index
		this.state.isPlaying = true
		this.state.pausedOffset = 0

		// Create audio nodes
		const source = this.context.createBufferSource()
		source.buffer = track.buffer

		const gainNode = this.context.createGain()
		source.connect(gainNode)
		gainNode.connect(this.masterGain)

		// Set up callbacks
		source.onended = () => {
			this.handleTrackEnded(index)
		}

		// Store references
		track.source = source
		track.gainNode = gainNode

		// Start playing immediately
		source.start(this.context.currentTime)

		// Notify track started
		this.onTrackStartCallbacks.forEach((cb) => cb(index))

		// Preload next tracks
		for (let i = 1; i <= this.preloadAhead; i++) {
			const nextIndex = index + i
			if (nextIndex < this.tracks.length) {
				this.preloadTrack(nextIndex).catch(console.error)
			}
		}
	}

	/**
	 * Handle track ended event
	 */
	private handleTrackEnded(index: number): void {
		const track = this.tracks[index]
		if (track) {
			track.source = null
			track.gainNode = null
		}

		// Only notify if this is still the current track
		if (index === this.state.currentIndex) {
			this.onTrackEndCallbacks.forEach((cb) => cb(index))
		}
	}

	/**
	 * Start playing from a specific index
	 */
	async play(startIndex = 0): Promise<void> {
		await this.playTrack(startIndex)
	}

	/**
	 * Play next track
	 */
	async playNext(): Promise<void> {
		const nextIndex = this.state.currentIndex + 1
		if (nextIndex < this.tracks.length) {
			await this.playTrack(nextIndex)
		}
	}

	/**
	 * Pause playback
	 */
	pause(): void {
		if (!this.state.isPlaying) return

		this.state.pausedAt = this.context.currentTime
		this.state.isPlaying = false

		// Calculate paused offset
		const position = this.getCurrentPosition()
		if (position) {
			this.state.pausedOffset = position.trackTime
		}

		// Stop current track
		this.stopCurrentTrack()

		// Suspend context to save resources
		this.context.suspend()
	}

	/**
	 * Resume playback
	 */
	async resume(): Promise<void> {
		if (this.state.isPlaying) return

		await this.context.resume()

		const currentTrack = this.tracks[this.state.currentIndex]
		if (!currentTrack?.buffer) return

		this.state.isPlaying = true

		// Create new source for resume
		const source = this.context.createBufferSource()
		source.buffer = currentTrack.buffer

		const gainNode = this.context.createGain()
		source.connect(gainNode)
		gainNode.connect(this.masterGain)

		// Calculate remaining duration
		const remainingDuration = currentTrack.duration - this.state.pausedOffset

		// Resume from offset
		source.start(this.context.currentTime, this.state.pausedOffset, remainingDuration)

		source.onended = () => this.handleTrackEnded(this.state.currentIndex)

		// Store references
		currentTrack.source = source
		currentTrack.gainNode = gainNode

		this.state.pausedOffset = 0
	}

	/**
	 * Stop playback
	 */
	stop(): void {
		this.pause()
		this.state.currentIndex = 0
		this.state.pausedOffset = 0
	}

	/**
	 * Seek to a specific track
	 */
	async seekToTrack(index: number): Promise<void> {
		if (index < 0 || index >= this.tracks.length) return
		await this.playTrack(index)
	}

	/**
	 * Get current playback position
	 */
	getCurrentPosition(): {
		trackIndex: number
		trackTime: number
		totalTime: number
	} | null {
		if (!this.state.isPlaying) {
			return {
				trackIndex: this.state.currentIndex,
				trackTime: this.state.pausedOffset,
				totalTime: 0,
			}
		}

		const currentTrack = this.tracks[this.state.currentIndex]
		if (!currentTrack?.source) return null

		// Estimate current time (not perfectly accurate but good enough)
		const elapsed = this.context.currentTime - (this.state.pausedAt || 0)
		const trackTime = Math.min(elapsed + this.state.pausedOffset, currentTrack.duration)

		return {
			trackIndex: this.state.currentIndex,
			trackTime,
			totalTime: trackTime,
		}
	}

	/**
	 * Set volume (0.0 to 1.0)
	 */
	setVolume(volume: number): void {
		this.masterGain.gain.value = Math.max(0, Math.min(1, volume))
	}

	/**
	 * Get volume
	 */
	getVolume(): number {
		return this.masterGain.gain.value
	}

	/**
	 * Clear all tracks
	 */
	clearQueue(): void {
		this.stop()
		this.tracks = []
		this.bufferCache.clear()
	}

	/**
	 * Register callback for track end event
	 */
	onTrackEnd(callback: (index: number) => void): void {
		this.onTrackEndCallbacks.push(callback)
	}

	/**
	 * Register callback for track start event
	 */
	onTrackStart(callback: (index: number) => void): void {
		this.onTrackStartCallbacks.push(callback)
	}

	/**
	 * Get audio context
	 */
	getContext(): AudioContext {
		return this.context
	}

	/**
	 * Get master gain node
	 */
	getMasterGain(): GainNode {
		return this.masterGain
	}

	/**
	 * Destroy the player
	 */
	destroy(): void {
		this.stop()
		this.clearQueue()
		this.onTrackEndCallbacks = []
		this.onTrackStartCallbacks = []

		if (this.context.state !== 'closed') {
			this.context.close()
		}
	}
}