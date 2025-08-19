import createDebug from 'debug'

// 创建不同模块的 debug 实例
export const debugPlayer = createDebug('msr:player')
export const debugStore = createDebug('msr:store')
export const debugApi = createDebug('msr:api')
export const debugUI = createDebug('msr:ui')
export const debugUtils = createDebug('msr:utils')
export const debugVisualizer = createDebug('msr:visualizer')
export const debugResource = createDebug('msr:resource')
export const debugLyrics = createDebug('msr:lyrics')
export const debugPlayroom = createDebug('msr:playroom')

// 通用 debug 实例
export const debug = createDebug('msr:app')

// 在开发环境下默认启用所有 debug
if (import.meta.env.DEV) {
	// 从环境变量或 localStorage 读取 DEBUG 设置
	const debugEnv = import.meta.env.VITE_DEBUG || localStorage.getItem('DEBUG')
	if (debugEnv) {
		createDebug.enable(debugEnv)
	} else {
		// 开发环境默认启用所有 msr: 相关的调试
		createDebug.enable('msr:*')
	}
}

// 导出 createDebug 以便其他地方创建自定义实例
export default createDebug