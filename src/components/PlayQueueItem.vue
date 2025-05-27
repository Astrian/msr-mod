<script setup lang="ts">
import { usePlayQueueStore } from '../stores/usePlayQueueStore'
import { artistsOrganize } from '../utils'

import XIcon from '../assets/icons/x.vue'
import UpHyphenIcon from '../assets/icons/uphypen.vue'
import DownHyphenIcon from '../assets/icons/downhyphen.vue'

import { ref } from 'vue'

const props = defineProps<{
	queueItem: QueueItem
	isCurrent: boolean
	index: number
}>()

const playQueueStore = usePlayQueueStore()

const hover = ref(false)

function removeItem() {
	playQueueStore.queueReplaceLock = true

	const queue = [...playQueueStore.list]

	if (!playQueueStore.playMode.shuffle) {
		// 非shuffle模式：直接操作原始列表
		queue.splice(props.index, 1)
		playQueueStore.list = queue

		if (props.index < playQueueStore.currentIndex) {
			playQueueStore.currentIndex--
		} else if (props.index === playQueueStore.currentIndex) {
			if (queue.length > 0) {
				playQueueStore.currentIndex = Math.min(playQueueStore.currentIndex, queue.length - 1)
			} else {
				playQueueStore.currentIndex = 0
			}
		}
	} else {
		// Shuffle模式：需要同时维护两个列表
		const originalIndex = playQueueStore.shuffleList[props.index]
		const shuffleList = [...playQueueStore.shuffleList]

		// 从原始列表中删除
		queue.splice(originalIndex, 1)

		// 从shuffle列表中删除当前项
		shuffleList.splice(props.index, 1)

		// 更新shuffle列表中所有大于被删除原始索引的值
		for (let i = 0; i < shuffleList.length; i++) {
			if (shuffleList[i] > originalIndex) {
				shuffleList[i]--
			}
		}

		playQueueStore.list = queue
		playQueueStore.shuffleList = shuffleList

		// 更新currentIndex
		if (props.index < playQueueStore.currentIndex) {
			playQueueStore.currentIndex--
		} else if (props.index === playQueueStore.currentIndex) {
			if (queue.length > 0) {
				playQueueStore.currentIndex = Math.min(playQueueStore.currentIndex, queue.length - 1)
			} else {
				playQueueStore.currentIndex = 0
			}
		}
	}
}
</script>

<template>
	<button class="p-4 w-full rounded-md hover:bg-white/5 first:mt-2 flex gap-2 items-center" @click="() => {
		if (isCurrent) { return }
		playQueueStore.currentIndex = index
		playQueueStore.isPlaying = true
	}" @mouseenter="hover = true" @mouseleave="hover = false">
		<div class="flex gap-2 flex-auto w-0">
			<div class="relative w-12 h-12 rounded-md shadow-xl overflow-hidden">
				<img :src="queueItem.album?.coverUrl" />
				<div class="w-full h-full absolute top-0 left-0 bg-neutral-900/75 flex justify-center items-center"
					v-if="isCurrent">
					<div style="height: 1rem;" class="flex justify-center items-center gap-[.125rem]">
						<div class="bg-white w-[.125rem] rounded-full" v-for="(bar, index) in playQueueStore.visualizer"
							:key="index" :style="{
								height: `${Math.max(10, bar)}%`
							}" />
					</div>
				</div>
			</div>
			<div class="flex flex-col text-left flex-auto w-0">
				<div class="text-white text-base font-medium truncate">{{ queueItem.song.name }}</div>
				<div class="text-white/75 text-sm truncate">
					{{ artistsOrganize(queueItem.song.artists ?? []) }} —
					{{ queueItem.album?.name ?? '未知专辑' }}
				</div>
			</div>
		</div>

		<div class="flex gap-1" v-if="hover">
			<button
				class="text-white/90 w-4 h-4 hover:scale-110 hover:text-white active:scale-95 active:text-white/85 transition-all"
				@click.stop>
				<UpHyphenIcon :size="4" />
			</button>

			<button
				class="text-white/90 w-4 h-4 hover:scale-110 hover:text-white active:scale-95 active:text-white/85 transition-all"
				@click.stop>
				<DownHyphenIcon :size="4" />
			</button>

			<button
				class="text-white/90 w-4 h-4 hover:scale-110 hover:text-white active:scale-95 active:text-white/85 transition-all"
				@click.stop="removeItem">
				<XIcon :size="4" />
			</button>
		</div>
	</button>
</template>