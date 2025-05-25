<script setup lang="ts">
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { artistsOrganize } from '../utils'
import gsap from 'gsap'
import { Draggable } from "gsap/Draggable"
import { onMounted } from 'vue'
import { useTemplateRef } from 'vue'
import { ref, watch } from 'vue'

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
import ListArrowIcon from '../assets/icons/listarrow.vue'

const playQueueStore = usePlayQueueStore()
gsap.registerPlugin(Draggable)

const progressBarThumb = useTemplateRef('progressBarThumb')
const progressBarContainer = useTemplateRef('progressBarContainer')
const playQueueDialogContainer = useTemplateRef('playQueueDialogContainer')
const playQueueDialog = useTemplateRef('playQueueDialog')

const displayTimeLeft = ref(false)
const presentQueueListDialog = ref(false)

onMounted(() => {
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

function makePlayQueueListPresent() {
	presentQueueListDialog.value = true
	const tl = gsap.timeline()
	tl.from(playQueueDialog.value, {
		marginLeft: '-24rem',
		duration: 0.2,
		ease: 'power2.out'
	}).from(playQueueDialogContainer.value, {
		backgroundColor: 'transparent',
		duration: 0.2,
		ease: 'power2.out'
	}, '<')
}

function makePlayQueueListDismiss() {
	const tl = gsap.timeline({
		onComplete: () => {
			presentQueueListDialog.value = false
		}
	})
	tl.to(playQueueDialog.value, {
		marginLeft: '-24rem',
		duration: 0.2,
		ease: 'power2.out'
	}).to(playQueueDialogContainer.value, {
		backgroundColor: 'transparent',
		duration: 0.2,
		ease: 'power2.out'
	}).set(playQueueDialogContainer.value, {
		backgroundColor: '#17171780',
		ease: 'power2.out'
	}).set(playQueueDialog.value, {
		marginLeft: '0rem',
		ease: 'power2.out'
	})
}
</script>

<template>
	<div class="z-0 absolute top-0 left-0 w-screen h-screen"
		v-if="playQueueStore.list[playQueueStore.currentIndex].album?.coverDeUrl">
		<img class="w-full h-full blur-2xl object-cover"
			:src="playQueueStore.list[playQueueStore.currentIndex].album?.coverDeUrl" />
		<div class="bg-gray-600/50 w-full h-full absolute top-0 left-0" />
	</div>

	<div class="w-full flex justify-center items-center my-auto gap-16 z-10 select-none">
		<div class="flex flex-col text-center w-96 gap-4">
			<img :src="playQueueStore.list[playQueueStore.currentIndex].album?.coverUrl"
				class="rounded-2xl shadow-2xl border border-white/20 w-96 h-96" />
			<div>
				<div class="text-white text-lg font-medium">{{ playQueueStore.list[playQueueStore.currentIndex].song.name }}
				</div>
				<div class="text-white/75 text-base">
					{{ artistsOrganize(playQueueStore.list[playQueueStore.currentIndex].song.artists ?? []) }} —
					{{ playQueueStore.list[playQueueStore.currentIndex].album?.name ?? '未知专辑' }}
				</div>
			</div>

			<div class="flex flex-col gap-1">
				<div class="w-full p-[0.125rem] bg-white/20 rounded-full backdrop-blur-3xl">
					<div class="w-full" ref="progressBarContainer">
						<div class="w-2 h-2 bg-white rounded-full shadow-md" ref="progressBarThumb" />
					</div>
				</div>

				<div class="w-full flex justify-between">
					<div class="text-white/75 font-light flex-1 text-left">
						{{ timeFormatter(Math.floor(playQueueStore.currentTime)) }}
					</div>
					<div class="text-white text-xs text-center">{{ formatDetector() }}</div>
					<button class="text-white/75 font-light flex-1 text-right"
						@click="displayTimeLeft = !displayTimeLeft">{{ `${displayTimeLeft ? '-' : ''}${timeFormatter(displayTimeLeft ? Math.floor(playQueueStore.duration) - Math.floor(playQueueStore.currentTime) : playQueueStore.duration)}` }}</button>
				</div>

				
			</div>

			<div class="w-full flex justify-between items-center">
				<div class="flex-1 text-left flex gap-1">
					<button class="text-white h-6 w-6 flex justify-center items-center rounded-full hover:bg-white/25">
						<StarEmptyIcon :size="4" />
					</button>
					<button class="text-white h-6 w-6 flex justify-center items-center rounded-full hover:bg-white/25" @click="makePlayQueueListPresent">
						<MusicListIcon :size="4" />
					</button>
				</div>

				<div class="flex-2 text-center align-center justify-center gap-2 flex">

					<button class="text-white flex-1 h-8 flex justify-center items-center rounded-lg hover:bg-white/25"
						@click="playPrevious">
						<RewindIcon :size="6" />
					</button>

					<button class="text-white flex-1 h-8 flex justify-center items-center rounded-lg hover:bg-white/25"
						@click="playQueueStore.isPlaying = !playQueueStore.isPlaying">
						<div v-if="playQueueStore.isPlaying">
							<LoadingIndicator v-if="playQueueStore.isBuffering" :size="6" />
							<PauseIcon v-else :size="6" />
						</div>
						<PlayIcon v-else :size="6" />
					</button>

					<button class="text-white flex-1 h-8 flex justify-center items-center rounded-lg hover:bg-white/25"
						@click="playNext">
						<ForwardIcon :size="6" />
					</button>
				</div>

				<div class="flex-1 text-right flex">
					<div class="flex-1" />
					<button class="text-white h-6 w-6 flex justify-center items-center rounded-full hover:bg-white/25">
						<ChatBubbleQuoteIcon :size="4" />
					</button>
					<button class="text-white h-6 w-6 flex justify-center items-center rounded-full hover:bg-white/25">
						<EllipsisHorizontalIcon :size="4" />
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Queue list -->
	<dialog :open="presentQueueListDialog" class="z-20 w-screen h-screen" @click="makePlayQueueListDismiss" ref="playQueueDialogContainer" style="background-color: #17171780;">
		<div class="w-96 h-screen bg-neutral-900/80 shadow-[0_0_16px_0_rgba(0,0,0,0.5)] backdrop-blur-2xl pt-8 flex flex-col" @click.stop ref="playQueueDialog">
			<div class="flex justify-between mx-8 mb-4">
				<div class="text-white font-medium text-2xl">播放队列</div>
				<button class="text-white w-9 h-9 bg-neutral-800/80 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex justify-center items-center" @click="makePlayQueueListDismiss">
					<XIcon :size="4" />
				</button>
			</div>

			<div class="flex gap-2 mx-8 mb-4">
				<button class="text-white flex-1 h-9 bg-neutral-800/80 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex justify-center items-center" @click="makePlayQueueListDismiss">
					<ShuffleIcon :size="4" />
				</button>
				<button class="text-white flex-1 h-9 bg-neutral-800/80 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex justify-center items-center" @click="makePlayQueueListDismiss">
					<ListArrowIcon :size="4" />
				</button>
			</div>

			<hr class="border-[#ffffff39]" />

			<div class="flex-auto h-0 overflow-y-auto px-4 flex flex-col gap-2">
				<button v-for="(track, index) in playQueueStore.list" class="p-4 w-full rounded-md hover:bg-white/5 first:mt-2" :key="track.song.cid">
					<div class="flex gap-2">
						<div class="relative w-12 h-12 rounded-md shadow-xl overflow-hidden">
							<img :src="track.album?.coverUrl" />
							<div class="w-full h-full absolute top-0 left-0 bg-neutral-900/75 flex justify-center items-center" v-if="index === playQueueStore.currentIndex">
								<div style="height: 1rem;" class="flex justify-center items-center gap-[.125rem]">
									<div class="bg-white w-[.125rem] rounded-full" v-for="(bar, index) in playQueueStore.visualizer" :key="index" :style="{
										height: `${Math.max(10, bar)}%`
									}" />
								</div>
							</div>
						</div>
						<div class="flex flex-col text-left flex-auto w-0">
							<div class="text-white text-base font-medium truncate">{{ track.song.name }}</div>
							<div class="text-white/75 text-sm truncate">{{ artistsOrganize(track.song.artists?? []) }} — {{ track.album?.name?? '未知专辑' }}</div>
						</div>
					</div>
				</button>
			</div>
		</div>
	</dialog>
</template>