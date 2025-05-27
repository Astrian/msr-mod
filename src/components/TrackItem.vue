<script setup lang="ts">
import { artistsOrganize } from '../utils'

defineProps<{
	album?: Album,
	track: Song,
	index: number,
	playfrom: (index: number) => void,
}>()
</script>

<template>
	<button
		class="flex align-center gap-4 text-left px-2 h-[2.75rem] hover:bg-neutral-600/40 odd:bg-netural-600/20 align-center relative overflow-hidden bg-neutral-800/20 odd:bg-neutral-800/40 transition-all"
		@click="playfrom(index)">

		<span class="text-[3.7rem] text-white/10 absolute left-0 top-[-1.4rem] track_num">{{ index + 1 }}</span>

		<div class="flex flex-col justify-center ml-4">
			<div class="text-white text-base">{{ track.name }}</div>
			<div class="text-white/50 text-sm"
				v-if="artistsOrganize(track.artists ?? []) !== artistsOrganize(album?.artistes ?? [])">
				{{ artistsOrganize(track.artists ?? []) }}
			</div>
		</div>


	</button>
</template>