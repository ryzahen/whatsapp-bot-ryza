const { react } = require("../../lib/functions")
const { downloadContentFromMessage } = require("baileys")
const fs = require("fs")
const path = require("path")
const axios = require("axios")
const FormData = require("form-data")

async function downloadMedia(msg) {
  const type = Object.keys(msg)[0]
  const stream = await downloadContentFromMessage(msg[type], type.replace('Message', ''))
  let buffer = Buffer.from([])
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk])
  }
  return buffer
}

async function uploadCatbox(filePath) {
  try {
    const form = new FormData()
    form.append('reqtype', 'fileupload')
    form.append('fileToUpload', fs.createReadStream(filePath))
    
    const response = await axios.post('https://catbox.moe/user/api.php', form, {
      headers: {
        ...form.getHeaders()
      }
    })

    return response.data || false
  } catch (err) {
    console.error("Upload catbox error:", err?.response?.data || err.message)
    return false
  }
}

module.exports = {
  commands: ["tourl", "upload", "catbox"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    try {
      await react(ryza, from, msg, "⏳")

      let mediaMessage = null
      let mediaType = null
      let fileName = null

      if (msg.message.imageMessage) {
        mediaMessage = msg.message
        mediaType = 'imageMessage'
        fileName = `image_${Date.now()}.jpg`
      } else if (msg.message.videoMessage) {
        mediaMessage = msg.message
        mediaType = 'videoMessage'
        fileName = `video_${Date.now()}.mp4`
      } else if (msg.message.audioMessage) {
        mediaMessage = msg.message
        mediaType = 'audioMessage'
        fileName = `audio_${Date.now()}.mp3`
      } else if (msg.message.documentMessage) {
        mediaMessage = msg.message
        mediaType = 'documentMessage'
        fileName = msg.message.documentMessage.fileName || `document_${Date.now()}.bin`
      }
      
      if (!mediaMessage) {
        const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
        if (quotedMsg) {
          if (quotedMsg.imageMessage) {
            mediaMessage = quotedMsg
            mediaType = 'imageMessage'
            fileName = `image_${Date.now()}.jpg`
          } else if (quotedMsg.videoMessage) {
            mediaMessage = quotedMsg
            mediaType = 'videoMessage'
            fileName = `video_${Date.now()}.mp4`
          } else if (quotedMsg.audioMessage) {
            mediaMessage = quotedMsg
            mediaType = 'audioMessage'
            fileName = `audio_${Date.now()}.mp3`
          } else if (quotedMsg.documentMessage) {
            mediaMessage = quotedMsg
            mediaType = 'documentMessage'
            fileName = quotedMsg.documentMessage.fileName || `document_${Date.now()}.bin`
          }
        }
      }

      if (!mediaMessage) {
        await react(ryza, from, msg, "❌")
        await ryza.sendMessage(from, { 
          text: "Cara Penggunaan:\n1. Kirim foto/video dengan caption .tourl\n2. Reply media dengan .tourl" 
        }, { quoted: msg })
        return
      }

      const mediaBuffer = await downloadMedia({ [mediaType]: mediaMessage[mediaType] })

      const tempDir = path.join(__dirname, "../../temp")
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

      const filePath = path.join(tempDir, fileName)
      fs.writeFileSync(filePath, mediaBuffer)

      const result = await uploadCatbox(filePath)

      fs.unlinkSync(filePath)

      if (!result) {
        await react(ryza, from, msg, "❌")
        await ryza.sendMessage(from, { 
          text: "Gagal mengupload media." 
        }, { quoted: msg })
        return
      }

      await react(ryza, from, msg, "✅")

      await ryza.sendMessage(from, {
        text: `URL: ${result}\n\n> powered by api.ryzahen.site`
      }, { quoted: msg })

    } catch (error) {
      console.error("Tourl error:", error)
      await react(ryza, from, msg, "❌")
      await ryza.sendMessage(from, { 
        text: `Gagal: ${error.message}` 
      }, { quoted: msg })
    }
  }
}