<script setup lang="ts">
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { watch } from 'vue'

const playQueue = usePlayQueueStore()

watch(() => playQueue.isPlaying, (newValue) => {
	console.log(newValue)
})
</script>

<template>
	<div class="bg-[#070909a7] backdrop-blur-3xl h-24 shadow-[0px_-1px_1rem_0px_rgba(0,0,0,0.1)] border-t border-t-[#1c1c1c] sticky bottom-0 w-full">
		
	</div>
</template>