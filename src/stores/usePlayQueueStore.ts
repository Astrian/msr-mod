import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apis from '../apis'

export const usePlayQueueStore = defineStore('queue', () => {
	// 内部状态
	const queue = ref<QueueItem[]>([])
	const isShuffle = ref<boolean>(false)
	const loopingMode = ref<'single' | 'all' | 'off'>('off')
	const queueReplaceLock = ref<boolean>(false)
	const currentPlaying = ref<number>(0) // 当前播放指针，指针在 queueOrder 中寻址（无论是否开启了随机播放）
	const queueOrder = ref<number[]>([]) // 播放队列顺序

	// 暴露给外部的响应式只读引用
	const queueState = computed(() =>
		// 按 queueOrder 的顺序排序输出队列
		queueOrder.value
			.map((index) => queue.value[index])
			.filter(Boolean),
	)
	const shuffleState = computed(() => isShuffle.value)
	const loopModeState = computed(() => loopingMode.value)

	// 获取当前播放项
	const currentTrack = computed(() => {
		const actualIndex = queueOrder.value[currentPlaying.value]
		return queue.value[actualIndex] || null
	})

	/************
	 *	播放队列相关
	 ***********/
	// 使用新队列替换老队列
	// 队列替换锁开启时启用确认，确认后重置该锁
	async function replaceQueue(songs: Song[]) {
		if (queueReplaceLock.value) {
			if (
				!confirm(
					'当前操作会将你的播放队列清空、放入这张专辑所有曲目，并从头播放。继续吗？',
				)
			) {
				return
			}
			// 重置队列替换锁
			queueReplaceLock.value = false
		}

		let newQueue: QueueItem[] = []

		// 专辑信息缓存空间
		let albums: { [key: string]: Album } = {}

		for (let i in songs) {
			// 写入新队列
			newQueue[newQueue.length] = {
				song: songs[i],
				album: await (async () => {
					if (albums[songs[i].albumCid ?? '0'])
						return albums[songs[i].albumCid ?? '0']
					else {
						const album = await apis.getAlbum(songs[i].albumCid ?? '0')
						albums[songs[i].albumCid ?? '0'] = album
						return album
					}
				})(),
			}
		}

		// 将新队列替换已有队列
		queue.value = newQueue

		// 初始化播放顺序
		queueOrder.value = Array.from({ length: newQueue.length }, (_, i) => i)
		currentPlaying.value = 0

		// 关闭随机播放和循环（外部可在此方法执行完毕后再更新播放模式）
		isShuffle.value = false
		loopingMode.value = 'off'
	}

	/************
	 * 播放模式相关
	 **********/
	// 切换随机播放模式
	const toggleShuffle = (turnTo?: boolean) => {
		// 未指定随机状态时自动开关
		const newShuffleState = turnTo ?? !isShuffle.value

		if (newShuffleState === isShuffle.value) return // 状态未改变

		/* if (newShuffleState) {
			// 开启随机播放：保存当前顺序并打乱
			const originalOrder = [...queueOrder.value]
			const shuffled = [...queueOrder.value]
			
			// Fisher-Yates 洗牌算法
			for (let i = shuffled.length - 1; i > 0; i--) {
				const j = Math.floor(Math.random() * (i + 1));
				[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
			}
			
			// 确保当前播放的歌曲位置不变（可选）
			const currentSongIndex = queueOrder.value[currentPlaying.value]
			const newCurrentPos = shuffled.indexOf(currentSongIndex)
			if (newCurrentPos !== -1 && newCurrentPos !== currentPlaying.value) {
				[shuffled[currentPlaying.value], shuffled[newCurrentPos]] = 
					[shuffled[newCurrentPos], shuffled[currentPlaying.value]]
			}
			
			// 保存原始顺序以便恢复
			queue.value.forEach((_, index) => {
				queue.value[index]._originalOrderIndex = originalOrder.indexOf(index)
			})
			
			queueOrder.value = shuffled
		} else {
			// 关闭随机播放：恢复原始顺序
			const restoredOrder = Array.from({ length: queue.value.length }, (_, i) => i)
			
			// 找到当前播放歌曲在原始顺序中的位置
			const currentSongIndex = queueOrder.value[currentPlaying.value]
			const newCurrentPos = restoredOrder.indexOf(currentSongIndex)
			
			queueOrder.value = restoredOrder
			currentPlaying.value = newCurrentPos !== -1 ? newCurrentPos : 0
		} */

		isShuffle.value = newShuffleState
	}

	// 切换循环播放模式
	const toggleLoop = (mode?: 'single' | 'all' | 'off') => {
		// 如果指定了循环模式
		if (mode) return (loopingMode.value = mode)

		// 如果没有指定，那么按照「无 -> 列表循环 -> 单曲循环」的顺序轮换
		switch (loopingMode.value) {
			case 'off':
				loopingMode.value = 'all'
				break
			case 'all':
				loopingMode.value = 'single'
				break
			case 'single':
				loopingMode.value = 'off'
				break
		}
	}

	return {
		// 响应式状态（只读）
		queue: queueState,
		isShuffle: shuffleState,
		loopMode: loopModeState,
		currentTrack,
		currentIndex: currentPlaying,

		// 修改方法
		replaceQueue,
		toggleShuffle,
		toggleLoop,
	}
})
