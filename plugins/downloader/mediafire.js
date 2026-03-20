const axios = require("axios")
const cheerio = require("cheerio")
const { react } = require("../../lib/functions")

class MediaFire {
  constructor() {
    this.baseHeaders = {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'max-age=0',
      'Priority': 'u=0, i',
      'Sec-Ch-Ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Linux"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'
    }
    this.cookieString = ''
    this.client = axios.create({ timeout: 30000, maxRedirects: 5, headers: this.baseHeaders })
    this.client.interceptors.response.use((response) => {
      const setCookieHeader = response.headers['set-cookie']
      if (setCookieHeader) {
        setCookieHeader.forEach(cookie => {
          const cookieParts = cookie.split(';')[0].split('=')
          if (cookieParts.length >= 2) {
            const cookieName = cookieParts[0]
            const cookieValue = cookieParts.slice(1).join('=')
            if (!this.cookieString.includes(`${cookieName}=`)) {
              this.cookieString += (this.cookieString ? '; ' : '') + `${cookieName}=${cookieValue}`
            }
          }
        })
        this.client.defaults.headers.common['Cookie'] = this.cookieString
      }
      return response
    })
  }

  async getFileInfo(url) {
    const response = await this.client.get(url)
    const $ = cheerio.load(response.data)
    
    const downloadLink = $('#downloadButton').attr('href')
    const directLink = downloadLink || null
    
    const fileName = $('.dl-btn-label').attr('title') || $('.promoDownloadName .dl-btn-label').text().trim() || null
    
    const fileSize = $('.download_link .input').text().match(/\(([^)]+)\)/)?.[1] || 
                     $('.download_link a').text().match(/\(([^)]+)\)/)?.[1] || 
                     $('.download_link .input').text().match(/\(([^)]+)\)/)?.[1] || 
                     $('.details .size').text().trim() || null
    
    return {
      success: true,
      data: {
        fileName,
        fileSize,
        directDownloadUrl: directLink,
        mediafireUrl: url
      }
    }
  }
}

module.exports = {
  commands: ["mediafire", "mf", "mfdl"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    try {
      await react(ryza, from, msg, "⏳")
      
      if (!text) {
        await react(ryza, from, msg, "⏳")
        await ryza.sendMessage(from, { 
          text: `Contoh: .mediafire https://www.mediafire.com/file/xxxxx` 
        }, { quoted: msg })
        return
      }

      const regex = /(https?:\/\/(?:www\.)?mediafire\.com\/(file|folder)\/[a-zA-Z0-9_]+\/?)/i
      const mfUrl = text.match(regex)?.[0]
      
      if (!mfUrl) {
        await react(ryza, from, msg, "⏳")
        await ryza.sendMessage(from, { 
          text: 'Link MediaFire tidak valid.' 
        }, { quoted: msg })
        return
      }

      const downloader = new MediaFire()
      const result = await downloader.getFileInfo(mfUrl)
      
      if (!result.success || !result.data.directDownloadUrl) {
        await react(ryza, from, msg, "⏳")
        await ryza.sendMessage(from, { 
          text: 'Gagal mengambil data dari MediaFire.' 
        }, { quoted: msg })
        return
      }

      await react(ryza, from, msg, "✅")
      
      const { fileName, fileSize, directDownloadUrl } = result.data
      
      const caption = `📁 *File:* ${fileName || 'Tidak diketahui'}\n📦 *Ukuran:* ${fileSize || 'Tidak diketahui'}\n\nDownload berhasil.`
      
      await ryza.sendMessage(from, {
        document: { url: directDownloadUrl },
        fileName: fileName || 'download',
        mimetype: 'application/octet-stream',
        caption: caption
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