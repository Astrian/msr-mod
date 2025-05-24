import { defineStore } from "pinia"
import { ref } from "vue"

export const usePlayQueueStore = defineStore('queue', () =>{
  const list = ref<QueueItem[]>([])
  const currentIndex = ref<number>(0)
	const isPlaying = ref<boolean>(false)
	const queueReplaceLock = ref<boolean>(false)

  return { list, currentIndex, isPlaying, queueReplaceLock }
})