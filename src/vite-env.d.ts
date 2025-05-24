/// <reference types="vite/client" />

type SongList = {
	list: Song[]
}

type Song = {
  cid: string
  name: string
  albumCid: string
  sourceUrl?: string
  lyricUrl?: string | null
  mvUrl?: string | null
  mvCoverUrl?: string | null
  artists: string[]
}

type Album = {
  cid: string
  name: string
  intro?: string
  belong?: string
  coverUrl: string
  coverDeUrl?: string
  artistes: string[]
}

type AlbumList = Album[]

interface ApiResponse {
	code: number
	msg: string
	data: unknown
}