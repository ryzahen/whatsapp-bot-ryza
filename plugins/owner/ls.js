const fs = require("fs").promises
const path = require("path")
const { isOwner } = require("../../lib/helper")

module.exports = {
  commands: ["ls", "list", "dir"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    if (!isOwner(sender)) {
      await ryza.sendMessage(from, { 
        text: "Maaf, perintah ini hanya untuk owner bot." 
      }, { quoted: msg })
      return
    }

    try {
      let targetPath = text.trim() || "."
      
      if (targetPath.startsWith("/")) {
        targetPath = "." + targetPath
      }
      
      const fullPath = path.resolve(targetPath)
      
      try {
        await fs.access(fullPath)
      } catch {
        await ryza.sendMessage(from, { 
          text: `Path tidak ditemukan: ${targetPath}` 
        }, { quoted: msg })
        return
      }
      
      const stats = await fs.stat(fullPath)
      
      if (!stats.isDirectory()) {
        await ryza.sendMessage(from, { 
          text: `Path bukan directory: ${targetPath}` 
        }, { quoted: msg })
        return
      }
      
      const files = await fs.readdir(fullPath)
      
      if (files.length === 0) {
        await ryza.sendMessage(from, { 
          text: `Directory kosong: ${targetPath}` 
        }, { quoted: msg })
        return
      }
      
      const items = await Promise.all(
        files.map(async (file) => {
          const filePath = path.join(fullPath, file)
          const fileStats = await fs.stat(filePath)
          const isDirectory = fileStats.isDirectory()
          
          return {
            name: file,
            isDirectory
          }
        })
      )
      
      items.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1
        if (!a.isDirectory && b.isDirectory) return 1
        return a.name.localeCompare(b.name)
      })
      
      let responseText = `📁 ${targetPath}\n`
      responseText += `> ${files.length} item\n\n`
      
      items.forEach((item) => {
        const prefix = item.isDirectory ? "📁" : "📄"
        responseText += `${prefix} ${item.name}\n`
      })

      await ryza.sendMessage(from, {
        text: responseText
      }, { quoted: msg })

    } catch (error) {
      console.error(error)
      await ryza.sendMessage(from, { 
        text: `Error: ${error.message}` 
      }, { quoted: msg })
    }
  }
}