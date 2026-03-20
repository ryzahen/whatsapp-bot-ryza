const { react } = require("../../lib/functions")
const { downloadContentFromMessage } = require("baileys")
const fs = require("fs").promises
const path = require("path")
const { exec } = require("child_process")
const util = require("util")
const execPromise = util.promisify(exec)

async function downloadMedia(msg, type) {
  let stream
  if (type === 'image') {
    stream = await downloadContentFromMessage(msg.message.imageMessage, 'image')
  } else if (type === 'video') {
    stream = await downloadContentFromMessage(msg.message.videoMessage, 'video')
  } else {
    throw new Error('Media tidak didukung')
  }

  let buffer = Buffer.from([])
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk])
  }
  return buffer
}

async function createSticker(inputPath, outputPath, isVideo = false) {
  try {
    if (isVideo) {
      const ffmpegCmd = `ffmpeg -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512" -t 10 -c:v libwebp -vcodec libwebp -lossless 0 -compression_level 6 -q:v 60 -loop 0 -an -vsync 0 -s 512:512 "${outputPath}"`
      await execPromise(ffmpegCmd)
    } else {
      const ffmpegCmd = `ffmpeg -i "${inputPath}" -vf "scale=512:512:force_original_aspect_ratio=increase,crop=512:512" -vcodec libwebp -lossless 0 -compression_level 6 -q:v 60 -loop 0 -an -vsync 0 -s 512:512 "${outputPath}"`
      await execPromise(ffmpegCmd)
    }
    return true
  } catch (error) {
    console.error("FFmpeg error:", error)
    throw error
  }
}

module.exports = {
  commands: ["sticker", "s", "stiker"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    try {
      await react(ryza, from, msg, "⏳")

      let targetMsg = msg
      let mediaType = null
      
      const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage
      const quotedKey = msg.message.extendedTextMessage?.contextInfo?.stanzaId
      
      if (quotedMsg) {
        targetMsg = {
          message: quotedMsg,
          key: {
            id: quotedKey,
            remoteJid: from
          }
        }
      }
      
      if (targetMsg.message.imageMessage) {
        mediaType = 'image'
      } else if (targetMsg.message.videoMessage) {
        mediaType = 'video'
        
        const duration = targetMsg.message.videoMessage.seconds || 0
        if (duration > 10) {
          await react(ryza, from, msg, "❌")
          await ryza.sendMessage(from, { 
            text: "Video terlalu panjang. Maksimal 10 detik untuk sticker GIF." 
          }, { quoted: msg })
          return
        }
      } else {
        await react(ryza, from, msg, "❌")
        await ryza.sendMessage(from, { 
          text: "Cara Penggunaan:\nKirim gambar/video dengan caption .sticker\nAtau reply gambar/video dengan .sticker\n\nUntuk video maksimal 10 detik." 
        }, { quoted: msg })
        return
      }

      const mediaBuffer = await downloadMedia(targetMsg, mediaType)
      
      if (!mediaBuffer || mediaBuffer.length === 0) {
        await react(ryza, from, msg, "❌")
        await ryza.sendMessage(from, { 
          text: "Gagal mengunduh media." 
        }, { quoted: msg })
        return
      }

      const tempDir = path.join(__dirname, "../../temp")
      try {
        await fs.access(tempDir)
      } catch {
        await fs.mkdir(tempDir, { recursive: true })
      }

      const inputExt = mediaType === 'image' ? 'jpg' : 'mp4'
      const inputPath = path.join(tempDir, `input_${Date.now()}.${inputExt}`)
      const outputPath = path.join(tempDir, `output_${Date.now()}.webp`)

      await fs.writeFile(inputPath, mediaBuffer)

      await createSticker(inputPath, outputPath, mediaType === 'video')

      const stickerBuffer = await fs.readFile(outputPath)

      await fs.unlink(inputPath).catch(() => {})
      await fs.unlink(outputPath).catch(() => {})

      await react(ryza, from, msg, "✅")

      await ryza.sendMessage(from, {
        sticker: stickerBuffer
      }, { quoted: msg })

    } catch (error) {
      console.error(error)
      await react(ryza, from, msg, "❌")
      await ryza.sendMessage(from, { 
        text: `Error: ${error.message}` 
      }, { quoted: msg })
    }
  }
}