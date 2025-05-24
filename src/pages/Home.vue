<script setup lang="ts">
import apis from '../apis'
import { onMounted } from 'vue'

onMounted(async () => {
	const res = await apis.getAlbums()
	console.log(res)
})
</script>

<template>
	<div class="text-white">hello</div>
</template>