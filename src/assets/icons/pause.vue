<script setup lang="ts">
defineProps<{
	size: number
}>()
</script>

<template>
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" :class="`w-${size} h-${size}`">
		<path d="M6 5H8V19H6V5ZM16 5H18V19H16V5Z"></path>
	</svg>
</template>