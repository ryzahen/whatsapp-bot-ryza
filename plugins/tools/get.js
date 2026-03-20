const axios = require("axios")
const { react } = require("../../lib/functions")

module.exports = {
  commands: ["get", "fetch", "httpget", "html"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    try {
      await react(ryza, from, msg, "⏳")
      
      if (!text) {
        await react(ryza, from, msg, "❌")
        await ryza.sendMessage(from, { 
          text: `Cara Penggunaan:
.get <url>

Contoh:
.get https://example.com
.get https://google.com` 
        }, { quoted: msg })
        return
      }

      let url = text.trim()
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url
      }

      const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i
      if (!urlRegex.test(url)) {
        await react(ryza, from, msg, "❌")
        await ryza.sendMessage(from, { 
          text: 'URL tidak valid! Masukkan URL yang benar.' 
        }, { quoted: msg })
        return
      }

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      })

      const html = response.data
      const contentType = response.headers['content-type']

      if (!contentType || !contentType.includes('text/html')) {
        await react(ryza, from, msg, "⚠️")
        await ryza.sendMessage(from, { 
          text: `URL tersebut bukan halaman HTML.` 
        }, { quoted: msg })
        return
      }

      const maxLength = 65000
      let htmlContent = html
      
      if (html.length > maxLength) {
        htmlContent = html.substring(0, maxLength) + `\n\n... (terpotong, total ukuran ${(html.length / 1024).toFixed(2)} KB)`
      }

      await react(ryza, from, msg, "✅")
      
      await ryza.sendMessage(from, {
        text: `\`\`\`${htmlContent}\`\`\``
      }, { quoted: msg })

    } catch (error) {
      console.error(error)
      await react(ryza, from, msg, "❌")
      
      let errorMessage = 'Gagal mengambil halaman.'
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Timeout: Server terlalu lama merespon.'
      } else if (error.response) {
        errorMessage = `HTTP Error: ${error.response.status} - ${error.response.statusText}`
      } else if (error.request) {
        errorMessage = 'Tidak dapat terhubung ke server.'
      } else if (error.message.includes('ENOTFOUND')) {
        errorMessage = 'Domain tidak ditemukan.'
      }

      await ryza.sendMessage(from, { 
        text: `Error: ${errorMessage}` 
      }, { quoted: msg })
    }
  }
}