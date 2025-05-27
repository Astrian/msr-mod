<script setup lang="ts">
import { artistsOrganize } from '../utils'
import { ref } from 'vue'
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { useToast } from 'vue-toast-notification'
import { useFavourites } from '../stores/useFavourites'

import QueueAddIcon from '../assets/icons/queueadd.vue'
import StarEmptyIcon from '../assets/icons/starempty.vue'
import StarFilledIcon from '../assets/icons/starfilled.vue'

const props = defineProps<{
	album?: Album,
	track: Song,
	index: number,
	playfrom: (index: number) => void,
}>()

const hover = ref(false)

const playQueueStore = usePlayQueueStore()
const toast = useToast()
const favourites = useFavourites()

function appendToQueue() {
	console.log('aaa')
	let queue = playQueueStore.list
	queue.push({
		song: props.track,
		album: props.album,
	} as QueueItem)
	playQueueStore.list = queue
	playQueueStore.queueReplaceLock = true
	toast.success('已添加到播放队列末尾', {
		position: 'top-right',
		duration: 1000,
	})
}
</script>

<template>
	<button
		class="flex justify-between align-center gap-4 text-left px-2 h-[2.75rem] hover:bg-neutral-600/40 odd:bg-netural-600/20 relative overflow-hidden bg-neutral-800/20 odd:bg-neutral-800/40 transition-all"
		@click="playfrom(index)" @mouseenter="() => { hover = true; console.log('aaa') }" @mouseleave="hover = false">

		<span class="text-[3.7rem] text-white/10 absolute left-0 top-[-1.4rem] track_num">{{ index + 1 }}</span>

		<div class="flex flex-col justify-center ml-4">
			<div class="text-white text-base">{{ track.name }}</div>
			<div class="text-white/50 text-sm"
				v-if="artistsOrganize(track.artists ?? []) !== artistsOrganize(album?.artistes ?? [])">
				{{ artistsOrganize(track.artists ?? []) }}
			</div>
		</div>

		<div class="flex items-center justify-center gap-2" v-if="hover">
			<button @click.stop="appendToQueue"
				class="hover:scale-110 transition-all text-white/50 hover:text-white active:text-white/40 active:scale-95">
				<QueueAddIcon :size="4" />
			</button>
			<button @click.stop="favourites.toggleFavourite({
				song: track,
				album: album,
			})" class="hover:scale-110 transition-all text-white/50 hover:text-white active:text-white/40 active:scale-95">
				<StarFilledIcon v-if="favourites.isFavourite(track.cid)" :size="4" />
				<StarEmptyIcon v-else :size="4" />
			</button>
		</div>

	</button>
</template>