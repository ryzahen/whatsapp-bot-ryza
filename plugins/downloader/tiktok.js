const axios = require("axios")
const { react } = require("../../lib/functions")

module.exports = {
  commands: ["tt", "tiktok", "tiktokdl"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    try {
      await react(ryza, from, msg, "⏳")
      
      const regex = /(https:\/\/(vt|vm)\.tiktok\.com\/[^\s]+|https:\/\/www\.tiktok\.com\/@[\w.-]+\/video\/\d+)/
      const parseUrl = text.match(regex)?.[0]
      
      if (!parseUrl) {
        await react(ryza, from, msg, "⏳")
        await ryza.sendMessage(from, { 
          text: `Penggunaan: .tt [url]\nContoh: .tt https://vt.tiktok.com/xxxxx` 
        }, { quoted: msg })
        return
      }

      const res = await axios.get(`https://www.tikwm.com/api/?url=${parseUrl}&hd=1`)
      
      if (!res.data || !res.data.data) {
        await react(ryza, from, msg, "⏳")
        await ryza.sendMessage(from, { 
          text: 'Gagal mengambil data dari TikTok.' 
        }, { quoted: msg })
        return
      }

      const data = res.data.data
      await react(ryza, from, msg, "✅")

      if (data.images && data.images.length > 0) {
        for (let img of data.images) {
          await ryza.sendMessage(from, { 
            image: { url: img }, 
            caption: 'Download berhasil' 
          }, { quoted: msg })
        }
      } else {
        await ryza.sendMessage(from, { 
          video: { url: data.play }, 
          caption: 'Download berhasil' 
        }, { quoted: msg })
      }

      if (data.music_info?.play) {
        await ryza.sendMessage(from, { 
          audio: { url: data.music_info.play }, 
          mimetype: "audio/mpeg"
        }, { quoted: msg })
      }

    } catch (err) {
      console.error(err)
      await react(ryza, from, msg, "⏳")
      await ryza.sendMessage(from, { 
        text: "Terjadi kesalahan saat memproses permintaan." 
      }, { quoted: msg })
    }
  }
}