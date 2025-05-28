<script setup lang="ts">
import StarFilledIcon from '../assets/icons/starfilled.vue'
import PlayIcon from '../assets/icons/play.vue'
import ShuffleIcon from '../assets/icons/shuffle.vue'

import { useFavourites } from '../stores/useFavourites'
import { ref } from 'vue'
import { artistsOrganize } from '../utils'
import { usePlayQueueStore } from '../stores/usePlayQueueStore'

const favourites = useFavourites()
const playQueueStore = usePlayQueueStore()

const currentList = ref<'favourites' | number>('favourites')

function playTheList(list: 'favourites' | number) {
	if (usePlayQueueStore().queueReplaceLock) {
		if (!confirm("当前操作会将你的播放队列清空、放入这张歌单所有曲目，并从头播放。继续吗？")) { return }
		usePlayQueueStore().queueReplaceLock = false
	}
	playQueueStore.list = []

	if (list === 'favourites') {
		if (favourites.favouritesCount === 0) return

		let newPlayQueue = favourites.favourites.map(item => ({
			song: item.song,
			album: item.album
		}))
		playQueueStore.list = newPlayQueue.slice().reverse()
		playQueueStore.currentIndex = 0
		playQueueStore.isPlaying = true
		playQueueStore.isBuffering = true
	} else {
		// Handle other lists if needed
	}
}

function shuffle(list: 'favourites' | number) {
	playTheList(list)
	playQueueStore.shuffleCurrent = true
	playQueueStore.playMode.shuffle = false
	setTimeout(() => {
		playQueueStore.playMode.shuffle = true
		playQueueStore.isPlaying = true
		playQueueStore.isBuffering = true
	}, 100)
}

</script>

<template>
	<div class="flex h-screen overflow-y-auto gap-8 select-none">
		<div class="w-96 sticky top-0 pl-8">
			<ul class="pt-26 flex flex-col gap-2">
				<li>
					<button
						class="flex gap-2 items-center w-full hover:bg-neutral-600/40 active:bg-neutral-700/50 transition-all rounded-md px-2 py-2"
						:class="currentList === 'favourites' ? 'bg-neutral-600/20' : ''" @click="currentList = 'favourites'">
						<div class="w-12 h-12 relative text-white bg-neutral-600 rounded-md shadow-md">
							<StarFilledIcon :size="6" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
						</div>
						<div class="flex flex-col text-left">
							<div class="text-white text-xl">我的星标歌曲</div>
							<div class="text-white/50 text-sm">{{ favourites.favouritesCount }} 首歌曲</div>
						</div>
					</button>
				</li>
				<li>
					<div class="w-full">
						<div class="text-white/50 text-center">
							<div class="text-lg">自定义歌单功能尚未就绪</div>
							<div class="text-md">随时回来看看！</div>
						</div>
					</div>
				</li>
			</ul>
		</div>
		<div class="flex-1 mt-26">
			<div class="flex gap-4">
				<div class="w-72 h-72 rounded-md overflow-hidden shadow-2xl bg-neutral-800/20 relative">
					<img :src="favourites.favourites[0]?.album?.coverUrl"
						v-if="favourites.favouritesCount > 0 && favourites.favouritesCount < 4" />
					<div v-else-if="favourites.favouritesCount >= 4" class="grid grid-cols-2 grid-rows-2">
						<img :src="favourites.favourites[0]?.album?.coverUrl" class="w-full h-full object-cover" />
						<img :src="favourites.favourites[1]?.album?.coverUrl" class="w-full h-full object-cover" />
						<img :src="favourites.favourites[2]?.album?.coverUrl" class="w-full h-full object-cover" />
						<img :src="favourites.favourites[3]?.album?.coverUrl" class="w-full h-full object-cover" />
					</div>

					<div
						class="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-neutral-800/20 to-sky-800/70 backdrop-grayscale-100">
						<StarFilledIcon class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" :size="32" />
					</div>
				</div>

				<div class="flex flex-col justify-between">
					<div v-if="currentList === 'favourites'" class="flex flex-col gap-2">
						<div class="text-white text-4xl font-medium">我的星标歌曲</div>
						<div class="text-white/50 text-lg">{{ favourites.favouritesCount }} 首歌曲</div>
					</div>

					<div class="flex gap-2">
						<button
							class="bg-sky-500/20 hover:bg-sky-500/30 active:bg-sky-600/30 active:shadow-inner backdrop-blur-3xl border border-[#ffffff39] rounded-full w-56 h-10 text-base text-white flex justify-center items-center gap-2 transition-all"
							@click="playTheList('favourites')">
							<PlayIcon :size="4" />
							<div>播放歌单</div>
						</button>

						<button
							class="text-white w-10 h-10 bg-neutral-800/80 border border-[#ffffff39] backdrop-blur-3xl rounded-full flex justify-center items-center hover:bg-neutral-700/80 transition-all"
							@click="shuffle('favourites')">
							<ShuffleIcon :size="4" />
						</button>
					</div>
				</div>
			</div>


			<div class="flex flex-col gap-2 mt-4 mr-8">
				<button v-for="item in favourites.favourites.slice().reverse()" :key="item.song.cid"
					class="text-left flex items-center p-2 hover:bg-neutral-400/10 odd:bg-neutral-400/5 rounded-md transition-all">
					<img :src="item.album?.coverUrl" class="w-12 h-12 rounded-md object-cover inline-block mr-2" />
					<div>
						<div class="text-white text-base font-medium">{{ item.song.name }}</div>
						<div class="text-white/50 text-sm">{{ item.album?.name }} - {{ artistsOrganize(item.song.artists ?? []) }}
						</div>
					</div>
				</button>
			</div>
		</div>
	</div>
</template>