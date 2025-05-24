<script setup lang="ts">
import { ref, onMounted } from 'vue'
import apis from '../apis'
import { useRoute } from 'vue-router'
import { usePlayQueueStore } from '../stores/usePlayQueueStore'

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

function artistsOrganize(list: string[]) {
	if (list.length === 0) { return '未知音乐人' }
	return list.map((artist) => {
		return artist
	}).join(' / ')
}

function playTheAlbum() {
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
	playQueue.currentIndex = 0
	playQueue.isPlaying = true
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
						@click="playTheAlbum">
						<div class="w-4 h-4">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M19.376 12.4161L8.77735 19.4818C8.54759 19.635 8.23715 19.5729 8.08397 19.3432C8.02922 19.261 8 19.1645 8 19.0658V4.93433C8 4.65818 8.22386 4.43433 8.5 4.43433C8.59871 4.43433 8.69522 4.46355 8.77735 4.5183L19.376 11.584C19.6057 11.7372 19.6678 12.0477 19.5146 12.2774C19.478 12.3323 19.4309 12.3795 19.376 12.4161Z">
								</path>
							</svg>
						</div>
						<div>播放专辑</div>
					</button>

					<button
						class="text-white w-10 h-10 bg-white/5 border border-[#ffffff39] rounded-full flex justify-center items-center">
						<div class="w-4 h-4">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M18 17.8832V16L23 19L18 22V19.9095C14.9224 19.4698 12.2513 17.4584 11.0029 14.5453L11 14.5386L10.9971 14.5453C9.57893 17.8544 6.32508 20 2.72483 20H2V18H2.72483C5.52503 18 8.05579 16.3312 9.15885 13.7574L9.91203 12L9.15885 10.2426C8.05579 7.66878 5.52503 6 2.72483 6H2V4H2.72483C6.32508 4 9.57893 6.14557 10.9971 9.45473L11 9.46141L11.0029 9.45473C12.2513 6.5416 14.9224 4.53022 18 4.09051V2L23 5L18 8V6.11684C15.7266 6.53763 13.7737 8.0667 12.8412 10.2426L12.088 12L12.8412 13.7574C13.7737 15.9333 15.7266 17.4624 18 17.8832Z">
								</path>
							</svg>
						</div>
					</button>

					<button
						class="text-white w-10 h-10 bg-white/5 border border-[#ffffff39] rounded-full flex justify-center items-center">
						<div class="w-4 h-4">
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
								<path
									d="M12.0006 18.26L4.94715 22.2082L6.52248 14.2799L0.587891 8.7918L8.61493 7.84006L12.0006 0.5L15.3862 7.84006L23.4132 8.7918L17.4787 14.2799L19.054 22.2082L12.0006 18.26ZM12.0006 15.968L16.2473 18.3451L15.2988 13.5717L18.8719 10.2674L14.039 9.69434L12.0006 5.27502L9.96214 9.69434L5.12921 10.2674L8.70231 13.5717L7.75383 18.3451L12.0006 15.968Z">
								</path>
							</svg>
						</div>
					</button>
				</div>

				<div class="text-sm text-gray-500 font-medium">
					共 {{ album?.songs?.length ?? '？' }} 首曲目
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<button v-for="(track, index) in album?.songs" :key="track.cid"
					class="flex align-center gap-4 text-left odd:bg-neutral-800/20 px-2 h-[2.75rem] rounded-md hover:bg-neutral-800 align-center">
					<div class="w-8 flex justify-center items-center">
						<span class="text-2xl text-white">{{ index + 1 }}</span>
					</div>
					<div class="flex flex-col justify-center">
						<div class="text-white text-base">{{ track.name }}</div>
						<div class="text-white/50 text-sm"
							v-if="artistsOrganize(track.artists ?? []) !== artistsOrganize(album?.artistes ?? [])">
							{{ artistsOrganize(track.artists ?? []) }}
						</div>
					</div>
				</button>
			</div>
		</div>
	</div>
</template>