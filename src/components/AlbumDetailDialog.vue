<script setup lang="ts">
import XIcon from '../assets/icons/x.vue'
import ShuffleIcon from '../assets/icons/shuffle.vue'
import PlayIcon from '../assets/icons/play.vue'
import StarEmptyIcon from '../assets/icons/starempty.vue'

import { ref, watch, nextTick } from 'vue'
import { gsap } from 'gsap'
import apis from '../apis'
import { artistsOrganize } from '../utils'
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import TrackItem from './TrackItem.vue'

const props = defineProps<{
	albumCid: string
	present: boolean
}>()

const emit = defineEmits<{
	(e: 'dismiss'): void
}>()

const album = ref<Album>()
const dialogBackdrop = ref<HTMLElement>()
const dialogContent = ref<HTMLElement>()
const closeButton = ref<HTMLElement>()

// Animation functions
const animateIn = async () => {
	if (!dialogBackdrop.value || !dialogContent.value || !closeButton.value) return

	// Set initial states
	gsap.set(dialogBackdrop.value, { opacity: 0 })
	gsap.set(dialogContent.value, { y: 50, opacity: 0, scale: 0.95 })
	gsap.set(closeButton.value, { scale: 0, rotation: -180 })

	// Create timeline
	const tl = gsap.timeline()

	tl.to(dialogBackdrop.value, {
		opacity: 1,
		duration: 0.3,
		ease: "power2.out"
	})
		.to(dialogContent.value, {
			y: 0,
			opacity: 1,
			scale: 1,
			duration: 0.4,
			ease: "power3.out"
		}, "-=0.1")
		.to(closeButton.value, {
			scale: 1,
			rotation: 0,
			duration: 0.3,
			ease: "back.out(1.7)"
		}, "-=0.2")
}

const animateOut = () => {
	if (!dialogBackdrop.value || !dialogContent.value || !closeButton.value) return

	const tl = gsap.timeline({
		onComplete: () => emit('dismiss')
	})

	tl.to(closeButton.value, {
		scale: 0,
		rotation: 180,
		duration: 0.2,
		ease: "power2.in"
	})
		.to(dialogContent.value, {
			y: 30,
			opacity: 0,
			scale: 0.95,
			duration: 0.3,
			ease: "power2.in"
		}, "-=0.1")
		.to(dialogBackdrop.value, {
			opacity: 0,
			duration: 0.2,
			ease: "power2.in"
		}, "-=0.1")
}

const handleClose = () => {
	animateOut()
}

watch(() => props.present, async (newVal) => {
	if (newVal) {
		await nextTick()
		animateIn()
	}
})

watch(() => props.albumCid, async () => {
	console.log("AlbumDetailDialog mounted with albumCid:", props.albumCid)
	album.value = undefined // Reset album when cid changes
	try {
		let res = await apis.getAlbum(props.albumCid)
		for (const track in res.songs) {
			res.songs[parseInt(track)] = await apis.getSong(res.songs[parseInt(track)].cid)
		}
		album.value = res
	} catch (error) {
		console.error(error)
	}
})

const playQueue = usePlayQueueStore()

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
	<dialog :open="present" class="bg-transparent z-20">
		<div ref="dialogBackdrop" class="w-screen h-screen z-20 bg-neutral-700/30 flex" @click="handleClose">
			<div ref="dialogContent"
				class="max-w-[60rem] w-full h-[40rem] bg-[#191919] mx-auto my-auto rounded-lg shadow-lg flex flex-col p-8 overflow-y-auto"
				@click.stop>
				<div class="flex justify-end sticky top-0 z-10 mb-8">
					<button ref="closeButton"
						class="text-white w-9 h-9 bg-neutral-800/80 border border-[#ffffff39] rounded-full text-center backdrop-blur-3xl flex justify-center items-center transition-all duration-200 hover:bg-neutral-700/80 hover:scale-110"
						@click="handleClose">
						<XIcon :size="4" />
					</button>
				</div>

				<div v-if="album" class="flex gap-8">
					<div class="mx-auto md:mx-0 md:w-72">
						<div class="md:sticky md:top-[4.5rem] flex flex-col gap-8">
							<div
								class="border border-[#5b5b5b] rounded-md overflow-hidden shadow-2xl bg-neutral-800 top-0 w-48 mx-auto md:w-72">
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
							<TrackItem v-for="(track, index) in album?.songs" :key="track.cid" :album="album" :track="track"
								:index="index" :playfrom="playTheAlbum" />
						</div>
					</div>
				</div>

				<div v-else class="text-white text-center mt-8">
					加载中...
				</div>
			</div>
		</div>
	</dialog>
</template>