const axios = require("axios")
const { react } = require("../../lib/functions")

class YTDL {
  constructor() {
    this.baseUrl = 'https://ytdownloader.io'
    this.nonce = 'cf1ae5b0cc'
    this.headers = {
      'Accept': '*/*',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Content-Type': 'application/json',
      'Origin': this.baseUrl,
      'Referer': this.baseUrl + '/',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'x-visolix-nonce': this.nonce
    }
    
    this.formatMap = {
      'MP4 (360p)': '360',
      'MP4 (480p)': '480',
      'MP4 (720p)': '720',
      'MP4 (1080p)': '1080',
      'MP4 (1440p)': '1440',
      'WEBM (4K)': '2160'
    }
  }

  async getVideoInfo(url, format) {
    const payload = {
      url: url,
      format: this.formatMap[format],
      captcha_response: null
    }

    const response = await axios.post(
      `${this.baseUrl}/wp-json/visolix/api/download`,
      payload,
      { headers: this.headers }
    )

    const html = response.data.data
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?]+)/)?.[1]
    const downloadId = html.match(/download-btn-([a-zA-Z0-9]+)/)?.[1]
    const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`

    return {
      videoId,
      downloadId,
      thumbnail
    }
  }

  async getProgress(downloadId) {
    const payload = { id: downloadId }

    const response = await axios.post(
      `${this.baseUrl}/wp-json/visolix/api/progress`,
      payload,
      { headers: this.headers }
    )

    return response.data
  }

  async getSecureUrl(downloadUrl, downloadId) {
    const payload = {
      url: downloadUrl,
      host: 'youtube',
      video_id: downloadId
    }

    const response = await axios.post(
      `${this.baseUrl}/wp-json/visolix/api/youtube-secure-url`,
      payload,
      { headers: this.headers }
    )

    return response.data.secure_url
  }

  async downloadVideo(url) {
    const info = await this.getVideoInfo(url, 'MP4 (720p)')
    
    let progress = await this.getProgress(info.downloadId)
    
    while (progress.progress < 1000) {
      await new Promise(resolve => setTimeout(resolve, 2000))
      progress = await this.getProgress(info.downloadId)
    }

    const secureUrl = await this.getSecureUrl(progress.download_url, info.downloadId)
    
    return {
      videoId: info.videoId,
      thumbnail: info.thumbnail,
      downloadUrl: progress.download_url,
      secureUrl: secureUrl
    }
  }
}

module.exports = {
  commands: ["ytmp4", "ytv", "ytvideo"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    try {
      await react(ryza, from, msg, "⏳")
      
      if (!text) {
        await react(ryza, from, msg, "⏳")
        await ryza.sendMessage(from, { 
          text: `Contoh: .ytmp4 https://youtu.be/xxxxx` 
        }, { quoted: msg })
        return
      }

      const regex = /(youtu\.be\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]+)/
      const ytUrl = text.match(regex)?.[0] ? text : null
      
      if (!ytUrl) {
        await react(ryza, from, msg, "⏳")
        await ryza.sendMessage(from, { 
          text: 'Link YouTube tidak valid.' 
        }, { quoted: msg })
        return
      }

      const scraper = new YTDL()
      const result = await scraper.downloadVideo(ytUrl)
      
      await react(ryza, from, msg, "✅")
      
      await ryza.sendMessage(from, {
        video: { url: result.secureUrl },
        caption: `Download berhasil`
      }, { quoted: msg })

    } catch (err) {
      console.error(err)
      await react(ryza, from, msg, "⏳")
      await ryza.sendMessage(from, { 
        text: `Terjadi kesalahan: ${err.message}` 
      }, { quoted: msg })
    }
  }
}