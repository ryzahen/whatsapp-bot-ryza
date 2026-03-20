const axios = require("axios")
const { react } = require("../../lib/functions")

module.exports = {
  commands: ["spotify"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    try {
      await react(ryza, from, msg, "⏳")
      
      if (!text) {
        await react(ryza, from, msg, "❌")
        await ryza.sendMessage(from, { 
          text: "Cara Penggunaan:\n.spotify <url spotify>\n\nContoh:\n.spotify https://open.spotify.com/track/4pBxV3n3XpqKT7wqbMbCn8" 
        }, { quoted: msg })
        return
      }

      let url = text.trim()
      
      if (!url.includes('open.spotify.com/')) {
        await react(ryza, from, msg, "❌")
        await ryza.sendMessage(from, { 
          text: "URL tidak valid. Masukkan URL Spotify yang benar." 
        }, { quoted: msg })
        return
      }

      const apiUrl = `https://api.ryzahen.site/spotify?url=${encodeURIComponent(url)}`
      
      const response = await axios.get(apiUrl)
      const result = response.data

      if (!result || result.status !== 200 || !result.data) {
        await react(ryza, from, msg, "❌")
        await ryza.sendMessage(from, { 
          text: "Gagal mendapatkan data dari server." 
        }, { quoted: msg })
        return
      }

      await react(ryza, from, msg, "✅")

      const metadata = result.data.metadata
      const caption = `Spotify Downloader\n\nJudul: ${metadata.judul}\nArtis: ${metadata.artis}\nDurasi: ${metadata.durasi}\n\n> powered by api.ryzahen.site`

      if (metadata.cover) {
        await ryza.sendMessage(from, {
          image: { url: metadata.cover },
          caption: caption
        }, { quoted: msg })
      }

      await ryza.sendMessage(from, {
        audio: { url: result.data.download.url },
        mimetype: "audio/mpeg",
        fileName: `${metadata.judul}.mp3`
      }, { quoted: msg })

    } catch (error) {
      console.error(error)
      await react(ryza, from, msg, "❌")
      
      let errorMessage = "Gagal mengambil data."
      if (error.response) {
        errorMessage = `Server error: ${error.response.status}`
      } else if (error.request) {
        errorMessage = "Tidak dapat terhubung ke server."
      }

      await ryza.sendMessage(from, { 
        text: `Error: ${errorMessage}` 
      }, { quoted: msg })
    }
  }
}