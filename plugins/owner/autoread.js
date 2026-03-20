const fs = require("fs")
const path = require("path")
const config = require("../../config")
const { isOwner } = require("../../lib/helper")
const { react } = require("../../lib/functions")

module.exports = {
  commands: ["autoread", "ar"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    if (!isOwner(sender)) {
      await react(ryza, from, msg, "❌")
      await ryza.sendMessage(from, { 
        text: "Maaf, perintah ini hanya untuk owner bot." 
      }, { quoted: msg })
      return
    }

    const option = args[0]?.toLowerCase()
    
    if (!option || (option !== "on" && option !== "off")) {
      const status = config.bot.autoread ? "ON" : "OFF"
      await ryza.sendMessage(from, {
        text: `*AUTOREAD*\n\nStatus: ${status}\n\nPenggunaan:\n.autoread on\n.autoread off`
      }, { quoted: msg })
      return
    }

    const newStatus = option === "on"
    
    if (config.bot.autoread === newStatus) {
      await react(ryza, from, msg, "⚠️")
      await ryza.sendMessage(from, {
        text: `Autoread sudah ${option === "on" ? "aktif" : "mati"} dari sebelumnya.`
      }, { quoted: msg })
      return
    }

    config.bot.autoread = newStatus
    
    const configPath = path.join(__dirname, "../../config.js")
    let configContent = fs.readFileSync(configPath, 'utf8')
    
    configContent = configContent.replace(
      /autoread: (true|false)/,
      `autoread: ${newStatus}`
    )
    
    fs.writeFileSync(configPath, configContent)
    
    await react(ryza, from, msg, "✅")
    await ryza.sendMessage(from, {
      text: `Autoread telah di ${option === "on" ? "aktifkan" : "matikan"}.`
    }, { quoted: msg })
  }
}