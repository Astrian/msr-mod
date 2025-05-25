<script setup lang="ts">
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'

import PlayIcon from '../assets/icons/play.vue'
import PauseIcon from '../assets/icons/pause.vue'
import LoadingIndicator from '../assets/icons/loadingindicator.vue'

const playQueueStore = usePlayQueueStore()
const route = useRoute()
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

		playQueueStore.duration = player.value?.duration?? 0
		playQueueStore.currentTime = player.value?.currentTime?? 0
	}

	watch(() => playQueueStore.updatedCurrentTime, (newValue) => {
		if (newValue === null) { return }
		if (player.value) player.value.currentTime = newValue
		playQueueStore.updatedCurrentTime = null
	})
}

function playNext() {
	if (playQueueStore.currentIndex === playQueueStore.list.length - 1) {
		console.log("at the bottom, pause")
		playQueueStore.currentIndex = 0
		player.value?.pause()
		playQueueStore.isPlaying = false
	} else {
		playQueueStore.currentIndex++
		playQueueStore.isPlaying = true
	}
}

function playPrevious() {
	if (player.value && (player.value.currentTime ?? 0) < 5 && playQueueStore.currentIndex > 0) {
		playQueueStore.currentIndex--
		playQueueStore.isPlaying = true
	} else {
		if (player.value) { player.value.currentTime = 0 }
	}
}

function updateCurrentTime() {
	playQueueStore.currentTime = player.value?.currentTime?? 0
}
</script>

<template>
	<div>
		<audio
			:src="playQueueStore.list[playQueueStore.currentIndex] ? playQueueStore.list[playQueueStore.currentIndex].song.sourceUrl : ''"
			ref="playerRef" 
			:autoplay="playQueueStore.isPlaying" 
			v-if="playQueueStore.list.length !== 0" 
			@ended="playNext"
			@pause="playQueueStore.isPlaying = false" 
			@play="playQueueStore.isPlaying = true" 
			@playing="() => {
				playQueueStore.isBuffering = false
				setMetadata()
			}" 
			@waiting="playQueueStore.isBuffering = true"
			@timeupdate="updateCurrentTime">
		</audio>

		
			<div
				class="text-white h-9 bg-neutral-800/80 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex gap-2 overflow-hidden select-none"
				v-if="playQueueStore.list.length !== 0 && route.path !== '/playroom'"
				>
				<RouterLink to="/playroom">
					<img :src="playQueueStore.list[playQueueStore.currentIndex].album?.coverUrl ?? ''" class="rounded-full h-9 w-9" />
				</RouterLink>

				<RouterLink to="/playroom">
					<div class="flex items-center w-32 h-9">
						<span class="truncate">{{ playQueueStore.list[playQueueStore.currentIndex].song.name }}</span>
					</div>
				</RouterLink>

				<button class="h-9 w-9 flex justify-center items-center" @click.stop="() => {
					playQueueStore.isPlaying = !playQueueStore.isPlaying
				}">
					<div v-if="playQueueStore.isPlaying">
						<LoadingIndicator v-if="playQueueStore.isBuffering === true" :size="4" />
						<PauseIcon v-else :size="4" />
					</div>
					<PlayIcon v-else :size="4" />
				</button>
			</div>
	</div>
</template>