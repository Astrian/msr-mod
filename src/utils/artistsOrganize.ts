export default (list: string[]) => {
	if (list.length === 0) { return '未知音乐人' }
	return list.map((artist) => {
		return artist
	}).join(' / ')
}