<script setup lang="ts">
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { debugPlayer } from '../utils/debug'
import { watch, ref } from 'vue'
import apis from '../apis'

const playQueue = usePlayQueueStore()

const resourcesUrl = ref<{ [key: string]: string }>({})
const audioRefs = ref<{ [key: string]: HTMLAudioElement }>({}) // audio 元素的引用

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

watch(() => playQueue.currentTrack, async (newTrack, oldTrack) => {
	if (!playQueue.currentTrack) return

	// 更新元数据
	navigator.mediaSession.metadata = new MediaMetadata({
		title: playQueue.currentTrack.song.name,
		artist: artistsOrganize(playQueue.currentTrack.song.artists ?? []),
		album: playQueue.currentTrack.album?.name,
		artwork: [
			{
				src: playQueue.currentTrack.album?.coverUrl ?? '',
				sizes: '500x500',
				type: 'image/png',
			},
		],
	})
	navigator.mediaSession.setActionHandler('previoustrack', () => {})
	navigator.mediaSession.setActionHandler('nexttrack', playQueue.skipToNext)

	// 如果目前歌曲变动时正在播放，则激活对应的 audio 组件，并将播放时间进度重置为零
	if (!playQueue.isPlaying) return
	debugPlayer("正在播放，变更至下一首歌")
	if (oldTrack) {
		const oldAudio = getAudioElement(oldTrack.song.cid)
		if (oldAudio && !oldAudio.paused) {
			oldAudio.pause()
		}
	}

	const newAudio = getAudioElement(newTrack.song.cid)
	if (newAudio) {
		try {
			await newAudio.play()
			debugPlayer(`开始播放: audio-${newTrack.song.cid}`)
		} catch (error) {
			console.error(`播放失败: audio-${newTrack.song.cid}`, error)
		}
	} else {
		console.warn(`找不到音频元素: audio-${newTrack.song.cid}`)
	}
})

// 优化音乐人字符串显示
function artistsOrganize(list: string[]) {
	if (list.length === 0) return '未知音乐人'

	return list
		.map((artist) => {
			return artist
		})
		.join(' / ')
}

// 自动播放属性判断
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

// 获取 audio 元素的 ref
function getAudioElement(cid: string): HTMLAudioElement | null {
	debugPlayer('Getting audio element for:', cid, audioRefs.value)
	return audioRefs.value[cid] || null
}

// audio 元素结束播放事件
function endOfPlay() {
	debugPlayer("结束播放")
	if (playQueue.loopingMode !== "single") {
		const next = playQueue.queue[playQueue.currentIndex + 1]
		debugPlayer(next.song.cid)
		debugPlayer(audioRefs.value[next.song.cid])
		audioRefs.value[next.song.cid].play()
	}
}

function setAudioRef(cid: string, el: HTMLAudioElement | null) {
	if (el) {
		audioRefs.value[cid] = el
		debugPlayer(`Audio element for ${cid} registered`, el)
	} else {
		delete audioRefs.value[cid]
	}
}
</script>

<template>
	<div>
		<div class="text-white"  v-for="track in playQueue.queue" :key="track.song.cid">
			<audio 
				v-if="resourcesUrl[track.song.cid]" 
				:src="resourcesUrl[track.song.cid]" 
				preload="auto" 
				:ref="el => setAudioRef(track.song.cid, el as HTMLAudioElement)"
				:autoplay="isAutoPlay(track.song.cid)"
				@ended="endOfPlay"
				@timeupdate=""
			/>
				{{track.song.cid}}
		</div>
	</div>
</template>
