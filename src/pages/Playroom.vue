<script setup lang="ts">
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { artistsOrganize } from '../utils'
import gsap from 'gsap'
import { Draggable } from "gsap/Draggable"
import { onMounted, onUnmounted, nextTick } from 'vue'
import { useTemplateRef } from 'vue'
import { ref, watch } from 'vue'
import { usePreferences } from '../stores/usePreferences'

import ScrollingLyrics from '../components/ScrollingLyrics.vue'

import RewindIcon from '../assets/icons/rewind.vue'
import ForwardIcon from '../assets/icons/forward.vue'
import PlayIcon from '../assets/icons/play.vue'
import PauseIcon from '../assets/icons/pause.vue'
import LoadingIndicator from '../assets/icons/loadingindicator.vue'
import ChatBubbleQuoteIcon from '../assets/icons/chatbubblequote.vue'
import StarEmptyIcon from '../assets/icons/starempty.vue'
import MusicListIcon from '../assets/icons/musiclist.vue'
import EllipsisHorizontalIcon from '../assets/icons/ellipsishorizontal.vue'
import XIcon from '../assets/icons/x.vue'
import ShuffleIcon from '../assets/icons/shuffle.vue'
import CycleTwoArrowsIcon from '../assets/icons/cycletwoarrows.vue'
import CycleTwoArrowsWithNumOneIcon from '../assets/icons/cycletwoarrowswithnumone.vue'
import SpeakerIcon from '../assets/icons/speaker.vue'

const playQueueStore = usePlayQueueStore()
const preferences = usePreferences()
gsap.registerPlugin(Draggable)

const progressBarThumb = useTemplateRef('progressBarThumb')
const progressBarContainer = useTemplateRef('progressBarContainer')
const playQueueDialogContainer = useTemplateRef('playQueueDialogContainer')
const playQueueDialog = useTemplateRef('playQueueDialog')
const controllerRef = useTemplateRef('controllerRef')
const lyricsSection = useTemplateRef('lyricsSection')
const albumCover = useTemplateRef('albumCover')
const songInfo = useTemplateRef('songInfo')

const playButton = useTemplateRef('playButton')

const presentQueueListDialog = ref(false)

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
	thumbUpdate()
	
	setupEntranceAnimations()
})

function timeFormatter(time: number) {
	const timeInSeconds = Math.floor(time)
	if (timeInSeconds < 0) { return '-:--' }
	const minutes = Math.floor(timeInSeconds / 60)
	const seconds = Math.floor(timeInSeconds % 60)
	if (isNaN(minutes) || isNaN(seconds)) { return '-:--' }
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
	
	nextTick(() => {
		const shuffleBtn = playQueueDialog.value?.querySelector('.flex-1:first-child') as HTMLElement
		if (shuffleBtn) {
			gsap.to(shuffleBtn, {
				scale: 0.95, duration: 0.1, yoyo: true, repeat: 1, ease: "power2.inOut"
			})
		}
	})
}

function toggleRepeat() {
	nextTick(() => {
		const repeatBtn = playQueueDialog.value?.querySelector('.flex-1:last-child') as HTMLElement
		if (repeatBtn) {
			gsap.to(repeatBtn, {
				rotateZ: 360, scale: 0.95, duration: 0.3, ease: "back.out(1.7)"
			})
		}
	})
	
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
	if (playQueueStore.playMode.shuffle) {
		return playQueueStore.list[playQueueStore.shuffleList[playQueueStore.currentIndex]]
	} else {
		return playQueueStore.list[playQueueStore.currentIndex]
	}
}

onUnmounted(() => {
})

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
	<!-- Background remains unchanged -->
	<div class="z-0 absolute top-0 left-0 w-screen h-screen" v-if="getCurrentTrack().album?.coverDeUrl">
		<img class="w-full h-full blur-2xl object-cover" :src="getCurrentTrack().album?.coverDeUrl" />
		<div class="bg-transparent w-full h-full absolute top-0 left-0" />
	</div>

	<!-- Main content area - new centered flex layout -->
	<div class="absolute top-0 left-0 flex justify-center h-screen w-screen overflow-y-auto z-10 select-none">
		<div class="flex items-center justify-center gap-16 h-fit my-auto" ref="mainContainer">
			
			<!-- Controller area -->
			<div class="flex flex-col w-96 gap-4" ref="controllerRef">
				<!-- Album cover with enhanced hover effect -->
				<div ref="albumCover" class="relative">
					<img :src="getCurrentTrack().album?.coverUrl" 
						class="rounded-2xl shadow-2xl border border-white/20 w-96 h-96 transition-transform duration-300 hover:scale-105" />
				</div>
				
				<!-- Song info with enhanced styling -->
				<div class="flex justify-between items-center gap-2" ref="songInfo">
					<div class="relative flex-auto w-0">
						<!-- ...existing song info code... -->
						<div class="">
							<div class="text-black/90 blur-lg text-lg font-medium truncate w-80">
								{{ getCurrentTrack().song.name }}
							</div>
							<div class="text-black/90 blur-lg text-base truncate w-80">
								{{ getCurrentTrack().song.artists ?? [] }} —
								{{ getCurrentTrack().album?.name ?? '未知专辑' }}
							</div>
						</div>

						<div class="absolute top-0">
							<div class="text-white text-lg font-medium truncate w-80">
								{{ getCurrentTrack().song.name }}
							</div>
							<div class="text-white/75 text-base truncate w-80">
								{{ artistsOrganize(getCurrentTrack().song.artists ?? []) }} —
								{{ getCurrentTrack().album?.name ?? '未知专辑' }}
							</div>
						</div>
					</div>

					<button class="h-10 w-10 flex justify-center items-center rounded-full bg-black/10 backdrop-blur-3xl transition-all duration-200 hover:bg-black/20 hover:scale-110" 
						ref="favoriteButton">
						<span class="text-white">
							<StarEmptyIcon :size="6" />
						</span>
					</button>
				</div>

				<!-- Progress section -->
				<div class="flex flex-col gap-1" ref="progressSection">
					<!-- ...existing progress bar code... -->
					<div class="w-full p-[0.125rem] bg-white/20 shadow-[0_.125rem_1rem_0_#00000010] rounded-full backdrop-blur-3xl">
						<div class="w-full" ref="progressBarContainer">
							<div class="w-2 h-2 bg-white rounded-full shadow-md" ref="progressBarThumb" />
						</div>
					</div>

					<div class="w-full flex justify-between">
						<!-- ...existing time display code... -->
						<div class="font-medium flex-1 text-left relative">
							<span class="text-black blur-lg absolute top-0">{{ timeFormatter(Math.floor(playQueueStore.currentTime)) }}</span>
							<span class="text-white/90">{{ timeFormatter(Math.floor(playQueueStore.currentTime)) }}</span>
						</div>
						<div class="text-xs text-center relative">
							<span class="text-black blur-lg absolute top-0">{{ formatDetector() }}</span>
							<span class="text-white">{{ formatDetector() }}</span>
						</div>
						<div class="flex flex-1">
							<div class="flex-1" />
							<button class="text-white/90 font-medium text-right relative transition-colors duration-200 hover:text-white" 
								@click="preferences.displayTimeLeft = !preferences.displayTimeLeft">
								<span class="text-black blur-lg absolute top-0">{{ `${preferences.displayTimeLeft ? '-' : ''}${timeFormatter(preferences.displayTimeLeft ? Math.floor(playQueueStore.duration) - Math.floor(playQueueStore.currentTime) : playQueueStore.duration)}` }}</span>
								<span>{{ `${preferences.displayTimeLeft ? '-' : ''}${timeFormatter(preferences.displayTimeLeft ? Math.floor(playQueueStore.duration) - Math.floor(playQueueStore.currentTime) : playQueueStore.duration)}` }}</span>
							</button>
						</div>
					</div>
				</div>

				<!-- Control buttons -->
				<div class="w-full flex justify-between items-center" ref="controlButtons">
					<div class="flex-1 text-left flex gap-1">
						<button class="h-8 w-8 flex justify-center items-center rounded-full hover:bg-white/25 transition-all duration-200 hover:scale-110" 
							ref="volumeButton">
							<div class="w-6 h-6 relative">
								<span class="text-black blur-md absolute top-0 left-0">
									<SpeakerIcon :size="6" />
								</span>
								<span class="text-white">
									<SpeakerIcon :size="6" />
								</span>
							</div>
						</button>
						<button class="text-white h-8 w-8 flex justify-center items-center rounded-full hover:bg-white/25 transition-all duration-200 hover:scale-110"
							@click="makePlayQueueListPresent" ref="queueButton">
							<div class="w-6 h-6 relative">
								<span class="text-black blur-md absolute top-0 left-0">
									<MusicListIcon :size="6" />
								</span>
								<span class="text-white">
									<MusicListIcon :size="6" />
								</span>
							</div>
						</button>
					</div>

					<div class="flex-2 text-center align-center justify-center gap-2 flex">
						<button class="text-white flex-1 h-10 flex justify-center items-center rounded-lg hover:bg-white/25 transition-all duration-200 hover:scale-105"
							@click="playPrevious" ref="prevButton">
							<div class="w-8 h-8 relative">
								<span class="text-black/80 blur-lg absolute top-0 left-0">
									<RewindIcon :size="8" />
								</span>
								<span class="text-white">
									<RewindIcon :size="8" />
								</span>
							</div>
						</button>

						<button class="text-white flex-1 h-10 flex justify-center items-center rounded-lg hover:bg-white/25 transition-all duration-200"
							@click="handlePlayPause" ref="playButton">
							<!-- ...existing play/pause icon code... -->
							<div v-if="playQueueStore.isPlaying">
								<div v-if="playQueueStore.isBuffering" class="w-6 h-6 relative">
									<span class="text-black/80 blur-lg absolute top-0 left-0">
										<LoadingIndicator :size="6" />
									</span>
									<span class="text-white">
										<LoadingIndicator :size="6" />
									</span>
								</div>
								<div v-else class="w-8 h-8 relative">
									<span class="text-black blur-md absolute top-0 left-0">
										<PauseIcon :size="8" />
									</span>
									<span class="text-white">
										<PauseIcon :size="8" />
									</span>
								</div>
							</div>
							<div v-else>
								<div class="w-8 h-8 relative">
									<span class="text-black/80 blur-lg absolute top-0 left-0">
										<PlayIcon :size="8" />
									</span>
									<span class="text-white">
										<PlayIcon :size="8" />
									</span>
								</div>
							</div>
						</button>

						<button class="text-white flex-1 h-10 flex justify-center items-center rounded-lg hover:bg-white/25 transition-all duration-200 hover:scale-105"
							@click="playNext" ref="nextButton">
							<div class="w-8 h-8 relative">
								<span class="text-black/80 blur-lg absolute top-0 left-0">
									<ForwardIcon :size="8" />
								</span>
								<span class="text-white">
									<ForwardIcon :size="8" />
								</span>
							</div>
						</button>
					</div>

					<div class="flex-1 text-right flex gap-1">
						<div class="flex-1" />
						<button class="text-white h-8 w-8 flex justify-center items-center rounded-full hover:bg-white/25 transition-all duration-200 hover:scale-110" 
							ref="lyricsButton">
							<div class="w-6 h-6 relative">
								<span class="text-black blur-md absolute top-0 left-0">
									<ChatBubbleQuoteIcon :size="6" />
								</span>
								<span class="text-white">
									<ChatBubbleQuoteIcon :size="6" />
								</span>
							</div>
						</button>
						<button class="text-white h-8 w-8 flex justify-center items-center rounded-full hover:bg-white/25 transition-all duration-200 hover:scale-110" 
							ref="moreButton">
							<div class="w-6 h-6 relative">
								<span class="text-black blur-sm absolute top-0 left-0">
									<EllipsisHorizontalIcon :size="6" />
								</span>
								<span class="text-white">
									<EllipsisHorizontalIcon :size="6" />
								</span>
							</div>
						</button>
					</div>
				</div>
			</div>

			<!-- Lyrics section - full screen height -->
			<div class="w-[40rem] h-screen" ref="lyricsSection">
				<ScrollingLyrics :lrcSrc="getCurrentTrack().song.lyricUrl ?? undefined" 
					class="h-full" ref="scrollingLyrics" />
			</div>
		</div>
	</div>

	<!-- Queue list dialog with enhanced animations -->
	<dialog :open="presentQueueListDialog" class="z-20 w-screen h-screen" @click="makePlayQueueListDismiss"
		ref="playQueueDialogContainer" style="background-color: transparent;">
		<div class="w-96 h-screen bg-neutral-900/80 shadow-[0_0_16px_0_rgba(0,0,0,0.5)] backdrop-blur-2xl pt-8 flex flex-col transform -translate-x-96"
			@click.stop ref="playQueueDialog">
			<div class="flex justify-between mx-8 mb-4">
				<div class="text-white font-medium text-2xl">播放队列</div>
				<button class="text-white w-9 h-9 bg-neutral-800/80 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex justify-center items-center transition-all duration-200 hover:bg-neutral-700/80 hover:scale-110"
					@click="makePlayQueueListDismiss">
					<XIcon :size="4" />
				</button>
			</div>

			<div class="flex gap-2 mx-8 mb-4">
				<button class="flex-1 h-9 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex justify-center items-center transition-all duration-200 hover:scale-105"
					:class="playQueueStore.playMode.shuffle ? 'bg-[#ffffffaa] text-neutral-700' : 'text-white bg-neutral-800/80'"
					@click="toggleShuffle">
					<ShuffleIcon :size="4" />
				</button>
				<button class="flex-1 h-9 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex justify-center items-center transition-all duration-200 hover:scale-105"
					:class="playQueueStore.playMode.repeat === 'off' ? 'text-white bg-neutral-800/80' : 'bg-[#ffffffaa] text-neutral-700'"
					@click="toggleRepeat">
					<CycleTwoArrowsIcon :size="4" v-if="playQueueStore.playMode.repeat !== 'single'" />
					<CycleTwoArrowsWithNumOneIcon :size="4" v-else />
				</button>
			</div>

			<hr class="border-[#ffffff39]" />

			<div class="flex-auto h-0 overflow-y-auto px-4 flex flex-col gap-2" v-if="playQueueStore.playMode.shuffle">
				<button v-for="(oriIndex, shuffledIndex) in playQueueStore.shuffleList"
					class="p-4 w-full rounded-md hover:bg-white/5 first:mt-2" :key="oriIndex" @click="() => {
						if (playQueueStore.currentIndex === shuffledIndex) { return }
						playQueueStore.currentIndex = shuffledIndex
						playQueueStore.isPlaying = true
					}">
					<div class="flex gap-2">
						<div class="relative w-12 h-12 rounded-md shadow-xl overflow-hidden">
							<img :src="playQueueStore.list[oriIndex].album?.coverUrl" />
							<div class="w-full h-full absolute top-0 left-0 bg-neutral-900/75 flex justify-center items-center"
								v-if="shuffledIndex === playQueueStore.currentIndex">
								<div style="height: 1rem;" class="flex justify-center items-center gap-[.125rem]">
									<div class="bg-white w-[.125rem] rounded-full" v-for="(bar, index) in playQueueStore.visualizer"
										:key="index" :style="{
											height: `${Math.max(10, bar)}%`
										}" />
								</div>
							</div>
						</div>
						<div class="flex flex-col text-left flex-auto w-0">
							<div class="text-white text-base font-medium truncate">{{ playQueueStore.list[oriIndex].song.name }}</div>
							<div class="text-white/75 text-sm truncate">
								{{ artistsOrganize(playQueueStore.list[oriIndex].song.artists ?? []) }} —
								{{ playQueueStore.list[oriIndex].album?.name ?? '未知专辑' }}
							</div>
						</div>
					</div>
				</button>
			</div>
			<div class="flex-auto h-0 overflow-y-auto px-4 flex flex-col gap-2" v-else>
				<button v-for="(track, index) in playQueueStore.list" class="p-4 w-full rounded-md hover:bg-white/5 first:mt-2"
					:key="track.song.cid" @click="() => {
						if (playQueueStore.currentIndex === index) { return }
						playQueueStore.currentIndex = index
						playQueueStore.isPlaying = true
					}">
					<div class="flex gap-2">
						<div class="relative w-12 h-12 rounded-md shadow-xl overflow-hidden">
							<img :src="track.album?.coverUrl" />
							<div class="w-full h-full absolute top-0 left-0 bg-neutral-900/75 flex justify-center items-center"
								v-if="index === playQueueStore.currentIndex">
								<div style="height: 1rem;" class="flex justify-center items-center gap-[.125rem]">
									<div class="bg-white w-[.125rem] rounded-full" v-for="(bar, index) in playQueueStore.visualizer"
										:key="index" :style="{
											height: `${Math.max(10, bar)}%`
										}" />
								</div>
							</div>
						</div>
						<div class="flex flex-col text-left flex-auto w-0">
							<div class="text-white text-base font-medium truncate">{{ track.song.name }}</div>
							<div class="text-white/75 text-sm truncate">{{ artistsOrganize(track.song.artists ?? []) }} —
								{{ track.album?.name ?? '未知专辑' }}
							</div>
						</div>
					</div>
				</button>
			</div>
		</div>
	</dialog>
</template>