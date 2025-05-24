<script setup lang="ts">
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { useTemplateRef, watch } from 'vue'

const playQueueStore = usePlayQueueStore()

const player = useTemplateRef('playerRef')

watch(() => playQueueStore.isPlaying, (newValue) => {
	if (newValue) { player.value?.play() }
	else { player.value?.pause() }
})
</script>

<template>
	<div>
		<audio :src="playQueueStore.list[playQueueStore.currentIndex] ? playQueueStore.list[playQueueStore.currentIndex].song.sourceUrl : ''" ref="playerRef" autoplay v-if="playQueueStore.list.length !== 0"></audio>

		<div
			class="text-white w-48 h-9 bg-neutral-800/80 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex gap-2 overflow-hidden"
			v-if="playQueueStore.list.length !== 0">
			<img :src="playQueueStore.list[playQueueStore.currentIndex].album?.coverUrl ?? ''" class="rounded-full" />
			<div class="flex-1 flex items-center">
				<span class="">{{ playQueueStore.list[playQueueStore.currentIndex].song.name }}</span>
			</div>
			<button class="h-9 w-9 flex justify-center items-center" @click="() => {
				playQueueStore.isPlaying = !playQueueStore.isPlaying
			}">
				<div class="w-4 h-4" v-if="playQueueStore.isPlaying">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
						<path d="M6 5H8V19H6V5ZM16 5H18V19H16V5Z"></path>
					</svg>
				</div>
				<div class="w-4 h-4" v-else>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
						<path
							d="M19.376 12.4161L8.77735 19.4818C8.54759 19.635 8.23715 19.5729 8.08397 19.3432C8.02922 19.261 8 19.1645 8 19.0658V4.93433C8 4.65818 8.22386 4.43433 8.5 4.43433C8.59871 4.43433 8.69522 4.46355 8.77735 4.5183L19.376 11.584C19.6057 11.7372 19.6678 12.0477 19.5146 12.2774C19.478 12.3323 19.4309 12.3795 19.376 12.4161Z">
						</path>
					</svg>
				</div>
			</button>
		</div>
	</div>
</template>