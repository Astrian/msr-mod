<script setup lang="ts">
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { useTemplateRef, watch } from 'vue'

const playQueueStore = usePlayQueueStore()

const player = useTemplateRef('playerRef')

watch(() => playQueueStore.isPlaying, (newValue) => {
	if (newValue) {
		player.value?.play()
		setMetadata()
	}
	else { player.value?.pause() }
})

watch(() => playQueueStore.currentIndex, () => {
	setMetadata()
	playQueueStore.isBuffering = true
})

function artistsOrganize(list: string[]) {
	if (list.length === 0) { return '未知音乐人' }
	return list.map((artist) => {
		return artist
	}).join(' / ')
}

function setMetadata() {
	if ('mediaSession' in navigator) {
		navigator.mediaSession.metadata = new MediaMetadata({
			title: playQueueStore.list[playQueueStore.currentIndex].song.name,
			artist: artistsOrganize(playQueueStore.list[playQueueStore.currentIndex].song.artists ?? []),
			album: playQueueStore.list[playQueueStore.currentIndex].album?.name,
			artwork: [
				{ src: playQueueStore.list[playQueueStore.currentIndex].album?.coverUrl ?? '', sizes: '500x500', type: 'image/png' },
			]
		})

		navigator.mediaSession.setActionHandler('previoustrack', playPrevious)
		navigator.mediaSession.setActionHandler('nexttrack', playNext)
	}
}

function playNext() {
	if (playQueueStore.currentIndex === playQueueStore.list.length - 1) {
		playQueueStore.currentIndex = 0
		player.value?.pause()
	} else {
		playQueueStore.currentIndex++
		player.value?.play()
	}
}

function playPrevious() {
	if (player.value && (player.value.currentTime ?? 0) < 5 && playQueueStore.currentIndex > 0) {
		playQueueStore.currentIndex--
		player.value?.play()
	} else {
		if (player.value) { player.value.currentTime = 0 }
	}
}
</script>

<template>
	<div>
		<audio
			:src="playQueueStore.list[playQueueStore.currentIndex] ? playQueueStore.list[playQueueStore.currentIndex].song.sourceUrl : ''"
			ref="playerRef" autoplay v-if="playQueueStore.list.length !== 0" @ended="playNext"
			@pause="playQueueStore.isPlaying = false" @play="playQueueStore.isPlaying = true"
			@playing="playQueueStore.isBuffering = false" @waiting="playQueueStore.isBuffering = true">
		</audio>

		<div
			class="text-white h-9 bg-neutral-800/80 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex gap-2 overflow-hidden select-none"
			v-if="playQueueStore.list.length !== 0">
			<img :src="playQueueStore.list[playQueueStore.currentIndex].album?.coverUrl ?? ''" class="rounded-full" />
			<div class="flex items-center w-32">
				<span class="truncate">{{ playQueueStore.list[playQueueStore.currentIndex].song.name }}</span>
			</div>
			<button class="h-9 w-9 flex justify-center items-center" @click="() => {
				playQueueStore.isPlaying = !playQueueStore.isPlaying
			}">
				<div class="w-4 h-4" v-if="playQueueStore.isPlaying">
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" v-if="playQueueStore.isBuffering === true">
						<circle fill="none" stroke-opacity="1" stroke="#FFFFFF" stroke-width=".5" cx="100" cy="100" r="0">
							<animate attributeName="r" calcMode="spline" dur="2" values="1;80" keyTimes="0;1" keySplines="0 .2 .5 1"
								repeatCount="indefinite"></animate>
							<animate attributeName="stroke-width" calcMode="spline" dur="2" values="0;25" keyTimes="0;1"
								keySplines="0 .2 .5 1" repeatCount="indefinite"></animate>
							<animate attributeName="stroke-opacity" calcMode="spline" dur="2" values="1;0" keyTimes="0;1"
								keySplines="0 .2 .5 1" repeatCount="indefinite"></animate>
						</circle>
					</svg>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" v-else>
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