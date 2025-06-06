import axios from 'axios'
import apis from '../apis'

/**
 * 检查歌曲资源 URL 是否可用，如果不可用则刷新
 * @param song 要检查的歌曲对象
 * @param updateCallback 更新歌曲信息的回调函数
 * @returns 更新后的歌曲对象（如果需要更新）或原始歌曲对象
 */
export const checkAndRefreshSongResource = async (
  song: Song,
  updateCallback?: (updatedSong: Song) => void
): Promise<Song> => {
  if (!song.sourceUrl) {
    console.warn('[ResourceChecker] 歌曲没有 sourceUrl:', song.name)
    return song
  }

  try {
    // 检查资源是否可用
    await axios.head(song.sourceUrl, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      params: {
        _t: Date.now() // 添加时间戳参数避免缓存
      },
      timeout: 5000 // 5秒超时
    })
    
    // 资源可用，返回原始歌曲
    console.log('[ResourceChecker] 资源可用:', song.name)
    return song
  } catch (error) {
    // 资源不可用，刷新歌曲信息
    console.log('[ResourceChecker] 资源不可用，正在刷新:', song.name, error)
    
    try {
      const updatedSong = await apis.getSong(song.cid)
      console.log('[ResourceChecker] 歌曲信息已刷新:', updatedSong.name)
      
      // 调用更新回调（如果提供）
      if (updateCallback) {
        updateCallback(updatedSong)
      }
      
      return updatedSong
    } catch (refreshError) {
      console.error('[ResourceChecker] 刷新歌曲信息失败:', refreshError)
      // 刷新失败，返回原始歌曲
      return song
    }
  }
}

/**
 * 批量检查多首歌曲的资源
 * @param songs 要检查的歌曲数组
 * @param updateCallback 更新单首歌曲信息的回调函数
 * @returns 更新后的歌曲数组
 */
export const checkAndRefreshMultipleSongs = async (
  songs: Song[],
  updateCallback?: (updatedSong: Song, originalIndex: number) => void
): Promise<Song[]> => {
  const results: Song[] = []
  
  for (let i = 0; i < songs.length; i++) {
    const originalSong = songs[i]
    const updatedSong = await checkAndRefreshSongResource(
      originalSong,
      updateCallback ? (updated) => updateCallback(updated, i) : undefined
    )
    results.push(updatedSong)
  }
  
  return results
}