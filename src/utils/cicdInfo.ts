export default {
	runId: import.meta.env.VITE_RUN_ID ?? '未知',
	hashId: import.meta.env.VITE_HASH_ID?.slice(0, 10) ?? '未知',
}