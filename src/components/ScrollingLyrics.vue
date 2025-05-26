<script setup lang="ts">
import { onMounted, ref } from 'vue'
import axios from 'axios'
import { watch } from 'vue'
import { usePlayQueueStore } from '../stores/usePlayQueueStore'

const playQueueStore = usePlayQueueStore()

const parsedLyrics = ref<(LyricsLine | GapLine)[]>([])
const currentLineIndex = ref(0)

const props = defineProps<{
	lrcSrc?: string
}>()

onMounted(async () => {
	if (props.lrcSrc) {
		const lrcContent = await axios.get(props.lrcSrc) 
		parsedLyrics.value = parseLyrics(lrcContent.data)
		console.log(parsedLyrics.value)
	}
})

function parseLyrics(lrcText: string, minGapDuration: number = 5): (LyricsLine | GapLine)[] {
  if (!lrcText) return []
  
  const lines = lrcText.split('\n')
  const tempParsedLines: (LyricsLine | GapLine)[] = []
  
  // LRC时间格式正则: [mm:ss.xx] 或 [mm:ss]
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g
  
  // 第一步：解析所有时间标签和歌词
  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)]
    if (matches.length === 0) continue
    
    // 提取歌词文本（去掉所有时间标签）
    const text = line.replace(/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/g, '').trim()
    
    // 解析每个时间标签
    for (const match of matches) {
      const minutes = parseInt(match[1])
      const seconds = parseInt(match[2])
      const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0')) : 0
      
      const totalSeconds = minutes * 60 + seconds + milliseconds / 1000
      
      if (text) {
        tempParsedLines.push({
          type: 'lyric',
          time: totalSeconds,
          text: text,
          originalTime: match[0]
        })
      } else {
        tempParsedLines.push({
          type: 'gap',
          time: totalSeconds,
          originalTime: match[0]
        })
      }
    }
  }
  
  // 按时间排序
  tempParsedLines.sort((a, b) => a.time - b.time)
  
  // 第二步：处理间隔，只保留超过指定时长的间隔
  const finalLines: (LyricsLine | GapLine)[] = []
  const lyricLines = tempParsedLines.filter(line => line.type === 'lyric') as LyricsLine[]
  const gapLines = tempParsedLines.filter(line => line.type === 'gap') as GapLine[]
  
  // 如果没有歌词行，直接返回
  if (lyricLines.length === 0) {
    return tempParsedLines
  }
  
  // 为每个间隔计算持续时间
  for (let i = 0; i < gapLines.length; i++) {
    const gapLine = gapLines[i]
    
    // 找到这个间隔之后的第一个歌词行
    const nextLyricLine = lyricLines.find(lyric => lyric.time > gapLine.time)
    
    if (nextLyricLine) {
      const duration = nextLyricLine.time - gapLine.time
      gapLine.duration = duration
      
      // 只有当间隔超过最小持续时间时才保留
      if (duration >= minGapDuration) {
        finalLines.push(gapLine)
      }
    }
  }
  
  // 添加所有歌词行
  finalLines.push(...lyricLines)
  
  // 最终排序
  return finalLines.sort((a, b) => a.time - b.time)
}

function findCurrentLineIndex(time: number): number {
  if (parsedLyrics.value.length === 0) return -1
  
  let index = -1
  for (let i = 0; i < parsedLyrics.value.length; i++) {
    if (time >= parsedLyrics.value[i].time) {
      index = i
    } else {
      break
    }
  }
  return index
}

watch(() => playQueueStore.currentTime, (value) => {
	currentLineIndex.value = findCurrentLineIndex(value)
})

function calculateTopRange() {
	return window.innerHeight / 3
}

</script>

<template>
	<div class="w-[40rem] overflow-x-visible flex flex-col gap-4 pl-16" :style="{
		paddingTop: `${calculateTopRange()}px`,
		paddingBottom: `${calculateTopRange() * 2}px`
	}">
		<div class="" v-for="(line, index) in parsedLyrics" :key="index">
			<div v-if="line.type === 'lyric'" class="text-3xl font-bold relative">
				<div :class="currentLineIndex === index ? 'text-black/80 blur-3xl' : 'text-black/20 blur-3xl'">{{ line.text }}</div>
				<div class="absolute top-0" :class="currentLineIndex === index ? 'text-white' : 'text-white/50'">{{ line.text }}</div>
			</div>
			<!-- <div v-else class="text-white/50 text-sm">
				{{ line.originalTime }}
			</div> -->
		</div>
	</div>
</template>