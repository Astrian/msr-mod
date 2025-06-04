/**
 * 浏览器检测工具
 */

/**
 * 检测是否为 Safari 浏览器
 * @returns {boolean} 如果是 Safari 返回 true，否则返回 false
 */
export function isSafari(): boolean {
	const ua = navigator.userAgent.toLowerCase()
	
	// 检测 Safari 浏览器（包括 iOS 和 macOS）
	// Safari 的 User Agent 包含 'safari' 但不包含 'chrome' 或 'chromium'
	const isSafariBrowser = ua.includes('safari') && 
		!ua.includes('chrome') && 
		!ua.includes('chromium') &&
		!ua.includes('android')
	
	// 额外检查：使用 Safari 特有的 API
	const isSafariByFeature = 'safari' in window || 
		/^((?!chrome|android).)*safari/i.test(navigator.userAgent)
	
	return isSafariBrowser || isSafariByFeature
}

/**
 * 检测是否为移动版 Safari
 * @returns {boolean} 如果是移动版 Safari 返回 true，否则返回 false
 */
export function isMobileSafari(): boolean {
	return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
}

/**
 * 检测是否支持 Web Audio API 的完整功能
 * @returns {boolean} 如果支持返回 true，否则返回 false
 */
export function supportsWebAudioVisualization(): boolean {
	// Safari 在某些情况下对 AudioContext 的支持有限制
	// 特别是在处理跨域音频资源时
	if (isSafari()) {
		console.log('[BrowserDetection] Safari detected, audio visualization disabled')
		return false
	}
	
	// 检查基本的 Web Audio API 支持
	const hasAudioContext = 'AudioContext' in window || 'webkitAudioContext' in window
	const hasAnalyserNode = hasAudioContext && (
		'AnalyserNode' in window || 
		(window.AudioContext && 'createAnalyser' in AudioContext.prototype)
	)
	
	return hasAudioContext && hasAnalyserNode
}

/**
 * 获取浏览器信息
 * @returns {object} 包含浏览器类型和版本信息的对象
 */
export function getBrowserInfo() {
	const ua = navigator.userAgent
	let browserName = 'Unknown'
	let browserVersion = 'Unknown'
	
	if (isSafari()) {
		browserName = 'Safari'
		const versionMatch = ua.match(/Version\/(\d+\.\d+)/)
		if (versionMatch) {
			browserVersion = versionMatch[1]
		}
	} else if (ua.includes('Chrome')) {
		browserName = 'Chrome'
		const versionMatch = ua.match(/Chrome\/(\d+\.\d+)/)
		if (versionMatch) {
			browserVersion = versionMatch[1]
		}
	} else if (ua.includes('Firefox')) {
		browserName = 'Firefox'
		const versionMatch = ua.match(/Firefox\/(\d+\.\d+)/)
		if (versionMatch) {
			browserVersion = versionMatch[1]
		}
	} else if (ua.includes('Edge')) {
		browserName = 'Edge'
		const versionMatch = ua.match(/Edge\/(\d+\.\d+)/)
		if (versionMatch) {
			browserVersion = versionMatch[1]
		}
	}
	
	return {
		name: browserName,
		version: browserVersion,
		isSafari: isSafari(),
		isMobileSafari: isMobileSafari(),
		supportsAudioVisualization: supportsWebAudioVisualization()
	}
}