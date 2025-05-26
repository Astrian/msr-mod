<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apis from '../apis'
import { useRoute } from 'vue-router'
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { artistsOrganize } from '../utils'
import TrackItem from '../components/TrackItem.vue'

import PlayIcon from '../assets/icons/play.vue'
import StarEmptyIcon from '../assets/icons/starempty.vue'
import ShuffleIcon from '../assets/icons/shuffle.vue'

const album = ref<Album>()

const route = useRoute()
const albumId = route.params.albumId

const playQueue = usePlayQueueStore()

onMounted(async () => {
	try {
		let res = await apis.getAlbum(albumId as string)
		for (const track in res.songs) {
			res.songs[parseInt(track)] = await apis.getSong(res.songs[parseInt(track)].cid)
		}
		album.value = res
		console.log(res)
	} catch (error) {
		console.log(error)
	}
})

function playTheAlbum(from: number = 0) {
	if (playQueue.queueReplaceLock) {
		if (!confirm("当前操作会将你的待播列表清空、放入这张专辑所有曲目，并从新待播清单的开头播放。继续吗？")) { return }
		playQueue.queueReplaceLock = false
	}

	let newPlayQueue = []
	for (const track of album.value?.songs ?? []) {
		console.log(track)
		newPlayQueue.push({
			song: track,
			album: album.value
		})
	}
	playQueue.list = newPlayQueue
	playQueue.currentIndex = from
	playQueue.isPlaying = true
	playQueue.isBuffering = true
}
</script>

<template>
	<div class="px-4 md:px-8 flex gap-8 flex-col md:flex-row select-none">
		<div class="mx-auto md:mx-0 md:w-72">
			<div class="md:sticky md:top-[6.625rem] flex flex-col gap-8">
				<div
					class="border border-[#5b5b5b] rounded-md overflow-hidden shadow-2xl bg-neutral-800 sticky w-48 mx-auto md:w-72">
					<img :src="album?.coverUrl" class="md:w-72 md:h-72 w-48 h-48 object-contain" />
				</div>
				<div class="flex flex-col gap-2 text-center md:text-left">
					<div class="text-white text-2xl font-semibold">{{ album?.name }}</div>
					<div class="text-sky-200 text-xl">{{ artistsOrganize(album?.artistes ?? []) }}</div>
					<div class="text-white/50 text-sm">{{ album?.intro }}</div>
				</div>
			</div>
		</div>

		<div class="flex-1 flex flex-col gap-8 mb-2">
			<div class="flex justify-between items-center">
				<div class="flex gap-2">
					<button
						class="bg-sky-500/20 hover:bg-sky-500/30 active:bg-sky-600/30 active:shadow-inner border border-[#ffffff39] rounded-full w-56 h-10 text-base text-white flex justify-center items-center gap-2"
						@click="playTheAlbum()">
						<PlayIcon :size="4" />
						<div>播放专辑</div>
					</button>

					<button
						class="text-white w-10 h-10 bg-white/5 border border-[#ffffff39] rounded-full flex justify-center items-center"
						@click="() => {
							playTheAlbum()
							playQueue.shuffleCurrent = true
							playQueue.playMode.shuffle = true
						}">
						<ShuffleIcon :size="4" />
					</button>

					<button
						class="text-white w-10 h-10 bg-white/5 border border-[#ffffff39] rounded-full flex justify-center items-center">
						<StarEmptyIcon :size="4" />
					</button>
				</div>

				<div class="text-sm text-gray-500 font-medium">
					共 {{ album?.songs?.length ?? '？' }} 首曲目
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<TrackItem v-for="(track, index) in album?.songs" :key="track.cid" :album="album" :track="track" :index="index" :playfrom="playTheAlbum" />
			</div>
		</div>
	</div>
</template>