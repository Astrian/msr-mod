/// <reference types="vite/client" />

type SongList = {
	list: Song[]
}

type Song = {
  cid: string
  name: string
  albumCid?: string
  mvUrl?: string | null
  mvCoverUrl?: string | null
	sourceUrl?: string | null
	lyricUrl?: string | null
  artistes?: string[]
  artists?: string[]
}

type Album = {
  cid: string
  name: string
  intro?: string
  belong?: string
  coverUrl: string
  coverDeUrl?: string
  artistes: string[]
  songs?: Song[]
}

type AlbumList = Album[]

interface ApiResponse {
	code: number
	msg: string
	data: unknown
}

interface QueueItem {
  song: Song
  album?: Album
  sourceUrl?: string
  lyricUrl?: string | null
}

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
  duration?: number // 添加间隔持续时间
}
