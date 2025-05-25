<script setup lang="ts">
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { artistsOrganize } from '../utils'
import gsap from 'gsap'
import { Draggable } from "gsap/Draggable"
import { onMounted } from 'vue'
import { useTemplateRef } from 'vue'
import { ref, watch } from 'vue'

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

})

function timeFormatter(time: number) {
	const timeInSeconds = Math.floor(time)
	if (timeInSeconds < 0) { return '0:00' }
	const minutes = Math.floor(timeInSeconds / 60)
	const seconds = Math.floor(timeInSeconds % 60)
	return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}

// 监听播放进度，更新进度条
watch(() => playQueueStore.currentTime, () => {
	const progress = playQueueStore.currentTime / playQueueStore.duration
	const containerWidth = progressBarContainer.value?.clientWidth || 0
	const thumbWidth = progressBarThumb.value?.clientWidth || 0
	const newPosition = (containerWidth - thumbWidth) * progress
	gsap.to(progressBarThumb.value, { x: newPosition, duration: 0.1 })
})
</script>

<template>
	<img class="z-0 absolute top-0 left-0 w-screen h-screen blur-2xl object-cover"
		:src="playQueueStore.list[playQueueStore.currentIndex].album?.coverDeUrl"
		v-if="playQueueStore.list[playQueueStore.currentIndex].album?.coverDeUrl" />

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
					<div class="text-white text-xs text-center">MP3</div>
					<button class="text-white/75 font-light flex-1 text-right"
						@click="displayTimeLeft = !displayTimeLeft">{{ `${displayTimeLeft ? '-' : ''}${timeFormatter(displayTimeLeft ? Math.floor(playQueueStore.duration) - Math.floor(playQueueStore.currentTime) : playQueueStore.duration)}` }}</button>
				</div>

				<div class="w-full flex justify-between items-center">
					<div class="flex-1 text-left"></div>
					<div class="flex-2 text-center align-center justify-center gap-2 flex">

						<button class="text-white flex-1 h-8 flex justify-center items-center rounded-lg hover:bg-white/25">
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
							<div class="w-6 h-6">
								<div v-if="playQueueStore.isPlaying">
									<svg v-if="playQueueStore.isBuffering" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
										<circle fill="none" stroke-opacity="1" stroke="#FFFFFF" stroke-width=".5" cx="100" cy="100" r="0">
											<animate attributeName="r" calcMode="spline" dur="2" values="1;80" keyTimes="0;1"
												keySplines="0 .2 .5 1" repeatCount="indefinite"></animate>
											<animate attributeName="stroke-width" calcMode="spline" dur="2" values="0;25" keyTimes="0;1"
												keySplines="0 .2 .5 1" repeatCount="indefinite"></animate>
											<animate attributeName="stroke-opacity" calcMode="spline" dur="2" values="1;0" keyTimes="0;1"
												keySplines="0 .2 .5 1" repeatCount="indefinite"></animate>
										</circle>
									</svg>
									<svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
										<path d="M6 5H8V19H6V5ZM16 5H18V19H16V5Z"></path>
									</svg>
								</div>
								<svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
									<path
										d="M19.376 12.4161L8.77735 19.4818C8.54759 19.635 8.23715 19.5729 8.08397 19.3432C8.02922 19.261 8 19.1645 8 19.0658V4.93433C8 4.65818 8.22386 4.43433 8.5 4.43433C8.59871 4.43433 8.69522 4.46355 8.77735 4.5183L19.376 11.584C19.6057 11.7372 19.6678 12.0477 19.5146 12.2774C19.478 12.3323 19.4309 12.3795 19.376 12.4161Z">
									</path>
								</svg>
							</div>
						</button>

						<button class="text-white flex-1 h-8 flex justify-center items-center rounded-lg hover:bg-white/25">
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