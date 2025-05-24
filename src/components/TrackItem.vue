<script setup lang="ts">
import { artistsOrganize } from '../utils'

defineProps<{
	album?: Album,
	track: Song,
	index: number
}>()
</script>

<template>
	<button
		class="flex align-center gap-4 text-left odd:bg-neutral-800/20 px-2 h-[2.75rem] rounded-md hover:bg-neutral-800 align-center relative overflow-hidden">
		
		<span class="text-[3.7rem] text-white/20 absolute right-0 top-[-1.4rem] track_num">{{ index + 1 }}</span>

		<div class="flex flex-col justify-center">
			<div class="text-white text-base">{{ track.name }}</div>
			<div class="text-white/50 text-sm"
				v-if="artistsOrganize(track.artists ?? []) !== artistsOrganize(album?.artistes ?? [])">
				{{ artistsOrganize(track.artists ?? []) }}
			</div>
		</div>

		
	</button>
</template>