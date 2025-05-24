<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apis from '../apis'
import { useRoute } from 'vue-router'

const album = ref<Album>()

const route = useRoute()
const albumId = route.params.albumId

onMounted(async () => {
	try {
		const res = await apis.getAlbum(albumId as string)
		album.value = res
		console.log(res)
	} catch (error) {
		console.log(error)
	}
})

function artistsOrganize(list: string[]) {
	if (list.length === 0) { return '未知音乐人' }
	return list.map((artist) => {
		return artist
	}).join(' / ')
}
</script>

<template>
	<div class="px-4 md:px-8 flex gap-8">
		<div class="mx-auto w-48 md:mx-0 md:w-72">
			<div class="sticky top-[6.625rem] flex flex-col gap-8">
				<div class="border border-[#5b5b5b] rounded-md overflow-hidden shadow-2xl bg-neutral-800 sticky">
					<img :src="album?.coverUrl" class="md:w-72 md:h-72 w-48 h-48 object-contain" />
				</div>
				<div class="flex flex-col gap-2">
					<div class="text-white text-2xl font-semibold">{{ album?.name }}</div>
					<div class="text-sky-200 text-xl">{{ artistsOrganize(album?.artistes ?? []) }}</div>
					<div class="text-white/50 text-sm">{{ album?.intro }}</div>
				</div>
			</div>
		</div>

		<div class="flex-1 flex flex-col gap-8">
			<div class="flex flex-col gap-2">
				<button v-for="(track, index) in album?.songs" :key="track.cid" class="flex align-center gap-4 text-left odd:bg-neutral-800/20 px-2 py-1 rounded-md hover:bg-neutral-800">
					<div class="w-8 flex justify-center items-center">
						<span class="text-2xl text-white">{{ index + 1 }}</span>
					</div>
					<div>
						<div class="text-white text-base">{{ track.name }}</div>
						<div class="text-white/50 text-sm">{{ artistsOrganize(track.artistes) }}</div>
					</div>
				</button>
			</div>

			<div v-if="album?.songs?.length" class="text-white/50 text-base mb-4">
				共 {{ album?.songs?.length }} 首曲目
			</div>
		</div>
	</div>
</template>