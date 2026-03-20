const { react } = require("../../lib/functions")
const { downloadContentFromMessage } = require("baileys")
const fs = require("fs")
const path = require("path")
const axios = require("axios")
const FormData = require("form-data")

class ImgUpscaler {
  constructor() {
    this.baseUrl = 'https://get1.imglarger.com'
    this.headers = {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
      'Origin': 'https://imgupscaler.com',
      'Referer': 'https://imgupscaler.com/'
    }
  }

  async uploadImage(imagePath) {
    const form = new FormData()
    const filename = path.basename(imagePath)
    form.append('myfile', fs.createReadStream(imagePath), filename)
    form.append('scaleRadio', '2')

    const response = await axios.post(`${this.baseUrl}/api/UpscalerNew/UploadNew`, form, {
      headers: {
        ...this.headers,
        ...form.getHeaders()
      }
    })

    return response.data
  }

  async checkStatus(code) {
    try {
      const response = await axios.post(`${this.baseUrl}/api/UpscalerNew/CheckStatusNew`, {
        code: code,
        scaleRadio: 2
      }, {
        headers: {
          ...this.headers,
          'Content-Type': 'application/json'
        }
      })

      return response.data
    } catch (error) {
      console.error("CheckStatus error:", error.message)
      return null
    }
  }

  async waitForResult(code) {
    let attempts = 0
    const maxAttempts = 30

    while (attempts < maxAttempts) {
      const result = await this.checkStatus(code)
      
      if (result && result.code === 200 && result.data) {
        if (result.data.status === 'success' && result.data.downloadUrls && result.data.downloadUrls.length > 0) {
          return result.data.downloadUrls[0]
        }
      }
      
      attempts++
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    throw new Error('Waktu habis, coba lagi nanti')
  }

  async process(imagePath) {
    try {
      const upload = await this.uploadImage(imagePath)
      
      if (!upload || !upload.data || !upload.data.code) {
        throw new Error('Gagal upload gambar')
      }
      
      const resultUrl = await this.waitForResult(upload.data.code)
      
      return {
        success: true,
        url: resultUrl
      }
    } catch (error) {
      console.error("Process error:", error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

async function downloadMedia(msg) {
  const type = Object.keys(msg)[0]
  const stream = await downloadContentFromMessage(msg[type], type.replace('Message', ''))
  let buffer = Buffer.from([])
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk])
  }
  return buffer
}

module.exports = {
  commands: ["hd", "enhance", "upscale"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    try {
      await react(ryza, from, msg, "⏳")

      let mediaMessage = null
      let mediaType = null
      let fileName = null

      if (msg.message.imageMessage) {
        mediaMessage = msg.message
        mediaType = 'imageMessage'
        fileName = `image_${Date.now()}.png`
      }
      
      if (!mediaMessage) {
        const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
        if (quotedMsg && quotedMsg.imageMessage) {
          mediaMessage = quotedMsg
          mediaType = 'imageMessage'
          fileName = `image_${Date.now()}.png`
        }
      }

      if (!mediaMessage) {
        await react(ryza, from, msg, "❌")
        await ryza.sendMessage(from, { 
          text: "Cara Penggunaan:\n1. Kirim foto dengan caption .hd\n2. Reply foto dengan .hd" 
        }, { quoted: msg })
        return
      }

      const mediaBuffer = await downloadMedia({ [mediaType]: mediaMessage[mediaType] })

      const tempDir = path.join(__dirname, "../../temp")
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

      const inputPath = path.join(tempDir, fileName)
      const outputPath = path.join(tempDir, `hd_${Date.now()}.png`)
      
      fs.writeFileSync(inputPath, mediaBuffer)

      const scraper = new ImgUpscaler()
      const result = await scraper.process(inputPath)
      
      if (!result.success || !result.url) {
        throw new Error(result.error || 'Gagal memproses gambar')
      }

      const hdResponse = await axios.get(result.url, { responseType: 'arraybuffer' })
      fs.writeFileSync(outputPath, hdResponse.data)

      await react(ryza, from, msg, "✅")

      await ryza.sendMessage(from, {
        document: fs.readFileSync(outputPath),
        mimetype: 'image/png',
        fileName: `hd_${Date.now()}.png`
      }, { quoted: msg })

      fs.unlinkSync(inputPath)
      fs.unlinkSync(outputPath)

    } catch (error) {
      console.error("HD error:", error)
      await react(ryza, from, msg, "❌")
      await ryza.sendMessage(from, { 
        text: `Gagal: ${error.message}` 
      }, { quoted: msg })
    }
  }
}