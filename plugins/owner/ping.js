const { react } = require("../../lib/functions")

module.exports = {
  commands: ["ping", "pong"],
  
  async execute(ryza, msg, { command, args, text, from, sender, pushname }) {
    const start = Date.now()
    await react(ryza, from, msg, "🏓")
    
    const ping = Date.now() - start
    const runtime = process.uptime() 
    const days = Math.floor(runtime / 86400)
    const hours = Math.floor((runtime % 86400) / 3600)
    const minutes = Math.floor((runtime % 3600) / 60)
    const seconds = Math.floor(runtime % 60)
    
    const runtimeText = []
    if (days > 0) runtimeText.push(`${days} hari`)
    if (hours > 0) runtimeText.push(`${hours} jam`)
    if (minutes > 0) runtimeText.push(`${minutes} menit`)
    if (seconds > 0) runtimeText.push(`${seconds} detik`)
    
    await ryza.sendMessage(from, {
      text: `🏓 *PONG!*
        
*Kecepatan:* ${ping}ms
*Runtime:* ${runtimeText.join(', ')}`
    }, { quoted: msg })
  }
}