import { defineStore } from "pinia"
import { ref } from "vue"

export const usePlayQueueStore = defineStore('queue', () =>{
  const list = ref<QueueItem[]>([])
  const currentIndex = ref<number>(0)
	const isPlaying = ref<boolean>(false)
	const queueReplaceLock = ref<boolean>(false)
	const isBuffering = ref<boolean>(false)
	const currentTime = ref<number>(0)
	const duration = ref<number>(0)
	const updatedCurrentTime = ref<number | null>(null)
	const visualizer = ref<number[]>([0, 0, 0, 0])

  return { list, currentIndex, isPlaying, queueReplaceLock, isBuffering, currentTime, duration, updatedCurrentTime, visualizer }
})