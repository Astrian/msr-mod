<script setup lang="ts">
import apis from '../apis'
import { onMounted, ref } from 'vue'
import AlbumDetailDialog from '../components/AlbumDetailDialog.vue'

const albums = ref([] as AlbumList)

const presentAlbumDetailDialog = ref(false)
const presentedAlbum = ref("")

onMounted(async () => {
	const res = await apis.getAlbums()
	albums.value = res
})
</script>

<template>
	<div class="text-white flex flex-col gap-8 mt-[6.625rem]">
		<div class="grid xl:grid-cols-6 grid-cols-3 lg:grid-cols-4">
			<div v-for="album in albums" :key="album.cid">
				<div class="cursor-pointer" @click="() => {
					presentedAlbum = album.cid
					presentAlbumDetailDialog = true
				}">
					<img :src="album.coverUrl" />
				</div>
			</div>
		</div>
	</div>

	<AlbumDetailDialog :albumCid="presentedAlbum" :present="presentAlbumDetailDialog"
		@dismiss="presentAlbumDetailDialog = false" />
</template>