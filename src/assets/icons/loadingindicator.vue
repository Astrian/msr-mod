<script setup lang="ts">
defineProps<{
	size: number
}>()
</script>

<template>
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" :class="`w-${size} h-${size}`">
		<circle fill="none" stroke-opacity="1" stroke="#FFFFFF" stroke-width=".5" cx="100" cy="100" r="0">
			<animate attributeName="r" calcMode="spline" dur="2" values="1;80" keyTimes="0;1" keySplines="0 .2 .5 1"
				repeatCount="indefinite"></animate>
			<animate attributeName="stroke-width" calcMode="spline" dur="2" values="0;25" keyTimes="0;1"
				keySplines="0 .2 .5 1" repeatCount="indefinite"></animate>
			<animate attributeName="stroke-opacity" calcMode="spline" dur="2" values="1;0" keyTimes="0;1"
				keySplines="0 .2 .5 1" repeatCount="indefinite"></animate>
		</circle>
	</svg>
</template>