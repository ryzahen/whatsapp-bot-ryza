const axios = require("axios")
const { react } = require("../../lib/functions")

module.exports = {
  commands: ["ssweb", "screenshotweb", "ss"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    try {
      await react(ryza, from, msg, "⏳")
      
      if (!text) {
        await react(ryza, from, msg, "❌")
        await ryza.sendMessage(from, { 
          text: `Cara Penggunaan:\n.ssweb <url>\n\nContoh:\n.ssweb https://example.com\n.ssweb https://github.com` 
        }, { quoted: msg })
        return
      }

      let url = text.trim()
      
      if (!url.startsWith('https://')) {
        url = 'https://' + url
      }

      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i
      if (!urlRegex.test(url)) {
        await react(ryza, from, msg, "❌")
        await ryza.sendMessage(from, { 
          text: 'URL tidak valid. Masukkan URL yang benar.' 
        }, { quoted: msg })
        return
      }

      await ryza.sendMessage(from, {
        text: `⏳ Mengambil screenshot dari ${url}...`
      }, { quoted: msg })

      const { data } = await axios.post(
        "https://gcp.imagy.app/screenshot/createscreenshot",
        {
          url: url,
          browserWidth: 1280,
          browserHeight: 720,
          fullPage: true,
          deviceScaleFactor: 1,
          format: "png",
        },
        {
          headers: {
            "content-type": "application/json",
            referer: "https://imagy.app/full-page-screenshot-taker/",
            "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
          },
        }
      )

      if (!data || !data.fileUrl) {
        await react(ryza, from, msg, "❌")
        await ryza.sendMessage(from, { 
          text: 'Gagal mengambil screenshot.' 
        }, { quoted: msg })
        return
      }

      await react(ryza, from, msg, "✅")

      await ryza.sendMessage(from, {
        image: { url: data.fileUrl },
        caption: `Screenshot dari ${url}`
      }, { quoted: msg })

    } catch (error) {
      console.error(error)
      await react(ryza, from, msg, "❌")
      
      let errorMessage = 'Gagal mengambil screenshot.'
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }

      await ryza.sendMessage(from, { 
        text: `Error: ${errorMessage}` 
      }, { quoted: msg })
    }
  }
}