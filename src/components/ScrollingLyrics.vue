<template>
	<div class="relative overflow-hidden h-full w-[40rem]" ref="lyricsContainer" @wheel="handleWheel">
		<!-- 歌词滚动区域 -->
		<div class="relative" ref="lyricsWrapper">
			<!-- 顶部填充 -->
			<div class="h-1/2 pointer-events-none"></div>

			<div v-for="(line, index) in parsedLyrics" :key="index" :ref="el => setLineRef(el as HTMLElement, index)"
				class="py-8 px-16 cursor-pointer transition-all duration-300 hover:scale-105"
				@click="handleLineClick(line, index)">
				<div v-if="line.type === 'lyric'" class="relative">
					<!-- 背景模糊文字 -->
					<div class="text-3xl font-bold transition-all duration-500" :class="[
						currentLineIndex === index ? 'text-black/80 blur-xl' : 'text-black/20 blur-2xl'
					]">
						{{ line.text }}
					</div>
					<!-- 前景清晰文字 -->
					<div class="absolute top-0 left-0 w-full text-3xl font-bold transition-all duration-500" :class="[
						currentLineIndex === index
							? 'text-white scale-110'
							: index < currentLineIndex
								? userScrolling ? 'text-white/60' : 'text-white/60 blur-xs'
								: userScrolling ? 'text-white/40' : 'text-white/40 blur-xs'
					]">
						{{ line.text }}
					</div>
				</div>

				<div v-else-if="line.type === 'gap'" class="flex items-center gap-2">
					<div v-for="dot in 3" :key="dot" class="bg-white rounded-full"
						:class="currentLineIndex === index ? 'w-4 h-4' : ''"
						:style="{ opacity: getGapDotOpacities(line)[dot - 1] }" />
				</div>
			</div>

			<!-- 底部填充 -->
			<div class="h-96 pointer-events-none"></div>
		</div>

		<!-- 歌词控制面板 -->
		<div class="absolute top-4 right-4 flex gap-2 opacity-0 transition-opacity duration-300 hover:opacity-100"
			ref="controlPanel">
			<button @click="toggleAutoScroll"
				class="px-3 py-1 rounded-full text-xs backdrop-blur-md text-white/80 hover:text-white transition-all duration-200"
				:class="[
					autoScroll
						? 'bg-white/20 shadow-lg'
						: 'bg-black/20 hover:bg-black/30'
				]">
				{{ autoScroll ? '自动' : '手动' }}
			</button>
			<button @click="resetScroll"
				class="px-3 py-1 rounded-full text-xs bg-black/20 backdrop-blur-md text-white/80 hover:bg-black/30 hover:text-white transition-all duration-200">
				重置
			</button>
		</div>

		<!-- 滚动指示器 -->
		<div class="absolute right-2 top-1/4 bottom-1/4 w-1 bg-white/10 rounded-full overflow-hidden"
			v-if="parsedLyrics.length > 5">
			<div class="w-full bg-white/40 rounded-full transition-all duration-300" :style="{
				height: scrollIndicatorHeight + '%',
				transform: `translateY(${scrollIndicatorPosition}px)`
			}"></div>
		</div>

		<!-- 加载状态 -->
		<div v-if="loading" class="absolute inset-0 flex items-center justify-center backdrop-blur-sm"
			ref="loadingIndicator">
			<div class="flex items-center gap-3 px-6 py-3 rounded-full bg-black/20 backdrop-blur-md">
				<div class="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin"></div>
				<div class="text-white/80 text-sm font-medium">加载歌词中...</div>
			</div>
		</div>

		<!-- 无歌词状态 -->
		<div v-if="!loading && parsedLyrics.length === 0" class="absolute inset-0 flex items-center justify-center"
			ref="noLyricsIndicator">
			<div class="text-center">
				<div class="text-white/40 text-lg font-medium mb-2">暂无歌词</div>
				<div class="text-white/30 text-sm">享受纯音乐的美妙</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, nextTick, computed, onUnmounted } from 'vue'
import axios from 'axios'
import gsap from 'gsap'
import { usePlayQueueStore } from '../stores/usePlayQueueStore'

// 类型定义
interface LyricsLine {
	type: 'lyric'
	time: number
	text: string
	originalTime: string
}

interface GapLine {
	type: 'gap'
	time: number
	originalTime: string
	duration?: number
}

const playQueueStore = usePlayQueueStore()

// 响应式数据
const parsedLyrics = ref<(LyricsLine | GapLine)[]>([])
const currentLineIndex = ref(-1)
const autoScroll = ref(true)
const loading = ref(false)
const userScrolling = ref(false)

// DOM 引用
const lyricsContainer = ref<HTMLElement>()
const lyricsWrapper = ref<HTMLElement>()
const lineRefs = ref<(HTMLElement | null)[]>([])
const controlPanel = ref<HTMLElement>()
const loadingIndicator = ref<HTMLElement>()
const noLyricsIndicator = ref<HTMLElement>()

// GSAP 动画实例
let scrollTween: gsap.core.Tween | null = null
let highlightTween: gsap.core.Tween | null = null
let userScrollTimeout: NodeJS.Timeout | null = null

// Props
const props = defineProps<{
	lrcSrc?: string
}>()

// 滚动指示器相关计算
const scrollIndicatorHeight = computed(() => {
	if (parsedLyrics.value.length === 0) return 0
	return Math.max(10, 100 / parsedLyrics.value.length * 5) // 显示大约5行的比例
})

const scrollIndicatorPosition = computed(() => {
	if (parsedLyrics.value.length === 0 || currentLineIndex.value < 0) return 0
	const progress = currentLineIndex.value / (parsedLyrics.value.length - 1)
	const containerHeight = lyricsContainer.value?.clientHeight || 400
	const indicatorTrackHeight = containerHeight / 2 // 指示器轨道高度
	return progress * (indicatorTrackHeight - (scrollIndicatorHeight.value / 100 * indicatorTrackHeight))
})

// 设置行引用
function setLineRef(el: HTMLElement | null, index: number) {
	if (el) {
		lineRefs.value[index] = el
	}
}

// 歌词解析函数
function parseLyrics(lrcText: string, minGapDuration: number = 5): (LyricsLine | GapLine)[] {
	if (!lrcText) return [
		{
			type: 'lyric',
			time: 0,
			text: '',
			originalTime: '[00:00]'
		}
	]

	const lines = lrcText.split('\n')
	const tempParsedLines: (LyricsLine | GapLine)[] = []

	const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g

	for (const line of lines) {
		const matches = [...line.matchAll(timeRegex)]
		if (matches.length === 0) continue

		const text = line.replace(/\[\d{1,2}:\d{2}(?:\.\d{1,3})?\]/g, '').trim()

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

	tempParsedLines.sort((a, b) => a.time - b.time)

	const finalLines: (LyricsLine | GapLine)[] = []
	const lyricLines = tempParsedLines.filter(line => line.type === 'lyric') as LyricsLine[]
	const gapLines = tempParsedLines.filter(line => line.type === 'gap') as GapLine[]

	if (lyricLines.length === 0) return tempParsedLines

	for (let i = 0; i < gapLines.length; i++) {
		const gapLine = gapLines[i]
		const nextLyricLine = lyricLines.find(lyric => lyric.time > gapLine.time)

		if (nextLyricLine) {
			const duration = nextLyricLine.time - gapLine.time
			gapLine.duration = duration

			if (duration >= minGapDuration) {
				finalLines.push(gapLine)
			}
		}
	}

	finalLines.push(...lyricLines)
	const sortedLines = finalLines.sort((a, b) => a.time - b.time)
	// 在最前面插入一个空行
	sortedLines.unshift({
		type: 'lyric',
		time: 0,
		text: '',
		originalTime: '[00:00]'
	})
	return sortedLines
}

// 查找当前行索引
function findCurrentLineIndex(time: number): number {
	if (parsedLyrics.value.length === 0) return -1
	// 如果时间小于第一句歌词，则返回0（空行）
	if (time < parsedLyrics.value[1]?.time) return 0
	let index = 0
	for (let i = 1; i < parsedLyrics.value.length; i++) {
		if (time >= parsedLyrics.value[i].time) {
			index = i
		} else {
			break
		}
	}
	return index
}

// 使用 GSAP 滚动到指定行
function scrollToLine(lineIndex: number, smooth = true) {
	if (!lyricsContainer.value || !lyricsWrapper.value || !lineRefs.value[lineIndex]) return

	const container = lyricsContainer.value
	const wrapper = lyricsWrapper.value
	const lineElement = lineRefs.value[lineIndex]

	const containerHeight = container.clientHeight
	const containerCenter = containerHeight / 2

	// 计算目标位置
	const lineOffsetTop = lineElement.offsetTop
	const lineHeight = lineElement.clientHeight
	const targetY = containerCenter - lineOffsetTop - lineHeight / 2

	// 停止之前的滚动动画
	if (scrollTween) {
		scrollTween.kill()
	}

	if (smooth) {
		// 使用 GSAP 平滑滚动
		scrollTween = gsap.to(wrapper, {
			y: targetY,
			duration: 0.8,
			ease: "power2.out",
			onComplete: () => {
				scrollTween = null
			}
		})
	} else {
		gsap.set(wrapper, { y: targetY })
	}
}

// 高亮当前行动画
function highlightCurrentLine(lineIndex: number) {
	if (!lineRefs.value[lineIndex]) return

	const lineElement = lineRefs.value[lineIndex]

	// 停止之前的高亮动画
	if (highlightTween) {
		highlightTween.kill()
	}

	// 重置所有行的样式
	lineRefs.value.forEach((el, index) => {
		if (el && index !== lineIndex) {
			gsap.to(el, {
				scale: 1,
				opacity: index < lineIndex ? 0.6 : 0.4,
				duration: 0.3,
				ease: "power2.out"
			})
		}
	})

	// 高亮当前行
	highlightTween = gsap.to(lineElement, {
		scale: 1.05,
		opacity: 1,
		duration: 0.2,
		ease: "back.out(1.7)",
		onComplete: () => {
			highlightTween = null
		}
	})
}

// 处理鼠标滚轮
function handleWheel(event: WheelEvent) {
	event.preventDefault()

	if (!lyricsWrapper.value || !lyricsContainer.value) return

	userScrolling.value = true
	autoScroll.value = false

	if (scrollTween) {
		scrollTween.kill()
	}

	const currentY = gsap.getProperty(lyricsWrapper.value, "y") as number
	const newY = currentY - event.deltaY * 0.5

	// 修正滚动范围计算
	const wrapperHeight = lyricsWrapper.value.scrollHeight
	const containerHeight = lyricsContainer.value.clientHeight
	const minY = containerHeight - wrapperHeight // 最底部
	const maxY = 0 // 最顶部
	const limitedY = Math.max(minY, Math.min(maxY, newY))

	gsap.to(lyricsWrapper.value, {
		y: limitedY,
		duration: 0.1,
		ease: "power2.out"
	})

	if (userScrollTimeout) {
		clearTimeout(userScrollTimeout)
	}

	userScrollTimeout = setTimeout(() => {
		userScrolling.value = false
		autoScroll.value = true

		if (currentLineIndex.value >= 0) {
			scrollToLine(currentLineIndex.value, true)
		}
	}, 3000)
}

// 处理歌词行点击
function handleLineClick(line: LyricsLine | GapLine, index: number) {
	if (line.type === 'lyric') {
		console.log('Jump to time:', line.time)
		// 这里可以发出事件让父组件处理音频跳转
		// emit('seek', line.time)
	}

	// 滚动到点击的行
	scrollToLine(index, true)

	// 添加点击反馈动画
	if (lineRefs.value[index]) {
		gsap.fromTo(lineRefs.value[index],
			{ scale: 1 },
			{
				scale: 1.1,
				duration: 0.1,
				yoyo: true,
				repeat: 1,
				ease: "power2.inOut"
			}
		)
	}
}

// 切换自动滚动
function toggleAutoScroll() {
	autoScroll.value = !autoScroll.value
	userScrolling.value = false

	// 按钮点击动画
	if (controlPanel.value) {
		gsap.fromTo(controlPanel.value.children[0],
			{ scale: 1 },
			{
				scale: 0.95,
				duration: 0.1,
				yoyo: true,
				repeat: 1,
				ease: "power2.inOut"
			}
		)
	}

	if (autoScroll.value && currentLineIndex.value >= 0) {
		nextTick(() => {
			scrollToLine(currentLineIndex.value, true)
		})
	}
}

// 重置滚动
function resetScroll() {
	if (!lyricsWrapper.value) return

	// 停止所有动画
	if (scrollTween) scrollTween.kill()
	if (highlightTween) highlightTween.kill()

	// 重置位置
	gsap.to(lyricsWrapper.value, {
		y: 0,
		duration: 0.3,
		ease: "power2.out"
	})

	autoScroll.value = true
	userScrolling.value = false

	// 按钮点击动画
	if (controlPanel.value) {
		gsap.fromTo(controlPanel.value.children[1],
			{ scale: 1 },
			{
				scale: 0.95,
				duration: 0.1,
				yoyo: true,
				repeat: 1,
				ease: "power2.inOut"
			}
		)
	}

	if (currentLineIndex.value >= 0) {
		nextTick(() => {
			scrollToLine(currentLineIndex.value, true)
		})
	}
}

// gap 圆点透明度计算
function getGapDotOpacities(line: GapLine) {
	// 获取 gap 的持续时间
	const duration = line.duration ?? 0
	if (duration <= 0) return [0.3, 0.3, 0.3]
	// 当前播放时间
	const now = playQueueStore.currentTime
	// gap 起止时间
	const start = line.time
	// 计算进度
	let progress = (now - start) / duration
	progress = Math.max(0, Math.min(1, progress))
	// 每个圆点的阈值
	const thresholds = [1 / 4, 2 / 4, 3 / 4]
	// 透明度从 0.3 到 1
	return thresholds.map(t => progress >= t ? 1 : progress >= t - 1 / 3 ? 0.6 : 0.3)
}

// 监听播放时间变化
watch(() => playQueueStore.currentTime, (time) => {
	const newIndex = findCurrentLineIndex(time)

	if (newIndex !== currentLineIndex.value && newIndex >= 0) {
		currentLineIndex.value = newIndex

		// 高亮动画
		highlightCurrentLine(newIndex)

		// 自动滚动
		if (autoScroll.value && !userScrolling.value) {
			nextTick(() => {
				scrollToLine(newIndex, true)
			})
		}
	}
})

// 监听歌词源变化
watch(() => props.lrcSrc, async (newSrc) => {
	console.log('Loading new lyrics from:', newSrc)
	// 重置状态
	currentLineIndex.value = -1
	lineRefs.value = []

	// 停止所有动画
	if (scrollTween) scrollTween.kill()
	if (highlightTween) highlightTween.kill()

	if (newSrc) {
		loading.value = true

		// 加载动画
		if (loadingIndicator.value) {
			gsap.fromTo(loadingIndicator.value,
				{ opacity: 0, scale: 0.8 },
				{ opacity: 1, scale: 1, duration: 0.3, ease: "back.out(1.7)" }
			)
		}

		try {
			const response = await axios.get(newSrc)
			parsedLyrics.value = parseLyrics(response.data)
			console.log('Parsed lyrics:', parsedLyrics.value)

			autoScroll.value = true
			userScrolling.value = false

			// 重置滚动位置
			if (lyricsWrapper.value) {
				gsap.set(lyricsWrapper.value, { y: 0 })
			}

		} catch (error) {
			console.error('Failed to load lyrics:', error)
			parsedLyrics.value = []
		} finally {
			loading.value = false
		}
	} else {
		parsedLyrics.value = []

		// 重置滚动位置
		if (lyricsWrapper.value) {
			gsap.set(lyricsWrapper.value, { y: 0 })
		}
	}
}, { immediate: true })


// 页面焦点处理函数变量声明
let handleVisibilityChange: (() => void) | null = null

// 页面焦点处理
function setupPageFocusHandlers() {
	handleVisibilityChange = () => {
		if (document.hidden) {
			// 页面失去焦点时暂停动画
			if (scrollTween) scrollTween.pause()
			if (highlightTween) highlightTween.pause()
		} else {
			// 页面重新获得焦点时恢复并重新同步
			if (scrollTween && scrollTween.paused()) scrollTween.resume()
			if (highlightTween && highlightTween.paused()) highlightTween.resume()
			
			// 重新同步歌词位置
			nextTick(() => {
				if (currentLineIndex.value >= 0 && autoScroll.value && !userScrolling.value) {
					scrollToLine(currentLineIndex.value, false) // 不使用动画，直接定位
				}
			})
		}
	}

	document.addEventListener('visibilitychange', handleVisibilityChange)
}

// 组件挂载时的入场动画
onMounted(() => {
	// 设置页面焦点处理
	setupPageFocusHandlers()

	// 控制面板入场动画
	if (controlPanel.value) {
		gsap.fromTo(controlPanel.value,
			{ opacity: 0, x: 20 },
			{ opacity: 0, x: 0, duration: 0.2, ease: "power2.out", delay: 0.2 }
		)
	}

	// 歌词行入场动画
	nextTick(() => {
		lineRefs.value.forEach((el, index) => {
			if (el) {
				gsap.fromTo(el,
					{ opacity: 0, y: 30 },
					{
						opacity: 1,
						y: 0,
						duration: 0.2,
						ease: "power2.out",
						delay: index * 0.1
					}
				)
			}
		})
	})
})

// 组件卸载时清理
onUnmounted(() => {
	if (scrollTween) scrollTween.kill()
	if (highlightTween) highlightTween.kill()
	if (userScrollTimeout) clearTimeout(userScrollTimeout)
	
	// 清理页面焦点事件监听器
	if (handleVisibilityChange) {
		document.removeEventListener('visibilitychange', handleVisibilityChange)
	}
})

// 暴露方法给父组件
defineExpose({
	scrollToLine,
	toggleAutoScroll,
	resetScroll,
	getCurrentLine: () => currentLineIndex.value >= 0 ? parsedLyrics.value[currentLineIndex.value] : null
})
</script>

<style scoped>
/* 自定义滚动条样式 */
.lyrics-container::-webkit-scrollbar {
	display: none;
}

.lyrics-container {
	-ms-overflow-style: none;
	scrollbar-width: none;
}
</style>