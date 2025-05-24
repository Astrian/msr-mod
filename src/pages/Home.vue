<script setup lang="ts">
import apis from '../apis'
import { onMounted, ref } from 'vue'

const albums = ref([] as AlbumList)

onMounted(async () => {
	const res = await apis.getAlbums()
	albums.value = res
})
</script>

<template>
	<div class="text-white flex flex-col gap-8 mb-16">
		<h1 class="text-4xl font-semibold pt-8 px-4 sticky top-0 bg-gradient-to-b from-[#00000080] to-transparent">浏览</h1>
		<div class="grid grid-cols-5">
			<div v-for="album in albums" :key="album.cid">
				<img :src="album.coverUrl" />
			</div>
		</div>
	</div>
</template>