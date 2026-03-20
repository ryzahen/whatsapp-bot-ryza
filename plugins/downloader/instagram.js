const axios = require("axios")
const { react } = require("../../lib/functions")

module.exports = {
  commands: ["ig", "igdl", "instagram"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    try {
      await react(ryza, from, msg, "⏳")
      
      if (!text) {
        await react(ryza, from, msg, "⏳")
        await ryza.sendMessage(from, { 
          text: `Penggunaan: .ig [url]\nContoh: .ig https://www.instagram.com/p/xxxxx` 
        }, { quoted: msg })
        return
      }

      const regex = /(https?:\/\/(?:www\.)?instagram\.com\/(p|reel|tv)\/[a-zA-Z0-9_-]+\/?)/i
      const igUrl = text.match(regex)?.[0]
      
      if (!igUrl) {
        await react(ryza, from, msg, "⏳")
        await ryza.sendMessage(from, { 
          text: 'Link Instagram tidak valid.' 
        }, { quoted: msg })
        return
      }

      const response = await axios.post('https://vdraw.ai/api/v1/instagram/ins-info', {
        url: igUrl,
        type: 'video'
      }, {
        headers: { 'Content-Type': 'application/json' }
      })

      const data = response.data?.data

      if (!data?.info?.length) {
        await react(ryza, from, msg, "⏳")
        await ryza.sendMessage(from, { 
          text: 'Konten tidak ditemukan.' 
        }, { quoted: msg })
        return
      }

      await react(ryza, from, msg, "✅")
      
      const medias = data.info
      const caption = 'Download berhasil'

      if (data.media_type === 'photo' || medias.length > 1) {
        for (const media of medias) {
          await ryza.sendMessage(from, {
            image: { url: media.url },
            caption: caption
          }, { quoted: msg })
          
          if (medias.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 1500))
          }
        }
      } else {
        await ryza.sendMessage(from, {
          video: { url: medias[0].url },
          caption: caption
        }, { quoted: msg })
      }

    } catch (err) {
      console.error(err)
      await react(ryza, from, msg, "⏳")
      await ryza.sendMessage(from, { 
        text: `Terjadi kesalahan: ${err.message}` 
      }, { quoted: msg })
    }
  }
}