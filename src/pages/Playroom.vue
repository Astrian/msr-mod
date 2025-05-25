<script setup lang="ts">
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { artistsOrganize } from '../utils'
import gsap from 'gsap'
import { Draggable } from "gsap/Draggable"
import { onMounted } from 'vue'
import { useTemplateRef } from 'vue'
import { ref } from 'vue'

const playQueueStore = usePlayQueueStore()
gsap.registerPlugin(Draggable)

const progressBarThumb = useTemplateRef('progressBarThumb')
const progressBarContainer = useTemplateRef('progressBarContainer')

const displayTimeLeft = ref(false)

onMounted(() => {
	Draggable.create(progressBarThumb.value, {
		type: 'x',
		bounds: progressBarContainer.value
	})

})

function timeFormatter(time: number) {
	const timeInSeconds = Math.floor(time)
	if (timeInSeconds < 0) { return '0:00' }
	const minutes = Math.floor(timeInSeconds / 60)
	const seconds = Math.floor(timeInSeconds % 60)
	return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
}


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
					{{ playQueueStore.list[playQueueStore.currentIndex].album?.name ?? '未知专辑' }}</div>
			</div>

			<div class="flex flex-col gap-1">
				<div class="w-full p-[0.125rem] bg-white/20 rounded-full backdrop-blur-3xl">
					<div class="w-full" ref="progressBarContainer">
						<div class="w-2 h-2 bg-white rounded-full shadow-md" ref="progressBarThumb" />
					</div>
				</div>
				<div class="w-full flex justify-between">
					<div class="text-white/75 font-light flex-1 text-left">{{ timeFormatter(Math.floor(playQueueStore.currentTime)) }}</div>
					<div class="text-white text-xs text-center">MP3</div>
					<button class="text-white/75 font-light flex-1 text-right" @click="displayTimeLeft = !displayTimeLeft">{{ `${displayTimeLeft ? '-' : ''}${timeFormatter(displayTimeLeft ? Math.floor(playQueueStore.duration) - Math.floor(playQueueStore.currentTime) : playQueueStore.duration)}` }}</button>
				</div>
			</div>
		</div>
	</div>
</template>