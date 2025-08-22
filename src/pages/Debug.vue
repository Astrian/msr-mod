<script lang="ts" setup>
import apis from '../apis'
import { debugUI } from '../utils/debug'
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { usePlayState } from '../stores/usePlayState'

const playQueue = usePlayQueueStore()
const playState = usePlayState()

async function playTheList() {
	debugUI("开始播放")
	const res = await apis.getAlbum("8936")
	let newQueue: QueueItem[] = []
	for (const track of res.songs ?? []) {
		newQueue[newQueue.length] = {
			song: track,
			album: res
		}
	}
	playQueue.replaceQueue(newQueue)
	playState.togglePlay(true)
}

async function pauseOrResume() {
	playState.togglePlay()
}
</script>

<template>
	<div class="text-white flex justify-center items-center min-h-screen flex-col">
		<button class="bg-white/20 px-2 py-1" @click="playTheList">开始播放</button>
		<div>当前播放队列里有 {{ playQueue.queue.length }} 首歌</div>
		<button class="bg-white/20 px-2 py-1" @click="pauseOrResume">播放/暂停</button>
		<div>播放进度：{{ Math.floor(playState.playProgress) }} / {{ Math.floor(playState.trackDuration) }}</div>
	</div>
</template>
