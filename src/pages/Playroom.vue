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

const playQueueStore = usePlayQueueStore()
gsap.registerPlugin(Draggable)

const progressBarThumb = useTemplateRef('progressBarThumb')
const progressBarContainer = useTemplateRef('progressBarContainer')

const displayTimeLeft = ref(false)

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
</script>

<template>
	<div class="z-0 absolute top-0 left-0 w-screen h-screen"
		v-if="playQueueStore.list[playQueueStore.currentIndex].album?.coverDeUrl">
		<img class="w-full h-full blur-2xl object-cover"
			:src="playQueueStore.list[playQueueStore.currentIndex].album?.coverDeUrl" />
		<div class="bg-gray-600/50 w-full h-full absolute top-0 left-0" />
	</div>

	<div class="w-full flex justify-center items-center my-auto gap-12 z-10 select-none">
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

				<div class="w-full flex justify-between items-center">
					<div class="flex-1 text-left"></div>
					<div class="flex-2 text-center align-center justify-center gap-2 flex">

						<button class="text-white flex-1 h-8 flex justify-center items-center rounded-lg hover:bg-white/25"
							@click="playPrevious">
							<div class="w-6 h-6">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M11.0002 17.035C11.0002 17.1383 10.9682 17.239 10.9087 17.3234C10.7494 17.549 10.4375 17.6028 10.2119 17.4435L3.07889 12.4085C3.03228 12.3756 2.99164 12.335 2.95874 12.2883C2.7995 12.0627 2.85329 11.7508 3.07889 11.5915L10.2119 6.55648C10.2962 6.49693 10.3969 6.46497 10.5002 6.46497C10.7763 6.46497 11.0002 6.68882 11.0002 6.96497V17.035ZM12.0789 12.4085C12.0323 12.3756 11.9916 12.335 11.9587 12.2883C11.7995 12.0627 11.8533 11.7508 12.0789 11.5915L19.2119 6.55648C19.2962 6.49693 19.3969 6.46497 19.5002 6.46497C19.7763 6.46497 20.0002 6.68882 20.0002 6.96497V17.035C20.0002 17.1383 19.9682 17.239 19.9087 17.3234C19.7494 17.549 19.4375 17.6028 19.2119 17.4435L12.0789 12.4085Z">
									</path>
								</svg>
							</div>
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
							<div class="w-6 h-6">
								<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M4.78834 17.4434C4.70398 17.503 4.60326 17.535 4.5 17.535C4.22386 17.535 4 17.3111 4 17.035V6.96488C4 6.86163 4.03197 6.7609 4.09152 6.67654C4.25076 6.45094 4.56274 6.39715 4.78834 6.5564L11.9213 11.5914C11.9679 11.6243 12.0086 11.665 12.0415 11.7116C12.2007 11.9372 12.1469 12.2492 11.9213 12.4084L4.78834 17.4434ZM13 6.96488C13 6.86163 13.032 6.7609 13.0915 6.67654C13.2508 6.45094 13.5627 6.39715 13.7883 6.5564L20.9213 11.5914C20.9679 11.6243 21.0086 11.665 21.0415 11.7116C21.2007 11.9372 21.1469 12.2492 20.9213 12.4084L13.7883 17.4434C13.704 17.503 13.6033 17.535 13.5 17.535C13.2239 17.535 13 17.3111 13 17.035V6.96488Z">
									</path>
								</svg>
							</div>
						</button>
					</div>
					<div class="flex-1 text-right"></div>
				</div>
			</div>
		</div>
	</div>
</template>