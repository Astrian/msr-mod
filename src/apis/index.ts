import axios from 'axios'

const msrInstance = axios.create({
	baseURL: 'https://monster-siren.hypergryph.com/api/',
})

export default {
	async getSongs() {
		const songs: {
			data: ApiResponse
		} = await msrInstance.get('songs')
		if (songs.data.code !== 0) { throw new Error(`Cannot get songs: ${songs.data.msg}`) }
		return { songs: songs.data.data as { list: SongList } }
	},
	async getSong(cid: string) {
		const song: {
			data: ApiResponse
		} = await msrInstance.get(`song/${cid}`)
		if (song.data.code!== 0) { throw new Error(`Cannot get song: ${song.data.msg}`) }
		return song.data.data as Song
	},
	async getAlbums() {
		const albums: {
			data: ApiResponse
		} = await msrInstance.get('albums')
		if (albums.data.code!== 0) { throw new Error(`Cannot get albums: ${albums.data.msg}`) }
		return albums.data.data as AlbumList
	},
	async getAlbum(cid: string) {
		const album: {
			data: ApiResponse
		} = await msrInstance.get(`album/${cid}/detail`)
		if (album.data.code!== 0) { throw new Error(`Cannot get album: ${album.data.msg}`) }
		const albumMeta: {
			data: ApiResponse
		} = await msrInstance.get(`album/${cid}/data`)
		let data = album.data.data as Album
		data.artistes = (albumMeta.data.data as Album).artistes
		return data
	}
}
