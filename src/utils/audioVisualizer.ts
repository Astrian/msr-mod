// utils/audioVisualizer.ts - 平衡频谱版本
import { ref, onUnmounted, Ref } from 'vue'

interface AudioVisualizerOptions {
  sensitivity?: number
  smoothing?: number
  barCount?: number
  debug?: boolean
  bassBoost?: number     // 低音增强倍数 (默认 0.7，降低低音)
  midBoost?: number      // 中音增强倍数 (默认 1.2)
  trebleBoost?: number   // 高音增强倍数 (默认 1.5)
}

export function audioVisualizer(options: AudioVisualizerOptions = {}) {
  const {
    sensitivity = 1,
    smoothing = 0.7,
    barCount = 4,
    debug = false,
    bassBoost = 0.7,      // 降低低音权重
    midBoost = 1.2,       // 提升中音
    trebleBoost = 1.5     // 提升高音
  } = options

  console.log('[AudioVisualizer] 初始化平衡频谱，选项:', options)

  // 导出的竖杠高度值数组 (0-100)
  const barHeights: Ref<number[]> = ref(Array(barCount).fill(0))
  const isAnalyzing = ref(false)
  const error = ref<string | null>(null)
  const isInitialized = ref(false)

  // 内部变量
  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let source: MediaElementAudioSourceNode | null = null
  let dataArray: Uint8Array | null = null
  let animationId: number | null = null
  let currentAudioElement: HTMLAudioElement | null = null

  // 调试日志
  function log(...args: any[]) {
    if (debug) {
      console.log('[AudioVisualizer]', ...args)
    }
  }

  // 初始化音频分析
  function initAudioContext(audioElement: HTMLAudioElement) {
    if (!audioElement) {
      log('错误: 音频元素为空')
      return
    }
    
    if (audioContext) {
      log('AudioContext 已存在，跳过初始化')
      return
    }

    try {
      log('开始初始化音频上下文...')

      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      log('AudioContext 创建成功, 状态:', audioContext.state, '采样率:', audioContext.sampleRate)

      // 如果上下文被暂停，尝试恢复
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          log('AudioContext 已恢复')
        })
      }

      analyser = audioContext.createAnalyser()
      
      // 尝试创建音频源
      try {
        source = audioContext.createMediaElementSource(audioElement)
        log('MediaElementSource 创建成功')
      } catch (sourceError) {
        log('创建 MediaElementSource 失败:', sourceError)
        error.value = 'CORS 错误: 无法访问跨域音频'
        return
      }
      
      // 优化分析器配置
      analyser.fftSize = 2048        // 增加分辨率
      analyser.smoothingTimeConstant = smoothing
      analyser.minDecibels = -100    // 更低的最小分贝
      analyser.maxDecibels = -30     // 调整最大分贝范围
      
      log('分析器配置:', {
        fftSize: analyser.fftSize,
        frequencyBinCount: analyser.frequencyBinCount,
        sampleRate: audioContext.sampleRate,
        frequencyResolution: audioContext.sampleRate / analyser.fftSize
      })
      
      // 连接音频节点
      source.connect(analyser)
      analyser.connect(audioContext.destination)
      
      // 创建数据数组
      dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      isInitialized.value = true
      error.value = null
      log('✅ 音频可视化器初始化成功')
      
    } catch (err) {
      log('❌ 音频上下文初始化失败:', err)
      error.value = `初始化失败: ${err instanceof Error ? err.message : String(err)}`
      isInitialized.value = false
    }
  }

  // 开始分析
  function startAnalysis() {
    if (!analyser || !dataArray || !isInitialized.value) {
      log('❌ 无法开始分析: 分析器未初始化')
      return
    }
    
    log('✅ 开始频谱分析')
    isAnalyzing.value = true
    animate()
  }

  // 停止分析
  function stopAnalysis() {
    log('停止频谱分析')
    isAnalyzing.value = false
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
    barHeights.value = Array(barCount).fill(0)
  }

  // 动画循环
  function animate() {
    if (!isAnalyzing.value || !analyser || !dataArray || !audioContext) return
    
    // 获取频率数据
    analyser.getByteFrequencyData(dataArray)
    
    // 使用平衡的频段分割
    const frequencyBands = divideFrequencyBandsBalanced(dataArray, barCount, audioContext.sampleRate)
    
    // 应用频段特定的增强
    const enhancedBands = applyFrequencyEnhancement(frequencyBands)
    
    // 更新竖杠高度 (0-100)
    barHeights.value = enhancedBands.map(value => 
      Math.min(100, Math.max(0, (value / 255) * 100 * sensitivity))
    )
    
    animationId = requestAnimationFrame(animate)
  }

  // 平衡的频段分割 - 使用对数分布和人耳感知特性
  function divideFrequencyBandsBalanced(data: Uint8Array, bands: number, sampleRate: number): number[] {
    const nyquist = sampleRate / 2
    const result: number[] = []
    
    // 定义人耳感知的频率范围 (Hz)
    const frequencyRanges = [
      { min: 20, max: 250, name: '低音' },      // 低音
      { min: 250, max: 2000, name: '中低音' },   // 中低音  
      { min: 2000, max: 8000, name: '中高音' },  // 中高音
      { min: 8000, max: 20000, name: '高音' }   // 高音
    ]
    
    for (let i = 0; i < bands; i++) {
      const range = frequencyRanges[i] || frequencyRanges[frequencyRanges.length - 1]
      
      // 将频率转换为 bin 索引
      const startBin = Math.floor((range.min / nyquist) * data.length)
      const endBin = Math.floor((range.max / nyquist) * data.length)
      
      // 确保范围有效
      const actualStart = Math.max(0, startBin)
      const actualEnd = Math.min(data.length - 1, endBin)
      
      if (debug && Math.random() < 0.01) {
        log(`频段 ${i} (${range.name}): ${range.min}-${range.max}Hz, bins ${actualStart}-${actualEnd}`)
      }
      
      // 计算该频段的 RMS (均方根) 值，而不是简单平均
      let sumSquares = 0
      let count = 0
      
      for (let j = actualStart; j <= actualEnd; j++) {
        const value = data[j]
        sumSquares += value * value
        count++
      }
      
      const rms = count > 0 ? Math.sqrt(sumSquares / count) : 0
      result.push(rms)
    }
    
    return result
  }

  // 应用频段特定的增强
  function applyFrequencyEnhancement(bands: number[]): number[] {
    const boosts = [bassBoost, midBoost, trebleBoost, trebleBoost]
    
    return bands.map((value, index) => {
      const boost = boosts[index] || 1
      let enhanced = value * boost
      
      // 应用压缩曲线，防止过度增强
      enhanced = 255 * Math.tanh(enhanced / 255)
      
      return Math.min(255, Math.max(0, enhanced))
    })
  }

  // 连接音频元素
  function connectAudio(audioElement: HTMLAudioElement) {
    log('🔗 连接音频元素...')
    
    if (currentAudioElement === audioElement) {
      log('音频元素相同，跳过重复连接')
      return
    }
    
    // 清理旧的连接
    cleanup()
    
    currentAudioElement = audioElement
    
    // 等待音频加载完成后再初始化
    if (audioElement.readyState >= 2) {
      initAudioContext(audioElement)
    } else {
      audioElement.addEventListener('loadeddata', () => {
        initAudioContext(audioElement)
      }, { once: true })
    }
    
    // 监听播放状态
    audioElement.addEventListener('play', startAnalysis)
    audioElement.addEventListener('pause', stopAnalysis)
    audioElement.addEventListener('ended', stopAnalysis)
    
    // 监听错误
    audioElement.addEventListener('error', (e) => {
      log('❌ 音频加载错误:', e)
      error.value = '音频加载失败'
    })
  }

  // 断开音频元素
  function disconnectAudio() {
    if (currentAudioElement) {
      currentAudioElement.removeEventListener('play', startAnalysis)
      currentAudioElement.removeEventListener('pause', stopAnalysis)
      currentAudioElement.removeEventListener('ended', stopAnalysis)
      currentAudioElement = null
    }
    cleanup()
  }

  // 清理资源
  function cleanup() {
    stopAnalysis()
    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close()
    }
    audioContext = null
    analyser = null
    source = null
    dataArray = null
    isInitialized.value = false
  }

  // 手动测试数据
  function testWithFakeData() {
    log('🧪 开始平衡频谱模拟测试')
    isAnalyzing.value = true
    
    let testCount = 0
    const maxTests = 50
    
    const fakeInterval = setInterval(() => {
      // 模拟更平衡的频谱数据
      barHeights.value = [
        Math.random() * 60 + 20,  // 低音：20-80
        Math.random() * 80 + 10,  // 中低音：10-90
        Math.random() * 90 + 5,   // 中高音：5-95
        Math.random() * 70 + 15   // 高音：15-85
      ]
      testCount++
      
      if (testCount >= maxTests) {
        clearInterval(fakeInterval)
        barHeights.value = Array(barCount).fill(0)
        isAnalyzing.value = false
        log('🧪 模拟测试结束')
      }
    }, 100)
  }

  // 动态调整增强参数
  function updateEnhancement(bass: number, mid: number, treble: number) {
    options.bassBoost = bass
    options.midBoost = mid
    options.trebleBoost = treble
    log('更新频段增强:', { bass, mid, treble })
  }

  // 组件卸载时清理
  onUnmounted(() => {
    disconnectAudio()
  })

  return {
    barHeights,
    isAnalyzing,
    isInitialized,
    error,
    connectAudio,
    disconnectAudio,
    startAnalysis,
    stopAnalysis,
    testWithFakeData,
    updateEnhancement
  }
}