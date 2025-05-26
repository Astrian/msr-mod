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
	<div class="text-white flex flex-col gap-8 mt-[6.625rem]">
		<div class="grid xl:grid-cols-6 grid-cols-3 lg:grid-cols-4">
			<div v-for="album in albums" :key="album.cid">
				<RouterLink :to="`/albums/${album.cid}`">
					<img :src="album.coverUrl" />
				</RouterLink>
			</div>
		</div>
	</div>
</template>