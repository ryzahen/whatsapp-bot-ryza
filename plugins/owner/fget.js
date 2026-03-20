const fs = require("fs").promises
const path = require("path")
const { isOwner } = require("../../lib/helper")

module.exports = {
  commands: ["fget", "fileget", "ambilfile"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    if (!isOwner(sender)) {
      await ryza.sendMessage(from, { 
        text: "Maaf, perintah ini hanya untuk owner bot." 
      }, { quoted: msg })
      return
    }

    try {
      if (!text) {
        await ryza.sendMessage(from, { 
          text: "Cara Penggunaan:\n.fget <path file>\n\nContoh:\n.fget plugins/downloader/tt.js\n.fget index.js\n.fget config.js" 
        }, { quoted: msg })
        return
      }

      let targetPath = text.trim()
      
      if (targetPath.startsWith("/")) {
        targetPath = "." + targetPath
      }
      
      const fullPath = path.resolve(targetPath)
      
      try {
        await fs.access(fullPath)
      } catch {
        await ryza.sendMessage(from, { 
          text: `File tidak ditemukan: ${targetPath}` 
        }, { quoted: msg })
        return
      }
      
      const stats = await fs.stat(fullPath)
      
      if (stats.isDirectory()) {
        await ryza.sendMessage(from, { 
          text: `Path adalah directory, bukan file: ${targetPath}` 
        }, { quoted: msg })
        return
      }
      
      const fileSize = (stats.size / 1024).toFixed(2)
      const maxSize = 50 * 1024
      
      if (stats.size > maxSize) {
        await ryza.sendMessage(from, { 
          text: `File terlalu besar (${fileSize} KB). Maksimal 50 MB.` 
        }, { quoted: msg })
        return
      }
      
      const fileBuffer = await fs.readFile(fullPath)
      const fileName = path.basename(fullPath)
      
      await ryza.sendMessage(from, {
        document: fileBuffer,
        mimetype: "application/octet-stream",
        fileName: fileName,
        caption: `📄 ${fileName} (${fileSize} KB)`
      }, { quoted: msg })

    } catch (error) {
      console.error(error)
      await ryza.sendMessage(from, { 
        text: `Error: ${error.message}` 
      }, { quoted: msg })
    }
  }
}