<script setup lang="ts">
import { useRoute } from 'vue-router'
import { usePlayQueueStore } from '../stores/usePlayQueueStore'

const route = useRoute()
const playQueue = usePlayQueueStore()
</script>

<template>
	<RouterLink to="/playroom" v-if="playQueue.currentTrack">
		<div
			class="h-9 w-52 bg-neutral-800/80 border border-[#ffffff39] rounded-full backdrop-blur-3xl flex items-center justify-between select-none overflow-hidden">
			<div class="flex items-center gap-2">
				<div class="rounded-full w-9 h-9 bg-gray-600 overflow-hidden">
					<img :src="playQueue.currentTrack.album?.coverUrl ?? ''" />
				</div>
				<div class="text-white">{{playQueue.currentTrack.song.name}}</div>
			</div>
		</div>
	</RouterLink>
</template>
