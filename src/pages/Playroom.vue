<script setup lang="ts">
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { artistsOrganize } from '../utils'
import gsap from 'gsap'
import { Draggable } from "gsap/Draggable"
import { onMounted, onUnmounted, nextTick } from 'vue'
import { useTemplateRef } from 'vue'
import { ref, watch } from 'vue'
import { usePreferences } from '../stores/usePreferences'
import { useFavourites } from '../stores/useFavourites'

import ScrollingLyrics from '../components/ScrollingLyrics.vue'

import RewindIcon from '../assets/icons/rewind.vue'
import ForwardIcon from '../assets/icons/forward.vue'
import PlayIcon from '../assets/icons/play.vue'
import PauseIcon from '../assets/icons/pause.vue'
import LoadingIndicator from '../assets/icons/loadingindicator.vue'
import ChatBubbleQuoteIcon from '../assets/icons/chatbubblequote.vue'
import ChatBubbleQuoteFullIcon from '../assets/icons/chatbubblequotefull.vue'
import StarEmptyIcon from '../assets/icons/starempty.vue'
import StarFilledIcon from '../assets/icons/starfilled.vue'
import MusicListIcon from '../assets/icons/musiclist.vue'
import EllipsisHorizontalIcon from '../assets/icons/ellipsishorizontal.vue'
import XIcon from '../assets/icons/x.vue'
import ShuffleIcon from '../assets/icons/shuffle.vue'
import CycleTwoArrowsIcon from '../assets/icons/cycletwoarrows.vue'
import CycleTwoArrowsWithNumOneIcon from '../assets/icons/cycletwoarrowswithnumone.vue'
import SpeakerIcon from '../assets/icons/speaker.vue'
import MuscialNoteSparklingIcon from '../assets/icons/musicalnotesparkling.vue'
import CastEmptyIcon from '../assets/icons/castempty.vue'

const playQueueStore = usePlayQueueStore()
const preferences = usePreferences()
const favourites = useFavourites()

gsap.registerPlugin(Draggable)

const progressBarThumb = useTemplateRef('progressBarThumb')
const progressBarContainer = useTemplateRef('progressBarContainer')
const playQueueDialogContainer = useTemplateRef('playQueueDialogContainer')
const playQueueDialog = useTemplateRef('playQueueDialog')
const controllerRef = useTemplateRef('controllerRef')
const lyricsSection = useTemplateRef('lyricsSection')
const albumCover = useTemplateRef('albumCover')
const songInfo = useTemplateRef('songInfo')
const moreOptionsDialog = useTemplateRef('moreOptionsDialog')

const playButton = useTemplateRef('playButton')
const volumeSliderThumb = useTemplateRef('volumeSliderThumb')
const volumeSliderContainer = useTemplateRef('volumeSliderContainer')

const presentQueueListDialog = ref(false)
const presentLyrics = ref(false)
const showLyricsTooltip = ref(false)
const showMoreOptions = ref(false)
const presentVolumeControl = ref(false)
const volume = ref(1) // 音量值 0-1

import PlayQueueItem from '../components/PlayQueueItem.vue'

onMounted(async () => {
	Draggable.create(progressBarThumb.value, {
		type: 'x',
		bounds: progressBarContainer.value,
		onDrag: function () {
			const thumbPosition = this.x
			const containerWidth = progressBarContainer.value?.clientWidth || 0
			const newTime = (thumbPosition / containerWidth) * playQueueStore.duration
			playQueueStore.updatedCurrentTime = newTime
		}
	})

	// 等待DOM完全渲染后再初始化拖拽
	await nextTick()

	// 初始化音量从localStorage或默认值
	const savedVolume = localStorage.getItem('audioVolume')
	if (savedVolume) {
		volume.value = parseFloat(savedVolume)
	}

	thumbUpdate()

	setupEntranceAnimations()

	// 添加页面焦点事件监听
	setupPageFocusHandlers()
})

function timeFormatter(time: number) {
	const timeInSeconds = Math.floor(time)
	if (timeInSeconds < 0) { return '-:--' }
	const minutes = Math.floor(timeInSeconds / 60)
	const seconds = Math.floor(timeInSeconds % 60)
	if (Number.isNaN(minutes) || Number.isNaN(seconds)) { return '-:--' }
	return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

// 监听播放进度，更新进度条
watch(() => playQueueStore.currentTime, () => {
	thumbUpdate()
})

function thumbUpdate() {
	const progress = playQueueStore.currentTime / playQueueStore.duration
	const containerWidth = progressBarContainer.value?.clientWidth || 0
	const thumbWidth = progressBarThumb.value?.clientWidth || 0
	const newPosition = (containerWidth - thumbWidth) * progress
	gsap.to(progressBarThumb.value, { x: newPosition, duration: 0.1 })
}

function volumeThumbUpdate() {
	const containerWidth = volumeSliderContainer.value?.clientWidth || 0
	const thumbWidth = volumeSliderThumb.value?.clientWidth || 0
	const newPosition = (containerWidth - thumbWidth) * volume.value
	gsap.to(volumeSliderThumb.value, { x: newPosition, duration: 0.1 })
}

function toggleVolumeControl() {
	if (!presentVolumeControl.value) {
		presentVolumeControl.value = true
		nextTick(() => {
			// 在音量控制显示后再创建Draggable
			createVolumeDraggable()
			volumeThumbUpdate()
		})
	} else {
		presentVolumeControl.value = false
	}
}

function createVolumeDraggable() {
	if (!volumeSliderThumb.value || !volumeSliderContainer.value) {
		console.warn('Volume slider elements not found')
		return
	}

	// 确保容器有宽度
	const containerWidth = volumeSliderContainer.value.clientWidth
	if (containerWidth === 0) {
		console.warn('Volume slider container has no width')
		return
	}

	// 创建音量滑杆的 Draggable
	Draggable.create(volumeSliderThumb.value, {
		type: 'x',
		bounds: volumeSliderContainer.value,
		onDrag: function () {
			const thumbPosition = this.x
			const containerWidth = volumeSliderContainer.value?.clientWidth || 0
			const thumbWidth = volumeSliderThumb.value?.clientWidth || 0
			// 确保音量值在0-1之间
			const newVolume = Math.max(0, Math.min(1, thumbPosition / (containerWidth - thumbWidth)))
			volume.value = newVolume
			updateAudioVolume()
			// 保存音量到localStorage
			localStorage.setItem('audioVolume', newVolume.toString())
		},
		onDragEnd: () => {
			// 拖拽结束时也保存一次
			localStorage.setItem('audioVolume', volume.value.toString())
		}
	})

	console.log('Volume draggable created successfully')
}

function updateAudioVolume() {
	// 通过事件或直接访问音频元素来设置音量
	const audioElement = document.querySelector('audio')
	if (audioElement) {
		audioElement.volume = volume.value
	}
}

function formatDetector() {
	const format = playQueueStore.list[playQueueStore.currentIndex].song.sourceUrl?.split('.').pop()
	if (format === 'mp3') { return 'MP3' }
	if (format === 'flac') { return 'FLAC' }
	if (format === 'm4a') { return 'M4A' }
	if (format === 'ape') { return 'APE' }
	if (format === 'wav') { return 'WAV' }
	return '未知格式'
}

function playNext() {
	if (playQueueStore.currentIndex === playQueueStore.list.length - 1) {
		console.log("at the bottom, pause")
		playQueueStore.currentIndex = 0
		playQueueStore.isPlaying = false
	} else {
		playQueueStore.currentIndex++
		playQueueStore.isPlaying = true
	}
}

function playPrevious() {
	if (playQueueStore.currentTime < 5 && playQueueStore.currentIndex > 0) {
		playQueueStore.currentIndex--
		playQueueStore.isPlaying = true
	} else {
		playQueueStore.updatedCurrentTime = 0
	}
}

function setupEntranceAnimations() {
	if (controllerRef.value) {
		gsap.fromTo(controllerRef.value.children,
			{ opacity: 0, y: 30, scale: 0.95 },
			{
				opacity: 1, y: 0, scale: 1,
				duration: 0.6, ease: "power2.out", stagger: 0.1
			}
		)
	}

	if (lyricsSection.value) {
		gsap.fromTo(lyricsSection.value,
			{ opacity: 0, x: 50 },
			{ opacity: 1, x: 0, duration: 0.8, ease: "power2.out", delay: 0.3 }
		)
	}
}

function handlePlayPause() {
	if (playButton.value) {
		gsap.to(playButton.value, {
			scale: 0.9, duration: 0.1, yoyo: true, repeat: 1,
			ease: "power2.inOut",
			onComplete: () => {
				playQueueStore.isPlaying = !playQueueStore.isPlaying
			}
		})
	} else {
		playQueueStore.isPlaying = !playQueueStore.isPlaying
	}
}

function toggleShuffle() {
	playQueueStore.playMode.shuffle = !playQueueStore.playMode.shuffle
	playQueueStore.shuffleCurrent = false
}

function toggleRepeat() {
	switch (playQueueStore.playMode.repeat) {
		case 'off': playQueueStore.playMode.repeat = 'all'; break
		case 'all': playQueueStore.playMode.repeat = 'single'; break
		case 'single': playQueueStore.playMode.repeat = 'off'; break
	}
}

function makePlayQueueListPresent() {
	presentQueueListDialog.value = true

	nextTick(() => {
		if (!playQueueDialogContainer.value || !playQueueDialog.value) return

		const tl = gsap.timeline()
		tl.to(playQueueDialogContainer.value, {
			backgroundColor: '#17171780', duration: 0.3, ease: 'power2.out'
		}).to(playQueueDialog.value, {
			x: 0, duration: 0.4, ease: 'power3.out'
		}, '<0.1')

		if (playQueueDialog.value.children.length > 0) {
			tl.fromTo(playQueueDialog.value.children,
				{ opacity: 0, x: -20 },
				{ opacity: 1, x: 0, duration: 0.3, ease: 'power2.out', stagger: 0.05 }, '<0.2')
		}
	})
}

function makePlayQueueListDismiss() {
	if (!playQueueDialogContainer.value || !playQueueDialog.value) {
		presentQueueListDialog.value = false
		return
	}

	const tl = gsap.timeline({
		onComplete: () => {
			presentQueueListDialog.value = false
			if (playQueueDialog.value) {
				gsap.set(playQueueDialog.value, { x: -384 })
			}
			if (playQueueDialogContainer.value) {
				gsap.set(playQueueDialogContainer.value, { backgroundColor: 'transparent' })
			}
		}
	})

	if (playQueueDialog.value.children.length > 0) {
		tl.to(playQueueDialog.value.children, {
			opacity: 0, x: -20, duration: 0.2, ease: 'power2.in', stagger: 0.03
		})
	}

	tl.to(playQueueDialog.value, {
		x: -384, duration: 0.3, ease: 'power2.in'
	}, playQueueDialog.value.children.length > 0 ? '<0.1' : '0')
		.to(playQueueDialogContainer.value, {
			backgroundColor: 'transparent', duration: 0.2, ease: 'power2.in'
		}, '<')
}

function getCurrentTrack() {
	if (playQueueStore.list.length === 0) {
		return null
	}
	if (playQueueStore.playMode.shuffle) {
		return playQueueStore.list[playQueueStore.shuffleList[playQueueStore.currentIndex]]
	} else {
		return playQueueStore.list[playQueueStore.currentIndex]
	}
}

function toggleMoreOptions() {
	if (!showMoreOptions.value) {
		showMoreOptions.value = true
		nextTick(() => {
			if (moreOptionsDialog.value) {
				const tl = gsap.timeline()
				tl.fromTo(moreOptionsDialog.value,
					{ opacity: 0, scale: 0.9, y: 10 },
					{ opacity: 1, scale: 1, y: 0, duration: 0.2, ease: "power2.out" }
				)
				if (moreOptionsDialog.value.children[0]?.children) {
					tl.fromTo(moreOptionsDialog.value.children[0].children,
						{ opacity: 0, x: -10 },
						{ opacity: 1, x: 0, duration: 0.15, ease: "power2.out", stagger: 0.05 },
						"<0.1"
					)
				}
			}
		})
	} else {
		if (moreOptionsDialog.value) {
			const tl = gsap.timeline({
				onComplete: () => {
					showMoreOptions.value = false
				}
			})
			if (moreOptionsDialog.value.children[0]?.children) {
				tl.to(moreOptionsDialog.value.children[0].children,
					{ opacity: 0, x: -10, duration: 0.1, ease: "power2.in", stagger: 0.02 }
				)
			}
			tl.to(moreOptionsDialog.value,
				{ opacity: 0, scale: 0.9, y: 10, duration: 0.15, ease: "power2.in" },
				moreOptionsDialog.value.children[0]?.children ? "<0.05" : "0"
			)
		} else {
			showMoreOptions.value = false
		}
	}
}

watch(() => [preferences.presentLyrics, getCurrentTrack()?.song.lyricUrl], (newValue, oldValue) => {
	if (!getCurrentTrack()) { return }

	const [showLyrics, hasLyricUrl] = newValue
	const [prevShowLyrics, _prevHasLyricUrl] = oldValue || [false, null]

	// Show lyrics when both conditions are met
	if (showLyrics && hasLyricUrl) {
		presentLyrics.value = true
		nextTick(() => {
			const tl = gsap.timeline()
			tl.from(controllerRef.value, {
				marginRight: '-40rem',
			}).fromTo(lyricsSection.value,
				{ opacity: 0, x: 50, scale: 0.95 },
				{ opacity: 1, x: 0, scale: 1, duration: 0.5, ease: "power2.out" },
				"-=0.3"
			)
		})
	}
	// Hide lyrics with different animations based on reason
	else if (presentLyrics.value) {
		let animationConfig

		// If lyrics were toggled off
		if (prevShowLyrics && !showLyrics) {
			animationConfig = {
				opacity: 0, x: -50, scale: 0.95,
				duration: 0.3, ease: "power2.in"
			}
		}
		// If no lyrics available (song changed)
		else if (!hasLyricUrl) {
			animationConfig = {
				opacity: 0, y: -20, scale: 0.98,
				duration: 0.3, ease: "power1.in"
			}
		}
		// Default animation
		else {
			animationConfig = {
				opacity: 0, x: -50,
				duration: 0.3, ease: "power2.in"
			}
		}

		const tl = gsap.timeline({
			onComplete: () => {
				presentLyrics.value = false
			}
		})

		tl.to(controllerRef.value, {
			marginLeft: '44rem',
			duration: 0.3, ease: "power2.out"
		})
			.to(lyricsSection.value, animationConfig, '<')
			.set(lyricsSection.value, {
				opacity: 1, x: 0, y: 0, scale: 1 // Reset for next time
			})
			.set(controllerRef.value, {
				marginLeft: '0rem' // Reset for next time
			})
	}
}, { immediate: true })

// 页面焦点处理函数变量声明
let handleVisibilityChange: (() => void) | null = null
let handlePageFocus: (() => void) | null = null

onUnmounted(() => {
	// 清理页面焦点事件监听器
	if (handleVisibilityChange) {
		document.removeEventListener('visibilitychange', handleVisibilityChange)
	}
	if (handlePageFocus) {
		window.removeEventListener('focus', handlePageFocus)
	}
})

// 页面焦点处理函数
function setupPageFocusHandlers() {
	handleVisibilityChange = () => {
		if (document.hidden) {
			// 页面失去焦点时，暂停所有动画
			console.log('[Playroom] 页面失去焦点，暂停动画')
		} else {
			// 页面重新获得焦点时，重新同步状态
			console.log('[Playroom] 页面重新获得焦点，同步状态')
			nextTick(() => {
				resyncLyricsState()
			})
		}
	}

	handlePageFocus = () => {
		console.log('[Playroom] 窗口获得焦点，同步状态')
		nextTick(() => {
			resyncLyricsState()
		})
	}

	// 监听页面可见性变化
	document.addEventListener('visibilitychange', handleVisibilityChange)
	window.addEventListener('focus', handlePageFocus)
}

// 重新同步歌词状态
function resyncLyricsState() {
	const currentTrack = getCurrentTrack()
	if (!currentTrack) { return }

	console.log('[Playroom] 重新同步歌词状态')

	// 重置动画状态
	if (controllerRef.value) {
		gsap.set(controllerRef.value, { 
			marginLeft: '0rem', 
			marginRight: '0rem' 
		})
	}

	if (lyricsSection.value) {
		gsap.set(lyricsSection.value, { 
			opacity: 1, 
			x: 0, 
			y: 0, 
			scale: 1 
		})
	}

	// 检查当前歌词显示状态应该是什么
	const shouldShowLyrics = preferences.presentLyrics && currentTrack.song.lyricUrl ? true : false

	if (shouldShowLyrics !== presentLyrics.value) {
		console.log(`[Playroom] 歌词状态不一致，重新设置: ${presentLyrics.value} -> ${shouldShowLyrics}`)
		
		// 直接设置状态，不触发动画
		presentLyrics.value = shouldShowLyrics
		
		// 如果需要显示歌词，重新执行显示动画
		if (shouldShowLyrics) {
			nextTick(() => {
				const tl = gsap.timeline()
				tl.from(controllerRef.value, {
					marginRight: '-40rem',
					duration: 0.4,
					ease: "power2.out"
				}).fromTo(lyricsSection.value,
					{ opacity: 0, x: 50, scale: 0.95 },
					{ opacity: 1, x: 0, scale: 1, duration: 0.5, ease: "power2.out" },
					"-=0.2"
				)
			})
		}
	}
}

// New: Watch for track changes and animate
watch(() => playQueueStore.currentIndex, () => {
	if (albumCover.value) {
		gsap.to(albumCover.value, {
			scale: 0.95, opacity: 0.7, duration: 0.2,
			ease: "power2.inOut", yoyo: true, repeat: 1
		})
	}

	if (songInfo.value) {
		gsap.fromTo(songInfo.value,
			{ opacity: 0, y: 10 },
			{ opacity: 1, y: 0, duration: 0.4, ease: "power2.out", delay: 0.3 }
		)
	}
})
</script>

<template>
	<div v-if="getCurrentTrack() !== null">
		<!-- Background remains unchanged -->
		<div class="z-0 absolute top-0 left-0 w-screen h-screen overflow-hidden"
			v-if="getCurrentTrack()?.album?.coverDeUrl">
			<img class="w-full h-full blur-2xl object-cover scale-110" :src="getCurrentTrack()?.album?.coverDeUrl" />
			<div class="w-full h-full absolute top-0 left-0 bg-neutral-900/5" />
		</div>

		<!-- Main content area - new centered flex layout -->
		<div class="absolute top-0 left-0 flex justify-center h-screen w-screen overflow-y-auto z-10 select-none">
			<div class="flex items-center justify-center gap-16 h-fit my-auto" ref="mainContainer">

				<!-- Controller area -->
				<div class="flex flex-col w-96 gap-4" ref="controllerRef">
					<!-- Album cover with enhanced hover effect -->
					<div ref="albumCover" class="relative">
						<img :src="getCurrentTrack()?.album?.coverUrl" class="rounded-2xl shadow-2xl border border-white/20 w-96 h-96
							transition-transform duration-300
							" :class="playQueueStore.isPlaying ? 'scale-100' : 'scale-85'" />
					</div>

					<!-- Song info with enhanced styling -->
					<div class="flex justify-between items-center gap-2" ref="songInfo">
						<div class="relative flex-auto w-0">
							<!-- ...existing song info code... -->
							<div class="">
								<div class="text-black/90 blur-lg text-lg font-medium truncate w-80">
									{{ getCurrentTrack()?.song.name }}
								</div>
								<div class="text-black/90 blur-lg text-base truncate w-80">
									{{ getCurrentTrack()?.song.artists ?? [] }} —
									{{ getCurrentTrack()?.album?.name ?? '未知专辑' }}
								</div>
							</div>

							<div class="absolute top-0">
								<div class="text-white text-lg font-medium truncate w-80">
									{{ getCurrentTrack()?.song.name }}
								</div>
								<div class="text-white/75 text-base truncate w-80">
									{{ artistsOrganize(getCurrentTrack()?.song.artists ?? []) }} —
									{{ getCurrentTrack()?.album?.name ?? '未知专辑' }}
								</div>
							</div>
						</div>

						<button
							class="h-10 w-10 flex justify-center items-center rounded-full backdrop-blur-3xl transition-all duration-200 hover:scale-110"
							ref="favoriteButton"
							@click="() => { const track = getCurrentTrack(); if (track !== null) favourites.toggleFavourite(track) }"
							:class="getCurrentTrack() && favourites.isFavourite(getCurrentTrack()!.song.cid) ? 'bg-neutral-200/90' : 'bg-black/10 hover:bg-black/20'">
							<span
								:class="getCurrentTrack() !== null && favourites.isFavourite(getCurrentTrack()!.song.cid) ? 'text-neutral-700' : 'text-white'">
								<StarFilledIcon v-if="getCurrentTrack() && favourites.isFavourite(getCurrentTrack()!.song.cid)"
									:size="6" />
								<StarEmptyIcon v-else :size="6" />
							</span>
						</button>
					</div>

					<!-- Progress section -->
					<div class="flex flex-col gap-1" ref="progressSection">
						<!-- ...existing progress bar code... -->
						<div
							class="w-full p-[0.125rem] bg-white/20 shadow-[0_.125rem_1rem_0_#00000010] rounded-full backdrop-blur-3xl">
							<div class="w-full" ref="progressBarContainer">
								<div class="w-2 h-2 bg-white rounded-full shadow-md" ref="progressBarThumb" />
							</div>
						</div>

						<div class="w-full flex justify-between">
							<!-- ...existing time display code... -->
							<div class="font-medium flex-1 text-left text-xs relative">
								<span
									class="text-black blur-lg absolute top-0 text-xs">{{ timeFormatter(Math.floor(playQueueStore.currentTime)) }}</span>
								<span
									class="text-white/90 absolute top-0">{{ timeFormatter(Math.floor(playQueueStore.currentTime)) }}</span>
							</div>
							<div class="text-xs text-center relative flex-1">
								<span class="text-black blur-lg absolute top-0">{{ formatDetector() }}</span>
								<span class="text-white">{{ formatDetector() }}</span>
							</div>
							<div class="flex flex-1">
								<div class="flex-1" />
								<button
									class="text-white/90 text-xs font-medium text-right relative transition-colors duration-200 hover:text-white"
									@click="preferences.displayTimeLeft = !preferences.displayTimeLeft">
									<span
										class="text-black blur-lg absolute top-0">{{ `${preferences.displayTimeLeft ? '-' : ''}${timeFormatter(preferences.displayTimeLeft ? Math.floor(playQueueStore.duration) - Math.floor(playQueueStore.currentTime) : playQueueStore.duration)}` }}</span>
									<span>{{ `${preferences.displayTimeLeft ? '-' : ''}${timeFormatter(preferences.displayTimeLeft ? Math.floor(playQueueStore.duration) - Math.floor(playQueueStore.currentTime) : playQueueStore.duration)}` }}</span>
								</button>
							</div>
						</div>
					</div>

					<!-- Control buttons -->
					<div class="w-full flex justify-between items-center" ref="controlButtons">
						<div class="flex-1 text-left flex gap-1">
							<button class="h-8 w-8 flex justify-center items-center rounded-full hover:bg-white/25 relative"
								ref="volumeButton" @click="toggleVolumeControl">
								<div class="w-6 h-6 relative">
									<span class="text-black blur-md absolute top-0 left-0 transition-all duration-200 hover:scale-110">
										<SpeakerIcon :size="6" />
									</span>
									<span class="text-white absolute top-0 left-0 transition-all duration-200 hover:scale-110">
										<SpeakerIcon :size="6" />
									</span>
								</div>

								<transition name="volume-control-fade">
									<div v-if="presentVolumeControl" @click.stop
										class="absolute bg-black/60 backdrop-blur-3xl rounded-md shadow-2xl border border-[#ffffff39] w-64 h-10 bottom-10 left-[-0.3rem] flex items-center justify-between px-4 z-50">
										<div class="w-full py-[0.125rem] px-[0.25rem] bg-white/20 rounded-full" ref="volumeSliderContainer">
											<div class="w-2 h-2 bg-white rounded-full shadow-md cursor-pointer" ref="volumeSliderThumb" />
										</div>
										<!-- <span class="text-white text-xs w-8 text-right flex-shrink-0">{{ Math.round(volume * 100) }}%</span> -->
									</div>
								</transition>
							</button>
							<button
								class="text-white h-8 w-8 flex justify-center items-center rounded-full hover:bg-white/25 transition-all duration-200 hover:scale-110"
								@click="makePlayQueueListPresent" ref="queueButton">
								<div class="w-6 h-6 relative">
									<span class="text-black blur-md absolute top-0 left-0">
										<MusicListIcon :size="6" />
									</span>
									<span class="text-white absolute top-0 left-0">
										<MusicListIcon :size="6" />
									</span>
								</div>
							</button>
						</div>

						<div class="flex-2 text-center align-center justify-center gap-2 flex">
							<button
								class="text-white flex-1 h-10 flex justify-center items-center rounded-lg hover:bg-white/25 transition-all duration-200 hover:scale-105"
								@click="playPrevious" ref="prevButton">
								<div class="w-8 h-8 relative">
									<span class="text-black/80 blur-lg absolute top-0 left-0">
										<RewindIcon :size="8" />
									</span>
									<span class="text-white absolute top-0 left-0">
										<RewindIcon :size="8" />
									</span>
								</div>
							</button>

							<button
								class="text-white flex-1 h-10 flex justify-center items-center rounded-lg hover:bg-white/25 transition-all duration-200"
								@click="handlePlayPause" ref="playButton">
								<!-- ...existing play/pause icon code... -->
								<div v-if="playQueueStore.isPlaying">
									<div v-if="playQueueStore.isBuffering" class="w-6 h-6 relative">
										<span class="text-black/80 blur-lg absolute top-0 left-0">
											<LoadingIndicator :size="6" />
										</span>
										<span class="text-white absolute top-0 left-0">
											<LoadingIndicator :size="6" />
										</span>
									</div>
									<div v-else class="w-8 h-8 relative">
										<span class="text-black blur-md absolute top-0 left-0">
											<PauseIcon :size="8" />
										</span>
										<span class="text-white absolute top-0 left-0">
											<PauseIcon :size="8" />
										</span>
									</div>
								</div>
								<div v-else>
									<div class="w-8 h-8 relative">
										<span class="text-black/80 blur-lg absolute top-0 left-0">
											<PlayIcon :size="8" />
										</span>
										<span class="text-white absolute top-0 left-0">
											<PlayIcon :size="8" />
										</span>
									</div>
								</div>
							</button>

							<button
								class="text-white flex-1 h-10 flex justify-center items-center rounded-lg hover:bg-white/25 transition-all duration-200 hover:scale-105"
								@click="playNext" ref="nextButton">
								<div class="w-8 h-8 relative">
									<span class="text-black/80 blur-lg absolute top-0 left-0">
										<ForwardIcon :size="8" />
									</span>
									<span class="text-white absolute top-0 left-0">
										<ForwardIcon :size="8" />
									</span>
								</div>
							</button>
						</div>

						<div class="flex-1 text-right flex gap-1">
							<div class="flex-1" />
							<!-- Lyrics button with tooltip only on hover -->
							<div @mouseenter="showLyricsTooltip = true" @mouseleave="showLyricsTooltip = false" class="relative">
								<button
									class="text-white h-8 w-8 flex justify-center items-center rounded-full hover:bg-white/25 transition-all duration-200 hover:scale-110"
									ref="lyricsButton" @click="preferences.presentLyrics = !preferences.presentLyrics">
									<div class="w-6 h-6 relative">
										<span class="text-white absolute top-0 left-0 z-10">
											<ChatBubbleQuoteFullIcon :size="6" v-if="preferences.presentLyrics" />
											<ChatBubbleQuoteIcon :size="6" v-else />
										</span>
										<span class="text-black/40 blur-md absolute top-0 left-0 z-0">
											<ChatBubbleQuoteFullIcon :size="6" v-if="preferences.presentLyrics" />
											<ChatBubbleQuoteIcon :size="6" v-else />
										</span>
									</div>
								</button>
								<!-- Show tooltip only on hover, with transition -->
								<transition name="lyrics-tooltip-fade">
									<div v-if="showLyricsTooltip && !getCurrentTrack()?.song.lyricUrl"
										class="absolute bottom-10 w-60 left-[-7rem] bg-black/60 backdrop-blur-3xl rounded-md p-2 text-xs flex flex-col text-left shadow-2xl border border-[#ffffff39]">
										<div class="font-semibold text-white">这首曲目不提供歌词文本</div>
										<div class="text-white/60">启用歌词时，将会在下一首有歌词的曲目中显示歌词文本。</div>
									</div>
								</transition>
							</div>
							<button
								class="text-white h-8 w-8 flex justify-center items-center rounded-full hover:bg-white/25 transition-all"
								@click="toggleMoreOptions">
								<div class="w-6 h-6 relative">
									<span class="text-black blur-sm absolute top-0 left-0 hover:scale-110 transition-all">
										<EllipsisHorizontalIcon :size="6" />
									</span>
									<span class="text-white absolute top-0 left-0 hover:scale-110 transition-all">
										<EllipsisHorizontalIcon :size="6" />
									</span>

									<dialog :open="showMoreOptions" @click.self="toggleMoreOptions" ref="moreOptionsDialog"
										class="bottom-8 left-[-13.3rem] w-60 rounded-md overflow-hidden bg-black/60 backdrop-blur-3xl shadow-2xl border border-[#ffffff39]">
										<ul class="my-2 flex flex-col gap-1">
											<li>
												<button
													class="flex px-2 py-1 hover:bg-white/10 w-full text-left disabled:opacity-70 cursor-not-allowed transition-colors duration-150"
													disabled>
													<MuscialNoteSparklingIcon :size="4" class="text-white mr-2" />
													<div class="flex-col">
														<div class="text-white text-sm">音频质量</div>
														<div class="text-white/60 text-xs">改不了，海猫没给这个选项！</div>
													</div>
												</button>
											</li>

											<li>
												<button
													class="flex px-2 py-1 hover:bg-white/10 w-full text-left disabled:opacity-70 cursor-not-allowed transition-colors duration-150"
													disabled>
													<CastEmptyIcon :size="4" class="text-white mr-2" />
													<div class="flex-col">
														<div class="text-white text-sm">Chromecast 投放</div>
														<div class="text-white/60 text-xs">下个版本！</div>
													</div>
												</button>
											</li>
										</ul>
									</dialog>
								</div>
							</button>
						</div>
					</div>
				</div>

				<!-- Lyrics section - full screen height -->
				<div class="w-[40rem] h-screen" ref="lyricsSection" v-if="presentLyrics">
					<ScrollingLyrics :lrcSrc="getCurrentTrack()?.song.lyricUrl ?? undefined" class="h-full"
						ref="scrollingLyrics" />
				</div>
			</div>
		</div>

		<!-- Queue list dialog with enhanced animations -->
		<dialog :open="presentQueueListDialog" class="z-20 w-screen h-screen" @click="makePlayQueueListDismiss"
			ref="playQueueDialogContainer" style="background-color: transparent;">
			<div
				class="w-96 h-screen bg-neutral-900/80 shadow-[0_0_16px_0_rgba(0,0,0,0.5)] backdrop-blur-2xl pt-8 flex flex-col transform -translate-x-96"
				@click.stop ref="playQueueDialog">
				<div class="flex justify-between mx-8 mb-4">
					<div class="text-white font-medium text-2xl">播放队列</div>
					<button
						class="text-white w-9 h-9 bg-neutral-800/80 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex justify-center items-center transition-all duration-200 hover:bg-neutral-700/80 hover:scale-110"
						@click="makePlayQueueListDismiss">
						<XIcon :size="4" />
					</button>
				</div>

				<div class="flex gap-2 mx-8 mb-4">
					<button
						class="flex-1 h-9 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex justify-center items-center transition-all duration-200 hover:scale-105"
						:class="playQueueStore.playMode.shuffle ? 'bg-[#ffffffaa] text-neutral-700' : 'text-white bg-neutral-800/80'"
						@click="toggleShuffle">
						<ShuffleIcon :size="4" />
					</button>
					<button
						class="flex-1 h-9 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex justify-center items-center transition-all duration-200 hover:scale-105"
						:class="playQueueStore.playMode.repeat === 'off' ? 'text-white bg-neutral-800/80' : 'bg-[#ffffffaa] text-neutral-700'"
						@click="toggleRepeat">
						<CycleTwoArrowsIcon :size="4" v-if="playQueueStore.playMode.repeat !== 'single'" />
						<CycleTwoArrowsWithNumOneIcon :size="4" v-else />
					</button>
				</div>

				<hr class="border-[#ffffff39]" />

				<div class="flex-auto h-0 overflow-y-auto px-4 flex flex-col gap-2" v-if="playQueueStore.playMode.shuffle">
					<PlayQueueItem v-for="(oriIndex, shuffledIndex) in playQueueStore.shuffleList"
						:queueItem="playQueueStore.list[oriIndex]" :isCurrent="playQueueStore.currentIndex === shuffledIndex"
						:key="playQueueStore.list[oriIndex].song.cid" :index="shuffledIndex" />
				</div>
				<div class="flex-auto h-0 overflow-y-auto px-4 flex flex-col gap-2" v-else>
					<PlayQueueItem :queueItem="track" :isCurrent="playQueueStore.currentIndex === index"
						v-for="(track, index) in playQueueStore.list" :index="index" :key="track.song.cid" />
				</div>
			</div>
		</dialog>
	</div>
	<div v-else class="flex items-center justify-center h-screen w-screen flex-col gap-4 text-center select-none">
		<div class="text-white text-2xl">现在没有播放任何东西喔</div>
		<div class="text-white text-lg">要来一块苹果派吗？</div>
		<RouterLink to="/">
			<button class="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200 text-lg">
				返回首页
			</button>
		</RouterLink>
	</div>
</template>

<style scoped>
/* ...existing styles... */
.lyrics-tooltip-fade-enter-active,
.lyrics-tooltip-fade-leave-active {
	transition: opacity 0.18s cubic-bezier(.4, 0, .2, 1), transform 0.18s cubic-bezier(.4, 0, .2, 1);
}

.lyrics-tooltip-fade-enter-from,
.lyrics-tooltip-fade-leave-to {
	opacity: 0;
	transform: translateY(10px) scale(0.98);
}

.lyrics-tooltip-fade-enter-to,
.lyrics-tooltip-fade-leave-from {
	opacity: 1;
	transform: translateY(0) scale(1);
}

.volume-control-fade-enter-active,
.volume-control-fade-leave-active {
	transition: opacity 0.2s cubic-bezier(.4, 0, .2, 1), transform 0.2s cubic-bezier(.4, 0, .2, 1);
}

.volume-control-fade-enter-from,
.volume-control-fade-leave-to {
	opacity: 0;
	transform: translateY(10px) scale(0.95);
}

.volume-control-fade-enter-to,
.volume-control-fade-leave-from {
	opacity: 1;
	transform: translateY(0) scale(1);
}
</style>