<script lang="ts" setup>
import { artistsOrganize } from '../utils'
import { ref } from 'vue'
import { useFavourites } from '../stores/useFavourites'
import apis from '../apis'
import axios from 'axios'

import StarSlashIcon from '../assets/icons/starslash.vue'
import { onMounted } from 'vue'

const favourites = useFavourites()

const hover = ref(false)

const props = defineProps<{
	item: QueueItem
	index: number
}>()

const emit = defineEmits<{
	(e: 'play', index: number): void
}>()

onMounted(async () => {
	try {
		await axios.head(props.item.song.sourceUrl ?? '')
	} catch (error) {
		// 刷新资源地址
		const updatedSong = await apis.getSong(props.item.song.cid)
		console.log('Updated song:', updatedSong)
		props.item.song.sourceUrl = updatedSong.sourceUrl
	}
})
</script>

<template>
	<button class="text-left flex p-2 hover:bg-neutral-400/10 odd:bg-neutral-400/5 rounded-md transition-all"
		@mouseenter="hover = true" @mouseleave="hover = false">
		<div class="items-center flex flex-auto w-0" @click="emit('play', index)">
			<img :src="item.album?.coverUrl" class="w-12 h-12 rounded-md object-cover inline-block mr-2" />
			<div>
				<div class="text-white text-base font-medium">{{ item.song.name }}</div>
				<div class="text-white/50 text-sm">{{ item.album?.name }} - {{ artistsOrganize(item.song.artists ?? []) }}
				</div>
			</div>
		</div>

		<div class="flex" v-if="hover">
			<button @click.stop="() => {
				favourites.toggleFavourite(item)
			}">
				<StarSlashIcon
					class="text-white/80 hover:text-white active:text-white/75 hover:scale-110 active:scale-95 transition-all"
					:size="4" />
			</button>
		</div>
	</button>
</template>