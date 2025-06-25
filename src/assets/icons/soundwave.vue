<script setup lang="ts">
defineProps<{
	size: number
}>()
</script>

<template>
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" :class="`w-${size} h-${size}`">
		<rect x="3" y="9" width="2" height="6" rx="1"></rect>
		<rect x="7" y="5" width="2" height="14" rx="1"></rect>
		<rect x="11" y="7" width="2" height="10" rx="1"></rect>
		<rect x="15" y="4" width="2" height="16" rx="1"></rect>
		<rect x="19" y="10" width="2" height="4" rx="1"></rect>
	</svg>
</template>