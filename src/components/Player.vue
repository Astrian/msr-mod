<script setup lang="ts">
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { debugPlayer } from '../utils/debug'
import { watch, ref } from 'vue'
import apis from '../apis'

const playQueue = usePlayQueueStore()

const resourcesUrl = ref<{ [key: string]: string }>({})

// 监听播放列表变化
watch(() => playQueue.queue, async () => {
	debugPlayer(playQueue.queue)
	let newResourcesUrl: { [key: string]: string } = {}
	for (const track of playQueue.queue) {
		const res = await apis.getSong(track.song.cid)
		newResourcesUrl[track.song.cid] = track.song.sourceUrl
	}
	debugPlayer(newResourcesUrl)
	resourcesUrl.value = newResourcesUrl
})

// 判断目前播放状态
function isAutoPlay(cid: string) {
	// 为了提前缓存播放队列中的歌曲，同时消除两首歌切换时的间隙，因此改用了新的方式来在网页上挂载音频
	// 现在会将队列中每一首歌曲都挂载一个单独的 <audio> 并添加 preload="auto" 属性
	// 这样就可以利用浏览器的内置行为来提前缓存队列中的所有歌曲了
	// 不过，这样就会导致判断到底哪一首歌需要播放就成了难题
	// 因此就有了这个函数，用于判断哪一个 <audio> 元素需要进行播放
	// 此函数主要用于 <audio> 元素的 autoplay 属性，以便在专辑或歌单页面点击播放按钮时直接开始播放音乐

	// 先判断是否正在播放
	if (!playQueue.isPlaying) return false

	// 再判断是否是目前曲目
	if (playQueue.currentTrack.song.cid !== cid) return false

	return true	
}
</script>

<template>
	<div>
		<div class="text-white"  v-for="track in playQueue.queue" :key="track.song.cid">
			<audio 
				v-if="resourcesUrl[track.song.cid]" 
				:src="resourcesUrl[track.song.cid]" 
				preload="auto" 
				:ref="`audio-${track.song.cid}`"
				:autoplay="isAutoPlay(track.song.cid)"
			/>
		</div>
	</div>
</template>
