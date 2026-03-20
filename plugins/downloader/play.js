const { ytmp3 } = require("yt-downld")
const { react } = require("../../lib/functions")

module.exports = {
  commands: ["play", "ytplay", "lagu"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    try {
      await react(ryza, from, msg, "⏳")
      
      if (!text) {
        await react(ryza, from, msg, "❌")
        await ryza.sendMessage(from, { 
          text: "Cara Penggunaan:\n.play <judul lagu>\n.play <url youtube>\n\nContoh:\n.play hindia evaluasi\n.play https://youtu.be/ZkWTSO13rdk" 
        }, { quoted: msg })
        return
      }

      let url = text.trim()
      
      const youtubeRegex = /(youtu\.be\/|youtube\.com\/(watch\?v=|embed\/|v\/))([^\?&"\'>]+)/
      const match = url.match(youtubeRegex)
      
      if (!match) {
        url = await searchYoutube(url)
        if (!url) {
          await react(ryza, from, msg, "❌")
          await ryza.sendMessage(from, { 
            text: "Tidak dapat menemukan video untuk pencarian tersebut." 
          }, { quoted: msg })
          return
        }
      }

      const result = await ytmp3(url)

      if (!result || !result.download) {
        await react(ryza, from, msg, "❌")
        await ryza.sendMessage(from, { 
          text: "Gagal mengambil audio." 
        }, { quoted: msg })
        return
      }

      await react(ryza, from, msg, "✅")

      const infoText = `Judul: ${result.title}\nDurasi: ${result.duration}`

      await ryza.sendMessage(from, {
        text: infoText
      }, { quoted: msg })

      await ryza.sendMessage(from, {
        audio: { url: result.download },
        mimetype: 'audio/mpeg',
        fileName: `${result.title}.mp3`
      }, { quoted: msg })

    } catch (error) {
      console.error("Play error:", error)
      await react(ryza, from, msg, "❌")
      await ryza.sendMessage(from, { 
        text: `Gagal: ${error.message}` 
      }, { quoted: msg })
    }
  }
}

async function searchYoutube(query) {
  try {
    const axios = require("axios")
    const response = await axios.get(`https://www.youtube.com/results`, {
      params: { search_query: query }
    })
    
    const html = response.data
    const regex = /watch\?v=([a-zA-Z0-9_-]{11})/
    const match = html.match(regex)
    
    if (match && match[1]) {
      return `https://youtu.be/${match[1]}`
    }
    
    return null
  } catch (error) {
    console.error("Search error:", error)
    return null
  }
}